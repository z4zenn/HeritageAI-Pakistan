import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function HeroSection() {
  const handleScrollToHowItWorks = () => {
    const section = document.getElementById('how-it-works');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden select-none bg-[#141618]">

      {/* 1. Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/hero-background.mp4" type="video/mp4" />
      </video>

      {/* 2. Responsive Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#141618]/85 via-[#141618]/70 to-[#141618]/55 md:bg-gradient-to-r md:from-[#141618]/95 md:via-[#141618]/65 md:to-transparent pointer-events-none z-0" />

      {/* 3. Left-Aligned Content */}
      <div className="absolute inset-0 flex items-center z-10 px-6">
        <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto w-full flex justify-start">
          <div className="max-w-2xl text-left space-y-6 flex flex-col items-start">


            {/* Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-[#EDE9DF] tracking-tight leading-[1.1] animate-fade-in-up animation-delay-200">
              Discover Pakistan's <br />
              <span className="text-[#C8B89A]" style={{ fontStyle: 'italic', fontWeight: 400 }}>Ancient Soul</span>
            </h1>

            {/* Subheading */}
            <p className="text-sm md:text-lg text-[#EDE9DF]/80 font-sans max-w-xl leading-relaxed animate-fade-in-up animation-delay-300">
              AI-powered heritage tour booking across 62 archaeological sites, from Neolithic Mehrgarh to imperial Mughal forts.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto justify-start animate-fade-in-up animation-delay-400">
              <Link
                to="/explore"
                className="px-8 py-3.5 rounded-full bg-[#1D9E75] hover:bg-[#EDE9DF] text-[#EDE9DF] hover:text-[#1D9E75] font-sans text-sm shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                style={{ fontWeight: 500 }}
              >
                <Compass className="w-4 h-4" />
                <span>Explore Sites</span>
              </Link>

              <button
                type="button"
                onClick={handleScrollToHowItWorks}
                className="px-8 py-3.5 rounded-full border border-[#EDE9DF]/60 hover:border-[#EDE9DF] text-[#EDE9DF] hover:bg-[#EDE9DF]/10 font-sans text-sm transition-all duration-300 active:scale-95"
                style={{ fontWeight: 500 }}
              >
                How It Works
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
