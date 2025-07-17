
import { Search as SearchIcon, Filter, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLatestRecall } from "@/hooks/useRecalls";

export const SearchSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: latestRecall } = useLatestRecall();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to results page with search query
      const params = new URLSearchParams({ q: searchQuery.trim() });
      window.location.href = `/search?${params.toString()}`;
    }
  };

  const handleQuickFilter = (category: string) => {
    const params = new URLSearchParams({ category });
    window.location.href = `/search?${params.toString()}`;
  };

  return (
    <section id="search" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Stay Safe with
            <span className="text-recall-trust"> Instant</span>
            <br />
            Recall Searches
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Search millions of product recalls from FDA, CPSC, NHTSA and more. 
            Get real-time alerts and keep your family safe.
          </p>
        </div>

        {/* Search Form */}
        <div className="animate-slide-up max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Enter product name, brand, barcode, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-14 text-lg border-2 border-gray-200 focus:border-recall-trust"
                />
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="h-14 px-8 bg-recall-trust hover:bg-blue-600 text-white font-semibold"
              >
                <SearchIcon className="w-5 h-5 mr-2" />
                Search Recalls
              </Button>
            </div>
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Button 
              variant="outline" 
              size="sm" 
              className="hover:bg-recall-trust hover:text-white transition-colors"
              onClick={() => handleQuickFilter("Food & Beverages")}
            >
              <Filter className="w-4 h-4 mr-1" />
              Food & Beverages
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hover:bg-recall-trust hover:text-white transition-colors"
              onClick={() => handleQuickFilter("Toys & Children's Products")}
            >
              <Filter className="w-4 h-4 mr-1" />
              Consumer Products
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hover:bg-recall-trust hover:text-white transition-colors"
              onClick={() => handleQuickFilter("Vehicles")}
            >
              <Filter className="w-4 h-4 mr-1" />
              Vehicles
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hover:bg-recall-trust hover:text-white transition-colors"
              onClick={() => handleQuickFilter("Medical Devices")}
            >
              <Filter className="w-4 h-4 mr-1" />
              Medical Devices
            </Button>
          </div>
        </div>

        {/* Recent Alerts Banner */}
        {latestRecall && (
          <div className="mt-12 bg-recall-warning-light border border-recall-warning rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center text-recall-warning">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="font-semibold">Latest Alert:</span>
              <span className="ml-2">{latestRecall.title}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
