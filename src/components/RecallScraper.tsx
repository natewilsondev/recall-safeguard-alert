
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const RecallScraper = () => {
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);
  const [lastScrapeResult, setLastScrapeResult] = useState<any>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleScrapeRecalls = async () => {
    setIsScrapingLoading(true);
    setScrapeError(null);
    
    try {
      console.log('Starting recall scraping...');
      
      const { data, error } = await supabase.functions.invoke('scrape-recalls', {
        body: {}
      });

      if (error) {
        console.error('Supabase function error:', error);
        setScrapeError(`Function error: ${error.message}`);
        throw error;
      }

      console.log('Scraping result:', data);
      setLastScrapeResult(data);
      
      if (data.success) {
        toast({
          title: "Scraping Complete",
          description: `${data.inserted} new recalls added from ${data.total_found} found`,
        });
      } else {
        toast({
          title: "Scraping Issues",
          description: "Some sources may have failed. Check results below.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Error scraping recalls:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setScrapeError(errorMessage);
      
      toast({
        title: "Scraping Failed",
        description: `Error: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsScrapingLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Recall Data Scraper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Scrape the latest recall data from FDA, CPSC, and NHTSA websites to keep the database updated.
        </p>
        
        <Button 
          onClick={handleScrapeRecalls} 
          disabled={isScrapingLoading}
          className="w-full"
        >
          {isScrapingLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Scrape Latest Recalls
            </>
          )}
        </Button>

        {scrapeError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
            <h4 className="font-semibold text-red-800 mb-2">Error Details:</h4>
            <p className="text-red-700">{scrapeError}</p>
          </div>
        )}

        {lastScrapeResult && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <h4 className="font-semibold mb-2">Last Scrape Results:</h4>
            <ul className="space-y-1">
              <li>• Found: {lastScrapeResult.total_found} recalls</li>
              <li>• Added: {lastScrapeResult.inserted} new recalls</li>
              <li>• Duplicates: {lastScrapeResult.duplicates || 0}</li>
              <li>• Errors: {lastScrapeResult.errors || 0}</li>
              <li>• Status: {lastScrapeResult.success ? 'Success' : 'Failed'}</li>
            </ul>
            
            {lastScrapeResult.source_results && (
              <div className="mt-3">
                <h5 className="font-medium mb-1">Source Results:</h5>
                {Object.entries(lastScrapeResult.source_results).map(([source, result]: [string, any]) => (
                  <div key={source} className="flex justify-between text-xs">
                    <span>{source}:</span>
                    <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                      {result.success ? `${result.count} found` : result.error}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
