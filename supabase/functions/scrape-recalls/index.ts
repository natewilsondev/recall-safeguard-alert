
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

const scrapeWithFirecrawl = async (url: string, retries = 3) => {
  console.log(`[FIRECRAWL] Starting scrape for URL: ${url} (retries left: ${retries})`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[FIRECRAWL] Attempt ${attempt}/${retries} for ${url}`);
      
      const requestBody = {
        url: url,
        pageOptions: {
          onlyMainContent: true,
          waitFor: 2000,
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
      };
      
      console.log(`[FIRECRAWL] Request body:`, JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': `RecallScraper/1.0 (Mozilla/5.0 compatible)`,
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`[FIRECRAWL] Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[FIRECRAWL] API Error Response: ${errorText}`);
        
        if (attempt === retries) {
          throw new Error(`Firecrawl API error after ${retries} attempts: ${response.status} - ${errorText}`);
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[FIRECRAWL] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      const data = await response.json();
      console.log(`[FIRECRAWL] Success response:`, JSON.stringify(data, null, 2));
      
      const extractedData = data.data?.llm_extraction || [];
      console.log(`[FIRECRAWL] Extracted ${extractedData.length} recall items from ${url}`);
      
      return extractedData;
      
    } catch (error) {
      console.error(`[FIRECRAWL] Attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        console.error(`[FIRECRAWL] All ${retries} attempts failed for ${url}`);
        throw error;
      }
      
      // Wait before retry
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`[FIRECRAWL] Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  return [];
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
  console.log(`[SCRAPER] Starting recall scraping from multiple sources...`);
  console.log(`[SCRAPER] Firecrawl API Key present: ${firecrawlApiKey ? 'YES' : 'NO'}`);
  
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
  const sourceResults: Record<string, { success: boolean; count: number; error?: string }> = {};

  for (const sourceInfo of sources) {
    try {
      console.log(`[SCRAPER] Processing ${sourceInfo.source} - URL: ${sourceInfo.url}`);
      const extractedData = await scrapeWithFirecrawl(sourceInfo.url);
      
      if (Array.isArray(extractedData)) {
        console.log(`[SCRAPER] Raw extracted data for ${sourceInfo.source}:`, extractedData.slice(0, 2));
        
        const processedRecalls = extractedData.map((recall: any) => {
          const processed = {
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
          };
          
          console.log(`[SCRAPER] Processed recall from ${sourceInfo.source}:`, processed.title);
          return processed;
        });
        
        allRecalls.push(...processedRecalls);
        sourceResults[sourceInfo.source] = { success: true, count: processedRecalls.length };
        console.log(`[SCRAPER] Successfully processed ${processedRecalls.length} recalls from ${sourceInfo.source}`);
      } else {
        console.warn(`[SCRAPER] No array data returned from ${sourceInfo.source}:`, extractedData);
        sourceResults[sourceInfo.source] = { success: false, count: 0, error: 'No array data returned' };
      }
    } catch (error) {
      console.error(`[SCRAPER] Error scraping ${sourceInfo.source}:`, error);
      sourceResults[sourceInfo.source] = { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
    
    // Rate limiting between sources
    console.log(`[SCRAPER] Waiting 2 seconds before next source...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`[SCRAPER] Final results by source:`, sourceResults);
  console.log(`[SCRAPER] Total recalls collected: ${allRecalls.length}`);
  
  return { recalls: allRecalls, sourceResults };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[MAIN] Starting recall scraping process...');
    console.log('[MAIN] Environment check - Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
    console.log('[MAIN] Environment check - Service Key:', supabaseServiceKey ? 'Present' : 'Missing');
    console.log('[MAIN] Environment check - Firecrawl Key:', firecrawlApiKey ? 'Present' : 'Missing');
    
    // Scrape recalls from all sources
    const result = await scrapeRecallSources();
    const { recalls, sourceResults } = result;
    
    console.log(`[MAIN] Found ${recalls.length} recalls to process`);

    if (recalls.length === 0) {
      console.log('[MAIN] No recalls found, returning early');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No new recalls found',
        processed: 0,
        source_results: sourceResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert recalls into database
    console.log('[MAIN] Starting database insertion process...');
    let insertedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    
    for (const recall of recalls) {
      try {
        console.log(`[DB] Processing recall: ${recall.title} from ${recall.source}`);
        
        // Check if recall already exists by title and source
        const { data: existing } = await supabase
          .from('recalls')
          .select('id')
          .eq('title', recall.title)
          .eq('source', recall.source)
          .maybeSingle();

        if (existing) {
          console.log(`[DB] Duplicate found: ${recall.title}`);
          duplicateCount++;
        } else {
          const { error } = await supabase
            .from('recalls')
            .insert(recall);

          if (error) {
            console.error(`[DB] Error inserting recall "${recall.title}":`, error);
            errorCount++;
          } else {
            console.log(`[DB] Successfully inserted: ${recall.title}`);
            insertedCount++;
          }
        }
      } catch (error) {
        console.error(`[DB] Error processing recall "${recall.title}":`, error);
        errorCount++;
      }
    }

    console.log(`[MAIN] Database insertion complete:`);
    console.log(`[MAIN] - Inserted: ${insertedCount}`);
    console.log(`[MAIN] - Duplicates: ${duplicateCount}`);
    console.log(`[MAIN] - Errors: ${errorCount}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully processed ${recalls.length} recalls, inserted ${insertedCount} new ones`,
      total_found: recalls.length,
      inserted: insertedCount,
      duplicates: duplicateCount,
      errors: errorCount,
      source_results: sourceResults
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
