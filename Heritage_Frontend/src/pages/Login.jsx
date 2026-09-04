import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, AlertTriangle, Landmark } from 'lucide-react';

export default function Login() {
  const { login /*, loginWithGoogle */ } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/explore');
    } catch (err) {
      console.error('Login error details:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to sign in. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex min-h-screen bg-[#141618] select-none overflow-hidden">
      {/* LEFT PANEL (Desktop only, hidden on mobile) */}
      <div 
        className="hidden md:flex md:w-1/2 flex-col items-center justify-center relative p-12 text-center"
        style={{
          background: 'linear-gradient(135deg, #0d1f1a 0%, #1a3329 40%, #0f2318 100%)'
        }}
      >
        {/* Geometric Star Pattern Overlay */}
        <svg xmlns="http://www.w3.org/2000/svg" 
             width="100%" height="100%" 
             style={{ position: 'absolute', top: 0, left: 0, 
                      opacity: 0.08 }}>
          <defs>
            <pattern id="mughal" x="0" y="0" 
                     width="80" height="80" 
                     patternUnits="userSpaceOnUse">
              
              {/* Outer octagon */}
              <polygon 
                points="24,0 56,0 80,24 80,56 56,80 24,80 0,56 0,24"
                fill="none" stroke="#1D9E75" strokeWidth="0.8"/>
              
              {/* Inner star - 8 pointed */}
              <polygon
                points="40,8 46,28 64,22 52,36 72,40 52,44 64,58 46,52 40,72 34,52 16,58 28,44 8,40 28,36 16,22 34,28"
                fill="none" stroke="#1D9E75" strokeWidth="0.8"/>
              
              {/* Center diamond */}
              <polygon
                points="40,26 54,40 40,54 26,40"
                fill="none" stroke="#1D9E75" strokeWidth="0.8"/>
              
              {/* Corner quarter circles */}
              <path d="M0,0 Q20,0 20,20 Q0,20 0,0Z" 
                    fill="none" stroke="#1D9E75" strokeWidth="0.6"/>
              <path d="M80,0 Q60,0 60,20 Q80,20 80,0Z" 
                    fill="none" stroke="#1D9E75" strokeWidth="0.6"/>
              <path d="M0,80 Q20,80 20,60 Q0,60 0,80Z" 
                    fill="none" stroke="#1D9E75" strokeWidth="0.6"/>
              <path d="M80,80 Q60,80 60,60 Q80,60 80,80Z" 
                    fill="none" stroke="#1D9E75" strokeWidth="0.6"/>
              
              {/* Connecting petals between octagons */}
              <path d="M40,0 Q50,10 40,20 Q30,10 40,0Z"
                    fill="none" stroke="#1D9E75" strokeWidth="0.6"/>
              <path d="M40,60 Q50,70 40,80 Q30,70 40,60Z"
                    fill="none" stroke="#1D9E75" strokeWidth="0.6"/>
              <path d="M0,40 Q10,50 20,40 Q10,30 0,40Z"
                    fill="none" stroke="#1D9E75" strokeWidth="0.6"/>
              <path d="M60,40 Q70,50 80,40 Q70,30 60,40Z"
                    fill="none" stroke="#1D9E75" strokeWidth="0.6"/>
              
              {/* Small decorative diamonds at octagon corners */}
              <polygon points="40,22 43,25 40,28 37,25"
                       fill="#1D9E75" opacity="0.4"/>
              <polygon points="40,52 43,55 40,58 37,55"
                       fill="#1D9E75" opacity="0.4"/>
              <polygon points="22,40 25,43 28,40 25,37"
                       fill="#1D9E75" opacity="0.4"/>
              <polygon points="52,40 55,43 58,40 55,37"
                       fill="#1D9E75" opacity="0.4"/>

            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mughal)"/>
        </svg>


        {/* Center Content */}
        <div className="flex flex-col items-center max-w-sm z-10">
          {/* Geometric Badshahi Mosque Silhouette */}
          <svg width="280" height="180" viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#1D9E75' }} className="opacity-60 mb-8 select-none">
            <rect x="20" y="150" width="240" height="10" fill="currentColor" rx="2" />
            <rect x="60" y="90" width="160" height="60" fill="currentColor" />
            <path d="M120 150 V115 C120 100 160 100 160 115 V150 Z" fill="#0d1f1a" />
            <path d="M80 150 V130 C80 120 100 120 100 130 V150 Z" fill="#0d1f1a" opacity="0.4" />
            <path d="M180 150 V130 C180 120 200 120 200 130 V150 Z" fill="#0d1f1a" opacity="0.4" />
            <path d="M115 90 C115 65 165 65 165 90 Z" fill="currentColor" />
            <rect x="138" y="55" width="4" height="12" fill="currentColor" />
            <path d="M75 90 C75 70 115 70 115 90 Z" fill="currentColor" />
            <rect x="93" y="60" width="4" height="12" fill="currentColor" />
            <path d="M165 90 C165 70 205 70 205 90 Z" fill="currentColor" />
            <rect x="183" y="60" width="4" height="12" fill="currentColor" />
            <rect x="30" y="40" width="16" height="110" fill="currentColor" />
            <path d="M30 40 C30 28 46 28 46 40 Z" fill="currentColor" />
            <rect x="234" y="40" width="16" height="110" fill="currentColor" />
            <path d="M234 40 C234 28 250 28 250 40 Z" fill="currentColor" />
          </svg>

          <h2 className="font-serif font-bold text-[28px] text-[#EDE9DF] leading-tight mb-3">
            Discover Pakistan's Ancient Soul
          </h2>
          <p className="font-sans text-[14px] text-[#C8B89A] leading-relaxed">
            62 heritage sites. Centuries of history. One platform to explore them all.
          </p>
        </div>

        {/* Bottom Testimonial Card */}
        <div 
          className="absolute bottom-12 max-w-sm w-full p-4 text-left z-10"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px'
          }}
        >
          <span className="font-serif text-3xl font-bold leading-none block mb-1" style={{ color: '#1D9E75' }}>“</span>
          <p className="font-sans text-[14px] text-[#EDE9DF] leading-relaxed mb-4">
            HeritageAI brought Pakistan's forgotten civilizations to life for me.
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1D9E75] text-[#EDE9DF] font-bold font-sans text-xs flex items-center justify-center">
              A
            </div>
            <span className="font-sans text-[12px] text-[#C8B89A]">
              Ayesha K., History Enthusiast
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL (Forms Panel) */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 relative min-h-screen">
        {/* Mobile-only logo link at top */}
        <Link 
          to="/" 
          className="block md:hidden absolute top-6 left-6 text-xs font-sans font-medium hover:opacity-85 transition-opacity"
          style={{ color: '#1D9E75' }}
        >
          HeritageAI Pakistan
        </Link>

        {/* Floating Form container */}
        <div className="max-w-[420px] w-full mx-auto">
          {/* Header */}
          <div className="text-left mb-8">
            <h2 className="font-serif font-bold text-[32px] text-[#EDE9DF] leading-tight">
              Welcome Back
            </h2>
            <p className="font-sans text-[14px] text-[#C8B89A] mt-2">
              Continue exploring Pakistan's heritage
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full">
            {/* Error Message Box */}
            {error && (
              <div 
                className="flex items-center gap-2 px-4 py-3 rounded-lg border font-sans text-[13px] mb-4" 
                style={{ 
                  backgroundColor: 'rgba(224, 82, 82, 0.1)', 
                  borderColor: 'rgba(224, 82, 82, 0.3)', 
                  color: '#E05252' 
                }}
              >
                <AlertTriangle className="h-[18px] w-[18px] shrink-0" style={{ color: '#E05252' }} />
                <span>{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2 mb-5">
              <label className="block font-sans text-[12px] font-medium uppercase tracking-[0.05em] text-[#C8B89A]">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-[18px] w-[18px]" style={{ color: '#3D494F' }} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="block w-full pl-11 pr-4 py-3 border border-[#3D494F] rounded-lg bg-[#23282D] text-[#EDE9DF] placeholder-[#3D494F] focus:outline-none focus:border-[#1D9E75] focus:ring-3 focus:ring-[#1D9E75]/15 transition-all font-sans text-[15px]"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2 mb-5">
              <label className="block font-sans text-[12px] font-medium uppercase tracking-[0.05em] text-[#C8B89A]">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-[18px] w-[18px]" style={{ color: '#3D494F' }} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="block w-full pl-11 pr-10 py-3 border border-[#3D494F] rounded-lg bg-[#23282D] text-[#EDE9DF] placeholder-[#3D494F] focus:outline-none focus:border-[#1D9E75] focus:ring-3 focus:ring-[#1D9E75]/15 transition-all font-sans text-[15px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#C8B89A]/50 hover:text-[#EDE9DF] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" style={{ color: '#3D494F' }} /> : <Eye className="h-[18px] w-[18px]" style={{ color: '#3D494F' }} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3.5 rounded-lg font-sans text-[15px] font-semibold tracking-[0.02em] mt-4 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] hover:scale-[1.01] hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{
                backgroundColor: '#1D9E75'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#178a65'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1D9E75'}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Please wait...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Google Sign In elements temporarily disabled */}
          {/* 
          {error && error.includes('Google') && (
            <div className="mt-4 p-3 bg-[#23282D] border-l-3 border-[#1D9E75] rounded flex items-center justify-between gap-3 text-left w-full">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span className="font-sans text-[13px] text-[#EDE9DF]">
                  This account uses Google Sign In
                </span>
              </div>
              <button
                type="button"
                onClick={loginWithGoogle}
                className="px-3 py-1.5 bg-[#1D9E75] hover:bg-[#178a65] text-white font-sans text-xs font-semibold rounded transition-colors cursor-pointer whitespace-nowrap"
              >
                Continue with Google
              </button>
            </div>
          )}

          <div className="relative my-8 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-[#3D494F]"></div>
            </div>
            <div className="relative flex justify-center text-[12px] uppercase z-10">
              <span className="bg-[#141618] px-4 font-sans text-[12px] tracking-wider text-[#C8B89A]">
                or
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-[10px] py-3 bg-[#23282D] text-[#EDE9DF] border border-[#3D494F] font-sans text-[15px] font-medium rounded-lg hover:border-[#1D9E75] hover:bg-[#2a3035] transition-all duration-200 cursor-pointer"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>
          */}

          {/* Footer Link */}
          <div className="text-center mt-6">
            <p className="font-sans text-[14px] text-[#C8B89A]">
              New to HeritageAI?{' '}
              <Link to="/register" className="font-semibold text-[#1D9E75] hover:opacity-85 transition-opacity">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
