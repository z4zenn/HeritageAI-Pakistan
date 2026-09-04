import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, Filter, X, Map, Eye, MapPin, Landmark, Star } from 'lucide-react';
import ExploreSiteCard from '../components/ExploreSiteCard';
import { siteData } from '../data/siteData';
import { api } from '../services/api';


const provinces = ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK'];
const siteTypes = [
  'Archaeological Site',
  'Fort',
  'Mosque',
  'Temple',
  'Gurudwara',
  'Tomb',
  'Stupa',
  'Monastery',
  'Museum',
  'Rock Art',
  'Garden'
];
const eras = [
  'Indus Valley',
  'Buddhist',
  'Gandhara',
  'Hindu',
  'Sikh',
  'Mughal',
  'Sultanate',
  'Medieval Islamic',
  'British Colonial',
  'Neolithic',
  'Ancient'
];

const getSiteInfo = async (siteName) => {
  return await api.getSiteInfo(siteName);
};

// Image recognition function using Groq Llama-4 Vision

/**
 * Resize and compress an image file to a lightweight JPEG format.
 * This prevents payload limit errors from the LLM APIs and speeds up uploads.
 */
const compressImage = (file, maxWidth = 1000, maxHeight = 1000, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to JPEG base64 Data URL with specified quality
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(new Error("Failed to load image element."));
    };
    reader.onerror = (err) => reject(new Error("Failed to read image file."));
  });
};

/**
 * Identify a Pakistani heritage / archaeological site from an image.
 */
const identifySite = async (imageFile) => {
  if (!imageFile) {
    throw new Error("No image was provided.");
  }

  try {
    // Compress and convert to base64 JPEG format before sending
    const base64Image = await compressImage(imageFile);
    const result = await api.identifySite(base64Image);
    return result;
  } catch (error) {
    console.error("Heritage site identification failed:", error);
    throw new Error(
      error?.message || "Failed to identify the heritage site."
    );
  }
};

