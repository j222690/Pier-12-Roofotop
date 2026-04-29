import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import GallerySection from "@/components/GallerySection";
import EventsSection from "@/components/EventsSection";
import PrivateEventsSection from "@/components/PrivateEventsSection";
import BusinessHoursSection from "@/components/BusinessHoursSection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <GallerySection />
      <EventsSection />
      <PrivateEventsSection />
      <BusinessHoursSection />
      <FooterSection />
    </div>
  );
};

export default Index;
