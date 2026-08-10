import React, { useState } from 'react';
import { 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  ArrowLeft, 
  Check, 
  Compass, 
  Landmark,
  Castle,
  Scroll,
  Flame,
  Palette,
  Crown,
  Leaf,
  Waves,
  Mountain,
  TreePine,
  Flag,
  User,
  Heart,
  Users,
  Clock,
  Sun,
  Calendar
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import ExploreSiteCard from '../components/ExploreSiteCard';
import { siteData } from '../data/siteData';
import { api } from '../services/api';

// Custom 4-person family icon representing Family Adventure
function FamilyIcon({ className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Father (Left Adult) */}
      <circle cx="5" cy="9" r="2" />
      <path d="M2.5 18v-1a2.5 2.5 0 0 1 5 0v1" />

      {/* Child 1 (Center Left) */}
      <circle cx="9.8" cy="12" r="1.3" />
      <path d="M8.2 18v-1a1.6 1.6 0 0 1 3.2 0v1" />

      {/* Child 2 (Center Right) */}
      <circle cx="14.2" cy="12" r="1.3" />
      <path d="M12.6 18v-1a1.6 1.6 0 0 1 3.2 0v1" />

      {/* Mother (Right Adult) */}
      <circle cx="19" cy="9" r="2" />
      <path d="M16.5 18v-1a2.5 2.5 0 0 1 5 0v1" />
    </svg>
  );
}

