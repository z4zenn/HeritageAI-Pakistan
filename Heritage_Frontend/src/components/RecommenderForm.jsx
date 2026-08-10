import React, { useState } from 'react';
import { Sparkles, Sliders, Check } from 'lucide-react';

const interestOptions = [
  'Mughal Architecture',
  'Gandhara Buddhist Art',
  'Indus Valley',
  'Islamic Heritage',
  'Sufi Shrines',
  'Hindu Heritage',
  'Central Asian/Tibetan',
  'Neolithic'
];

const provinces = ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK'];
const visitorTypes = ['Solo Traveler', 'Family Group', 'Historian/Researcher', 'Adventure Backpacker'];
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function RecommenderForm({ onSubmit }) {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedProvinces, setSelectedProvinces] = useState([]);
  const [visitorType, setVisitorType] = useState(visitorTypes[0]);
  const [budget, setBudget] = useState(15000);
  const [travelMonth, setTravelMonth] = useState(months[9]);
  const [groupSize, setGroupSize] = useState(1);

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const toggleProvince = (province) => {
    setSelectedProvinces(prev =>
      prev.includes(province) ? prev.filter(p => p !== province) : [...prev, province]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ interests: selectedInterests, provinces: selectedProvinces, visitorType, budget, travelMonth, groupSize });
  };

  const inputBase = "w-full px-3.5 py-2.5 bg-[#EDEAE4] dark:bg-[#141618] border border-[#D5CFC6] dark:border-[#3D494F] rounded-xl font-sans text-xs text-[#1A1E21] dark:text-[#EDE9DF] focus:outline-none focus:border-[#1D9E75] appearance-none cursor-pointer";
  const labelBase = "text-[11px] font-sans uppercase text-[#1D9E75]";

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-3xl mx-auto bg-[#F5F2ED] dark:bg-[#23282D] border border-[#D5CFC6] dark:border-[#3D494F] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6 select-none transition-colors duration-300"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#D5CFC6] dark:border-[#3D494F] pb-4 mb-2">
        <Sliders className="w-5 h-5 text-[#1D9E75]" />
        <h2 className="font-serif font-bold text-xl text-[#1A1E21] dark:text-[#EDE9DF]">
          Tour Matching Preferences
        </h2>
      </div>

      {/* 1. Interests */}
      <div className="flex flex-col gap-2.5">
        <span className={`${labelBase}`} style={{fontWeight: 500, letterSpacing: '0.08em'}}>
          Your Cultural &amp; Historical Interests (Select all that apply)
        </span>
        <div className="flex flex-wrap gap-2">
          {interestOptions.map((opt) => {
            const isSelected = selectedInterests.includes(opt);
            return (
              <button
                type="button"
                key={opt}
                onClick={() => toggleInterest(opt)}
                className={`px-3 py-1.5 rounded-full text-xs font-sans transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#1D9E75] text-[#EDE9DF] border-[#1D9E75]'
                    : 'bg-[#EDEAE4] dark:bg-[#141618] text-[#6B6560] dark:text-[#C8B89A] border-[#D5CFC6] dark:border-[#3D494F] hover:border-[#1D9E75]'
                }`}
                style={{fontWeight: 500}}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Provinces */}
      <div className="flex flex-col gap-2.5">
        <span className={`${labelBase}`} style={{fontWeight: 500, letterSpacing: '0.08em'}}>
          Preferred Provinces / Regions
        </span>
        <div className="flex flex-wrap gap-2">
          {provinces.map((prov) => {
            const isSelected = selectedProvinces.includes(prov);
            return (
              <button
                type="button"
                key={prov}
                onClick={() => toggleProvince(prov)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all border flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1D9E75] text-[#EDE9DF] border-[#1D9E75]'
                    : 'bg-[#EDEAE4] dark:bg-[#141618] text-[#6B6560] dark:text-[#C8B89A] border-[#D5CFC6] dark:border-[#3D494F] hover:border-[#1D9E75]'
                }`}
                style={{fontWeight: 500}}
              >
                {isSelected && <Check className="w-3 h-3 text-[#EDE9DF]" />}
                <span>{prov}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Dropdowns & Number Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Visitor Type */}
        <div className="flex flex-col gap-2">
          <label htmlFor="visitor-type-select" className={labelBase} style={{fontWeight: 500, letterSpacing: '0.08em'}}>
            Visitor Profile
          </label>
          <div className="relative">
            <select id="visitor-type-select" value={visitorType} onChange={(e) => setVisitorType(e.target.value)} className={inputBase} style={{fontWeight: 500}}>
              {visitorTypes.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B6560] dark:text-[#C8B89A] text-[10px]">▼</div>
          </div>
        </div>

        {/* Travel Month */}
        <div className="flex flex-col gap-2">
          <label htmlFor="travel-month-select" className={labelBase} style={{fontWeight: 500, letterSpacing: '0.08em'}}>
            Expedition Month
          </label>
          <div className="relative">
            <select id="travel-month-select" value={travelMonth} onChange={(e) => setTravelMonth(e.target.value)} className={inputBase} style={{fontWeight: 500}}>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B6560] dark:text-[#C8B89A] text-[10px]">▼</div>
          </div>
        </div>

        {/* Group Size */}
        <div className="flex flex-col gap-2">
          <label htmlFor="recommender-group-size" className={labelBase} style={{fontWeight: 500, letterSpacing: '0.08em'}}>
            Group Size
          </label>
          <input
            type="number"
            id="recommender-group-size"
            min={1} max={50}
            value={groupSize}
            onChange={(e) => setGroupSize(Number(e.target.value))}
            className={inputBase}
            style={{fontWeight: 500}}
          />
        </div>
      </div>

      {/* 4. Budget Slider */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex justify-between">
          <span className={labelBase} style={{fontWeight: 500, letterSpacing: '0.08em'}}>Max Budget Per Person</span>
          <span className="text-[#1D9E75] text-xs font-mono" style={{fontWeight: 500}}>{budget.toLocaleString()} PKR</span>
        </div>
        <input
          type="range"
          min={2000} max={60000} step={1000}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full h-1.5 bg-[#D5CFC6] dark:bg-[#3D494F] rounded-lg appearance-none cursor-pointer accent-[#1D9E75]"
        />
        <div className="flex justify-between text-[9px] text-[#6B6560] dark:text-[#C8B89A] font-mono mt-1">
          <span>2,000 PKR</span>
          <span>60,000 PKR</span>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-4 border-t border-[#D5CFC6] dark:border-[#3D494F] flex justify-center">
        <button
          type="submit"
          className="px-8 py-3.5 rounded-full bg-[#1D9E75] hover:bg-[#1D9E75]/85 text-[#EDE9DF] font-sans text-sm shadow hover:shadow-md transition-all duration-300 active:scale-95 flex items-center gap-1.5 cursor-pointer"
          style={{fontWeight: 500}}
        >
          <Sparkles className="w-4 h-4" />
          <span>Find My Heritage Sites</span>
        </button>
      </div>
    </form>
  );
}
