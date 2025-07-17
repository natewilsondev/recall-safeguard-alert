
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecallData {
  title: string;
  description: string;
  product_name: string;
  brand?: string;
  category: string;
  recall_number?: string;
  recall_date: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: 'FDA' | 'CPSC' | 'NHTSA' | 'OTHER';
  remedy_instructions?: string;
  source_url?: string;
}

const scrapeWithFirecrawl = async (url: string) => {
  console.log(`Scraping URL: ${url}`);
  
  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
      pageOptions: {
        onlyMainContent: true,
      },
      extractorOptions: {
        mode: 'llm-extraction',
        extractionPrompt: `Extract recall information from this page and return a JSON array of recalls with the following structure:
        {
          "title": "recall title",
          "description": "description of the issue", 
          "product_name": "name of the product",
          "brand": "brand name if available",
          "category": "product category",
          "recall_number": "official recall number if available",
          "recall_date": "date in YYYY-MM-DD format",
          "risk_level": "LOW|MEDIUM|HIGH|CRITICAL based on severity",
          "remedy_instructions": "what consumers should do",
          "source_url": "original URL"
        }
        Only extract actual recalls, not other content. Return empty array if no recalls found.`
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Firecrawl API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data?.llm_extraction || [];
};

const categorizeProduct = (productName: string, description: string): string => {
  const text = (productName + ' ' + description).toLowerCase();
  
  if (text.includes('food') || text.includes('beverage') || text.includes('formula') || text.includes('nutrition')) {
    return 'Food & Beverages';
  }
  if (text.includes('toy') || text.includes('child') || text.includes('infant') || text.includes('baby')) {
    return 'Toys & Children\'s Products';
  }
  if (text.includes('car') || text.includes('vehicle') || text.includes('auto') || text.includes('tire')) {
    return 'Vehicles';
  }
  if (text.includes('appliance') || text.includes('kitchen') || text.includes('home')) {
    return 'Home Appliances';
  }
  if (text.includes('medical') || text.includes('device') || text.includes('drug')) {
    return 'Medical Devices';
  }
  
  return 'Consumer Products';
};

const scrapeRecallSources = async () => {
  const sources = [
    {
      url: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts',
      source: 'FDA' as const
    },
    {
      url: 'https://www.cpsc.gov/Recalls',
      source: 'CPSC' as const
    },
    {
      url: 'https://www.nhtsa.gov/recalls',
      source: 'NHTSA' as const
    }
  ];

  const allRecalls: RecallData[] = [];

  for (const sourceInfo of sources) {
    try {
      console.log(`Scraping ${sourceInfo.source} recalls...`);
      const extractedData = await scrapeWithFirecrawl(sourceInfo.url);
      
      if (Array.isArray(extractedData)) {
        const processedRecalls = extractedData.map((recall: any) => ({
          title: recall.title || 'Untitled Recall',
          description: recall.description || '',
          product_name: recall.product_name || recall.title || 'Unknown Product',
          brand: recall.brand || null,
          category: recall.category || categorizeProduct(recall.product_name || '', recall.description || ''),
          recall_number: recall.recall_number || null,
          recall_date: recall.recall_date || new Date().toISOString().split('T')[0],
          risk_level: recall.risk_level || 'MEDIUM',
          source: sourceInfo.source,
          remedy_instructions: recall.remedy_instructions || 'Contact manufacturer for details',
          source_url: recall.source_url || sourceInfo.url
        }));
        
        allRecalls.push(...processedRecalls);
      }
    } catch (error) {
      console.error(`Error scraping ${sourceInfo.source}:`, error);
    }
  }

  return allRecalls;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting recall scraping process...');
    
    // Scrape recalls from all sources
    const recalls = await scrapeRecallSources();
    
    console.log(`Found ${recalls.length} recalls to process`);

    if (recalls.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No new recalls found',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert recalls into database
    let insertedCount = 0;
    for (const recall of recalls) {
      try {
        // Check if recall already exists by title and source
        const { data: existing } = await supabase
          .from('recalls')
          .select('id')
          .eq('title', recall.title)
          .eq('source', recall.source)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('recalls')
            .insert(recall);

          if (error) {
            console.error('Error inserting recall:', error);
          } else {
            insertedCount++;
          }
        }
      } catch (error) {
        console.error('Error processing recall:', error);
      }
    }

    console.log(`Successfully inserted ${insertedCount} new recalls`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully processed ${recalls.length} recalls, inserted ${insertedCount} new ones`,
      total_found: recalls.length,
      inserted: insertedCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scrape-recalls function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