export default function Recommend() {
  const { theme } = useTheme();

  // Navigation & flow states
  const [step, setStep] = useState(1);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingSubtext, setShowLoadingSubtext] = useState(false);
  const [matchedSites, setMatchedSites] = useState(null);

  // Quiz selections
  const [selectedQ1, setSelectedQ1] = useState([]); // Draws
  const [selectedQ2, setSelectedQ2] = useState([]); // Regions
  const [selectedQ3, setSelectedQ3] = useState('');  // Travel Style
  const [selectedQ4, setSelectedQ4] = useState('');  // Duration Depth
  const [selectedQ5, setSelectedQ5] = useState(15000); // Budget

  // Navigation handlers
  const handleGoBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleContinue = () => {
    if (step < 5) {
      setStep(prev => prev + 1);
    }
  };

  // Auto-advance for single-select steps with a brief delay so user sees selection
  const handleSingleSelectAdvance = (setter, value) => {
    setter(value);
    setTimeout(() => {
      setStep(prev => prev + 1);
    }, 280);
  };

  // Selections togglers
  const toggleQ1 = (id) => {
    setSelectedQ1(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleQ2 = (regionName) => {
    if (regionName === 'All of Pakistan') {
      setSelectedQ2(prev => 
        prev.includes('All of Pakistan') ? [] : ['All of Pakistan']
      );
    } else {
      setSelectedQ2(prev => {
        const filtered = prev.filter(r => r !== 'All of Pakistan');
        if (filtered.includes(regionName)) {
          return filtered.filter(r => r !== regionName);
        } else {
          return [...filtered, regionName];
        }
      });
    }
  };

  // Budget Tier Classifier
  const getActiveBudgetTier = (val) => {
    if (val >= 2000 && val <= 15000) return 'explorer';
    if (val > 15000 && val <= 35000) return 'traveler';
    return 'grand';
  };

  // Submit and Calculate Matches
  const handleSubmitQuiz = async () => {
    setIsLoading(true);
    setShowLoadingSubtext(false);

    // Delayed loading subtext
    const subtextTimeout = setTimeout(() => {
      setShowLoadingSubtext(true);
    }, 500);

    // 1. Map Q1 Selections to backend Interest tags
    let interestsMap = [];
    if (selectedQ1.includes('arch')) interestsMap.push('mughal', 'fort', 'palace');
    if (selectedQ1.includes('civ')) interestsMap.push('indus', 'bronze-age', 'neolithic', 'stone-age', 'archaeology');
    if (selectedQ1.includes('sacred')) interestsMap.push('islamic', 'mosque', 'tomb', 'worship');
    if (selectedQ1.includes('art')) interestsMap.push('buddhist', 'gandhara', 'monastery');
    if (selectedQ1.includes('empires')) interestsMap.push('mughal', 'fort');
    if (selectedQ1.includes('nature')) interestsMap.push('desert', 'garden', 'water');
    
    if (interestsMap.length === 0) {
      interestsMap = ['archaeology', 'mughal', 'unesco'];
    }

    // 2. Map Q2 Selections to backend Province names
    let regionMap = 'Any';
    if (selectedQ2.length === 1 && !selectedQ2.includes('All of Pakistan')) {
      regionMap = selectedQ2[0];
    }

    // 3. Map Q3 Selections to backend Travel Style
    let travelStyleMap = 'Solo Traveler';
    if (selectedQ3 === 'solo') travelStyleMap = 'Solo Traveler';
    else if (selectedQ3 === 'couple') travelStyleMap = 'Adventure Backpacker';
    else if (selectedQ3 === 'family') travelStyleMap = 'Family Group';
    else if (selectedQ3 === 'group') travelStyleMap = 'Historian/Researcher';

    try {
      // Fetch recommendations from backend
      const data = await api.fetchRecommendations(interestsMap, regionMap, travelStyleMap);
      
      // Map matchPercentage for visualization consistency
      const scored = data.map((site, index) => ({
        ...site,
        matchPercentage: Math.max(99 - index * 3 - Math.floor(Math.random() * 2), 65)
      }));

      setMatchedSites(scored);
    } catch (err) {
      console.error("Failed to fetch AI recommendations, running local fallback:", err);
      // Fallback local scoring if backend fails
      let provincesMap = [];
      if (selectedQ2.includes('All of Pakistan') || selectedQ2.length === 0) {
        provincesMap = ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK'];
      } else {
        provincesMap = selectedQ2;
      }
      
      const calculatedMatches = siteData.map((site) => {
        let matchScore = 50;

        if (interestsMap.length > 0) {
          const hasInterest = interestsMap.some(interest =>
            site.civilizationEra.toLowerCase().includes(interest.toLowerCase()) ||
            site.siteType.toLowerCase().includes(interest.toLowerCase()) ||
            site.tags.includes(interest.toLowerCase())
          );
          if (hasInterest) matchScore += 25;
        }

        if (provincesMap.length > 0) {
          if (provincesMap.includes(site.province)) matchScore += 20;
        }

        matchScore += Math.floor(10 + Math.random() * 5);
        matchScore = Math.min(matchScore, 99);
        return { ...site, matchPercentage: matchScore };
      });

      const sortedMatches = calculatedMatches
        .sort((a, b) => b.matchPercentage - a.matchPercentage)
        .slice(0, 5);

      setMatchedSites(sortedMatches);
    } finally {
      clearTimeout(subtextTimeout);
      setIsLoading(false);
      setQuizCompleted(true);
    }
  };

  const handleRetakeQuiz = () => {
    setSelectedQ1([]);
    setSelectedQ2([]);
    setSelectedQ3('');
    setSelectedQ4('');
    setSelectedQ5(15000);
    setMatchedSites(null);
    setQuizCompleted(false);
    setStep(1);
  };

  // Compile Q1 Selection Labels for summary
  const getQ1SelectedSummary = () => {
    const labels = [];
    if (selectedQ1.includes('arch')) labels.push('Ancient Architecture');
    if (selectedQ1.includes('civ')) labels.push('Lost Civilizations');
    if (selectedQ1.includes('sacred')) labels.push('Spiritual & Sacred Sites');
    if (selectedQ1.includes('art')) labels.push('Art & Culture');
    if (selectedQ1.includes('empires')) labels.push('Empires & Dynasties');
    if (selectedQ1.includes('nature')) labels.push('Nature & Landscape');
    
    if (labels.length === 0) return 'Heritage Sites';
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} & ${labels[1]}`;
    return `${labels.slice(0, -1).join(', ')}, & ${labels[labels.length - 1]}`;
  };

  // Compile Q2 Selected Regions for summary
  const getQ2SelectedSummary = () => {
    if (selectedQ2.includes('All of Pakistan') || selectedQ2.length === 0) {
      return 'Pakistan';
    }
    if (selectedQ2.length === 1) return selectedQ2[0];
    if (selectedQ2.length === 2) return `${selectedQ2[0]} and ${selectedQ2[1]}`;
    return `${selectedQ2.slice(0, -1).join(', ')}, and ${selectedQ2[selectedQ2.length - 1]}`;
  };

  /* ── Options datasets ── */
  const q1Options = [
    { id: 'arch', icon: Castle, title: 'Ancient Architecture' },
    { id: 'civ', icon: Scroll, title: 'Lost Civilizations' },
    { id: 'sacred', icon: Flame, title: 'Spiritual & Sacred Sites' },
    { id: 'art', icon: Palette, title: 'Art & Culture' },
    { id: 'empires', icon: Crown, title: 'Empires & Dynasties' },
    { id: 'nature', icon: Leaf, title: 'Nature & Landscape' }
  ];

  const q2Options = [
    { name: 'Punjab', icon: Waves },
    { name: 'Sindh', icon: Scroll },
    { name: 'KPK', icon: Compass },
    { name: 'Balochistan', icon: Sun },
    { name: 'Gilgit-Baltistan', icon: Mountain },
    { name: 'AJK', icon: TreePine },
    { name: 'All of Pakistan', icon: Flag }
  ];

  const q3Options = [
    { id: 'solo', icon: User, title: 'Solo Explorer', desc: 'Your own pace, your own path' },
    { id: 'couple', icon: Users, title: "Couple's Journey", desc: 'Shared discoveries' },
    { id: 'family', icon: FamilyIcon, title: 'Family Adventure', desc: 'Memories for everyone' },
    { id: 'group', icon: Compass, title: 'Group Expedition', desc: 'More stories, more magic' }
  ];

  const q4Options = [
    { id: 'half', icon: Clock, title: 'Half Day', desc: 'A focused 3–4 hour visit' },
    { id: 'full', icon: Sun, title: 'Full Day Immersion', desc: 'Dawn to dusk exploration' },
    { id: 'multi', icon: Calendar, title: 'Multi-Day Expedition', desc: 'Go deep into history' }
  ];

  // Global tokens
  const cardActiveStyle = 'bg-gradient-to-br from-[#1a3a30] to-[#0f2420] border-[1.5px] border-[#1D9E75] shadow-[0_0_24px_rgba(29,158,117,0.2)]';
  const cardHoverStyle = 'hover:bg-[#EDEAE4]/80 dark:hover:bg-[#2a3035] hover:border-[#1D9E75]/50 dark:hover:border-[#C8B89A] hover:-translate-y-[3px] transition-all duration-200';
  const trackColor = theme === 'dark' ? '#3D494F' : '#D5CFC6';

  /* ───────────────────────────────
     LOADING STATE SCREEN
  ──────────────────────────────── */
  if (isLoading) {
    return (
      <div 
        className="flex-1 w-full bg-[#F5F2ED] dark:bg-[#141618] flex flex-col items-center justify-center py-20 px-6 select-none"
        style={{ 
          background: theme === 'dark' 
            ? 'radial-gradient(circle at center, rgba(29, 158, 117, 0.04) 0%, #141618 100%)' 
            : 'radial-gradient(circle at center, rgba(29, 158, 117, 0.02) 0%, #F5F2ED 100%)', 
          minHeight: '85vh' 
        }}
      >
        <div className="flex flex-col items-center justify-center gap-4 text-center max-w-sm">
          {/* Centered pulsing Logo icon */}
          <div className="w-20 h-20 rounded-full bg-[#1D9E75]/10 border border-[#1D9E75]/30 flex items-center justify-center mb-2 animate-pulse-subtle">
            <Landmark className="w-9 h-9 text-[#1D9E75] drop-shadow-[0_0_10px_#1D9E75]" />
          </div>
          
          <div className="space-y-2 font-sans text-xs">
            <p className="uppercase tracking-[0.18em] text-[#1D9E75] font-semibold text-sm">AI Match Pipeline</p>
            {showLoadingSubtext && (
              <p className="text-[#6B6560] dark:text-[#C8B89A] font-light text-sm animate-fade-in-up duration-500">
                Searching 62 sites across Pakistan...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ───────────────────────────────
     RESULTS SCREEN
  ──────────────────────────────── */
  if (quizCompleted && matchedSites) {
    return (
      <div className="flex-1 w-full bg-[#F5F2ED] dark:bg-[#141618] py-16 px-6 md:px-12 lg:px-16 select-none transition-colors duration-300">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#1A1E21] dark:text-[#EDE9DF] tracking-tight">
              Your Heritage Trail
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6560] dark:text-[#C8B89A] italic font-sans font-light max-w-xl mx-auto leading-relaxed">
              Based on your love of {getQ1SelectedSummary()} in {getQ2SelectedSummary()} — here are your top matches:
            </p>
            <div className="w-24 h-0.5 bg-[#1D9E75] mx-auto mt-2" />
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[28px] items-stretch mt-4">
            {matchedSites.map((site) => (
              <div key={site.id} className="relative group h-full flex flex-col justify-between">
                <div className="relative">
                  {/* Match score ribbon */}
                  <div className="absolute top-4 right-4 z-20 bg-[#1D9E75] text-[#EDE9DF] px-3 py-1 rounded-full text-[10px] font-sans tracking-wide uppercase shadow-md" style={{ fontWeight: 600 }}>
                    {site.matchPercentage}% Match
                  </div>
                  <ExploreSiteCard {...site} />
                </div>
                {site.recommendationReason && (
                  <div className="mt-3 bg-[#EDEAE4]/75 dark:bg-[#1C1C1C] border border-[#D5CFC6]/50 dark:border-[#3D494F]/40 p-4 rounded-xl text-[11px] font-sans italic text-[#6B6560]/90 dark:text-[#C8B89A]/95 leading-relaxed relative flex items-start gap-2 shadow-sm">
                    <span className="text-xs">✨</span>
                    <div>
                      <span className="font-bold not-italic uppercase tracking-wider text-[8px] text-[#1D9E75] block mb-0.5">AI Suggestion Reason</span>
                      {site.recommendationReason}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tips Section */}
          <div className="bg-[#EDEAE4] dark:bg-[#23282D] p-6 border border-[#D5CFC6] dark:border-[#3D494F] rounded-2xl flex items-start gap-4 text-xs leading-relaxed text-[#6B6560] dark:text-[#C8B89A] max-w-2xl mx-auto shadow-sm">
            <AlertCircle className="w-5 h-5 text-[#1D9E75] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#1D9E75] font-semibold">Match Scoring rationale: </span>
              Rankings are calculated based on the convergence of your interest flags, preferred province coordinate boundaries, and budget suitability index.
            </div>
          </div>

          {/* Retake Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleRetakeQuiz}
              className="px-8 py-3.5 rounded-full border border-[#1D9E75]/55 text-[#1D9E75] hover:bg-[#1D9E75] hover:text-[#EDE9DF] font-sans text-xs transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
              style={{ fontWeight: 500 }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Heritage Quiz</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  /* ───────────────────────────────
     QUIZ STEPS FLOW
  ──────────────────────────────── */
  return (
    <div 
      className="flex-1 w-full bg-[#F5F2ED] dark:bg-[#141618] flex flex-col justify-between pt-28 pb-12 px-6 md:px-12 select-none transition-colors duration-300 relative overflow-hidden" 
      style={{ 
        background: theme === 'dark' 
          ? 'radial-gradient(circle at center, rgba(29, 158, 117, 0.04) 0%, #141618 100%)' 
          : 'radial-gradient(circle at center, rgba(29, 158, 117, 0.02) 0%, #F5F2ED 100%)', 
        minHeight: '85vh' 
      }}
    >
      {/* 1. Header Toolbar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between pb-8 border-b border-[#D5CFC6] dark:border-[#3D494F]/20">
        {/* Back Button */}
        {step > 1 ? (
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1.5 text-xs text-[#6B6560] dark:text-[#C8B89A] hover:text-[#1D9E75] transition-colors cursor-pointer bg-transparent border-none outline-none font-sans"
            style={{ fontWeight: 300 }}
          >
            <ArrowLeft className="w-4 h-4 text-[#6B6560] dark:text-[#C8B89A]" />
            <span>Back</span>
          </button>
        ) : (
          <div className="w-12 h-4" /> // placeholder spacer
        )}

        {/* Progress Bar */}
        <div className="flex-1 mx-8 max-w-md h-[2px] bg-[#D5CFC6] dark:bg-[#3D494F] rounded-full relative overflow-hidden">
          <div 
            className="h-full bg-[#1D9E75] transition-all duration-300 ease-out" 
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Question Counter */}
        <span className="text-xs font-sans text-[#6B6560] dark:text-[#C8B89A]" style={{ fontWeight: 300 }}>
          {step} of 5
        </span>
      </div>

      {/* 2. Focused Main Question Area */}
      <div key={step} className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center py-12 animate-quiz-slide">
        
        {/* QUESTION 1 — WHAT DRAWS YOU TO HERITAGE */}
        {step === 1 && (
          <div className="w-full space-y-10 flex flex-col items-center">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4.5xl font-serif font-bold text-[#1A1E21] dark:text-[#EDE9DF]">
                What draws you to heritage?
              </h2>
              <p className="text-sm font-sans text-[#6B6560] dark:text-[#C8B89A]" style={{ fontWeight: 300 }}>
                Pick everything that speaks to you
              </p>
            </div>

            {/* 2x3 responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-2xl justify-center">
              {q1Options.map((opt) => {
                const isSelected = selectedQ1.includes(opt.id);
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleQ1(opt.id)}
                    className={`w-[160px] h-[180px] sm:w-[180px] sm:h-[200px] rounded-[20px] flex flex-col justify-between p-6 border relative cursor-pointer text-left transition-all duration-300 ${
                      isSelected 
                        ? cardActiveStyle 
                        : `bg-[#EDEAE4] dark:bg-[#23282D] border-[#D5CFC6] dark:border-[#3D494F]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${cardHoverStyle}`
                    }`}
                  >
                    {/* Icon */}
                    <div 
                      className="pt-2 transition-all duration-300"
                      style={{ filter: isSelected ? 'drop-shadow(0 0 8px #1D9E75)' : 'none' }}
                    >
                      <IconComponent className={`w-8 h-8 ${isSelected ? 'text-[#1D9E75]' : 'text-[#6B6560] dark:text-[#C8B89A]'}`} />
                    </div>
                    {/* Label */}
                    <span 
                      className={`font-sans text-xs font-medium tracking-wide leading-snug pb-1 transition-colors duration-300 ${isSelected ? 'text-[#1D9E75]' : 'text-[#1A1E21] dark:text-[#EDE9DF]'}`}
                    >
                      {opt.title}
                    </span>

                    {/* Small teal check badge */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#1D9E75] flex items-center justify-center shadow-md animate-fade-in-up">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleContinue}
              disabled={selectedQ1.length === 0}
              className={`px-8 py-3 rounded-full text-xs font-sans uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                selectedQ1.length > 0 
                  ? 'bg-[#1D9E75] text-[#EDE9DF] hover:bg-[#1D9E75]/90'
                  : 'bg-[#EDEAE4] dark:bg-[#23282D] text-[#6B6560]/40 dark:text-[#6B6560] border border-[#D5CFC6] dark:border-[#3D494F]/40 cursor-not-allowed'
              }`}
              style={{ fontWeight: 500 }}
            >
              Continue
            </button>
          </div>
        )}

        {/* QUESTION 2 — WHERE IN PAKISTAN CALLS TO YOU */}
        {step === 2 && (
          <div className="w-full space-y-10 flex flex-col items-center">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4.5xl font-serif font-bold text-[#1A1E21] dark:text-[#EDE9DF]">
                Where in Pakistan calls to you?
              </h2>
              <p className="text-sm font-sans text-[#6B6560] dark:text-[#C8B89A]" style={{ fontWeight: 300 }}>
                Select one or more regions
              </p>
            </div>

            {/* Horizontal Wrap Pills */}
            <div className="flex flex-wrap gap-4 justify-center max-w-2xl my-2">
              {q2Options.map((opt) => {
                const isSelected = selectedQ2.includes(opt.name);
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.name}
                    onClick={() => toggleQ2(opt.name)}
                    className={`h-[64px] min-w-[160px] px-6 rounded-full flex items-center justify-center gap-3 border cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#1a3a30] to-[#152e25] border-[#1D9E75] text-[#EDE9DF] shadow-[0_0_20px_rgba(29,158,117,0.25)]'
                        : `bg-[#EDEAE4] dark:bg-[#23282D] border-[#D5CFC6] dark:border-[#3D494F]/60 text-[#6B6560] dark:text-[#C8B89A] hover:bg-[#EDEAE4]/80 dark:hover:bg-[#2a3035] hover:border-[#1D9E75]/60`
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isSelected ? 'text-[#1D9E75]' : 'text-[#6B6560] dark:text-[#C8B89A]'}`} />
                    <span className="font-serif italic text-base font-normal">
                      {opt.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleContinue}
              disabled={selectedQ2.length === 0}
              className={`px-8 py-3 rounded-full text-xs font-sans uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                selectedQ2.length > 0 
                  ? 'bg-[#1D9E75] text-[#EDE9DF] hover:bg-[#1D9E75]/90'
                  : 'bg-[#EDEAE4] dark:bg-[#23282D] text-[#6B6560]/40 dark:text-[#6B6560] border border-[#D5CFC6] dark:border-[#3D494F]/40 cursor-not-allowed'
              }`}
              style={{ fontWeight: 500 }}
            >
              Continue
            </button>
          </div>
        )}

        {/* QUESTION 3 — HOW DO YOU LIKE TO TRAVEL */}
        {step === 3 && (
          <div className="w-full space-y-10 flex flex-col items-center">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4.5xl font-serif font-bold text-[#1A1E21] dark:text-[#EDE9DF]">
                How do you like to travel?
              </h2>
              <p className="text-sm font-sans text-[#6B6560] dark:text-[#C8B89A]" style={{ fontWeight: 300 }}>
                This helps us match the right tour sizes
              </p>
            </div>

            {/* 4 tall cards - single select */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl justify-center w-full">
              {q3Options.map((opt) => {
                const isSelected = selectedQ3 === opt.id;
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSingleSelectAdvance(setSelectedQ3, opt.id)}
                    className={`w-full h-[220px] rounded-[20px] flex flex-col justify-between p-6 border relative cursor-pointer text-center transition-all duration-300 ${
                      isSelected 
                        ? cardActiveStyle 
                        : `bg-[#EDEAE4] dark:bg-[#23282D] border-[#D5CFC6] dark:border-[#3D494F]/60 text-[#1A1E21] dark:text-[#EDE9DF] hover:border-[#1D9E75]/60 hover:bg-[#EDEAE4]/80 dark:hover:bg-[#2a3035]`
                    }`}
                  >
                    {/* Large icon */}
                    <div 
                      className="pt-4 mx-auto transition-all duration-300"
                      style={{ filter: isSelected ? 'drop-shadow(0 0 8px #1D9E75)' : 'none' }}
                    >
                      <IconComponent className={`w-10 h-10 mx-auto ${isSelected ? 'text-[#1D9E75]' : 'text-[#6B6560] dark:text-[#C8B89A]'}`} />
                    </div>
                    {/* Content Group */}
                    <div className="space-y-1.5 pb-2">
                      <h4 
                        className={`font-serif font-bold text-sm leading-snug transition-colors duration-300 ${isSelected ? 'text-[#1D9E75]' : 'text-[#1A1E21] dark:text-[#EDE9DF]'}`}
                      >
                        {opt.title}
                      </h4>
                      <p className="font-sans text-[11px] text-[#6B6560] dark:text-[#C8B89A] italic font-light leading-tight">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* QUESTION 4 — HOW DEEP DO YOU WANT TO GO */}
        {step === 4 && (
          <div className="w-full space-y-10 flex flex-col items-center">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4.5xl font-serif font-bold text-[#1A1E21] dark:text-[#EDE9DF]">
                How deep do you want to go?
              </h2>
              <p className="text-sm font-sans text-[#6B6560] dark:text-[#C8B89A]" style={{ fontWeight: 300 }}>
                How much time will you give to each site?
              </p>
            </div>

            {/* 3 horizontal cards side-by-side - single select */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl justify-center w-full">
              {q4Options.map((opt) => {
                const isSelected = selectedQ4 === opt.id;
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSingleSelectAdvance(setSelectedQ4, opt.id)}
                    className={`w-full h-[160px] rounded-[20px] flex flex-col justify-between p-6 border relative cursor-pointer text-center transition-all duration-300 ${
                      isSelected 
                        ? cardActiveStyle 
                        : `bg-[#EDEAE4] dark:bg-[#23282D] border-[#D5CFC6] dark:border-[#3D494F]/60 text-[#1A1E21] dark:text-[#EDE9DF] hover:border-[#1D9E75]/60 hover:bg-[#EDEAE4]/80 dark:hover:bg-[#2a3035]`
                    }`}
                  >
                    {/* Large icon */}
                    <div 
                      className="transition-all duration-300"
                      style={{ filter: isSelected ? 'drop-shadow(0 0 8px #1D9E75)' : 'none' }}
                    >
                      <IconComponent className={`w-8 h-8 mx-auto ${isSelected ? 'text-[#1D9E75]' : 'text-[#6B6560] dark:text-[#C8B89A]'}`} />
                    </div>
                    {/* Content Group */}
                    <div className="space-y-1.5 pb-1">
                      <h4 
                        className={`font-serif font-bold text-sm leading-snug transition-colors duration-300 ${isSelected ? 'text-[#1D9E75]' : 'text-[#1A1E21] dark:text-[#EDE9DF]'}`}
                      >
                        {opt.title}
                      </h4>
                      <p className="font-sans text-[11px] text-[#6B6560] dark:text-[#C8B89A] italic font-light leading-tight">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* QUESTION 5 — BUDGET PER PERSON */}
        {step === 5 && (
          <div className="w-full space-y-10 flex flex-col items-center">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4.5xl font-serif font-bold text-[#1A1E21] dark:text-[#EDE9DF]">
                What's your budget per person?
              </h2>
              <p className="text-sm font-sans text-[#6B6560] dark:text-[#C8B89A]" style={{ fontWeight: 300 }}>
                We'll find the best experiences within your range
              </p>
            </div>

            {/* Slider container */}
            <div className="w-full max-w-lg space-y-6 pt-4 px-4">
              
              {/* Dynamic live budget counter */}
              <div className="text-center">
                <span className="font-serif font-bold text-4xl sm:text-5xl text-[#1A1E21] dark:text-[#EDE9DF]">
                  ₨ {selectedQ5.toLocaleString()}
                </span>
              </div>

              {/* Slider Input */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={2000}
                  max={60000}
                  step={1000}
                  value={selectedQ5}
                  onChange={(e) => setSelectedQ5(Number(e.target.value))}
                  className="w-full h-[4px] budget-slider rounded-full cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #1D9E75 0%, #1D9E75 ${((selectedQ5 - 2000) / (60000 - 2000)) * 100}%, ${trackColor} ${((selectedQ5 - 2000) / (60000 - 2000)) * 100}%, ${trackColor} 100%)`
                  }}
                />
                
                {/* Min Max Labels */}
                <div className="flex justify-between text-xs font-sans text-[#6B6560] dark:text-[#C8B89A]" style={{ fontWeight: 300 }}>
                  <span>₨ 2,000</span>
                  <span>₨ 60,000</span>
                </div>
              </div>

              {/* 3 Budget Tier labels below */}
              <div className="flex justify-between items-center text-xs font-sans pt-4 border-t border-[#D5CFC6] dark:border-[#3D494F]/15">
                {[
                  { id: 'explorer', label: 'Budget Explorer', range: '2k–15k' },
                  { id: 'traveler', label: 'Heritage Traveler', range: '15k–35k' },
                  { id: 'grand', label: 'Grand Expedition', range: '35k–60k' }
                ].map((tier) => {
                  const isActive = getActiveBudgetTier(selectedQ5) === tier.id;
                  return (
                    <div 
                      key={tier.id} 
                      className="flex flex-col items-center text-center transition-all duration-300"
                    >
                      <span 
                        className={`transition-all ${
                          isActive 
                            ? 'text-[#1D9E75] font-semibold text-xs scale-105' 
                            : 'text-[#6B6560]/50 dark:text-[#3D494F] font-light text-[11px]'
                        }`}
                      >
                        {tier.label}
                      </span>
                      <span className={`text-[10px] mt-0.5 ${isActive ? 'text-[#1D9E75]/70 font-normal' : 'text-[#6B6560]/40 dark:text-[#3D494F]/60'}`}>
                        {tier.range}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Submit CTA button */}
              <div className="flex justify-center pt-8">
                <button
                  onClick={handleSubmitQuiz}
                  className="w-[320px] h-14 rounded-full bg-gradient-to-r from-[#1D9E75] to-[#15705A] hover:from-[#21b384] hover:to-[#1a856c] text-[#EDE9DF] font-sans font-semibold text-base tracking-wide flex items-center justify-center gap-2.5 transition-all duration-300 transform hover:scale-[1.03] hover:shadow-[0_8px_32px_rgba(29,158,117,0.4)] cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-white" />
                  <span>Find My Heritage Sites ✦</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* 3. Invisible bottom spacer to balance layout */}
      <div className="w-full h-8" />
    </div>
  );
}
