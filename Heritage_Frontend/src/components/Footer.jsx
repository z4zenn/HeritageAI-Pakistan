import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Landmark, Heart } from 'lucide-react';

const tp = 'text-[#1A1E21] dark:text-[#EDE9DF]';
const tm = 'text-[#6B6560] dark:text-[#C8B89A]';
const bdr = 'border-[#D5CFC6] dark:border-[#3D494F]';

export default function Footer() {
  return (
    <footer className={`relative z-10 w-full bg-[#EDEAE4] dark:bg-[#23282D] pt-16 pb-8 px-6 border-t ${bdr} select-none transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

        {/* Column 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#1D9E75]" />
            <span className={`font-serif font-bold text-lg ${tp} tracking-tight`}>
              HeritageAI Pakistan
            </span>
          </div>
          <p className={`text-xs font-sans ${tm} leading-relaxed`}>
            An intelligent portal designed to curate ancient historical archives, recommend optimal heritage tours, and facilitate easy reservations across 62 monumental locations in Pakistan.
          </p>
        </div>

        {/* Column 2 */}
        <div className="space-y-4">
          <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-[#1D9E75]">Quick Links</h4>
          <ul className={`flex flex-col gap-2.5 text-xs ${tm} font-sans`}>
            {[['/', 'Home Portal'], ['/explore', 'Explore Monuments'], ['/recommend', 'AI Tour Finder'], ['/about', 'About Us']].map(([path, label]) => (
              <li key={path}><Link to={path} className="hover:text-[#1D9E75] transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Column 3 */}
        <div className="space-y-4">
          <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-[#1D9E75]">Explore Regions</h4>
          <ul className={`flex flex-col gap-2.5 text-xs ${tm} font-sans`}>
            {['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK'].map((r) => (
              <li key={r}>
                <Link to={`/explore?province=${r}`} className="hover:text-[#1D9E75] transition-colors">
                  {r === 'KPK' ? 'Khyber Pakhtunkhwa' : r === 'AJK' ? 'Azad Jammu & Kashmir' : r}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4 */}
        <div className="space-y-4">
          <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-[#1D9E75]">Contact</h4>
          <ul className={`flex flex-col gap-3 text-xs ${tm} font-sans`}>
            {[
              [Mail, 'info@heritageai.pk'],
              [MapPin, 'Islamabad, Pakistan']
            ].map(([Icon, text]) => (
              <li key={text} className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-[#1D9E75] shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className={`max-w-7xl mx-auto pt-8 border-t ${bdr} flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans ${tm} opacity-70 text-center`}>
        <span>© 2026 HeritageAI Pakistan. All Rights Reserved.</span>
        <span className="flex items-center gap-1.5">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-[#1D9E75] fill-[#1D9E75]" />
          <span>for Pakistan Heritage</span>
        </span>
      </div>
    </footer>
  );
}
