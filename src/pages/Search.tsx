
import { useState, useEffect } from "react";
import { Search, Filter, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useRecalls } from "@/hooks/useRecalls";
import { FeaturedRecalls } from "@/components/FeaturedRecalls";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [riskLevel, setRiskLevel] = useState("all");

  // Get search params from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("q");
    const cat = urlParams.get("category");
    
    if (q) setSearchQuery(q);
    if (cat) setCategory(cat);
  }, []);

  const { data: recalls, isLoading, error } = useRecalls({
    searchQuery: searchQuery || undefined,
    category: category !== "all" ? category : undefined,
    riskLevel: riskLevel !== "all" ? riskLevel : undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL params
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (category !== "all") params.set("category", category);
    if (riskLevel !== "all") params.set("riskLevel", riskLevel);
    
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Search Header */}
        <section className="py-8 bg-gray-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Search Results
                {recalls && ` (${recalls.length} found)`}
              </h1>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search recalls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Food & Beverages">Food & Beverages</SelectItem>
                  <SelectItem value="Toys & Children's Products">Toys & Children's Products</SelectItem>
                  <SelectItem value="Vehicles">Vehicles</SelectItem>
                  <SelectItem value="Home Appliances">Home Appliances</SelectItem>
                  <SelectItem value="Medical Devices">Medical Devices</SelectItem>
                </SelectContent>
              </Select>

              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Button type="submit" className="bg-recall-trust hover:bg-blue-600">
                <Filter className="w-4 h-4 mr-2" />
                Search
              </Button>
            </form>
          </div>
        </section>

        {/* Results */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-recall-trust mx-auto"></div>
                <p className="mt-4 text-gray-600">Searching recalls...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Error loading search results</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : recalls && recalls.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No recalls found matching your search criteria.</p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setCategory("all");
                    setRiskLevel("all");
                    window.history.pushState({}, "", window.location.pathname);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <FeaturedRecalls />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Search;