export { identifySite };
// Match landmark name against local sites list
const matchSite = (landmarkName, sitesArray) => {
  const name = landmarkName.toLowerCase();
  return sitesArray.filter(site =>
    site.name.toLowerCase().includes(name) ||
    name.includes(site.name.toLowerCase()) ||
    site.city.toLowerCase().includes(name) ||
    site.alternateNames?.some(alt =>
      alt.toLowerCase().includes(name) ||
      name.includes(alt.toLowerCase())
    )
  );
};

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const provinceParam = searchParams.get('province');
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState(provinceParam || 'All');
  const [selectedType, setSelectedType] = useState('All');
  const [unescoOnly, setUnescoOnly] = useState(false);
  const [selectedEra, setSelectedEra] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleBookNow = (site) => {
    navigate(`/checkout/${site.slug || site._id}`);
  };

  // Load sites from API on mount
  useEffect(() => {
    const loadSites = async () => {
      try {
        setIsLoading(true);
        const data = await api.fetchSites();
        setSites(data);
      } catch (err) {
        console.error("Failed to fetch sites from backend:", err);
        // Fallback to static data in case backend is offline
        setSites(siteData);
      } finally {
        setIsLoading(false);
      }
    };
    loadSites();
  }, []);



  // Pagination state and automatic reset on filter updates
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    setVisibleCount(6);
  }, [searchQuery, selectedProvince, selectedType, unescoOnly, selectedEra]);

  // Temporary drawer states
  const [tempProvince, setTempProvince] = useState(selectedProvince);
  const [tempType, setTempType] = useState(selectedType);
  const [tempUnesco, setTempUnesco] = useState(unescoOnly);
  const [tempEra, setTempEra] = useState(selectedEra);

  // Image recognition states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiIdentifiedName, setAiIdentifiedName] = useState('');
  const [aiConfidence, setAiConfidence] = useState('');
  const [aiSiteInfo, setAiSiteInfo] = useState(null);
  const [aiRawResult, setAiRawResult] = useState(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [showToastAlert, setShowToastAlert] = useState(false);

  const fileInputRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (msg, duration = 4000) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    setShowToastAlert(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowToastAlert(false);
    }, duration);
  };

  const handleIdentifyClick = async () => {
    if (!selectedImageFile) return;
    setIsAnalyzing(true);
    try {
      const result = await identifySite(selectedImageFile);
      setAiRawResult(result);

      if (result.identified && result.status !== "NOT_A_LANDMARK") {
        setAiIdentifiedName(result.siteName || "Recognized Landmark");
        setAiConfidence(result.confidence || "high");
        setShowUploadModal(false);
        setSelectedImageFile(null);
        setPreviewUrl('');

        setIsFetchingInfo(true);
        setAiSiteInfo(null);

        if (result.status === "PAKISTANI_HERITAGE" || result.status === "INTERNATIONAL_LANDMARK") {
          getSiteInfo(result.siteName)
            .then((info) => {
              setAiSiteInfo(info);
              setIsFetchingInfo(false);
            })
            .catch((err) => {
              console.error(err);
              const fallbackSite = sites.find(site =>
                site.name.toLowerCase() === result.siteName.toLowerCase() ||
                site.name.toLowerCase().includes(result.siteName.toLowerCase()) ||
                result.siteName.toLowerCase().includes(site.name.toLowerCase())
              );
              setAiSiteInfo({
                isPakistaniHeritage: result.isPakistaniSite,
                historySummary: result.description || "A notable historical landmark.",
                modernLocation: result.location || (result.isPakistaniSite ? "Pakistan" : "Outside Pakistan"),
                era: fallbackSite ? fallbackSite.civilizationEra : "Historical Era",
                period: fallbackSite ? fallbackSite.period : "Unknown Period"
              });
              setIsFetchingInfo(false);
            });
        } else {
          // UNKNOWN_LANDMARK
          setAiSiteInfo({
            isPakistaniHeritage: false,
            historySummary: result.description || "This looks like a historical landmark or ruin, but its exact name could not be verified in global archives.",
            modernLocation: result.location || "Unknown Location",
            era: "Ancient / Historical",
            period: "Unverified Period"
          });
          setIsFetchingInfo(false);
        }
      } else {
        // NOT_A_LANDMARK
        setAiIdentifiedName("Not a Landmark");
        setAiConfidence("low");
        setShowUploadModal(false);
        setSelectedImageFile(null);
        setPreviewUrl('');
        setIsFetchingInfo(false);
        setAiSiteInfo({
          isPakistaniHeritage: false,
          historySummary: "We couldn't detect a recognizable landmark or heritage site in this photo. Please try uploading an image of a monument, ruin, or historic building.",
          modernLocation: "N/A",
          era: "N/A",
          period: "N/A"
        });
      }
    } catch (err) {
      console.error(err);
      setShowUploadModal(false);
      setSelectedImageFile(null);
      setPreviewUrl('');
      showToast("Something went wrong. Please try again.", 4000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearAiResult = () => {
    setAiRawResult(null);
    setAiIdentifiedName('');
    setAiConfidence('');
    setAiSiteInfo(null);
    setIsFetchingInfo(false);
    // Reset page filters to return the grid to normal unfiltered state
    setSelectedProvince('All');
    setSelectedType('All');
    setUnescoOnly(false);
    setSelectedEra('All');
    setSearchQuery('');
    setSearchParams({});
    setTempProvince('All');
    setTempType('All');
    setTempUnesco(false);
    setTempEra('All');
  };

  const matchedSite = (aiIdentifiedName && (aiRawResult?.status === "PAKISTANI_HERITAGE" || aiRawResult?.isPakistaniSite))
    ? sites.find(site =>
      site.name.toLowerCase() === aiIdentifiedName.toLowerCase() ||
      site.name.toLowerCase().includes(aiIdentifiedName.toLowerCase()) ||
      aiIdentifiedName.toLowerCase().includes(site.name.toLowerCase())
    )
    : null;

  const currentStatus = aiRawResult?.status || (
    aiIdentifiedName === "Not a Landmark" || (aiSiteInfo && !aiSiteInfo.isPakistaniHeritage && aiIdentifiedName.includes("Not"))
      ? "NOT_A_LANDMARK"
      : (aiSiteInfo?.isPakistaniHeritage ? "PAKISTANI_HERITAGE" : "INTERNATIONAL_LANDMARK")
  );

  const isNotALandmark = currentStatus === "NOT_A_LANDMARK" || aiRawResult?.identified === false;
  const isPakistaniHeritage = currentStatus === "PAKISTANI_HERITAGE";
  const isInternationalLandmark = currentStatus === "INTERNATIONAL_LANDMARK";
  const isUnknownLandmark = currentStatus === "UNKNOWN_LANDMARK";

  const handleViewSimilarClick = () => {
    if (matchedSite) {
      if (matchedSite.civilizationEra && matchedSite.civilizationEra !== 'All') {
        setSelectedEra(matchedSite.civilizationEra);
        setTempEra(matchedSite.civilizationEra);
      } else {
        setSelectedProvince(matchedSite.province);
        setTempProvince(matchedSite.province);
      }
    }
  };

  const handleBrowseSimilarClick = () => {
    if (aiSiteInfo && aiSiteInfo.era) {
      const matchedEra = eras.find(e =>
        e.toLowerCase().includes(aiSiteInfo.era.toLowerCase()) ||
        aiSiteInfo.era.toLowerCase().includes(e.toLowerCase())
      );
      if (matchedEra) {
        setSelectedEra(matchedEra);
        setTempEra(matchedEra);
      } else {
        setSelectedEra('All');
        setTempEra('All');
      }
    }
  };

  // Sync active filters to temp filters whenever drawer is opened
  useEffect(() => {
    if (showFilters) {
      setTempProvince(selectedProvince);
      setTempType(selectedType);
      setTempUnesco(unescoOnly);
      setTempEra(selectedEra);
    }
  }, [showFilters, selectedProvince, selectedType, unescoOnly, selectedEra]);

  useEffect(() => {
    if (provinceParam) {
      setSelectedProvince(provinceParam);
      setTempProvince(provinceParam);
    }
  }, [provinceParam]);

  const clearFilter = (type) => {
    if (type === 'province') {
      setSelectedProvince('All');
      setTempProvince('All');
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('province');
      setSearchParams(newParams);
    }
    if (type === 'type') {
      setSelectedType('All');
      setTempType('All');
    }
    if (type === 'unesco') {
      setUnescoOnly(false);
      setTempUnesco(false);
    }
    if (type === 'era') {
      setSelectedEra('All');
      setTempEra('All');
    }
    if (type === 'search') setSearchQuery('');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedProvince('All');
    setSelectedType('All');
    setUnescoOnly(false);
    setSelectedEra('All');
    setSearchParams({});
    setTempProvince('All');
    setTempType('All');
    setTempUnesco(false);
    setTempEra('All');
    setAiIdentifiedName('');
    setAiConfidence('');
    setAiSiteInfo(null);
    setIsFetchingInfo(false);
  };

  const handleApplyFilters = () => {
    setSelectedProvince(tempProvince);
    setSelectedType(tempType);
    setUnescoOnly(tempUnesco);
    setSelectedEra(tempEra);

    const newParams = new URLSearchParams(searchParams);
    if (tempProvince === 'All') {
      newParams.delete('province');
    } else {
      newParams.set('province', tempProvince);
    }
    setSearchParams(newParams);

    setShowFilters(false);
  };

  const handleResetTempFilters = () => {
    setTempProvince('All');
    setTempType('All');
    setTempUnesco(false);
    setTempEra('All');
  };

  const filteredSites = sites.filter((site) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || (
      site.name?.toLowerCase().includes(searchLower) ||
      (site.region || site.province)?.toLowerCase().includes(searchLower) ||
      (site.era || site.civilizationEra || site.period)?.toLowerCase().includes(searchLower) ||
      (site.type || site.siteType)?.toLowerCase().includes(searchLower) ||
      site.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );

    // Handle province filtering
    const matchesProvince = selectedProvince === 'All' ||
      site.province.toLowerCase() === selectedProvince.toLowerCase();

    // Handle site type filtering (flexible match)
    let matchesType = false;
    if (selectedType === 'All') {
      matchesType = true;
    } else {
      const siteTypeLower = site.siteType.toLowerCase();
      const selTypeLower = selectedType.toLowerCase();
      matchesType = siteTypeLower.includes(selTypeLower) ||
        selTypeLower.includes(siteTypeLower) ||
        (selTypeLower.includes('fort') && siteTypeLower.includes('fort')) ||
        (selTypeLower === 'archaeological' && siteTypeLower.includes('archaeological')) ||
        (selTypeLower === 'religious/shrine' && ['mosque', 'temple', 'gurudwara', 'monastery', 'shrine'].some(t => siteTypeLower.includes(t)));
    }

    const matchesUnesco = !unescoOnly || site.unescoListed === true;

    // Handle era filtering (flexible match)
    let matchesEra = false;
    if (selectedEra === 'All') {
      matchesEra = true;
    } else {
      const siteEraLower = site.civilizationEra.toLowerCase();
      const selEraLower = selectedEra.toLowerCase();
      matchesEra = siteEraLower.includes(selEraLower) ||
        selEraLower.includes(siteEraLower) ||
        (selEraLower.includes('mughal') && siteEraLower.includes('mughal')) ||
        (selEraLower.includes('buddhist') && (siteEraLower.includes('buddhist') || siteEraLower.includes('gandhara'))) ||
        (selEraLower.includes('gandhara') && (siteEraLower.includes('gandhara') || siteEraLower.includes('buddhist'))) ||
        (selEraLower.includes('neolithic') && siteEraLower.includes('neolithic')) ||
        (selEraLower.includes('islamic') && siteEraLower.includes('islamic')) ||
        (selEraLower.includes('hindu') && siteEraLower.includes('hindu')) ||
        (selEraLower.includes('sikh') && siteEraLower.includes('sikh'));
    }

    return matchesSearch && matchesProvince && matchesType && matchesUnesco && matchesEra;
  });

  /* ── Shared style tokens ── */
  const textPrimary = "text-[#1A1E21] dark:text-[#EDE9DF]";
  const textMuted = "text-[#6B6560] dark:text-[#C8B89A]";

  return (
    <div className="flex-1 w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 py-12 flex flex-col gap-12 select-none">

      {/* Page Header - Editorial Opener */}
      <div className="pt-16 md:pt-20 pb-4 flex flex-col gap-3">
        <h1 className={`text-4xl md:text-5xl font-serif font-bold ${textPrimary} tracking-tight`}>
          Explore Heritage Sites
        </h1>
        <p
          className={`text-xs md:text-sm ${textMuted} max-w-xl leading-relaxed`}
          style={{ fontWeight: 300, letterSpacing: '0.012em' }}
        >
          Browse through Pakistan's rich historical locations, explore ancient ruins, sacred shrines, and plan your custom itinerary.
        </p>
      </div>

      {/* AI Result Panel */}
      {aiIdentifiedName && (
        <div className="relative bg-[#23282D] border-[0.5px] border-[#3D494F] rounded-[20px] p-8 md:py-8 md:px-[36px] mb-8 animate-slide-down shadow-2xl">
          {/* Close / Dismiss panel */}
          <div className="absolute top-6 right-6 flex flex-col items-center select-none z-10">
            <button
              onClick={handleClearAiResult}
              className="text-xl text-[#C8B89A] hover:text-[#EDE9DF] transition-colors cursor-pointer font-sans bg-transparent border-none outline-none leading-none p-1"
              aria-label="Dismiss result"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={handleClearAiResult}
              className="text-[12px] font-sans font-light text-[#3D494F] hover:text-[#C8B89A] transition-colors cursor-pointer bg-transparent border-none outline-none underline underline-offset-2 mt-1"
            >
              Clear result
            </button>
          </div>

          {isNotALandmark ? (
            /* NOT A LANDMARK Alert Banner */
            <div className="flex items-start gap-4 pr-12 max-md:pr-0">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-1">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] tracking-wider uppercase font-medium px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-block font-sans">
                  Not a Landmark
                </span>
                <h3 className="text-2xl font-serif text-[#EDE9DF] font-medium">
                  We couldn't detect a landmark in this photo
                </h3>
                <p className="text-xs text-[#C8B89A] font-sans leading-relaxed max-w-xl">
                  We couldn't detect a recognizable landmark or heritage site in this photo. Please try uploading an image of a monument, ruin, or historic building.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleClearAiResult}
                    className="px-5 py-2 rounded-full border border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75]/10 text-xs font-sans font-medium transition-all cursor-pointer"
                  >
                    Try Another Photo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* LANDMARK IDENTIFIED RESULT PANEL */
            <div className="flex flex-col md:flex-row gap-8 pr-12 max-md:pr-0">
              {/* Left Column: Details */}
              <div className="flex-[1.4] flex flex-col justify-between">
                <div>
                  {/* Top Row Badges */}
                  <div className="flex items-center justify-between flex-wrap gap-2 w-full pr-12 max-md:pr-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] tracking-wider uppercase font-medium px-2.5 py-0.5 rounded-full bg-[#1D9E75]/15 text-[#1D9E75] border border-[#1D9E75]/30 font-sans">
                        {isUnknownLandmark ? 'Potential Landmark' : 'AI Identified'}
                      </span>
                    </div>
                    {aiConfidence && (
                      <div className={`px-2.5 py-0.5 rounded-full border text-[10px] font-sans font-medium uppercase tracking-wider ${
                        aiConfidence === 'high'
                          ? 'bg-[#1D9E75]/15 border-[#1D9E75] text-[#1D9E75]'
                          : aiConfidence === 'medium'
                            ? 'bg-[#C8B89A]/10 border-[#C8B89A] text-[#C8B89A]'
                            : 'bg-[#3D494F]/30 border-[#3D494F] text-[#3D494F]'
                      }`}>
                        {aiConfidence} confidence
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl md:text-3xl font-serif text-[#EDE9DF] font-medium mt-3 leading-tight">
                    {aiIdentifiedName}
                  </h3>

                  {/* Description / Summary */}
                  {isFetchingInfo ? (
                    <div className="mt-3.5 space-y-2.5">
                      <div className="h-4 bg-[#3D494F] rounded-[4px] w-full skeleton-shimmer" />
                      <div className="h-4 bg-[#3D494F] rounded-[4px] w-[90%] skeleton-shimmer" />
                      <div className="h-4 bg-[#3D494F] rounded-[4px] w-[75%] skeleton-shimmer" />
                    </div>
                  ) : (
                    <p className="text-xs md:text-sm text-gray-400 font-sans font-light mt-2.5 leading-relaxed max-w-xl">
                      {aiRawResult?.description || aiSiteInfo?.historySummary || "A historical site or monument."}
                    </p>
                  )}
                </div>

                {/* Location Row */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center text-xs text-gray-400 font-sans">
                    <MapPin className="w-[13px] h-[13px] text-[#1D9E75] mr-1.5 shrink-0" />
                    <span className="text-gray-500 mr-1">Location:</span>
                    <span className="text-gray-200 font-medium">
                      {aiRawResult?.location || aiSiteInfo?.modernLocation || "Unknown Location"}
                    </span>
                  </div>

                  {!isUnknownLandmark && (aiSiteInfo?.era || aiSiteInfo?.period) && (
                    <div className="flex items-center text-xs text-gray-400 font-sans">
                      <Landmark className="w-[13px] h-[13px] text-[#1D9E75] mr-1.5 shrink-0" />
                      <span className="text-[#C8B89A]">
                        {aiSiteInfo?.era || "Historical Era"} {aiSiteInfo?.period ? `· ${aiSiteInfo.period}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Context Banner */}
              <div className="flex-[0.6] bg-[#1a1e22] border border-[#3D494F]/40 p-4 rounded-xl max-w-xs flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#23282D] text-[#C8B89A] border border-[#3D494F] w-fit font-medium inline-block font-sans">
                    {isPakistaniHeritage && 'Pakistani Heritage'}
                    {isInternationalLandmark && 'International Landmark'}
                    {isUnknownLandmark && 'Uncataloged Site'}
                  </span>

                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    {isPakistaniHeritage && matchedSite &&
                      "This landmark is cataloged in our primary database. Explore full details and tour availability below."}

                    {isPakistaniHeritage && !matchedSite &&
                      "This landmark is located in Pakistan, but it is currently not added to our database catalog."}

                    {isInternationalLandmark &&
                      `This landmark is located in ${aiRawResult?.country || 'another country'}, outside Pakistan. HeritageAI focuses on Pakistan's heritage sites.`}

                    {isUnknownLandmark &&
                      "This looks like a historical landmark or ruin, but its exact name could not be verified in global archives. You can still explore verified sites across Pakistan below."}
                  </p>
                </div>

                {matchedSite ? (
                  <div className="pt-2 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#EDE9DF]">
                      <Star className="w-3.5 h-3.5 fill-[#1D9E75] text-[#1D9E75]" />
                      <span>{matchedSite.satisfactionRating || "4.8"} Rating</span>
                    </div>
                    <Link
                      to={`/site/${matchedSite.id}`}
                      className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#1D9E75] to-[#15705A] text-[#EDE9DF] font-sans font-semibold text-xs text-center hover:scale-[1.02] transition-all"
                    >
                      Explore This Site →
                    </Link>
                  </div>
                ) : isPakistaniHeritage ? (
                  <button
                    onClick={handleBrowseSimilarClick}
                    className="text-xs text-[#1D9E75] hover:underline flex items-center gap-1 font-medium mt-1 cursor-pointer bg-transparent border-none p-0 text-left font-sans"
                  >
                    Browse Similar Sites &rarr;
                  </button>
                ) : (
                  <div className="pt-1 flex flex-col gap-2">
                    <button
                      onClick={handleClearAiResult}
                      className="w-full py-2 rounded-full border border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75]/10 text-xs font-sans font-medium transition-all cursor-pointer"
                    >
                      Explore Pakistani Heritage Sites →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        {/* Search Bar - Elegant & Thin */}
        <div className="relative flex-1 w-full flex items-center">
          <input
            type="text"
            id="sites-search-bar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, region, era, type, or tags..."
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-[0.5px] border-[#D5CFC6]/65 dark:border-[#3D494F]/50 rounded-[10px] text-xs font-sans text-[#1A1E21] dark:text-[#EDE9DF] placeholder-[#6B6560]/45 dark:placeholder-[#C8B89A]/35 focus:outline-none focus:border-[#1D9E75] transition-all duration-300"
          />
          <Search className="absolute left-3.5 w-3.5 h-3.5 text-[#6B6560]/50 dark:text-[#C8B89A]/40" />
        </div>

        {/* Eye Icon Button */}
        <div className="relative group shrink-0">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="w-[48px] h-[38px] flex items-center justify-center bg-[#23282D] border-[0.5px] border-[#3D494F] rounded-[12px] hover:border-[#1D9E75] transition-all duration-200 ease-out cursor-pointer group"
          >
            <Eye className="w-5 h-5 text-[#C8B89A] group-hover:text-[#1D9E75] transition-colors duration-200 ease-out" />
          </button>
          <div className="absolute top-[44px] left-1/2 -translate-x-1/2 bg-[#23282D] text-[#EDE9DF] border border-[#3D494F]/40 font-sans font-light text-[12px] px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50">
            Identify a Heritage Site
          </div>
        </div>

        {/* Filters Button */}
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-2 px-4 py-2.5 border-[0.5px] border-[#D5CFC6]/65 dark:border-[#3D494F]/50 rounded-[10px] text-xs font-sans text-[#6B6560] dark:text-[#C8B89A] hover:text-[#1D9E75] hover:border-[#1D9E75] transition-all duration-300 cursor-pointer whitespace-nowrap"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Active Filter Chips */}
      {(selectedProvince !== 'All' || selectedType !== 'All' || selectedEra !== 'All' || unescoOnly || searchQuery !== '') && !aiIdentifiedName && (
        <div className="flex flex-wrap items-center gap-2 pt-2 -mt-6">
          <span className={`text-[10px] font-sans uppercase tracking-[0.05em] ${textMuted} mr-1`} style={{ fontWeight: 500 }}>Active Filters:</span>

          {searchQuery !== '' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/25 text-[10px] font-sans" style={{ fontWeight: 500 }}>
              <span>Search: "{searchQuery}"</span>
              <button onClick={() => clearFilter('search')} className="hover:text-red-400 cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
          )}
          {selectedProvince !== 'All' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/25 text-[10px] font-sans" style={{ fontWeight: 500 }}>
              <span>Region: {selectedProvince}</span>
              <button onClick={() => clearFilter('province')} className="hover:text-red-400 cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
          )}
          {selectedType !== 'All' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/25 text-[10px] font-sans" style={{ fontWeight: 500 }}>
              <span>Type: {selectedType}</span>
              <button onClick={() => clearFilter('type')} className="hover:text-red-400 cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
          )}
          {selectedEra !== 'All' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/25 text-[10px] font-sans" style={{ fontWeight: 500 }}>
              <span>Era: {selectedEra}</span>
              <button onClick={() => clearFilter('era')} className="hover:text-red-400 cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
          )}
          {unescoOnly && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/25 text-[10px] font-sans" style={{ fontWeight: 500 }}>
              <span>UNESCO Listed</span>
              <button onClick={() => clearFilter('unesco')} className="hover:text-red-400 cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
          )}
          <button onClick={clearAllFilters} className={`text-[10px] font-sans ${textMuted} hover:text-[#1D9E75] underline underline-offset-2 ml-2 cursor-pointer`} style={{ fontWeight: 500 }}>
            Clear All
          </button>
        </div>
      )}

      {/* AI Identified Results Header Removed */}

      {/* Cards Grid */}
      <main className="w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[28px] items-stretch">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-[#FAF6F0] dark:bg-[#23282D]/40 border border-[#D5CFC6]/60 dark:border-[#3D494F]/30 rounded-2xl p-6 h-[400px] flex flex-col gap-4">
                <div className="w-full h-48 bg-[#D5CFC6]/20 dark:bg-[#3D494F]/25 rounded-xl skeleton-shimmer" />
                <div className="h-6 bg-[#D5CFC6]/20 dark:bg-[#3D494F]/25 rounded w-2/3 skeleton-shimmer" />
                <div className="h-4 bg-[#D5CFC6]/20 dark:bg-[#3D494F]/25 rounded w-1/2 skeleton-shimmer" />
                <div className="h-16 bg-[#D5CFC6]/20 dark:bg-[#3D494F]/25 rounded w-full skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : filteredSites.length > 0 ? (
          <div className="flex flex-col gap-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[28px] items-stretch">
              {filteredSites.slice(0, visibleCount).map((site) => (
                <ExploreSiteCard key={site.id} {...site} onBookNow={() => handleBookNow(site)} />
              ))}
            </div>

            {filteredSites.length > visibleCount && (
              <div className="flex flex-col items-center gap-3 pt-6 border-t border-[#D5CFC6]/25 dark:border-[#3D494F]/15">
                <p className="text-xs font-sans text-[#6B6560] dark:text-[#C8B89A] font-light">
                  Showing <span className="font-semibold text-[#1A1E21] dark:text-[#EDE9DF]">{visibleCount}</span> of <span className="font-semibold text-[#1A1E21] dark:text-[#EDE9DF]">{filteredSites.length}</span> sites
                </p>
                <div className="w-48 h-1 bg-[#D5CFC6]/30 dark:bg-[#3D494F]/30 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-[#1D9E75] transition-all duration-500 rounded-full"
                    style={{ width: `${(visibleCount / filteredSites.length) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => setVisibleCount(filteredSites.length)}
                  className="px-8 py-3.5 rounded-full border border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75]/5 dark:hover:bg-[#1D9E75]/10 font-sans font-semibold text-xs tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer flex items-center gap-2 shadow-[0_4px_12px_rgba(29,158,117,0.08)]"
                >
                  <span>View More Sites</span>
                  <span className="text-sm">↓</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-24 text-center border border-dashed border-[#D5CFC6]/50 dark:border-[#3D494F]/40 rounded-2xl space-y-4 bg-[#F5F2ED]/50 dark:bg-[#23282D]/20">
            <Map className="w-12 h-12 text-[#1D9E75] mx-auto opacity-30" />
            <h3 className={`font-serif font-bold text-lg ${textPrimary}`}>No Sites Found</h3>
            <p className={`text-xs ${textMuted} max-w-sm mx-auto font-light`}>
              No archaeological sites match your current filters. Try resetting the options or adjusting your search phrase.
            </p>
            <button
              onClick={clearAllFilters}
              className="px-5 py-2.5 rounded-[10px] bg-[#1D9E75] text-[#EDE9DF] font-sans text-xs hover:bg-[#1D9E75]/90 transition-colors cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              Reset Search Filters
            </button>
          </div>
        )}
      </main>

      {/* Collapsible Slide-over Filter Drawer */}
      <FilterDrawer
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        tempProvince={tempProvince}
        setTempProvince={setTempProvince}
        tempType={tempType}
        setTempType={setTempType}
        tempEra={tempEra}
        setTempEra={setTempEra}
        tempUnesco={tempUnesco}
        setTempUnesco={setTempUnesco}
        handleApplyFilters={handleApplyFilters}
        handleResetTempFilters={handleResetTempFilters}
        provinces={provinces}
        siteTypes={siteTypes}
        eras={eras}
      />

      {/* ── IMAGE UPLOAD MODAL ── */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[4px] p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUploadModal(false);
          }}
        >
          {/* Modal Container */}
          <div className="relative w-full max-w-[520px] bg-[#F5F2ED] dark:bg-[#141618] border border-[#D5CFC6] dark:border-[#3D494F]/60 rounded-[24px] p-[40px] shadow-2xl select-none max-md:w-full max-md:h-screen max-md:rounded-none max-md:p-6 max-md:flex max-md:flex-col max-md:justify-center">

            {/* Close button */}
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-6 right-6 text-3xl text-[#6B6560] dark:text-[#C8B89A] hover:text-[#1A1E21] dark:hover:text-[#EDE9DF] transition-colors cursor-pointer font-sans bg-transparent border-none outline-none leading-none"
              aria-label="Close modal"
            >
              &times;
            </button>

            {/* Modal Header */}
            <div className="text-center flex flex-col items-center">
              <Eye className="w-[28px] h-[28px] text-[#1D9E75]" />
              <h2 className="font-serif font-bold text-[26px] text-[#1A1E21] dark:text-[#EDE9DF] mt-[12px] leading-tight">
                Identify a Heritage Site
              </h2>
              <p className="text-[14px] font-sans font-light text-[#6B6560] dark:text-[#C8B89A] italic mt-[8px]">
                Upload a photo and our AI will match it to Pakistan's heritage sites
              </p>
              {/* Thin decorative line */}
              <div style={{ width: '48px', height: '1px', backgroundColor: '#1D9E75', margin: '20px auto' }} />
            </div>

            {/* Upload Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) {
                  setSelectedImageFile(file);
                  setPreviewUrl(URL.createObjectURL(file));
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative h-[200px] rounded-[16px] border-[1.5px] border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 overflow-hidden ${isDragging
                ? 'border-[#1D9E75] bg-[#1D9E75]/5'
                : 'border-[#D5CFC6] dark:border-[#3D494F] bg-[#EDEAE4] dark:bg-[#23282D] hover:border-[#1D9E75]/55'
                }`}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-[12px]"
                />
              ) : (
                <div className="p-6 flex flex-col items-center">
                  <Eye className={`w-[40px] h-[40px] transition-colors duration-200 ${isDragging ? 'text-[#1D9E75]' : 'text-[#6B6560]/40 dark:text-[#3D494F]'}`} />
                  <span className="font-serif italic text-[16px] text-[#6B6560] dark:text-[#C8B89A] mt-[12px]">
                    Drop your image here
                  </span>
                  <span className="text-[12px] font-sans font-light text-[#6B6560] dark:text-[#C8B89A]/70 mt-1">
                    or click to browse — JPG, PNG supported
                  </span>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedImageFile(file);
                  setPreviewUrl(URL.createObjectURL(file));
                }
              }}
              accept="image/*"
              className="hidden"
            />

            {/* Submit / Process Button */}
            <button
              onClick={handleIdentifyClick}
              disabled={!selectedImageFile || isAnalyzing}
              className={`w-full h-[48px] rounded-[50px] mt-[20px] font-sans font-semibold text-[15px] text-[#EDE9DF] transition-all duration-200 ${!selectedImageFile
                ? 'bg-[#D5CFC6] dark:bg-[#3D494F] text-[#6B6560]/50 dark:text-[#C8B89A]/50 cursor-not-allowed'
                : isAnalyzing
                  ? 'bg-[#1D9E75] opacity-80 cursor-wait animate-pulse'
                  : 'bg-gradient-to-r from-[#1D9E75] to-[#15705A] hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(29,158,117,0.35)] cursor-pointer'
                }`}
              style={{
                boxShadow: (selectedImageFile && !isAnalyzing) ? '0 8px 24px rgba(29,158,117,0.35)' : undefined
              }}
            >
              {isAnalyzing ? 'Analysing image...' : 'Identify Site ✦'}
            </button>

            {/* Loading text helper */}
            {isAnalyzing && (
              <p className="text-[12px] font-sans font-light text-[#6B6560] dark:text-[#C8B89A] italic mt-3 text-center">
                Our AI is scanning Pakistan's heritage database...
              </p>
            )}

          </div>
        </div>
      )}

      {/* Toast Notification Alert */}
      {showToastAlert && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#23282D] border-[0.5px] border-[#3D494F] rounded-[12px] px-5 py-3.5 shadow-2xl flex items-center gap-3 z-50 text-left animate-quiz-slide text-[13px] text-[#EDE9DF] max-w-sm whitespace-nowrap">
          <Eye className="w-5 h-5 text-[#1D9E75] shrink-0" />
          <span className="font-sans font-normal">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

// Collapsible Slide-over Filter Drawer Component (Defined outside parent to prevent unmount blinking on state update)
function FilterDrawer({
  showFilters,
  setShowFilters,
  tempProvince,
  setTempProvince,
  tempType,
  setTempType,
  tempEra,
  setTempEra,
  tempUnesco,
  setTempUnesco,
  handleApplyFilters,
  handleResetTempFilters,
  provinces,
  siteTypes,
  eras
}) {
  const [isEraDropdownOpen, setIsEraDropdownOpen] = useState(false);

  if (!showFilters) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setShowFilters(false)}
      />

      {/* Drawer panel */}
      <div className="relative w-[340px] max-w-[90vw] bg-[#F5F2ED] dark:bg-[#141618] h-full p-8 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-in-left">
        <div className="space-y-10">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#D5CFC6]/45 dark:border-[#3D494F]/30">
            <h2 className="font-serif text-lg font-bold text-[#1A1E21] dark:text-[#EDE9DF]">Filters</h2>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 text-[#6B6560] dark:text-[#C8B89A] hover:text-[#1D9E75] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Province Selector */}
          <div className="space-y-4">
            <span className="text-[10px] font-sans uppercase tracking-[0.15em] text-[#6B6560]/75 dark:text-[#C8B89A]/60 font-light block">
              Province / Region
            </span>
            <div className="flex flex-col gap-2 font-sans text-xs">
              <button
                onClick={() => setTempProvince('All')}
                className="flex items-center gap-3 py-1 text-left w-full cursor-pointer transition-colors duration-200"
              >
                <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full border border-[#6B6560]/40 dark:border-[#C8B89A]/30 transition-all duration-300" />
                  {tempProvince === 'All' && (
                    <div className="absolute w-1.5 h-1.5 bg-[#1D9E75] rounded-full scale-120 transition-all duration-300" />
                  )}
                </div>
                <span className={`text-xs font-sans tracking-wide transition-colors duration-200 ${tempProvince === 'All' ? 'text-[#1D9E75] font-medium' : 'text-[#6B6560] dark:text-[#C8B89A]'}`}>
                  All Provinces
                </span>
              </button>

              {provinces.map((prov) => {
                const isActive = tempProvince === prov;
                return (
                  <button
                    key={prov}
                    onClick={() => setTempProvince(prov)}
                    className="flex items-center gap-3 py-1 text-left w-full cursor-pointer transition-colors duration-200"
                  >
                    <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full border border-[#6B6560]/40 dark:border-[#C8B89A]/30 transition-all duration-300" />
                      {isActive && (
                        <div className="absolute w-1.5 h-1.5 bg-[#1D9E75] rounded-full scale-120 transition-all duration-300" />
                      )}
                    </div>
                    <span className={`text-xs font-sans tracking-wide transition-colors duration-200 ${isActive ? 'text-[#1D9E75] font-medium' : 'text-[#6B6560] dark:text-[#C8B89A]'}`}>
                      {prov}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Site Type Selector */}
          <div className="space-y-4">
            <span className="text-[10px] font-sans uppercase tracking-[0.15em] text-[#6B6560]/75 dark:text-[#C8B89A]/60 font-light block">
              Site Type
            </span>
            <div className="flex flex-col gap-2 font-sans text-xs">
              <button
                onClick={() => setTempType('All')}
                className="flex items-center gap-3 py-1 text-left w-full cursor-pointer transition-colors duration-200"
              >
                <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full border border-[#6B6560]/40 dark:border-[#C8B89A]/30 transition-all duration-300" />
                  {tempType === 'All' && (
                    <div className="absolute w-1.5 h-1.5 bg-[#1D9E75] rounded-full scale-120 transition-all duration-300" />
                  )}
                </div>
                <span className={`text-xs font-sans tracking-wide transition-colors duration-200 ${tempType === 'All' ? 'text-[#1D9E75] font-medium' : 'text-[#6B6560] dark:text-[#C8B89A]'}`}>
                  All Types
                </span>
              </button>

              {siteTypes.map((type) => {
                const isActive = tempType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setTempType(type)}
                    className="flex items-center gap-3 py-1 text-left w-full cursor-pointer transition-colors duration-200"
                  >
                    <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full border border-[#6B6560]/40 dark:border-[#C8B89A]/30 transition-all duration-300" />
                      {isActive && (
                        <div className="absolute w-1.5 h-1.5 bg-[#1D9E75] rounded-full scale-120 transition-all duration-300" />
                      )}
                    </div>
                    <span className={`text-xs font-sans tracking-wide transition-colors duration-200 ${isActive ? 'text-[#1D9E75] font-medium' : 'text-[#6B6560] dark:text-[#C8B89A]'}`}>
                      {type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Civilization Era Dropdown */}
          <div className="space-y-4">
            <span className="text-[10px] font-sans uppercase tracking-[0.15em] text-[#6B6560]/75 dark:text-[#C8B89A]/60 font-light block">
              Civilization Era
            </span>
            <div className="relative max-w-xs">
              <button
                type="button"
                onClick={() => setIsEraDropdownOpen(!isEraDropdownOpen)}
                className="w-full flex items-center justify-between text-left py-2 px-3 bg-[#F5F2ED] dark:bg-[#23282D] border border-[#D5CFC6] dark:border-[#3D494F] rounded-lg text-xs font-sans text-[#1A1E21] dark:text-[#EDE9DF] hover:border-[#1D9E75] focus:outline-none focus:border-[#1D9E75] transition-all duration-300 cursor-pointer"
              >
                <span className="truncate pr-2">{tempEra === 'All' ? 'All Civilization Eras' : tempEra}</span>
                <span className={`text-[9px] text-[#6B6560] dark:text-[#C8B89A] transition-transform duration-300 ${isEraDropdownOpen ? 'rotate-180' : 'rotate-0'}`}>
                  ▼
                </span>
              </button>

              {/* Floating dropdown menu */}
              {isEraDropdownOpen && (
                <>
                  {/* Backdrop to close the dropdown when clicking outside */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsEraDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 mt-1.5 bg-[#F5F2ED] dark:bg-[#23282D] border border-[#D5CFC6] dark:border-[#3D494F] rounded-lg shadow-xl overflow-hidden max-h-[220px] overflow-y-auto z-20 divide-y divide-[#D5CFC6]/20 dark:divide-[#3D494F]/20">
                    <button
                      type="button"
                      onClick={() => {
                        setTempEra('All');
                        setIsEraDropdownOpen(false);
                      }}
                      className={`w-full text-left py-2.5 px-3.5 text-xs font-sans hover:bg-[#1D9E75]/10 hover:text-[#1D9E75] transition-colors duration-150 cursor-pointer ${tempEra === 'All' ? 'bg-[#1D9E75]/10 text-[#1D9E75] font-semibold' : 'text-[#6B6560] dark:text-[#C8B89A]'
                        }`}
                    >
                      All Civilization Eras
                    </button>
                    {eras.map((era) => {
                      const isActive = tempEra === era;
                      return (
                        <button
                          key={era}
                          type="button"
                          onClick={() => {
                            setTempEra(era);
                            setIsEraDropdownOpen(false);
                          }}
                          className={`w-full text-left py-2.5 px-3.5 text-xs font-sans hover:bg-[#1D9E75]/10 hover:text-[#1D9E75] transition-colors duration-150 cursor-pointer ${isActive ? 'bg-[#1D9E75]/10 text-[#1D9E75] font-semibold' : 'text-[#6B6560] dark:text-[#C8B89A]'
                            }`}
                        >
                          {era}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* UNESCO Toggle */}
          <div className="space-y-4 pt-2">
            <button
              type="button"
              onClick={() => setTempUnesco(!tempUnesco)}
              className="flex items-center justify-between w-full max-w-xs group cursor-pointer"
            >
              <span className="text-[10px] font-sans uppercase tracking-[0.15em] text-[#6B6560]/75 dark:text-[#C8B89A]/60 font-light">
                UNESCO Listed Only
              </span>
              <div className={`w-8 h-3 rounded-full p-[1px] transition-colors duration-300 relative ${tempUnesco ? 'bg-[#1D9E75]' : 'bg-[#D5CFC6] dark:bg-[#3D494F]'}`}>
                <div className={`w-2.5 h-2.5 rounded-full bg-white shadow-sm transition-transform duration-300 ${tempUnesco ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-[#D5CFC6]/45 dark:border-[#3D494F]/30 flex items-center justify-between mt-8">
          <button
            onClick={handleResetTempFilters}
            className="text-xs font-sans text-[#6B6560] dark:text-[#C8B89A] hover:text-[#1D9E75] underline underline-offset-4 decoration-[#D5CFC6] hover:decoration-[#1D9E75] transition-all duration-200 cursor-pointer"
          >
            Reset filters
          </button>
          <button
            onClick={handleApplyFilters}
            className="px-5 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-[#EDE9DF] rounded-[10px] text-xs font-sans transition-colors cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
