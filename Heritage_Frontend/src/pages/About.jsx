import { Compass, Sparkles, Landmark } from 'lucide-react';
import aboutBgVideo from '../assets/WhatsApp Video 2026-08-10 at 7.32.00 AM.mp4';

export default function About() {
  // Page-wide variables (always dark for cinematic video contrast)
  const tp   = 'text-[#EDE9DF]';
  const tm   = 'text-[#C8B89A]';

  // Card-specific adaptive variables
  const ctp  = 'text-black dark:text-[#EDE9DF]';
  const ctm  = 'text-black dark:text-[#C8B89A]';

  return (
    <div className="relative flex-1 w-full bg-[#141618] pt-32 pb-16 px-6 md:px-12 select-none font-sans overflow-hidden transition-colors duration-300">
      {/* Background Video (Fixed to Viewport to maintain 16:9 ratio) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
        style={{ opacity: 0.35 }}
      >
        <source src={aboutBgVideo} type="video/mp4" />
      </video>

      {/* Dark Tint Overlay (Maintains high video contrast) */}
      <div className="fixed inset-0 bg-[#141618]/50 z-0 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col gap-0">

        {/* ── PAGE HERO — TOP SECTION ── */}
        <div className="text-center pt-12 pb-6 flex flex-col items-center">
          <h1 className={`text-4xl md:text-5.5xl font-serif font-bold ${tp} tracking-tight leading-tight`}>
            About HeritageAI Pakistan
          </h1>
          <p 
            className={`text-base sm:text-lg ${tm} italic mt-4 max-w-[520px] mx-auto text-center`} 
            style={{ fontWeight: 300 }}
          >
            Built to keep Pakistan's ancient soul alive — one archaeological site at a time.
          </p>
          {/* Thin horizontal decorative divider */}
          <div className="w-[60px] h-[1px] bg-[#1D9E75] mx-auto my-8" />
        </div>

        {/* ── SECTION 1 — HERITAGE IN NUMBERS ── */}
        <section className="py-16 grid grid-cols-1 md:grid-cols-5 gap-8 items-center max-w-4xl mx-auto w-full border-b border-[#3D494F]/25">
          {/* Stat 1 */}
          <div className="md:col-span-1 text-center flex flex-col items-center justify-center">
            <span className={`font-serif font-bold text-[56px] ${tp} leading-none`}>9,000+</span>
            <span className="font-sans text-xs tracking-[0.1em] text-[#1D9E75] uppercase mt-2 font-medium">Years of Civilization</span>
            <span className={`font-sans text-xs ${tm} italic mt-1 font-light`}>From Mehrgarh to the Mughal Empire</span>
          </div>
          
          {/* Divider 1 */}
          <div className="hidden md:flex md:col-span-1 justify-center items-center">
            <div className="w-[1px] h-20 bg-[#3D494F]/35" />
          </div>

          {/* Stat 2 */}
          <div className="md:col-span-1 text-center flex flex-col items-center justify-center">
            <span className={`font-serif font-bold text-[56px] ${tp} leading-none`}>62</span>
            <span className="font-sans text-xs tracking-[0.1em] text-[#1D9E75] uppercase mt-2 font-medium">Archaeological Sites</span>
            <span className={`font-sans text-xs ${tm} italic mt-1 font-light`}>Mapped, documented, and bookable</span>
          </div>

          {/* Divider 2 */}
          <div className="hidden md:flex md:col-span-1 justify-center items-center">
            <div className="w-[1px] h-20 bg-[#3D494F]/35" />
          </div>

          {/* Stat 3 */}
          <div className="md:col-span-1 text-center flex flex-col items-center justify-center">
            <span className={`font-serif font-bold text-[56px] ${tp} leading-none`}>6</span>
            <span className="font-sans text-xs tracking-[0.1em] text-[#1D9E75] uppercase mt-2 font-medium">UNESCO World Sites</span>
            <span className={`font-sans text-xs ${tm} italic mt-1 font-light`}>Preserved for future generations</span>
          </div>
        </section>

        {/* ── SECTION 2 — OUR MANIFESTO ── */}
        <section className="relative py-20 flex flex-col items-center text-center max-w-3xl mx-auto w-full border-b border-[#3D494F]/25 overflow-hidden">
          {/* Large faint quotation mark behind the text */}
          <span 
            className="absolute -top-6 left-6 md:left-20 font-serif text-[200px] text-[#1D9E75] opacity-[0.06] select-none pointer-events-none leading-none z-0"
            style={{ fontStyle: 'normal' }}
          >
            “
          </span>
          
          <span className="text-[11px] font-sans tracking-[0.14em] text-[#1D9E75] uppercase block mb-6 z-10 font-medium">
            OUR MISSION
          </span>
          <p className={`font-serif italic text-2xl md:text-3xl ${tp} leading-relaxed max-w-2xl mx-auto z-10`}>
            "Pakistan holds some of humanity's oldest stories. HeritageAI exists to make sure those stories are never forgotten — and always findable."
          </p>
          <p className={`font-sans text-sm ${tm} italic mt-6 font-light z-10`}>
            From Neolithic Mehrgarh to the Mughal forts of Lahore — we mapped it all.
          </p>
        </section>

        {/* ── SECTION 3 — WHAT WE BUILT ── */}
        <section className="py-20 flex flex-col items-center w-full border-b border-[#3D494F]/25">
          <span className="text-[11px] font-sans tracking-[0.14em] text-[#1D9E75] uppercase block mb-3 font-medium">
            WHAT WE BUILT
          </span>
          <h2 className={`text-2xl md:text-3.5xl font-serif font-bold ${tp} text-center mb-12`}>
            Three ways to experience Pakistan's heritage
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
            {/* Card 1 - Explore */}
            <div className="bg-[#EDEAE4]/40 dark:bg-[#23282D]/40 backdrop-blur-md border border-[#D5CFC6]/45 dark:border-[#3D494F]/45 p-9 rounded-[20px] flex flex-col gap-4 text-left hover:-translate-y-1 hover:border-[#1D9E75] hover:shadow-[0_8px_32px_rgba(29,158,117,0.12)] transition-all duration-250 ease-out group">
              <div className="w-12 h-12 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform duration-300">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className={`font-serif font-bold text-xl ${ctp}`}>Explore Sites</h3>
              <p className={`text-xs sm:text-sm ${ctm} leading-relaxed font-light`}>
                Browse 62 heritage sites filtered by era, region, and civilization. Every site documented with historical context and visitor details.
              </p>
            </div>

            {/* Card 2 - Discover */}
            <div className="bg-[#EDEAE4]/40 dark:bg-[#23282D]/40 backdrop-blur-md border border-[#D5CFC6]/45 dark:border-[#3D494F]/45 p-9 rounded-[20px] flex flex-col gap-4 text-left hover:-translate-y-1 hover:border-[#1D9E75] hover:shadow-[0_8px_32px_rgba(29,158,117,0.12)] transition-all duration-250 ease-out group">
              <div className="w-12 h-12 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className={`font-serif font-bold text-xl ${ctp}`}>AI Recommendations</h3>
              <p className={`text-xs sm:text-sm ${ctm} leading-relaxed font-light`}>
                Tell us what moves you — ancient forts, Sufi shrines, lost cities — and our engine builds your perfect heritage trail.
              </p>
            </div>

            {/* Card 3 - Book */}
            <div className="bg-[#EDEAE4]/40 dark:bg-[#23282D]/40 backdrop-blur-md border border-[#D5CFC6]/45 dark:border-[#3D494F]/45 p-9 rounded-[20px] flex flex-col gap-4 text-left hover:-translate-y-1 hover:border-[#1D9E75] hover:shadow-[0_8px_32px_rgba(29,158,117,0.12)] transition-all duration-250 ease-out group">
              <div className="w-12 h-12 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform duration-300">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className={`font-serif font-bold text-xl ${ctp}`}>Book a Tour</h3>
              <p className={`text-xs sm:text-sm ${ctm} leading-relaxed font-light`}>
                Reserve your visit in minutes. Custom itineraries, group options, and guided experiences across Pakistan.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 4 — OUR VISION ── */}
        <section className="py-20 flex flex-col items-center w-full">
          <span className="text-[11px] font-sans tracking-[0.14em] text-[#1D9E75] uppercase block mb-3 font-medium">
            OUR VISION
          </span>
          <h2 className={`text-2xl md:text-3.5xl font-serif font-bold ${tp} text-center mb-6`}>
            Preserving History Through Innovation
          </h2>
          <p className={`text-xs sm:text-sm ${tm} font-sans text-center max-w-2xl leading-relaxed font-light`} style={{ fontWeight: 300 }}>
            HeritageAI Pakistan is a digital initiative dedicated to cataloging, preserving, and sharing the rich cultural and archaeological history of Pakistan. By leveraging modern technology, we aim to make historical education and sustainable heritage tourism accessible to everyone worldwide.
          </p>
        </section>

      </div>
    </div>
  );
}
