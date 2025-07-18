
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

// Fetch FDA recalls from official API
const fetchFDARecalls = async () => {
  console.log('[FDA] Fetching recalls from FDA API...');
  try {
    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const dateQuery = `[${oneMonthAgo.toISOString().split('T')[0].replace(/-/g, '')}+TO+${today.toISOString().split('T')[0].replace(/-/g, '')}]`;
    
    const response = await fetch(`https://api.fda.gov/food/enforcement.json?search=recall_initiation_date:${dateQuery}&limit=20`);
    
    if (!response.ok) {
      throw new Error(`FDA API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[FDA] Retrieved ${data.results?.length || 0} recalls`);
    
    return (data.results || []).map((recall: any) => ({
      title: recall.product_description || 'FDA Food Recall',
      description: recall.reason_for_recall || '',
      product_name: recall.product_description || 'Unknown Product',
      brand: recall.recalling_firm || null,
      category: 'Food & Beverages',
      recall_number: recall.recall_number || null,
      recall_date: recall.recall_initiation_date || new Date().toISOString().split('T')[0],
      risk_level: recall.classification === 'Class I' ? 'HIGH' : recall.classification === 'Class II' ? 'MEDIUM' : 'LOW',
      source: 'FDA' as const,
      remedy_instructions: 'Do not consume. Return to place of purchase.',
      source_url: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts'
    }));
  } catch (error) {
    console.error('[FDA] Error fetching recalls:', error);
    return [];
  }
};

// Fetch CPSC recalls from RSS feed
const fetchCPSCRecalls = async () => {
  console.log('[CPSC] Fetching recalls from RSS feed...');
  try {
    const response = await fetch('https://www.cpsc.gov/Newsroom/rss');
    
    if (!response.ok) {
      throw new Error(`CPSC RSS error: ${response.status}`);
    }
    
    const rssText = await response.text();
    console.log('[CPSC] RSS feed retrieved, parsing...');
    
    // Simple RSS parsing
    const items = rssText.match(/<item>[\s\S]*?<\/item>/g) || [];
    console.log(`[CPSC] Found ${items.length} RSS items`);
    
    return items.slice(0, 10).map((item, index) => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || `CPSC Recall ${index + 1}`;
      const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      
      // Parse date
      let recallDate = new Date().toISOString().split('T')[0];
      if (pubDate) {
        const parsedDate = new Date(pubDate);
        if (!isNaN(parsedDate.getTime())) {
          recallDate = parsedDate.toISOString().split('T')[0];
        }
      }
      
      return {
        title: title.replace('CPSC Announces ', '').replace(' Recall', ''),
        description: description.replace(/<[^>]*>/g, '').substring(0, 500),
        product_name: title.replace('CPSC Announces ', '').replace(' Recall', ''),
        brand: null,
        category: categorizeProduct(title, description),
        recall_number: null,
        recall_date: recallDate,
        risk_level: 'MEDIUM' as const,
        source: 'CPSC' as const,
        remedy_instructions: 'Stop using immediately. Contact manufacturer.',
        source_url: link || 'https://www.cpsc.gov/Recalls'
      };
    });
  } catch (error) {
    console.error('[CPSC] Error fetching recalls:', error);
    return [];
  }
};

// Fetch NHTSA recalls from API
const fetchNHTSARecalls = async () => {
  console.log('[NHTSA] Fetching recalls from NHTSA API...');
  try {
    // Get recent recalls
    const response = await fetch('https://api.nhtsa.gov/recalls/recallsByVehicle?make=&model=&year=2024&to=2025');
    
    if (!response.ok) {
      // Fallback to a different endpoint
      console.log('[NHTSA] Primary API failed, trying alternative...');
      const altResponse = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getrecallsbymanufacturer/Honda?format=json');
      
      if (!altResponse.ok) {
        throw new Error(`NHTSA API error: ${altResponse.status}`);
      }
      
      const altData = await altResponse.json();
      console.log(`[NHTSA] Retrieved ${altData.Results?.length || 0} recalls from alternative endpoint`);
      
      return (altData.Results || []).slice(0, 5).map((recall: any) => ({
        title: recall.Component || 'Vehicle Recall',
        description: recall.Summary || '',
        product_name: `${recall.Make || ''} ${recall.Model || ''}`.trim() || 'Vehicle',
        brand: recall.Make || null,
        category: 'Vehicles',
        recall_number: recall.NHTSACampaignNumber || null,
        recall_date: recall.ReportReceivedDate || new Date().toISOString().split('T')[0],
        risk_level: 'HIGH' as const,
        source: 'NHTSA' as const,
        remedy_instructions: 'Contact authorized dealer for inspection and repair.',
        source_url: 'https://www.nhtsa.gov/recalls'
      }));
    }
    
    const data = await response.json();
    console.log(`[NHTSA] Retrieved ${data.results?.length || 0} recalls`);
    
    return (data.results || []).slice(0, 5).map((recall: any) => ({
      title: recall.Subject || 'Vehicle Recall',
      description: recall.Summary || '',
      product_name: `${recall.Make || ''} ${recall.Model || ''}`.trim() || 'Vehicle',
      brand: recall.Make || null,
      category: 'Vehicles',
      recall_number: recall.NHTSACampaignNumber || null,
      recall_date: recall.ReportReceivedDate || new Date().toISOString().split('T')[0],
      risk_level: 'HIGH' as const,
      source: 'NHTSA' as const,
      remedy_instructions: 'Contact authorized dealer for inspection and repair.',
      source_url: 'https://www.nhtsa.gov/recalls'
    }));
  } catch (error) {
    console.error('[NHTSA] Error fetching recalls:', error);
    return [];
  }
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
  console.log(`[SCRAPER] Starting recall scraping from multiple sources using proper APIs...`);
  
  const allRecalls: RecallData[] = [];
  const sourceResults: Record<string, { success: boolean; count: number; error?: string }> = {};

  // Fetch from FDA API
  try {
    const fdaRecalls = await fetchFDARecalls();
    allRecalls.push(...fdaRecalls);
    sourceResults['FDA'] = { success: true, count: fdaRecalls.length };
    console.log(`[SCRAPER] Successfully fetched ${fdaRecalls.length} recalls from FDA API`);
  } catch (error) {
    console.error('[SCRAPER] FDA fetch failed:', error);
    sourceResults['FDA'] = { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }

  // Fetch from CPSC RSS
  try {
    const cpscRecalls = await fetchCPSCRecalls();
    allRecalls.push(...cpscRecalls);
    sourceResults['CPSC'] = { success: true, count: cpscRecalls.length };
    console.log(`[SCRAPER] Successfully fetched ${cpscRecalls.length} recalls from CPSC RSS`);
  } catch (error) {
    console.error('[SCRAPER] CPSC fetch failed:', error);
    sourceResults['CPSC'] = { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }

  // Fetch from NHTSA API
  try {
    const nhtsaRecalls = await fetchNHTSARecalls();
    allRecalls.push(...nhtsaRecalls);
    sourceResults['NHTSA'] = { success: true, count: nhtsaRecalls.length };
    console.log(`[SCRAPER] Successfully fetched ${nhtsaRecalls.length} recalls from NHTSA API`);
  } catch (error) {
    console.error('[SCRAPER] NHTSA fetch failed:', error);
    sourceResults['NHTSA'] = { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
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
