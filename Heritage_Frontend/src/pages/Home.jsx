import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Search, Database, CalendarCheck, ArrowRight, Star, Landmark } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import SiteCard from '../components/SiteCard';
import { siteData } from '../data/siteData';
import api from '../services/api';

const regions = [
  { name: 'Punjab', count: 28, tagline: 'Cradle of Mughal elegance & Sufi mysticism', lightColor: 'bg-amber-100 text-amber-800', darkColor: 'dark:bg-amber-950/30 dark:text-amber-300/60' },
  { name: 'Sindh', count: 16, tagline: 'Gateway of Islam & ancient Indus city grids', lightColor: 'bg-rose-100 text-rose-800', darkColor: 'dark:bg-rose-950/30 dark:text-rose-300/60' },
  { name: 'KPK', count: 14, tagline: 'Graeco-Buddhist monasteries & Gandhara art', lightColor: 'bg-emerald-100 text-emerald-800', darkColor: 'dark:bg-emerald-950/30 dark:text-emerald-300/60' },
  { name: 'Balochistan', count: 8, tagline: 'Neolithic origins & remote mountain trails', lightColor: 'bg-orange-100 text-orange-800', darkColor: 'dark:bg-orange-950/30 dark:text-orange-300/60' },
  { name: 'Gilgit-Baltistan', count: 6, tagline: 'Silk Road fortresses & high valley heights', lightColor: 'bg-blue-100 text-blue-800', darkColor: 'dark:bg-blue-950/30 dark:text-blue-300/60' },
  { name: 'AJK', count: 3, tagline: 'Kashmiri fortresses & temple universities', lightColor: 'bg-purple-100 text-purple-800', darkColor: 'dark:bg-purple-950/30 dark:text-purple-300/60' }
];



const PROVINCE_COUNTS = {
  'Punjab': 28,
  'Sindh': 16,
  'KPK': 14,
  'Balochistan': 8,
  'Gilgit-Baltistan': 6,
  'AJK': 3
};

const features = [
  { icon: Brain, title: 'AI Recommendations', desc: 'Neural matching models evaluate your historical preferences to recommend optimal trails.' },
  { icon: Search, title: 'Semantic Search', desc: 'Query sites using natural phrasing like "symmetrical mirror halls" or "ancient water channels".' },
  { icon: Database, title: 'Visitor Insights', desc: 'Leverage thousands of visitor records to calculate accessibility scores and travel comfort indices.' },
  { icon: CalendarCheck, title: 'Easy Booking', desc: 'Secure certified local guides and arrange entries with a simple multi-step confirmation.' }
];

const steps = [
  { step: '01', title: 'Tell Us Your Interests', desc: 'Select historical eras, preferences, budget constraints, and regions.' },
  { step: '02', title: 'AI Finds Matches', desc: 'Our recommendation engine matches and scores optimal locations for you.' },
  { step: '03', title: 'Book Your Tour', desc: 'Confirm dates, select certified guides, and generate entry tickets.' }
];

const testimonials = [
  { name: 'Dr. Elizabeth Moore', role: 'Archaeology Professor', quote: 'HeritageAI transforms how scholars and travelers interact with Indus Valley relics. The indexing is precise, and the guide matching is spot on.', rating: 5 },
  { name: 'Zainab Qazi', role: 'Travel Vlogger', quote: 'Booking a guide for Takht-i-Bahi through this portal was seamless. The accessibility matrix told me exactly what to expect on the ridge trail.', rating: 5 },
  { name: 'Haris Khan', role: 'Family Traveler', quote: 'The AI recommended Baltit Fort based on our winter month query, and it was the highlight of our Hunza trip. Incredible project quality!', rating: 4 }
];

/* ── Shared token shortcuts ── */
const tp = 'text-[#1A1E21] dark:text-[#EDE9DF]';          // text primary
const tm = 'text-[#6B6560] dark:text-[#C8B89A]';          // text muted
const bg = 'bg-[#F5F2ED] dark:bg-[#141618]';              // page bg
const surf = 'bg-[#EDEAE4] dark:bg-[#23282D]';              // surface/card
const bdr = 'border-[#D5CFC6] dark:border-[#3D494F]';      // border
const div = 'bg-[#D5CFC6] dark:bg-[#3D494F]';              // divider

