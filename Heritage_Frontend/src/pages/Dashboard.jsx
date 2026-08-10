import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getEarnedStamps } from '../utils/passport';
import { 
  User, Calendar, MapPin, Award, Shield, 
  ExternalLink, Clock, CheckCircle2, XCircle, ChevronRight 
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const earnedStamps = getEarnedStamps();

  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        setLoading(true);
        const data = await api.fetchMyBookings();
        setBookings(data);
      } catch (err) {
        console.error("Error fetching user bookings:", err);
        setError("Failed to retrieve your tours history. Please check back later.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserBookings();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#1D9E75]/15 text-[#1D9E75] border border-[#1D9E75]/35">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/20 text-red-400 border border-red-900/30">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/20 text-amber-400 border border-amber-900/30">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="flex-1 w-full bg-[#141618] text-[#EDE9DF] min-h-screen py-10 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Dashboard Title & Introduction */}
        <div className="border-b border-[#3D494F]/30 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#EDE9DF]">
              Traveler Profile
            </h1>
            <p className="text-sm font-sans text-[#C8B89A] mt-1.5 font-light">
              Manage your expeditions, track your passport stamps, and view reservation history.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans text-[#C8B89A] font-light">Account status:</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#3D494F]/40 border border-[#3D494F] text-[#EDE9DF]">
              Traveler
            </span>
          </div>
        </div>

        {/* Analytics & Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: User Profile summary */}
          <div className="bg-[#23282D] border border-[#3D494F] rounded-xl p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1D9E75]/10 border border-[#1D9E75]/30 flex items-center justify-center text-[#1D9E75] overflow-hidden shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-lg text-[#EDE9DF] truncate">{user?.name || 'Traveler'}</h3>
              <p className="font-sans text-xs text-[#C8B89A] truncate mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-1 text-[11px] text-[#1D9E75] font-sans font-medium mt-1">
                <Shield className="w-3 h-3" />
                <span>Verified Explorer</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Bookings */}
          <div className="bg-[#23282D] border border-[#3D494F] rounded-xl p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1D9E75]/10 border border-[#1D9E75]/30 flex items-center justify-center text-[#1D9E75] shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="font-sans text-xs text-[#C8B89A] uppercase tracking-wider font-semibold">Tours Booked</p>
              <h3 className="font-serif font-bold text-3xl text-[#EDE9DF] mt-1">{bookings.length}</h3>
            </div>
          </div>

          {/* Card 3: Stamps Unlocked */}
          <div className="bg-[#23282D] border border-[#3D494F] rounded-xl p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1D9E75]/10 border border-[#1D9E75]/30 flex items-center justify-center text-[#1D9E75] shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="font-sans text-xs text-[#C8B89A] uppercase tracking-wider font-semibold">Passport Stamps</p>
              <h3 className="font-serif font-bold text-3xl text-[#EDE9DF] mt-1">
                {earnedStamps.length} <span className="text-sm font-sans font-light text-[#C8B89A]">unlocked</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Bookings Table & Stamp Collection Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Bookings History Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#23282D] border border-[#3D494F] rounded-xl p-6 shadow-md">
              <h2 className="font-serif font-bold text-xl text-[#EDE9DF] mb-5 border-b border-[#3D494F]/30 pb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#1D9E75]" />
                Your Booked Expeditions
              </h2>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-[#1D9E75] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-sans text-[#C8B89A]">Retrieving bookings list...</p>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-lg text-red-300 text-xs font-sans">
                  {error}
                </div>
              ) : bookings.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <p className="font-sans text-sm text-[#C8B89A] italic font-light">
                    You haven't booked any tours yet. Explore the historical treasures of Pakistan and secure your first booking!
                  </p>
                  <Link
                    to="/explore"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#1D9E75] hover:bg-[#157F5D] text-[#EDE9DF] font-sans font-medium text-sm rounded-full shadow transition-all duration-200"
                  >
                    Browse Destinations
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-[#3D494F]/60 text-xs uppercase tracking-wider text-[#C8B89A] font-semibold">
                        <th className="pb-3 pr-2">Destination</th>
                        <th className="pb-3 px-2">Date</th>
                        <th className="pb-3 px-2">Travelers</th>
                        <th className="pb-3 px-2">Price</th>
                        <th className="pb-3 pl-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3D494F]/20">
                      {bookings.map((booking) => (
                        <tr key={booking._id} className="hover:bg-[#141618]/30 transition-colors">
                          <td className="py-4 pr-2 font-serif font-bold text-[#EDE9DF]">
                            {booking.siteId?.name || 'Ancient Landmark'}
                          </td>
                          <td className="py-4 px-2 text-[#C8B89A] text-xs">
                            {new Date(booking.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-4 px-2 text-[#EDE9DF] text-center">
                            {booking.numberOfPeople}
                          </td>
                          <td className="py-4 px-2 text-[#1D9E75] font-semibold">
                            Rs. {booking.totalPrice?.toLocaleString()}
                          </td>
                          <td className="py-4 pl-2 text-right md:text-left">
                            {getStatusBadge(booking.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Stamp Preview list side column */}
          <div className="space-y-6">
            <div className="bg-[#23282D] border border-[#3D494F] rounded-xl p-6 shadow-md">
              <h2 className="font-serif font-bold text-xl text-[#EDE9DF] mb-5 border-b border-[#3D494F]/30 pb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#1D9E75]" />
                Recent Passport Stamps
              </h2>

              {earnedStamps.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-sans text-xs text-[#C8B89A] italic font-light leading-relaxed">
                    Stamps are unlocked dynamically as you visit new archaeological monuments and booking status is marked as complete.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {earnedStamps.slice(-6).map((stamp) => (
                      <div
                        key={stamp.siteId}
                        className="bg-[#141618] border border-[#3D494F]/60 rounded-xl p-3 flex flex-col items-center justify-center text-center aspect-square shadow"
                      >
                        <div className="w-10 h-10 rounded-full border border-[#1D9E75] flex items-center justify-center text-[#1D9E75] text-xs font-semibold bg-[#1a3a30]/30 shadow-inner">
                          {/* Motif symbol */}
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="font-serif text-[10px] text-[#EDE9DF] font-bold truncate w-full mt-2 leading-none">
                          {stamp.siteName}
                        </span>
                        <span className="text-[8px] font-sans text-[#1D9E75] uppercase mt-0.5 tracking-wider">
                          {stamp.province}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] font-sans text-[#C8B89A] text-center italic mt-4 font-light">
                    Open your Passport modal from the top navbar to view the full stamp catalog.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
