
import { Search, Shield, Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-recall-trust" />
            <span className="text-2xl font-bold text-gray-900">RecallGuard</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#search" className="text-gray-700 hover:text-recall-trust transition-colors">
              Search Recalls
            </a>
            <a href="#alerts" className="text-gray-700 hover:text-recall-trust transition-colors">
              Safety Alerts
            </a>
            <a href="#about" className="text-gray-700 hover:text-recall-trust transition-colors">
              How It Works
            </a>
            <Button className="bg-recall-trust hover:bg-blue-600">
              <Bell className="w-4 h-4 mr-2" />
              Get Alerts
            </Button>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden animate-slide-up">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <a
                href="#search"
                className="block px-3 py-2 text-gray-700 hover:text-recall-trust hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Search Recalls
              </a>
              <a
                href="#alerts"
                className="block px-3 py-2 text-gray-700 hover:text-recall-trust hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Safety Alerts
              </a>
              <a
                href="#about"
                className="block px-3 py-2 text-gray-700 hover:text-recall-trust hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <div className="px-3 py-2">
                <Button className="w-full bg-recall-trust hover:bg-blue-600">
                  <Bell className="w-4 h-4 mr-2" />
                  Get Alerts
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
