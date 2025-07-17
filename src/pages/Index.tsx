
import { Header } from "@/components/Header";
import { SearchSection } from "@/components/SearchSection";
import { FeaturedRecalls } from "@/components/FeaturedRecalls";
import { HowItWorks } from "@/components/HowItWorks";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SearchSection />
      <FeaturedRecalls />
      <HowItWorks />
      <NewsletterSignup />
      <Footer />
    </div>
  );
};

export default Index;
