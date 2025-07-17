
import { AlertTriangle, Calendar, Package, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRecalls } from "@/hooks/useRecalls";

export const FeaturedRecalls = () => {
  const { data: recalls, isLoading, error } = useRecalls({ limit: 6 });

  const getRiskColor = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-600 text-white";
      case "HIGH":
        return "bg-recall-warning text-white";
      case "MEDIUM":
        return "bg-orange-500 text-white";
      case "LOW":
        return "bg-yellow-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getRiskLabel = (risk: string) => {
    return risk.charAt(0).toUpperCase() + risk.slice(1).toLowerCase() + " Risk";
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Recent Recalls
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Stay informed about the latest product recalls and safety alerts
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-40 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Recent Recalls
          </h2>
          <p className="text-lg text-gray-600">
            Unable to load recalls at the moment. Please try again later.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Recent Recalls
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay informed about the latest product recalls and safety alerts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recalls?.map((recall, index) => (
            <Card 
              key={recall.id} 
              className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge className={getRiskColor(recall.risk_level)}>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {getRiskLabel(recall.risk_level)}
                  </Badge>
                  <Badge variant="outline">{recall.category || "General"}</Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">{recall.title}</CardTitle>
                <p className="text-sm text-gray-600">{recall.brand || "Unknown Brand"}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {recall.product_image_url && (
                  <div className="w-full h-40 rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={recall.product_image_url} 
                      alt={recall.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <p className="text-sm text-gray-700 line-clamp-3">
                  {recall.description}
                </p>
                
                <div className="flex items-center text-xs text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(recall.recall_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-1" />
                    {recall.source}
                  </div>
                </div>
                
                <Button variant="outline" className="w-full group">
                  View Details
                  <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button 
            size="lg" 
            variant="outline" 
            className="hover:bg-recall-trust hover:text-white transition-colors"
            onClick={() => window.location.href = '/search'}
          >
            View All Recalls
          </Button>
        </div>
      </div>
    </section>
  );
};
