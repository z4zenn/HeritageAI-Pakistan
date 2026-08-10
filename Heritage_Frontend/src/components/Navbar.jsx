import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Landmark, Sun, Moon, User, Lock, Settings, LogOut, Map, Castle, MoonStar, Scroll, Gem, Flame, Compass, History, Shield } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getEarnedStamps, getStampMotif } from '../utils/passport.js';
import { siteData } from '../data/siteData.js';
import LogoutModal from './LogoutModal';

const renderStampIcon = (iconName, className = "w-6 h-6") => {
  switch (iconName) {
    case 'castle': return <Castle className={className} />;
    case 'moon-star': return <MoonStar className={className} />;
    case 'landmark': return <Landmark className={className} />;
    case 'scroll': return <Scroll className={className} />;
    case 'gem': return <Gem className={className} />;
    case 'flame': return <Flame className={className} />;
    case 'compass': return <Compass className={className} />;
    case 'history': return <History className={className} />;
    default: return <Landmark className={className} />;
  }
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user: loggedInUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const isFixedHeader = ['/', '/login', '/register', '/about', '/recommend'].includes(location.pathname);

  // Profile dropdown and modal states
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownRefMobile = useRef(null);

  // Retrieve earned stamps dynamically
  const earnedStamps = getEarnedStamps();

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      const clickedMobile = dropdownRefMobile.current && dropdownRefMobile.current.contains(e.target);
      if (!clickedMobile) {
        setShowDropdown(false);
      }
    };
    if (dropdownOpen || showDropdown) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [dropdownOpen, showDropdown]);

  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);


  // Prevent background scroll when modal is active
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Explore Sites', path: '/explore' },
    { name: 'AI Recommender', path: '/recommend' },
    ...(loggedInUser ? [{ name: 'My Bookings', path: '/my-bookings' }] : []),
    { name: 'About', path: '/about' }
  ];

  // Calculations for Passport stats
  const sitesVisited = earnedStamps.length;
  const provincesExplored = new Set(earnedStamps.map(s => s.province)).size;
  const unescoSites = earnedStamps.filter(s => s.unescoListed).length;

  return (
    <header className={`${isFixedHeader ? 'fixed left-0 right-0' : 'sticky'} top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2 select-none pointer-events-none`}>
      <div className={`max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto w-full pointer-events-auto bg-white/30 dark:bg-[#23282D]/55 backdrop-blur-xl border border-white/30 dark:border-[#3D494F]/40 shadow-lg hover:shadow-xl transition-all duration-300 ${isOpen ? 'rounded-3xl' : 'rounded-full'}`}>
        <div className="px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-[#1D9E75] flex items-center justify-center">
              <Landmark className="w-5 h-5 text-[#EDE9DF]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-xl text-[#1A1E21] dark:text-[#EDE9DF] leading-none tracking-tight">
                HeritageAI
              </span>
              <span className="text-[10px] font-sans text-[#6B6560] dark:text-[#C8B89A] mt-0.5" style={{fontWeight: 500, letterSpacing: '0.08em'}}>
                PAKISTAN
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-sans transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? 'text-[#1D9E75] border-b-2 border-[#1D9E75] pb-1'
                      : 'text-[#1A1E21] dark:text-[#EDE9DF] hover:text-[#1D9E75]'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right: Theme Toggle + Profile + CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              type="button"
              className="p-2.5 rounded-full hover:bg-[#3D494F]/30 dark:hover:bg-[#3D494F]/60 text-[#1A1E21] dark:text-[#EDE9DF] transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark'
                ? <Moon className="w-5 h-5 text-[#C8B89A]" />
                : <Sun className="w-5 h-5 text-black" />
              }
            </button>

            {loggedInUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="focus:outline-none cursor-pointer flex items-center justify-center p-0 border-none bg-transparent"
                  title="Profile Menu"
                >
                  {loggedInUser?.avatar ? (
                    <img
                      src={loggedInUser.avatar}
                      alt={loggedInUser.name}
                      referrerPolicy="no-referrer"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #1D9E75'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#1D9E75',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '600',
                      fontFamily: 'Outfit',
                      border: '2px solid #1D9E75',
                      flexShrink: 0
                    }}>
                      {loggedInUser?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {/* PROFILE DROPDOWN PANEL */}
                {dropdownOpen && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '52px',
                      right: 0,
                      backgroundColor: '#23282D',
                      border: '1px solid #3D494F',
                      borderRadius: '12px',
                      minWidth: '220px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      zIndex: 1000,
                      overflow: 'hidden',
                      textAlign: 'left'
                    }}
                  >
                    {/* DROPDOWN HEADER */}
                    <div 
                      style={{ 
                        padding: '16px', 
                        borderBottom: '1px solid #3D494F', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px' 
                      }}
                    >
                      {loggedInUser.avatar ? (
                        <img 
                          src={loggedInUser.avatar} 
                          alt={loggedInUser.name} 
                          referrerPolicy="no-referrer" 
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #1D9E75'
                          }}
                        />
                      ) : (
                        <div 
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: '#1D9E75',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: '600',
                            fontFamily: 'Outfit, sans-serif',
                            flexShrink: 0
                          }}
                        >
                          {loggedInUser?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                        <h4 
                          style={{ 
                            fontFamily: 'Outfit, sans-serif', 
                            fontSize: '15px', 
                            color: '#EDE9DF', 
                            fontWeight: 600, 
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {loggedInUser.name}
                        </h4>
                        <p 
                          style={{ 
                            fontFamily: 'Outfit, sans-serif', 
                            fontSize: '12px', 
                            color: '#C8B89A', 
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {loggedInUser.email}
                        </p>
                      </div>
                    </div>

                    {/* MENU ITEMS */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {/* 1. My Bookings */}
                      <button
                        onClick={() => {
                          navigate('/my-bookings');
                          setDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 16px',
                          color: '#C8B89A',
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '14px',
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: 'transparent',
                          width: '100%',
                          textAlign: 'left',
                          transition: 'all 0.15s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#141618';
                          e.currentTarget.style.color = '#EDE9DF';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#C8B89A';
                        }}
                      >
                        <Landmark className="w-4 h-4 text-[#1D9E75]" />
                        <span>My Bookings</span>
                      </button>

                      {/* 2. Dashboard */}
                      <button
                        onClick={() => {
                          navigate(loggedInUser.role === 'admin' ? '/admin/dashboard' : '/dashboard');
                          setDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 16px',
                          color: '#C8B89A',
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '14px',
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: 'transparent',
                          width: '100%',
                          textAlign: 'left',
                          transition: 'all 0.15s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#141618';
                          e.currentTarget.style.color = '#EDE9DF';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#C8B89A';
                        }}
                      >
                        {loggedInUser.role === 'admin' ? (
                          <>
                            <Shield className="w-4 h-4 text-[#1D9E75]" />
                            <span>Admin Dashboard</span>
                          </>
                        ) : (
                          <>
                            <Settings className="w-4 h-4 text-[#1D9E75]" />
                            <span>Dashboard</span>
                          </>
                        )}
                      </button>

                      {/* 3. Divider */}
                      <div style={{ borderBottom: '1px solid #3D494F', margin: '6px 8px' }} />

                      {/* 4. Sign Out */}
                      <button
                        onClick={() => {
                          setShowLogoutModal(true);
                          setDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 16px',
                          color: '#C8B89A',
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '14px',
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: 'transparent',
                          width: '100%',
                          textAlign: 'left',
                          transition: 'all 0.15s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#141618';
                          e.currentTarget.style.color = '#E05252';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#C8B89A';
                        }}
                      >
                        <LogOut className="w-4 h-4 text-[#1D9E75]" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2 rounded-full border border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75]/10 font-sans text-sm font-semibold transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-full bg-[#1D9E75] text-[#EDE9DF] hover:bg-[#157F5D] font-sans text-sm font-semibold shadow-md transition-all duration-200 active:scale-95"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Actions (Profile + Mobile Menu Toggle) */}
          <div className="flex md:hidden items-center gap-3">
            {loggedInUser && (
              /* PROFILE ICON & DROPDOWN FOR MOBILE */
              <div className="relative" ref={dropdownRefMobile}>
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="focus:outline-none cursor-pointer flex items-center justify-center"
                  title="Profile Menu"
                >
                  {loggedInUser?.avatar ? (
                    <img
                      src={loggedInUser.avatar}
                      alt={loggedInUser.name}
                      referrerPolicy="no-referrer"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #1D9E75'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#1D9E75',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      fontFamily: 'Outfit',
                      border: '2px solid #1D9E75',
                      flexShrink: 0
                    }}>
                      {loggedInUser?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {/* PROFILE DROPDOWN PANEL FOR MOBILE */}
                {showDropdown && (
                  <div className="absolute right-0 mt-3.5 w-[280px] bg-[#23282D] border-[0.5px] border-[#3D494F] rounded-[16px] p-[20px] shadow-[0_16px_48px_rgba(0,0,0,0.4)] z-50 text-left">
                    {/* Top section */}
                    <div className="flex items-center gap-3">
                      <div className="w-[52px] h-[52px] rounded-full border-2 border-[#1D9E75] bg-[#3D494F]/40 overflow-hidden flex items-center justify-center">
                        {loggedInUser.avatar ? (
                          <img src={loggedInUser.avatar} alt={loggedInUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-xl font-semibold text-[#EDE9DF] font-sans uppercase">
                            {loggedInUser.name ? loggedInUser.name.charAt(0) : 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-[15px] text-[#EDE9DF] leading-tight">{loggedInUser.name}</h4>
                        <p className="text-[12px] font-sans text-[#C8B89A] italic font-light mt-0.5">
                          {loggedInUser.role === 'admin' ? 'Administrator' : 'Heritage Explorer'}
                        </p>
                      </div>
                    </div>

                    <div style={{ margin: '16px 0', backgroundColor: '#3D494F', height: '1px' }} />

                    {/* Passport Preview strip */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-sans uppercase text-[#1D9E75] tracking-[0.12em] block font-medium">
                        HERITAGE PASSPORT
                      </span>

                      {earnedStamps.length > 0 ? (
                        <div className="flex gap-2.5 flex-wrap">
                          {earnedStamps.slice(-3).map((stamp) => {
                            const site = siteData.find(s => s.id === stamp.siteId);
                            const iconName = site ? getStampMotif(site.civilizationEra, site.siteType).icon : (stamp.icon || 'landmark');
                            return (
                              <div
                                key={stamp.siteId}
                                className="w-[32px] h-[32px] rounded-full bg-[#141618] border border-[#1D9E75] flex items-center justify-center text-[#1D9E75] shadow-inner"
                                title={stamp.siteName}
                              >
                                {renderStampIcon(iconName, "w-[16px] h-[16px]")}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[12px] font-sans text-[#C8B89A] italic font-light">
                          No sites visited yet
                        </p>
                      )}

                      <button
                        onClick={() => {
                          setShowModal(true);
                          setShowDropdown(false);
                        }}
                        className="text-[13px] font-sans font-medium text-[#1D9E75] hover:text-[#1D9E75]/80 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none mt-2 w-full text-left"
                      >
                        View Full Passport →
                      </button>
                    </div>

                    <div style={{ margin: '16px 0', backgroundColor: '#3D494F', height: '1px' }} />

                    {/* Menu Items */}
                    <div className="flex flex-col gap-1 w-full">
                      <button
                        onClick={() => {
                          setShowModal(true);
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-3 px-[8px] py-[10px] rounded-[10px] text-[14px] font-sans font-normal text-[#C8B89A] hover:bg-[#141618] hover:text-[#EDE9DF] transition-all cursor-pointer text-left w-full border-none bg-transparent"
                      >
                        <Landmark className="w-[16px] h-[16px] text-[#1D9E75]" />
                        <span>My Heritage Passport</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate('/my-bookings');
                        }}
                        className="flex items-center gap-3 px-[8px] py-[10px] rounded-[10px] text-[14px] font-sans font-normal text-[#C8B89A] hover:bg-[#141618] hover:text-[#EDE9DF] transition-all cursor-pointer text-left w-full border-none bg-transparent"
                      >
                        <Map className="w-[16px] h-[16px] text-[#1D9E75]" />
                        <span>My Booked Tours</span>
                      </button>

                      <button
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-[8px] py-[10px] rounded-[10px] text-[14px] font-sans font-normal text-[#C8B89A] hover:bg-[#141618] hover:text-[#EDE9DF] transition-all cursor-pointer text-left w-full border-none bg-transparent"
                      >
                        <Settings className="w-[16px] h-[16px] text-[#1D9E75]" />
                        <span>Preferences</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowLogoutModal(true);
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-3 px-[8px] py-[10px] rounded-[10px] text-[14px] font-sans font-normal text-[#C8B89A] hover:bg-[#141618] hover:text-[#EDE9DF] transition-all cursor-pointer text-left w-full border-none bg-transparent"
                      >
                        <LogOut className="w-[16px] h-[16px] text-[#1D9E75]" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              className="p-2 text-[#1A1E21] dark:text-[#EDE9DF] hover:text-[#1D9E75] rounded-lg transition-all cursor-pointer"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-[#3D494F] px-6 pb-6 pt-4 flex flex-col gap-3 rounded-b-3xl">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `text-sm font-sans py-2 px-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#1D9E75]/15 text-[#1D9E75]'
                      : 'text-[#1A1E21] dark:text-[#EDE9DF] hover:bg-[#3D494F]/20 dark:hover:bg-[#3D494F]/50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            {/* Mobile Theme Toggle */}
            <div className="border-t border-[#3D494F] pt-3 mt-1 flex items-center justify-between">
              <span className="text-xs font-sans text-[#6B6560] dark:text-[#C8B89A]" style={{fontWeight: 500}}>Appearance</span>
              <button
                onClick={toggleTheme}
                type="button"
                className="p-2 rounded-full bg-[#3D494F]/20 dark:bg-[#3D494F]/40 text-[#1A1E21] dark:text-[#EDE9DF] transition-colors cursor-pointer"
              >
                 {theme === 'dark'
                  ? <Moon className="w-5 h-5 text-[#C8B89A]" />
                  : <Sun className="w-5 h-5 text-black" />
                }
              </button>
            </div>

            {/* Mobile Conditional Dashboard/Admin Link */}
            {loggedInUser && loggedInUser.role === 'admin' && (
              <div className="border-t border-[#3D494F] pt-3 mt-1 flex justify-center">
                <Link
                  to="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-1.5 hover:opacity-85 transition-opacity justify-center"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: '13px', color: '#1D9E75' }}
                >
                  <Shield className="w-[14px] h-[14px]" />
                  <span>Admin</span>
                </Link>
              </div>
            )}
            {loggedInUser && loggedInUser.role === 'user' && (
              <div className="border-t border-[#3D494F] pt-3 mt-1 flex justify-center">
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-1.5 hover:opacity-85 transition-opacity justify-center"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: '13px', color: '#C8B89A' }}
                >
                  <User className="w-[14px] h-[14px]" />
                  <span>Dashboard</span>
                </Link>
              </div>
            )}

            {!loggedInUser && (
              <div className="border-t border-[#3D494F] pt-3 mt-1 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2.5 rounded-full border border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75]/10 font-sans text-sm text-center font-semibold"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2.5 rounded-full bg-[#1D9E75] text-[#EDE9DF] hover:bg-[#157F5D] font-sans text-sm text-center font-semibold shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {loggedInUser && (
              <div className="border-t border-[#3D494F] pt-3 mt-1">
                <button
                  onClick={() => {
                    setShowLogoutModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full py-2.5 rounded-full border border-red-800/40 text-red-400 hover:bg-red-900/10 font-sans text-sm text-center font-medium cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}

            <div className="border-t border-[#3D494F] pt-3 mt-1">
              <Link
                to="/explore"
                onClick={() => setIsOpen(false)}
                className="w-full py-3 rounded-full bg-[#1D9E75] text-[#EDE9DF] font-sans text-sm text-center shadow-md block"
                style={{fontWeight: 500}}
              >
                Book a Tour
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── HERITAGE PASSPORT — FULL MODAL ── */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-[4px] p-4 overflow-y-auto pointer-events-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          {/* Modal Container */}
          <div className="relative w-full h-full md:h-auto max-h-none md:max-h-[88vh] max-w-none md:max-w-[760px] bg-[#141618] border-none md:border border-none md:border-[#3D494F]/60 rounded-none md:rounded-[24px] p-6 md:p-[48px] shadow-2xl overflow-y-scroll no-scrollbar flex flex-col justify-between select-none">
            
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-3xl text-[#C8B89A] hover:text-[#EDE9DF] transition-colors cursor-pointer font-sans bg-transparent border-none outline-none leading-none"
              aria-label="Close modal"
            >
              &times;
            </button>

            {/* Modal Content */}
            <div className="w-full flex flex-col items-center">
              
              {/* Modal Header */}
              <div className="text-center flex flex-col items-center">
                <Landmark className="w-[28px] h-[28px] text-[#1D9E75]" />
                <h2 className="font-serif font-bold text-[32px] text-[#EDE9DF] mt-[12px] leading-tight">
                  Heritage Passport
                </h2>
                <p className="text-[13px] font-sans text-[#C8B89A] italic mt-1.5 font-light">
                  Archaeological Explorer · HeritageAI Pakistan
                </p>
                {/* Thin decorative line */}
                <div style={{ width: '48px', height: '1px', backgroundColor: '#1D9E75', margin: '16px auto' }} />
              </div>

              {/* Passport Stats Row */}
              <div className="flex justify-center items-center gap-8 py-5 border-b border-[#3D494F]/20 max-w-md mx-auto w-full">
                <div className="text-center">
                  <div className="font-serif font-bold text-[28px] text-[#EDE9DF] leading-none">
                    {sitesVisited}
                  </div>
                  <div className="font-sans text-[12px] text-[#C8B89A] font-light mt-1">
                    Sites Visited
                  </div>
                </div>
                <div className="w-[1px] h-8 bg-[#3D494F]/40" />
                <div className="text-center">
                  <div className="font-serif font-bold text-[28px] text-[#EDE9DF] leading-none">
                    {provincesExplored}
                  </div>
                  <div className="font-sans text-[12px] text-[#C8B89A] font-light mt-1">
                    Provinces Explored
                  </div>
                </div>
                <div className="w-[1px] h-8 bg-[#3D494F]/40" />
                <div className="text-center">
                  <div className="font-serif font-bold text-[28px] text-[#EDE9DF] leading-none">
                    {unescoSites}
                  </div>
                  <div className="font-sans text-[12px] text-[#C8B89A] font-light mt-1">
                    UNESCO Sites
                  </div>
                </div>
              </div>

              {/* Passport Stamps Grid */}
              <div className="w-full mt-10">
                <span className="text-[11px] font-sans tracking-[0.12em] text-[#1D9E75] uppercase block mb-[24px] font-medium text-left">
                  YOUR STAMPS
                </span>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[20px]">
                  {siteData.map((site) => {
                    const stamp = earnedStamps.find(s => s.siteId === site.id);
                    const isEarned = !!stamp;
                    const motif = getStampMotif(site.civilizationEra, site.siteType);

                    if (isEarned) {
                      return (
                        <div
                          key={site.id}
                          className="bg-[#23282D] border-[0.5px] border-[#3D494F] rounded-[16px] p-[20px] flex flex-col items-center justify-center text-center relative aspect-square"
                          style={{ boxShadow: '0 0 20px rgba(29,158,117,0.15)' }}
                        >
                          <div 
                            className="w-[72px] h-[72px] rounded-full border-2 border-[#1D9E75] flex items-center justify-center text-[#1D9E75] shadow-md mx-auto"
                            style={{ background: 'linear-gradient(135deg, #1a3a30, #0f2420)' }}
                          >
                            {renderStampIcon(motif.icon, "w-[32px] h-[32px]")}
                          </div>
                          <h4 className="font-serif font-bold text-[13px] text-[#EDE9DF] mt-[12px] leading-tight truncate w-full">
                            {site.name}
                          </h4>
                          <span className="text-[10px] font-sans font-medium text-[#1D9E75] uppercase mt-1 tracking-wider">
                            {site.province}
                          </span>
                          <span className="text-[11px] font-sans text-[#C8B89A] italic font-light mt-0.5">
                            {stamp.dateEarned}
                          </span>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={site.id}
                          className="bg-[#23282D] border-[0.5px] border-[#3D494F]/40 rounded-[16px] p-[20px] flex flex-col items-center justify-center text-center opacity-45 relative aspect-square select-none group"
                        >
                          <div className="w-[72px] h-[72px] rounded-full bg-[#1e2428] border border-[#3D494F] flex items-center justify-center mx-auto">
                            <Lock className="w-[24px] h-[24px] text-[#3D494F]" />
                          </div>
                          <h4 className="font-serif font-bold text-[13px] text-[#3D494F] mt-[12px] leading-tight truncate w-full">
                            {site.name}
                          </h4>
                          <span className="text-[10px] font-sans font-medium text-[#3D494F] uppercase mt-1 tracking-wider">
                            {site.province}
                          </span>

                          {/* Minimal hover tooltip */}
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-[#141618] border border-[#3D494F] text-[#C8B89A] text-[10px] font-sans font-light italic px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg">
                            Visit this site to unlock
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          logout();
          setShowLogoutModal(false);
        }}
      />
    </header>
  );
}
