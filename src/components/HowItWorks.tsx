
import { Search, Bell, Shield, Smartphone } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      title: "Search Products",
      description: "Enter product names, brands, barcodes, or categories to find recall information instantly.",
      color: "bg-blue-100 text-recall-trust"
    },
    {
      icon: Bell,
      title: "Get Alerts",
      description: "Sign up for email notifications about recalls for products you care about.",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: Shield,
      title: "Stay Protected",
      description: "Access detailed recall information including risk levels and remedy instructions.",
      color: "bg-green-100 text-recall-safe"
    },
    {
      icon: Smartphone,
      title: "Mobile Ready",
      description: "Use our mobile-friendly platform anywhere to check product safety on the go.",
      color: "bg-purple-100 text-purple-600"
    }
  ];

  return (
    <section id="about" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How RecallGuard Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform aggregates recall data from multiple government agencies to keep you informed and safe
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${step.color} mb-6`}>
                <step.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Data Sources */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Trusted Data Sources
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center text-center">
            <div className="space-y-2">
              <div className="w-16 h-16 bg-recall-trust rounded-lg flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-lg">FDA</span>
              </div>
              <p className="text-sm text-gray-600">Food & Drug Administration</p>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-lg">CPSC</span>
              </div>
              <p className="text-sm text-gray-600">Consumer Product Safety</p>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-lg">NHTSA</span>
              </div>
              <p className="text-sm text-gray-600">Vehicle Safety</p>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-lg">USDA</span>
              </div>
              <p className="text-sm text-gray-600">Agriculture Department</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
