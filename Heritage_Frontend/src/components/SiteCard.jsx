import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Crown, Landmark, ArrowRight } from 'lucide-react';

export default function SiteCard({ id, name, city, province, civilizationEra, siteType, unescoListed, period, satisfactionRating, images, onBookNow }) {

  const getProvinceBadgeStyle = (prov) => {
    switch (prov) {
      case 'Punjab':           return 'bg-amber-900/30 text-amber-300 border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-300';
      case 'Sindh':            return 'bg-rose-900/30 text-rose-300 border-rose-700/50 dark:bg-rose-900/30 dark:text-rose-300';
      case 'KPK':              return 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'Balochistan':      return 'bg-orange-900/30 text-orange-300 border-orange-700/50 dark:bg-orange-900/30 dark:text-orange-300';
      case 'Gilgit-Baltistan': return 'bg-blue-900/30 text-blue-300 border-blue-700/50 dark:bg-blue-900/30 dark:text-blue-300';
      case 'AJK':              return 'bg-purple-900/30 text-purple-300 border-purple-700/50 dark:bg-purple-900/30 dark:text-purple-300';
      default:                 return 'bg-[#3D494F]/40 text-[#C8B89A] border-[#3D494F]';
    }
  };

  // Light mode province badges (lighter tones)
  const getProvinceBadgeStyleLight = (prov) => {
    switch (prov) {
      case 'Punjab':           return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Sindh':            return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'KPK':              return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Balochistan':      return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Gilgit-Baltistan': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'AJK':              return 'bg-purple-100 text-purple-800 border-purple-300';
      default:                 return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  return (
    <div className="bg-[#EDEAE4] dark:bg-[#23282D] rounded-[16px] border border-[#D5CFC6] dark:border-[#3D494F] overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex flex-col h-full min-h-[320px] group">

      {/* Site Image */}
      <div className="relative w-full overflow-hidden" style={{ height: '200px' }}>
        {images?.[0] ? (
          <img
            src={images[0]}
            alt={name}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              borderRadius: '16px 16px 0 0',
              display: 'block'
            }}
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '200px',
            background: 'linear-gradient(135deg, #1a2a22, #23282D)',
            borderRadius: '16px 16px 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontSize: '32px' }}>🏛️</span>
            <span style={{ 
              color: '#3D494F', 
              fontSize: '11px',
              fontFamily: 'Outfit'
            }}>No image yet</span>
          </div>
        )}

        {/* UNESCO badge */}
        {unescoListed && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F5F2ED]/90 dark:bg-[#23282D]/90 text-[#1D9E75] border border-[#1D9E75]/40 text-[10px] font-sans shadow-sm uppercase tracking-wider" style={{fontWeight: 500}}>
              <Crown className="w-3.5 h-3.5 fill-[#1D9E75] text-[#1D9E75]" />
              <span>UNESCO</span>
            </span>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="flex-1 p-[20px] flex flex-col justify-between gap-4">
        <div className="space-y-2.5">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-sans border tracking-wider uppercase transition-all duration-300 dark:${getProvinceBadgeStyle(province)} ${getProvinceBadgeStyleLight(province)}`} style={{fontWeight: 500}}>
              {province}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-sans text-[#1A1E21] dark:text-[#EDE9DF]" style={{fontWeight: 500}}>
              <Star className="w-3.5 h-3.5 text-[#1D9E75] fill-[#1D9E75]" />
              <span>{satisfactionRating}</span>
            </span>
          </div>

          {/* Title */}
          <h3 className="font-serif font-bold text-lg text-[#1A1E21] dark:text-[#EDE9DF] group-hover:text-[#1D9E75] transition-colors leading-tight">
            {name}
          </h3>

          {/* Era / Period */}
          <div className="space-y-1">
            <div className="text-[11px] font-sans text-[#6B6560] dark:text-[#C8B89A] flex items-center gap-1">
              <span className="text-[#1D9E75]">Era:</span>
              <span>{civilizationEra}</span>
            </div>
            <div className="text-[11px] font-sans text-[#6B6560] dark:text-[#C8B89A] flex items-center gap-1">
              <span className="text-[#1D9E75]">Period:</span>
              <span className="truncate max-w-[200px]">{period}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2 flex flex-col gap-2">
          <Link
            to={`/site/${id}`}
            className="w-full py-2.5 rounded-full border border-[#1D9E75]/40 hover:border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75] hover:text-[#EDE9DF] font-sans text-xs transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-98"
            style={{fontWeight: 500}}
          >
            <span>Explore Heritage Engine</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>

          {onBookNow && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onBookNow();
              }}
              className="w-full text-white font-sans text-sm cursor-pointer select-none"
              style={{
                backgroundColor: '#1D9E75',
                padding: '10px',
                borderRadius: '8px',
                fontWeight: 600,
                border: 'none',
                marginTop: '8px',
                transition: 'all 0.2s',
                fontFamily: 'Outfit, sans-serif'
              }}
              onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
              onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
            >
              Book a Tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
