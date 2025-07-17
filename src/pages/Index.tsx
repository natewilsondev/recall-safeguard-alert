
import { Header } from "@/components/Header";
import { SearchSection } from "@/components/SearchSection";
import { FeaturedRecalls } from "@/components/FeaturedRecalls";
import { HowItWorks } from "@/components/HowItWorks";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Footer } from "@/components/Footer";
import { RecallScraper } from "@/components/RecallScraper";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SearchSection />
      
      {/* Add scraper component for testing */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <RecallScraper />
          </div>
        </div>
      </section>
      
      <FeaturedRecalls />
      <HowItWorks />
      <NewsletterSignup />
      <Footer />
    </div>
  );
};

export default Index;
