
import { Bell, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useNewsletterSignup } from "@/hooks/useNewsletterSignup";

export const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const newsletterMutation = useNewsletterSignup();

  const categories = [
    { id: "Food & Beverages", label: "Food & Beverages" },
    { id: "Toys & Children's Products", label: "Toys & Children's Products" },
    { id: "Vehicles", label: "Vehicles & Auto Parts" },
    { id: "Home Appliances", label: "Home Appliances" },
    { id: "Medical Devices", label: "Medical Devices" },
    { id: "Cosmetics & Personal Care", label: "Cosmetics & Personal Care" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    newsletterMutation.mutate({
      email,
      categories: selectedCategories
    });
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (newsletterMutation.isSuccess) {
    return (
      <section id="alerts" className="py-16 bg-recall-safe-light">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in">
            <CheckCircle className="w-16 h-16 text-recall-safe mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              You're All Set!
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for subscribing to RecallGuard alerts. We'll notify you about important recalls in your selected categories.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                newsletterMutation.reset();
                setEmail("");
                setSelectedCategories([]);
              }}
              className="hover:bg-recall-safe hover:text-white transition-colors"
            >
              Subscribe Another Email
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="alerts" className="py-16 bg-gradient-to-br from-recall-trust-light to-blue-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 animate-fade-in">
          <Bell className="w-12 h-12 text-recall-trust mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Stay Ahead of Recalls
          </h2>
          <p className="text-lg text-gray-600">
            Get instant email alerts when products you care about are recalled. Choose your categories and we'll keep you informed.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                  disabled={newsletterMutation.isPending}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Alert Categories (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={category.id}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                      disabled={newsletterMutation.isPending}
                    />
                    <label
                      htmlFor={category.id}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {category.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-recall-trust hover:bg-blue-600"
              disabled={newsletterMutation.isPending}
            >
              {newsletterMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Subscribing...
                </div>
              ) : (
                <>
                  <Bell className="w-5 h-5 mr-2" />
                  Subscribe to Alerts
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-500 mt-4 text-center">
            We respect your privacy. Unsubscribe at any time. No spam, ever.
          </p>
        </div>
      </div>
    </section>
  );
};
