import Navbar from "../../components/landing/Navbar";
import Hero from "../../components/landing/Hero";
import Features from "../../components/landing/Features";
import HowItWorks from "../../components/landing/HowItWorks";
import WhyChoose from "../../components/landing/WhyChoose";
import Statistics from "../../components/landing/Statistics";
import Testimonials from "../../components/landing/Testimonials";
import FAQ from "../../components/landing/FAQ";
import CTA from "../../components/landing/CTA";
import Footer from "../../components/landing/Footer";
import ScrollProgress from "../../components/landing/ScrollProgress";
import ScrollToTop from "../../components/landing/ScrollToTop";

function LandingPage() {
  return (
    <>
      <ScrollProgress />

      <Navbar />

      <main>
        <Hero />

        <Features />

        <HowItWorks />

        <WhyChoose />

        <Statistics />

        <Testimonials />

        <FAQ />

        <CTA />
      </main>

      <Footer />

      <ScrollToTop />
    </>
  );
}

export default LandingPage;