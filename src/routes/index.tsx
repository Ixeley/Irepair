import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { initVisitorTracking } from "@/lib/visitor-presence";
import { TopBar } from "@/components/site/TopBar";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { Devices } from "@/components/site/Devices";
import { Services } from "@/components/site/Services";
import { WhyUs } from "@/components/site/WhyUs";
import { Process } from "@/components/site/Process";
import { BookingSection } from "@/components/site/BookingSection";
import { Pricing } from "@/components/site/Pricing";
import { FAQ } from "@/components/site/FAQ";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";
import { ChatBubble } from "@/components/site/ChatBubble";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  useEffect(() => {
    return initVisitorTracking("home");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Nav />
      <main>
        <Hero />
        <Devices />
        <Services />
        <WhyUs />
        <Process />
        <BookingSection />
        <Pricing />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <ChatBubble />
      <Toaster />
    </div>
  );
}
