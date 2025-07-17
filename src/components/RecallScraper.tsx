
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const RecallScraper = () => {
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);
  const [lastScrapeResult, setLastScrapeResult] = useState<any>(null);
  const { toast } = useToast();

  const handleScrapeRecalls = async () => {
    setIsScrapingLoading(true);
    
    try {
      console.log('Starting recall scraping...');
      
      const { data, error } = await supabase.functions.invoke('scrape-recalls', {
        body: {}
      });

      if (error) {
        throw error;
      }

      setLastScrapeResult(data);
      
      toast({
        title: "Scraping Complete",
        description: `${data.inserted} new recalls added from ${data.total_found} found`,
      });
      
    } catch (error) {
      console.error('Error scraping recalls:', error);
      toast({
        title: "Error",
        description: "Failed to scrape recalls. Please try again.",
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

        {lastScrapeResult && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <h4 className="font-semibold mb-2">Last Scrape Results:</h4>
            <ul className="space-y-1">
              <li>• Found: {lastScrapeResult.total_found} recalls</li>
              <li>• Added: {lastScrapeResult.inserted} new recalls</li>
              <li>• Status: {lastScrapeResult.success ? 'Success' : 'Failed'}</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
