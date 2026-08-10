import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Landmark } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const processAuth = async () => {
      try {
        const token = searchParams.get('token');
        if (token) {
          // Save token to localStorage under the key 'heritage_token'
          localStorage.setItem('heritage_token', token);
          
          // Retrieve logged-in user profile
          const userData = await api.getMe();
          
          // Set user in AuthContext
          setUser(userData);
          setUserProfile(userData);
          setStatus('success');
          
          // Redirect to /explore after 1.5 seconds
          setTimeout(() => {
            navigate('/explore', { replace: true });
          }, 1500);
        } else {
          console.warn('No token found in AuthCallback query parameters.');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Google OAuth Callback Authentication error:', error);
        navigate('/login', { replace: true });
      }
    };

    processAuth();
  }, [searchParams, setUser, navigate]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#141618] text-[#EDE9DF] relative overflow-hidden select-none">
      
      {/* Scoped CSS animations for checkmark and progress bar */}
      <style>{`
        @keyframes draw-check {
          from { stroke-dashoffset: 100; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes fill-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>

      {status === 'loading' ? (
        <div className="flex flex-col items-center gap-6">
          {/* HeritageAI Logo at Top */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#1D9E75] flex items-center justify-center shadow-md">
              <Landmark className="w-5 h-5 text-[#EDE9DF]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif font-bold text-xl text-[#EDE9DF] leading-none tracking-tight">
                HeritageAI
              </span>
              <span className="text-[10px] font-sans text-[#C8B89A] mt-0.5" style={{ fontWeight: 500, letterSpacing: '0.08em' }}>
                PAKISTAN
              </span>
            </div>
          </div>

          {/* Spinning circle loader */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-t-[#1D9E75] border-r-transparent border-b-[#3D494F]/40 border-l-transparent animate-spin"></div>
            <div className="absolute inset-4 rounded-full bg-[#1D9E75]/10 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1D9E75] animate-ping"></div>
            </div>
          </div>

          <p className="font-serif text-lg tracking-wide text-[#EDE9DF] animate-pulse">
            Signing you in...
          </p>
          <p className="font-sans text-xs text-[#C8B89A] font-light">
            Securing a connection with the central registry
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center max-w-[320px] w-full px-4 text-center">
          
          {/* Large Animated Checkmark Circle */}
          <div className="mb-6">
            <svg width="80" height="80" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="24" 
                      fill="none" 
                      stroke="#1D9E75" 
                      strokeWidth="3"/>
              <path fill="none" 
                    stroke="#1D9E75" 
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="100"
                    strokeDashoffset="100"
                    style={{ animation: 'draw-check 0.6s ease forwards' }}
                    d="M14 27 L22 35 L38 18"/>
            </svg>
          </div>

          {/* Google User Profile Picture / Initial Fallback */}
          <div className="mb-6">
            {userProfile?.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                referrerPolicy="no-referrer"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #1D9E75',
                  boxShadow: '0 4px 12px rgba(29, 158, 117, 0.15)'
                }}
              />
            ) : (
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#1D9E75',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: '600',
                fontFamily: 'Outfit',
                border: '3px solid #1D9E75',
                boxShadow: '0 4px 12px rgba(29, 158, 117, 0.15)'
              }}>
                {userProfile?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Heading and Subtexts */}
          <h2 className="font-serif font-bold text-[24px] text-[#EDE9DF] leading-tight mb-2">
            Welcome, {userProfile?.name ? userProfile.name.split(' ')[0] : 'Explorer'}!
          </h2>
          
          <p className="font-sans text-[14px] text-[#C8B89A] mb-3">
            You're now signed in with Google
          </p>
          
          <p className="font-sans text-[12px] text-[#3D494F]">
            Redirecting to explore...
          </p>

          {/* Progress Bar at Bottom of Screen */}
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#23282D]">
            <div 
              className="h-full bg-[#1D9E75]"
              style={{
                animation: 'fill-progress 1.5s linear forwards'
              }}
            />
          </div>

        </div>
      )}
    </div>
  );
}
