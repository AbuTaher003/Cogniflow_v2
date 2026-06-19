import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { LivePreview } from "@/components/landing/live-preview";
import { WhyCogniFlow } from "@/components/landing/why-cogniflow";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden bg-slate-950 text-white min-h-screen">
      <div className="noise-grid pointer-events-none absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.015),_transparent)]" />
      <Navbar />
      <Hero />
      <LivePreview />
      <WhyCogniFlow />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <Faq />
      <Footer />
    </main>
  );
}