export default function Home() {
  const provinceImages = {
    'Punjab': 'https://d34vm3j4h7f97z.cloudfront.net/original/3X/2/b/2bf83428614bae7db7b011184f9b0808539ff3c0.jpeg',
    'Sindh': 'https://www.laurewanders.com/wp-content/uploads/2024/12/Things-to-do-in-Sindh-00001.jpg',
    'KPK': 'https://www.dikhannewcity.com/wp-content/uploads/2024/12/Khayber-1536x864.jpg',
    'Balochistan': 'https://matrixmag.com/wp-content/uploads/2025/03/Balochistan-2.jpg',
    'Gilgit-Baltistan': 'https://res.cloudinary.com/dwtpwlpn0/image/upload/v1781372908/heritage-sites/altit-fort.jpg',
    'AJK': 'https://res.cloudinary.com/dwtpwlpn0/image/upload/v1781372550/heritage-sites/sharda-temple.jpg'
  };

  const [popularSites, setPopularSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await api.get('/sites');
        const allSites = res.data.data || res.data;
        // Take first 4 sites for homepage
        setPopularSites(allSites.slice(0, 4));
      } catch (err) {
        console.error('Failed to fetch sites:', err);
      } finally {
        setSitesLoading(false);
      }
    };
    fetchSites();
  }, []);

  return (
    <div className={`flex-1 w-full ${bg} flex flex-col items-center`}>

      {/* 1. HERO */}
      <HeroSection />

      {/* 2. STATS BAR */}
      <div className={`w-full ${surf} py-6 px-6 select-none border-y ${bdr}`}>
        <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto flex flex-wrap justify-center md:justify-between items-center gap-6 text-sm font-sans uppercase text-center text-[#1D9E75]" style={{ fontWeight: 500, letterSpacing: '0.08em' }}>
          <span>62 Heritage Sites</span>
          <span className={`hidden md:inline ${div.replace('bg-', 'text-')}`}>•</span>
          <span>6 Distinct Regions</span>
          <span className={`hidden md:inline text-[#D5CFC6] dark:text-[#3D494F]`}>•</span>
          <span>9000+ Visitor Records</span>
          <span className="hidden md:inline text-[#D5CFC6] dark:text-[#3D494F]">•</span>
          <span>AI-Powered Recommendations</span>
        </div>
      </div>

      {/* 3. FEATURED REGIONS */}
      <section className="w-full py-16 px-6 max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2 select-none">
          <span className="text-xs font-sans uppercase text-[#1D9E75]" style={{ fontWeight: 500, letterSpacing: '0.08em' }}>Explore Territories</span>
          <h2 className={`text-3xl md:text-4xl font-serif font-bold ${tp}`}>Featured Regions</h2>
          <div className="w-20 h-0.5 bg-[#1D9E75] mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {regions.map((region) => (
            <Link
              key={region.name}
              to={`/explore?province=${region.name}`}
              className={`relative ${surf} rounded-2xl border ${bdr} overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 flex flex-col group cursor-pointer`}
            >
              <div className={`aspect-[16/10] w-full ${region.lightColor} ${region.darkColor} flex flex-col items-center justify-center gap-1.5 select-none p-4 relative overflow-hidden`}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  borderRadius: 'inherit',
                  zIndex: 0
                }}>
                  <img
                    src={provinceImages[region.name] ||
                      provinceImages[region.region] ||
                      provinceImages[region.province]}
                    alt={region.name || region.region}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.style.background =
                        'linear-gradient(135deg, #1a2a22 0%, #23282D 100%)'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                    zIndex: 1
                  }} />
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between" style={{ position: 'relative', zIndex: 2 }}>
                <div>
                  <h3 className={`font-serif font-bold text-lg ${tp} group-hover:text-[#1D9E75] transition-colors`}>
                    {region.name}
                  </h3>
                  <p className={`text-xs ${tm} font-sans mt-1 leading-relaxed`}>
                    {region.tagline}
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 text-xs font-sans text-[#1D9E75] group-hover:translate-x-1 transition-transform self-start" style={{ fontWeight: 500 }}>
                  <span>View All Sites</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className={`w-32 h-px ${div} mx-auto`} />

      {/* 4. WHY HERITAGE AI */}
      <section className={`w-full py-16 px-6 ${bg} max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto`}>
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2 select-none">
          <span className="text-xs font-sans uppercase text-[#1D9E75]" style={{ fontWeight: 500, letterSpacing: '0.08em' }}>Pioneering Digits</span>
          <h2 className={`text-3xl md:text-4xl font-serif font-bold ${tp}`}>Why HeritageAI</h2>
          <div className="w-20 h-0.5 bg-[#1D9E75] mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 select-none">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div key={index} className={`p-6 rounded-2xl border ${bdr} ${surf} flex flex-col items-center text-center space-y-3.5`}>
                <div className="w-12 h-12 rounded-full bg-[#1D9E75]/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#1D9E75]" />
                </div>
                <h3 className={`font-serif font-bold text-base ${tp}`}>{feat.title}</h3>
                <p className={`text-xs font-sans ${tm} leading-relaxed`}>{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Divider */}
      <div className={`w-32 h-px ${div} mx-auto`} />

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className={`w-full py-16 px-6 ${bg} max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto`}>
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2 select-none">
          <span className="text-xs font-sans uppercase text-[#1D9E75]" style={{ fontWeight: 500, letterSpacing: '0.08em' }}>Tour Pipeline</span>
          <h2 className={`text-3xl md:text-4xl font-serif font-bold ${tp}`}>How It Works</h2>
          <div className="w-20 h-0.5 bg-[#1D9E75] mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative select-none">
          <div className={`hidden md:block absolute top-10 left-[15%] right-[15%] h-0.5 ${div} -z-10`} />

          {steps.map((st) => (
            <div key={st.step} className={`flex flex-col items-center text-center p-6 ${surf} border ${bdr} rounded-2xl md:border-none md:bg-transparent`}>
              <div className={`w-14 h-14 rounded-full ${surf} border-2 border-[#1D9E75] flex items-center justify-center font-serif text-lg font-bold text-[#1D9E75] shadow mb-4`}>
                {st.step}
              </div>
              <h3 className={`font-serif font-bold text-base ${tp} mb-2`}>{st.title}</h3>
              <p className={`text-xs font-sans ${tm} leading-relaxed max-w-xs`}>{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. POPULAR SITES */}
      <section className={`w-full py-16 px-6 ${bg} border-y ${bdr}`}>
        <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-sans uppercase text-[#1D9E75]" style={{ fontWeight: 500, letterSpacing: '0.08em' }}>Curated Picks</span>
            <h2 className={`text-3xl font-serif font-bold ${tp}`}>Popular Sites</h2>
            <div className="w-20 h-0.5 bg-[#1D9E75]" />
          </div>
          <Link
            to="/explore"
            className="text-xs font-sans text-[#1D9E75] hover:text-[#1D9E75]/75 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            style={{ fontWeight: 500 }}
          >
            <span>View All 62 Sites</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[24px] pb-6">
          {sitesLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} style={{
                height: '320px',
                background: '#23282D',
                borderRadius: '16px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            ))
          ) : (
            popularSites.map((site) => (
              <div key={site._id || site.id} className="w-full">
                <SiteCard
                  id={site._id || site.id}
                  name={site.name}
                  city={site.city || site.nearbyCity}
                  province={site.region || site.province}
                  civilizationEra={site.era || site.civilizationEra}
                  siteType={site.type || site.siteType}
                  unescoListed={site.tags?.includes('unesco') || site.unescoListed}
                  period={site.era || site.period}
                  satisfactionRating={4.7}
                  description={site.shortDescription || site.description}
                  images={site.images}
                />
              </div>
            ))
          )}
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className={`w-full py-16 px-6 max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto select-none`}>
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-sans uppercase text-[#1D9E75]" style={{ fontWeight: 500, letterSpacing: '0.08em' }}>Visitor Logs</span>
          <h2 className={`text-3xl md:text-4xl font-serif font-bold ${tp}`}>What Builders Say</h2>
          <div className="w-20 h-0.5 bg-[#1D9E75] mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((test, index) => (
            <div key={index} className={`${surf} p-6 rounded-2xl border ${bdr} shadow-sm flex flex-col justify-between min-h-[220px]`}>
              <div className="space-y-3.5">
                <div className="flex gap-0.5">
                  {[...Array(test.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#1D9E75] fill-[#1D9E75]" />
                  ))}
                </div>
                <p className={`text-xs font-sans ${tp} opacity-85 leading-relaxed`}>
                  "{test.quote}"
                </p>
              </div>
              <div className={`pt-4 border-t ${bdr} mt-4`}>
                <h4 className={`font-serif font-bold text-sm ${tp}`}>{test.name}</h4>
                <span className={`text-[10px] uppercase font-sans ${tm} block mt-0.5`} style={{ fontWeight: 500 }}>{test.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. NEWSLETTER */}
      <section className={`w-full ${surf} py-16 px-6 select-none border-t ${bdr} flex justify-center`}>
        <div className="max-w-3xl w-full text-center space-y-6 flex flex-col items-center">
          <h2 className={`text-3xl font-serif font-bold tracking-tight ${tp}`}>
            Subscribe to Heritage Logs
          </h2>
          <p className={`text-xs font-sans ${tm} max-w-md leading-relaxed`}>
            Get monthly digests of archaeological discoveries, newly cataloged tour routes, and seasonal discount coupons.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); alert('Subscribed to Heritage Logs successfully!'); }}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
          >
            <input
              type="email"
              required
              placeholder="Enter your email address"
              className={`flex-1 px-5 py-3 rounded-full ${bg} ${tp} font-sans text-xs focus:outline-none focus:ring-2 focus:ring-[#1D9E75] border ${bdr}`}
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-[#1D9E75] hover:bg-[#1D9E75]/85 text-[#EDE9DF] font-sans text-xs shadow-md transition-all active:scale-95 shrink-0"
              style={{ fontWeight: 500 }}
            >
              Sign Up
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
