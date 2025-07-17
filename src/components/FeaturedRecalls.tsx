
import { AlertTriangle, Calendar, Package, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Recall {
  id: string;
  title: string;
  brand: string;
  category: string;
  riskLevel: "high" | "medium" | "low";
  date: string;
  description: string;
  affectedProducts: string;
  image?: string;
}

export const FeaturedRecalls = () => {
  const recalls: Recall[] = [
    {
      id: "1",
      title: "Children's Building Blocks",
      brand: "ToyMaker Inc.",
      category: "Toys",
      riskLevel: "high",
      date: "2024-01-15",
      description: "Small parts may detach and pose choking hazard to children under 3 years old.",
      affectedProducts: "Model XYZ-123, manufactured between Jan-Dec 2023",
      image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b"
    },
    {
      id: "2",
      title: "Electric Coffee Maker",
      brand: "BrewMaster",
      category: "Appliances",
      riskLevel: "medium",
      date: "2024-01-12",
      description: "Potential electrical malfunction may cause overheating and fire risk.",
      affectedProducts: "Series CM-500, manufactured in 2023",
      image: "https://images.unsplash.com/photo-1511920170033-f8396924c348"
    },
    {
      id: "3",
      title: "Organic Baby Food Pouches",
      brand: "NatureFirst",
      category: "Food",
      riskLevel: "medium",
      date: "2024-01-10",
      description: "Possible contamination with harmful bacteria detected in select batches.",
      affectedProducts: "Best by dates: 03/2024 - 05/2024",
      image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e"
    }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-recall-warning text-white";
      case "medium":
        return "bg-orange-500 text-white";
      case "low":
        return "bg-yellow-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getRiskLabel = (risk: string) => {
    return risk.charAt(0).toUpperCase() + risk.slice(1) + " Risk";
  };

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
          {recalls.map((recall, index) => (
            <Card 
              key={recall.id} 
              className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge className={getRiskColor(recall.riskLevel)}>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {getRiskLabel(recall.riskLevel)}
                  </Badge>
                  <Badge variant="outline">{recall.category}</Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">{recall.title}</CardTitle>
                <p className="text-sm text-gray-600">{recall.brand}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {recall.image && (
                  <div className="w-full h-40 rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={recall.image} 
                      alt={recall.title}
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
                    {new Date(recall.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-1" />
                    Affected Products
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
          <Button size="lg" variant="outline" className="hover:bg-recall-trust hover:text-white transition-colors">
            View All Recalls
          </Button>
        </div>
      </div>
    </section>
  );
};
