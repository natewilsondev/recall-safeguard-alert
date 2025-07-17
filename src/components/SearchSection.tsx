
import { Search, Filter, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const SearchSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false);
      console.log("Searching for:", searchQuery);
    }, 1500);
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
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
                disabled={isSearching}
                className="h-14 px-8 bg-recall-trust hover:bg-blue-600 text-white font-semibold"
              >
                {isSearching ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Searching...
                  </div>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Search Recalls
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" className="hover:bg-recall-trust hover:text-white transition-colors">
              <Filter className="w-4 h-4 mr-1" />
              Food & Beverages
            </Button>
            <Button variant="outline" size="sm" className="hover:bg-recall-trust hover:text-white transition-colors">
              <Filter className="w-4 h-4 mr-1" />
              Consumer Products
            </Button>
            <Button variant="outline" size="sm" className="hover:bg-recall-trust hover:text-white transition-colors">
              <Filter className="w-4 h-4 mr-1" />
              Vehicles
            </Button>
            <Button variant="outline" size="sm" className="hover:bg-recall-trust hover:text-white transition-colors">
              <Filter className="w-4 h-4 mr-1" />
              Medical Devices
            </Button>
          </div>
        </div>

        {/* Recent Alerts Banner */}
        <div className="mt-12 bg-recall-warning-light border border-recall-warning rounded-lg p-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-center text-recall-warning">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span className="font-semibold">Latest Alert:</span>
            <span className="ml-2">Children's toy recall due to choking hazard</span>
          </div>
        </div>
      </div>
    </section>
  );
};
