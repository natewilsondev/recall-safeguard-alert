
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

console.log("Edge function started - scrape-recalls");

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;

console.log("Environment variables loaded:", {
  supabaseUrl: !!supabaseUrl,
  serviceKey: !!supabaseServiceKey,
  firecrawlKey: !!firecrawlApiKey
});

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
const fetchFDARecalls = async (): Promise<RecallData[]> => {
  console.log('[FDA] Starting fetch from FDA API...');
  try {
    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const dateQuery = `[${oneMonthAgo.toISOString().split('T')[0].replace(/-/g, '')}+TO+${today.toISOString().split('T')[0].replace(/-/g, '')}]`;
    const url = `https://api.fda.gov/food/enforcement.json?search=recall_initiation_date:${dateQuery}&limit=20`;
    
    console.log('[FDA] Fetching from URL:', url);
    const response = await fetch(url);
    
    console.log('[FDA] Response status:', response.status);
    if (!response.ok) {
      throw new Error(`FDA API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[FDA] Raw response structure:', {
      hasResults: !!data.results,
      resultsLength: data.results?.length || 0,
      meta: data.meta || null
    });
    
    if (!data.results || !Array.isArray(data.results)) {
      console.log('[FDA] No results array in response, returning empty array');
      return [];
    }

    const transformedRecalls = data.results.map((recall: any, index: number) => {
      console.log(`[FDA] Transforming recall ${index + 1}:`, {
        product_description: recall.product_description,
        reason_for_recall: recall.reason_for_recall,
        classification: recall.classification
      });
      
      return {
        title: recall.product_description || `FDA Food Recall ${index + 1}`,
        description: recall.reason_for_recall || 'No description available',
        product_name: recall.product_description || 'Unknown Product',
        brand: recall.recalling_firm || null,
        category: 'Food & Beverages',
        recall_number: recall.recall_number || null,
        recall_date: recall.recall_initiation_date || new Date().toISOString().split('T')[0],
        risk_level: (recall.classification === 'Class I' ? 'HIGH' : 
                    recall.classification === 'Class II' ? 'MEDIUM' : 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        source: 'FDA' as const,
        remedy_instructions: 'Do not consume. Return to place of purchase.',
        source_url: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts'
      };
    });
    
    console.log(`[FDA] Successfully transformed ${transformedRecalls.length} recalls`);
    return transformedRecalls;
  } catch (error) {
    console.error('[FDA] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    });
    return [];
  }
};

// Fetch CPSC recalls from RSS feed
const fetchCPSCRecalls = async (): Promise<RecallData[]> => {
  console.log('[CPSC] Starting fetch from RSS feed...');
  try {
    const url = 'https://www.cpsc.gov/Newsroom/rss';
    console.log('[CPSC] Fetching from URL:', url);
    
    const response = await fetch(url);
    console.log('[CPSC] Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`CPSC RSS error: ${response.status} - ${response.statusText}`);
    }
    
    const rssText = await response.text();
    console.log('[CPSC] RSS feed retrieved, length:', rssText.length, 'chars');
    
    // Simple RSS parsing
    const items = rssText.match(/<item>[\s\S]*?<\/item>/g) || [];
    console.log(`[CPSC] Found ${items.length} RSS items`);
    
    if (items.length === 0) {
      console.log('[CPSC] No RSS items found in feed');
      return [];
    }

    const transformedRecalls = items.slice(0, 10).map((item, index) => {
      console.log(`[CPSC] Processing RSS item ${index + 1}`);
      
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || `CPSC Recall ${index + 1}`;
      const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      
      console.log(`[CPSC] Item ${index + 1} parsed:`, {
        title: title.substring(0, 50) + '...',
        hasDescription: !!description,
        hasLink: !!link,
        pubDate
      });
      
      // Parse date
      let recallDate = new Date().toISOString().split('T')[0];
      if (pubDate) {
        const parsedDate = new Date(pubDate);
        if (!isNaN(parsedDate.getTime())) {
          recallDate = parsedDate.toISOString().split('T')[0];
        }
      }
      
      const cleanTitle = title.replace('CPSC Announces ', '').replace(' Recall', '');
      const cleanDescription = description.replace(/<[^>]*>/g, '').substring(0, 500);
      
      return {
        title: cleanTitle,
        description: cleanDescription,
        product_name: cleanTitle,
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
    
    console.log(`[CPSC] Successfully transformed ${transformedRecalls.length} recalls`);
    return transformedRecalls;
  } catch (error) {
    console.error('[CPSC] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    });
    return [];
  }
};

// Fetch NHTSA recalls with Firecrawl fallback
const fetchNHTSAWithFirecrawl = async (): Promise<RecallData[]> => {
  console.log('[NHTSA] Starting fetch with Firecrawl fallback...');
  
  try {
    console.log('[NHTSA] Attempting primary API endpoint...');
    const primaryUrl = 'https://api.nhtsa.gov/recalls/recallsByVehicle?make=&model=&year=2024&to=2025';
    console.log('[NHTSA] Primary URL:', primaryUrl);
    
    const response = await fetch(primaryUrl);
    console.log('[NHTSA] Primary response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[NHTSA] Primary API success, data structure:', {
        hasResults: !!data.results,
        resultsLength: data.results?.length || 0
      });
      
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        const transformedRecalls = data.results.slice(0, 5).map((recall: any, index: number) => {
          console.log(`[NHTSA] Transforming primary result ${index + 1}:`, {
            Subject: recall.Subject,
            Make: recall.Make,
            Model: recall.Model
          });
          
          return {
            title: recall.Subject || `Vehicle Recall ${index + 1}`,
            description: recall.Summary || 'No description available',
            product_name: `${recall.Make || ''} ${recall.Model || ''}`.trim() || 'Vehicle',
            brand: recall.Make || null,
            category: 'Vehicles',
            recall_number: recall.NHTSACampaignNumber || null,
            recall_date: recall.ReportReceivedDate || new Date().toISOString().split('T')[0],
            risk_level: 'HIGH' as const,
            source: 'NHTSA' as const,
            remedy_instructions: 'Contact authorized dealer for inspection and repair.',
            source_url: 'https://www.nhtsa.gov/recalls'
          };
        });
        
        console.log(`[NHTSA] Primary API returned ${transformedRecalls.length} recalls`);
        return transformedRecalls;
      }
    }
    
    console.log('[NHTSA] Primary API failed or empty, trying alternative endpoint...');
    const altUrl = 'https://vpic.nhtsa.dot.gov/api/vehicles/getrecallsbymanufacturer/Honda?format=json';
    console.log('[NHTSA] Alternative URL:', altUrl);
    
    const altResponse = await fetch(altUrl);
    console.log('[NHTSA] Alternative response status:', altResponse.status);
    
    if (altResponse.ok) {
      const altData = await altResponse.json();
      console.log('[NHTSA] Alternative API data structure:', {
        hasResults: !!altData.Results,
        resultsLength: altData.Results?.length || 0
      });
      
      if (altData.Results && Array.isArray(altData.Results) && altData.Results.length > 0) {
        const transformedRecalls = altData.Results.slice(0, 5).map((recall: any, index: number) => {
          console.log(`[NHTSA] Transforming alternative result ${index + 1}:`, {
            Component: recall.Component,
            Make: recall.Make,
            Model: recall.Model
          });
          
          return {
            title: recall.Component || `Vehicle Recall ${index + 1}`,
            description: recall.Summary || 'No description available',
            product_name: `${recall.Make || ''} ${recall.Model || ''}`.trim() || 'Vehicle',
            brand: recall.Make || null,
            category: 'Vehicles',
            recall_number: recall.NHTSACampaignNumber || null,
            recall_date: recall.ReportReceivedDate || new Date().toISOString().split('T')[0],
            risk_level: 'HIGH' as const,
            source: 'NHTSA' as const,
            remedy_instructions: 'Contact authorized dealer for inspection and repair.',
            source_url: 'https://www.nhtsa.gov/recalls'
          };
        });
        
        console.log(`[NHTSA] Alternative API returned ${transformedRecalls.length} recalls`);
        return transformedRecalls;
      }
    }
    
    console.log('[NHTSA] Both API endpoints failed/empty, attempting Firecrawl fallback...');
    return await fetchNHTSAWithFirecrawlFallback();
    
  } catch (error) {
    console.error('[NHTSA] All endpoints failed, error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    });
    
    console.log('[NHTSA] Attempting Firecrawl fallback due to error...');
    return await fetchNHTSAWithFirecrawlFallback();
  }
};

const fetchNHTSAWithFirecrawlFallback = async (): Promise<RecallData[]> => {
  console.log('[FIRECRAWL] Starting Firecrawl fallback for NHTSA...');
  
  try {
    if (!firecrawlApiKey) {
      console.error('[FIRECRAWL] API key not found');
      return [];
    }
    
    const firecrawlUrl = 'https://api.firecrawl.dev/v0/scrape';
    const targetUrl = 'https://www.nhtsa.gov/recalls';
    
    console.log('[FIRECRAWL] Making request to:', firecrawlUrl);
    console.log('[FIRECRAWL] Target URL:', targetUrl);
    
    const firecrawlRequest = {
      url: targetUrl,
      pageOptions: {
        onlyMainContent: true,
        includeHtml: false
      }
    };
    
    console.log('[FIRECRAWL] Request payload:', JSON.stringify(firecrawlRequest, null, 2));
    
    const firecrawlResponse = await fetch(firecrawlUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(firecrawlRequest)
    });
    
    console.log('[FIRECRAWL] Response status:', firecrawlResponse.status);
    console.log('[FIRECRAWL] Response headers:', Object.fromEntries(firecrawlResponse.headers.entries()));
    
    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('[FIRECRAWL] Error response:', errorText);
      throw new Error(`Firecrawl API error: ${firecrawlResponse.status} - ${errorText}`);
    }
    
    const firecrawlData = await firecrawlResponse.json();
    console.log('[FIRECRAWL] Response structure:', {
      success: firecrawlData.success,
      hasData: !!firecrawlData.data,
      dataKeys: firecrawlData.data ? Object.keys(firecrawlData.data) : null
    });
    
    if (!firecrawlData.success || !firecrawlData.data) {
      console.error('[FIRECRAWL] Invalid response structure:', firecrawlData);
      return [];
    }
    
    const content = firecrawlData.data.content || firecrawlData.data.markdown || '';
    console.log('[FIRECRAWL] Content length:', content.length, 'chars');
    console.log('[FIRECRAWL] Content preview:', content.substring(0, 200) + '...');
    
    // Simple content parsing for recall information
    const recallMatches = content.match(/recall[^\n]*\n/gi) || [];
    console.log(`[FIRECRAWL] Found ${recallMatches.length} potential recall mentions`);
    
    if (recallMatches.length === 0) {
      console.log('[FIRECRAWL] No recall content found in scraped data');
      return [];
    }
    
    const transformedRecalls = recallMatches.slice(0, 3).map((match: string, index: number) => {
      console.log(`[FIRECRAWL] Processing match ${index + 1}:`, match.substring(0, 100) + '...');
      
      const title = match.trim().substring(0, 100) || `NHTSA Recall ${index + 1}`;
      
      return {
        title,
        description: 'Recall information from NHTSA website',
        product_name: 'Vehicle',
        brand: null,
        category: 'Vehicles',
        recall_number: null,
        recall_date: new Date().toISOString().split('T')[0],
        risk_level: 'MEDIUM' as const,
        source: 'NHTSA' as const,
        remedy_instructions: 'Contact authorized dealer for inspection and repair.',
        source_url: 'https://www.nhtsa.gov/recalls'
      };
    });
    
    console.log(`[FIRECRAWL] Successfully created ${transformedRecalls.length} recalls from scraped content`);
    return transformedRecalls;
    
  } catch (error) {
    console.error('[FIRECRAWL] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    });
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
  console.log(`[SCRAPER] Starting recall scraping from multiple sources...`);
  
  const allRecalls: RecallData[] = [];
  const sourceResults: Record<string, { success: boolean; count: number; error?: string; fallbackUsed?: boolean }> = {};

  // Fetch from FDA API - wrapped in individual try/catch
  console.log('[SCRAPER] Processing FDA source...');
  try {
    const fdaRecalls = await fetchFDARecalls();
    allRecalls.push(...fdaRecalls);
    sourceResults['FDA'] = { success: fdaRecalls.length > 0, count: fdaRecalls.length };
    console.log(`[SCRAPER] FDA completed: ${fdaRecalls.length} recalls`);
  } catch (error) {
    console.error('[SCRAPER] FDA fetch failed:', error);
    sourceResults['FDA'] = { 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }

  // Fetch from CPSC RSS - wrapped in individual try/catch
  console.log('[SCRAPER] Processing CPSC source...');
  try {
    const cpscRecalls = await fetchCPSCRecalls();
    allRecalls.push(...cpscRecalls);
    sourceResults['CPSC'] = { success: cpscRecalls.length > 0, count: cpscRecalls.length };
    console.log(`[SCRAPER] CPSC completed: ${cpscRecalls.length} recalls`);
  } catch (error) {
    console.error('[SCRAPER] CPSC fetch failed:', error);
    sourceResults['CPSC'] = { 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }

  // Fetch from NHTSA with Firecrawl fallback - wrapped in individual try/catch
  console.log('[SCRAPER] Processing NHTSA source...');
  try {
    const nhtsaRecalls = await fetchNHTSAWithFirecrawl();
    allRecalls.push(...nhtsaRecalls);
    sourceResults['NHTSA'] = { 
      success: nhtsaRecalls.length > 0, 
      count: nhtsaRecalls.length,
      fallbackUsed: true // Since we always try Firecrawl fallback
    };
    console.log(`[SCRAPER] NHTSA completed: ${nhtsaRecalls.length} recalls`);
  } catch (error) {
    console.error('[SCRAPER] NHTSA fetch failed:', error);
    sourceResults['NHTSA'] = { 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : 'Unknown error',
      fallbackUsed: true
    };
  }

  console.log(`[SCRAPER] Final results by source:`, JSON.stringify(sourceResults, null, 2));
  console.log(`[SCRAPER] Total recalls collected: ${allRecalls.length}`);
  
  // Validate all recalls have required fields
  const validRecalls = allRecalls.filter(recall => {
    const isValid = recall.title && recall.product_name && recall.source && recall.recall_date;
    if (!isValid) {
      console.warn('[SCRAPER] Invalid recall filtered out:', {
        hasTitle: !!recall.title,
        hasProductName: !!recall.product_name,
        hasSource: !!recall.source,
        hasRecallDate: !!recall.recall_date
      });
    }
    return isValid;
  });
  
  console.log(`[SCRAPER] Valid recalls after filtering: ${validRecalls.length}`);
  
  return { recalls: validRecalls, sourceResults };
};

const handler = async (req: Request): Promise<Response> => {
  console.log('[HANDLER] Function invoked, method:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('[HANDLER] CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[MAIN] Starting recall scraping process...');
    console.log('[MAIN] Environment check:', {
      supabaseUrl: !!supabaseUrl,
      serviceKey: !!supabaseServiceKey,
      firecrawlKey: !!firecrawlApiKey
    });
    
    // Test database connection
    console.log('[MAIN] Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('recalls')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('[MAIN] Database connection test failed:', testError);
      throw new Error(`Database connection failed: ${testError.message}`);
    }
    
    console.log('[MAIN] Database connection successful');
    
    // Scrape recalls from all sources
    console.log('[MAIN] Starting source scraping...');
    const result = await scrapeRecallSources();
    const { recalls, sourceResults } = result;
    
    console.log(`[MAIN] Scraping completed. Found ${recalls.length} valid recalls to process`);
    console.log('[MAIN] Source results summary:', sourceResults);

    if (recalls.length === 0) {
      console.log('[MAIN] No recalls found, returning early');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No new recalls found from any source',
        total_found: 0,
        inserted: 0,
        duplicates: 0,
        errors: 0,
        source_results: sourceResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert recalls into database with detailed logging
    console.log('[MAIN] Starting database insertion process...');
    let insertedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const insertErrors: string[] = [];
    
    for (let i = 0; i < recalls.length; i++) {
      const recall = recalls[i];
      try {
        console.log(`[DB] Processing recall ${i + 1}/${recalls.length}: "${recall.title.substring(0, 50)}..." from ${recall.source}`);
        
        // Validate required fields before insertion
        if (!recall.title || !recall.product_name || !recall.source || !recall.recall_date) {
          console.error(`[DB] Invalid recall data:`, {
            hasTitle: !!recall.title,
            hasProductName: !!recall.product_name,
            hasSource: !!recall.source,
            hasRecallDate: !!recall.recall_date
          });
          errorCount++;
          insertErrors.push(`Invalid data for recall: ${recall.title || 'Unknown'}`);
          continue;
        }
        
        // Check if recall already exists by title and source
        console.log(`[DB] Checking for duplicates...`);
        const { data: existing, error: selectError } = await supabase
          .from('recalls')
          .select('id')
          .eq('title', recall.title)
          .eq('source', recall.source)
          .maybeSingle();

        if (selectError) {
          console.error(`[DB] Error checking duplicates:`, selectError);
          errorCount++;
          insertErrors.push(`Duplicate check failed for: ${recall.title}`);
          continue;
        }

        if (existing) {
          console.log(`[DB] Duplicate found for: ${recall.title}`);
          duplicateCount++;
        } else {
          console.log(`[DB] Inserting new recall...`);
          const { error: insertError } = await supabase
            .from('recalls')
            .insert(recall);

          if (insertError) {
            console.error(`[DB] Insert error for "${recall.title}":`, {
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint
            });
            errorCount++;
            insertErrors.push(`Insert failed for: ${recall.title} - ${insertError.message}`);
          } else {
            console.log(`[DB] Successfully inserted: ${recall.title}`);
            insertedCount++;
          }
        }
      } catch (error) {
        console.error(`[DB] Unexpected error processing recall "${recall.title}":`, {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : null
        });
        errorCount++;
        insertErrors.push(`Unexpected error for: ${recall.title}`);
      }
    }

    console.log(`[MAIN] Database insertion complete:`);
    console.log(`[MAIN] - Total processed: ${recalls.length}`);
    console.log(`[MAIN] - Successfully inserted: ${insertedCount}`);
    console.log(`[MAIN] - Duplicates skipped: ${duplicateCount}`);
    console.log(`[MAIN] - Errors encountered: ${errorCount}`);
    
    if (insertErrors.length > 0) {
      console.log(`[MAIN] Error details:`, insertErrors);
    }

    const response = {
      success: true,
      message: `Successfully processed ${recalls.length} recalls. Inserted: ${insertedCount}, Duplicates: ${duplicateCount}, Errors: ${errorCount}`,
      total_found: recalls.length,
      inserted: insertedCount,
      duplicates: duplicateCount,
      errors: errorCount,
      source_results: sourceResults,
      error_details: insertErrors.length > 0 ? insertErrors : undefined
    };

    console.log('[MAIN] Returning response:', JSON.stringify(response, null, 2));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : null;
    
    console.error('[MAIN] Top-level error in scrape-recalls function:', {
      message: errorMessage,
      stack: errorStack
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false,
      details: 'Check edge function logs for detailed error information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
