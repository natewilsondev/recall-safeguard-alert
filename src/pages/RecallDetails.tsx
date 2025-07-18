import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Calendar, Package, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Recall {
  id: string;
  title: string;
  description: string;
  product_name: string;
  brand?: string;
  category: string;
  recall_number?: string;
  recall_date: string;
  risk_level: string;
  source: string;
  remedy_instructions?: string;
  source_url?: string;
  product_image_url?: string;
  barcode?: string;
  affected_lots?: string[];
}

const RecallDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recall, setRecall] = useState<Recall | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecall = async () => {
      if (!id) {
        setError("No recall ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('recalls')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          setError("Recall not found");
        } else {
          setRecall(data);
        }
      } catch (err) {
        console.error('Error fetching recall:', err);
        setError("Failed to load recall details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecall();
  }, [id]);

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recall?.title,
          text: `Product Recall: ${recall?.product_name}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Recall link copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="h-12 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="h-64 bg-gray-200 rounded mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !recall) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {error || "Recall Not Found"}
              </h1>
              <p className="text-gray-600 mb-6">
                The recall you're looking for could not be found.
              </p>
              <Button onClick={() => navigate('/')}>
                Return Home
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Recall Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={getRiskColor(recall.risk_level)}>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {getRiskLabel(recall.risk_level)}
                </Badge>
                <Badge variant="outline">{recall.category}</Badge>
                <Badge variant="outline">{recall.source}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {recall.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Package className="w-4 h-4 mr-1" />
                {recall.brand || "Unknown Brand"}
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(recall.recall_date).toLocaleDateString()}
              </div>
              {recall.recall_number && (
                <div>
                  Recall #: {recall.recall_number}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Image */}
              {recall.product_image_url && (
                <Card>
                  <CardContent className="p-6">
                    <img 
                      src={recall.product_image_url} 
                      alt={recall.product_name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Recall Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {recall.description}
                  </p>
                </CardContent>
              </Card>

              {/* Remedy Instructions */}
              {recall.remedy_instructions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-recall-warning">
                      What You Should Do
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {recall.remedy_instructions}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Affected Lots */}
              {recall.affected_lots && recall.affected_lots.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Affected Product Lots</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {recall.affected_lots.map((lot, index) => (
                        <Badge key={index} variant="outline">
                          {lot}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Product Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <dt className="font-medium text-gray-900">Product Name</dt>
                    <dd className="text-gray-600">{recall.product_name}</dd>
                  </div>
                  
                  {recall.brand && (
                    <div>
                      <dt className="font-medium text-gray-900">Brand</dt>
                      <dd className="text-gray-600">{recall.brand}</dd>
                    </div>
                  )}
                  
                  <div>
                    <dt className="font-medium text-gray-900">Category</dt>
                    <dd className="text-gray-600">{recall.category}</dd>
                  </div>
                  
                  {recall.barcode && (
                    <div>
                      <dt className="font-medium text-gray-900">Barcode</dt>
                      <dd className="text-gray-600 font-mono text-sm">{recall.barcode}</dd>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Official Source */}
              {recall.source_url && (
                <Card>
                  <CardHeader>
                    <CardTitle>Official Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(recall.source_url, '_blank')}
                    >
                      View on {recall.source}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RecallDetails;