import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Shield, Users, BookOpen, Map, Check, X, 
  TrendingUp, AlertCircle, BarChart3, Clock, AlertTriangle,
  Plus, Edit, Trash2, Eye, EyeOff, Search
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const colors = {
    bg: isDark ? 'bg-[#141618]' : 'bg-[#FAF9F6]',
    text: isDark ? 'text-[#EDE9DF]' : 'text-[#141618]',
    subtext: isDark ? 'text-[#C8B89A]' : 'text-slate-500',
    cardBg: isDark ? 'bg-[#23282D]' : 'bg-[#FFFFFF]',
    cardBorder: isDark ? 'border-[#3D494F]' : 'border-slate-200',
    borderMuted: isDark ? 'border-[#3D494F]/30' : 'border-slate-200/50',
    borderDivided: isDark ? 'divide-[#3D494F]/20' : 'divide-slate-100',
    tableBorder: isDark ? 'border-[#3D494F]/60' : 'border-slate-200',
    rowHover: isDark ? 'hover:bg-[#141618]/30' : 'hover:bg-slate-50/70',
    topSiteItem: isDark ? 'bg-[#141618]/40 border-[#3D494F]/30' : 'bg-slate-50 border-slate-100',
    statsIconBg: isDark ? 'bg-[#1D9E75]/10' : 'bg-emerald-50',
    statsIconText: isDark ? 'text-[#1D9E75]' : 'text-emerald-600',
    refreshBtn: isDark ? 'bg-[#3D494F]/40 hover:bg-[#3D494F]/70 border-[#3D494F] text-[#EDE9DF]' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700',
    progressBarBg: isDark ? 'bg-[#141618]' : 'bg-slate-100',
    controlBarBg: isDark ? 'bg-[#23282D]' : 'bg-[#FFFFFF]',
    searchInputBg: isDark ? 'bg-[#141618]' : 'bg-slate-50',
    inputBorder: isDark ? 'border-[#3D494F]/60' : 'border-slate-300',
    actionBtn: isDark ? 'bg-[#3D494F]/20 border-[#3D494F]/40 text-[#EDE9DF]' : 'bg-slate-100 border-slate-200 text-slate-700',
    modalBg: isDark ? 'bg-[#23282D]' : 'bg-[#FFFFFF]',
    modalBorder: isDark ? 'border-[#3D494F]' : 'border-slate-200',
    modalInputBg: isDark ? 'bg-[#141618]' : 'bg-slate-50',
    modalInputBorder: isDark ? 'border-[#3D494F]/60' : 'border-slate-300',
    modalText: isDark ? 'text-[#EDE9DF]' : 'text-slate-900',
    modalSubText: isDark ? 'text-[#C8B89A]' : 'text-slate-500',
    cancelBtn: isDark ? 'bg-transparent hover:bg-[#3D494F]/40 border-[#3D494F] text-[#EDE9DF]' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
  };

  const [stats, setStats] = useState(null);
  const [usersData, setUsersData] = useState([]);
  const [adminSites, setAdminSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('reservations');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal CRUD states
  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    region: 'Punjab',
    era: '',
    type: '',
    shortDescription: '',
    fullDescription: '',
    nearbyCity: '',
    visitingHours: '09:00 AM - 05:00 PM',
    entryFee: 'Rs. 200',
    lat: '31.5497',
    lng: '74.3436',
    images: '',
    tags: '',
    isHidden: false
  });

  // 1. Guard check: Only admins allowed
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsData, usersList, sitesList] = await Promise.all([
        api.fetchAdminStats(),
        api.fetchAdminUsers(),
        api.fetchAdminSites()
      ]);
      setStats(statsData);
      setUsersData(usersList);
      setAdminSites(sitesList);
    } catch (err) {
      console.error("Admin Dashboard data fetch failure:", err);
      setError("Failed to retrieve administrative analytics. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      setActionLoading(bookingId);
      await api.updateBookingStatus(bookingId, newStatus);
      await loadData();
    } catch (err) {
      console.error("Failed to update booking status:", err);
      alert(err.message || "Failed to update status. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle toggling visibility
  const handleToggleVisibility = async (id) => {
    try {
      setActionLoading(id);
      const updated = await api.toggleAdminSiteVisibility(id);
      setAdminSites(prev => prev.map(s => s._id === id ? updated : s));
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
      alert(err.message || "Failed to toggle visibility. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle deleting a site
  const handleDeleteSite = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This will also remove its search index from Pinecone.`)) {
      return;
    }
    try {
      setActionLoading(id);
      await api.deleteAdminSite(id);
      setAdminSites(prev => prev.filter(s => s._id !== id));
      const statsData = await api.fetchAdminStats();
      setStats(statsData);
    } catch (err) {
      console.error("Failed to delete site:", err);
      alert(err.message || "Failed to delete site. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // Open modal for add
  const handleOpenAddModal = () => {
    setEditingSite(null);
    setFormData({
      name: '',
      region: 'Punjab',
      era: '',
      type: '',
      shortDescription: '',
      fullDescription: '',
      nearbyCity: '',
      visitingHours: '09:00 AM - 05:00 PM',
      entryFee: 'Rs. 200',
      lat: '31.5497',
      lng: '74.3436',
      images: '',
      tags: '',
      isHidden: false
    });
    setShowModal(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (site) => {
    setEditingSite(site);
    setFormData({
      name: site.name || '',
      region: site.region || 'Punjab',
      era: site.civilizationEra || site.era || '',
      type: site.siteType || site.type || '',
      shortDescription: site.shortDescription || '',
      fullDescription: site.fullDescription || '',
      nearbyCity: site.nearbyCity || site.city || '',
      visitingHours: site.visitingHours || '09:00 AM - 05:00 PM',
      entryFee: site.entryFee || 'Free',
      lat: String(site.lat || 0),
      lng: String(site.lon || site.lng || 0),
      images: site.images ? site.images.join('\n') : '',
      tags: site.tags ? site.tags.join(', ') : '',
      isHidden: site.isHidden || false
    });
    setShowModal(true);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading('saving');
      
      const payload = {
        name: formData.name,
        region: formData.region,
        era: formData.era,
        type: formData.type,
        shortDescription: formData.shortDescription,
        fullDescription: formData.fullDescription,
        coordinates: {
          lat: parseFloat(formData.lat) || 0,
          lng: parseFloat(formData.lng) || 0
        },
        images: formData.images.split('\n').map(x => x.trim()).filter(Boolean),
        nearbyCity: formData.nearbyCity,
        visitingHours: formData.visitingHours,
        entryFee: formData.entryFee,
        tags: formData.tags.split(',').map(x => x.trim()).filter(Boolean),
        isHidden: formData.isHidden
      };

      if (editingSite) {
        const updated = await api.updateAdminSite(editingSite._id, payload);
        setAdminSites(prev => prev.map(s => s._id === editingSite._id ? updated : s));
      } else {
        const created = await api.createAdminSite(payload);
        setAdminSites(prev => [created, ...prev]);
      }

      const statsData = await api.fetchAdminStats();
      setStats(statsData);
      
      setShowModal(false);
    } catch (err) {
      console.error("Failed to save site:", err);
      alert(err.message || "Failed to save site details. Please check form values.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center min-h-screen ${colors.bg} ${colors.text}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
          <p className={`font-sans text-xs font-light tracking-wider ${colors.subtext} uppercase`}>Loading Control Center...</p>
        </div>
      </div>
    );
  }

  // Double check role authorization
  if (user?.role !== 'admin') {
    return null;
  }

  const allBookings = usersData.flatMap((record) =>
    record.bookings.map((booking) => ({
      ...booking,
      user: record.user
    }))
  );

  const sortedBookings = [...allBookings].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB - dateA;
  });

  const filteredSites = adminSites.filter(site => {
    const query = searchTerm.toLowerCase();
    return (
      (site.name || '').toLowerCase().includes(query) ||
      (site.region || '').toLowerCase().includes(query) ||
      (site.nearbyCity || '').toLowerCase().includes(query) ||
      (site.type || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className={`flex-1 w-full ${colors.bg} ${colors.text} min-h-screen py-10 px-4 sm:px-6 lg:px-8 select-none transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className={`border-b ${colors.borderMuted} pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4`}>
          <div>
            <h1 className={`text-3xl md:text-4xl font-serif font-bold ${colors.text} flex items-center gap-2`}>
              <Shield className="w-8 h-8 text-[#1D9E75]" />
              Admin Command Console
            </h1>
            <p className={`text-sm font-sans ${colors.subtext} mt-1.5 font-light`}>
              Overview of system metrics, site bookings verification, and user management.
            </p>
          </div>
          <button
            onClick={loadData}
            className={`px-5 py-2.5 ${colors.refreshBtn} border rounded-lg text-xs font-sans font-medium transition-all cursor-pointer`}
          >
            Refresh Analytics
          </button>
        </div>

        {/* Global Statistics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Users */}
          <div className={`${colors.cardBg} ${colors.cardBorder} border rounded-xl p-6 shadow flex items-center justify-between transition-all`}>
            <div className="space-y-1">
              <p className={`font-sans text-xs ${colors.subtext} uppercase tracking-wider font-semibold`}>Total Travelers</p>
              <h3 className={`font-serif font-bold text-3xl ${colors.text}`}>{stats?.totalUsers || 0}</h3>
            </div>
            <div className={`w-12 h-12 rounded-full ${colors.statsIconBg} flex items-center justify-center ${colors.statsIconText}`}>
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Bookings */}
          <div className={`${colors.cardBg} ${colors.cardBorder} border rounded-xl p-6 shadow flex items-center justify-between transition-all`}>
            <div className="space-y-1">
              <p className={`font-sans text-xs ${colors.subtext} uppercase tracking-wider font-semibold`}>Booked Tours</p>
              <h3 className={`font-serif font-bold text-3xl ${colors.text}`}>{stats?.totalBookings || 0}</h3>
            </div>
            <div className={`w-12 h-12 rounded-full ${colors.statsIconBg} flex items-center justify-center ${colors.statsIconText}`}>
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Sites */}
          <div className={`${colors.cardBg} ${colors.cardBorder} border rounded-xl p-6 shadow flex items-center justify-between transition-all`}>
            <div className="space-y-1">
              <p className={`font-sans text-xs ${colors.subtext} uppercase tracking-wider font-semibold`}>Active Destinations</p>
              <h3 className={`font-serif font-bold text-3xl ${colors.text}`}>{stats?.totalSites || 0}</h3>
            </div>
            <div className={`w-12 h-12 rounded-full ${colors.statsIconBg} flex items-center justify-center ${colors.statsIconText}`}>
              <Map className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-950/20 border border-red-900/40 rounded-xl text-red-200 text-xs font-sans">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Selection Navigation Bar */}
        <div className={`flex border-b ${colors.borderMuted} gap-6`}>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`pb-3 text-sm font-sans font-semibold tracking-wider uppercase transition-all relative cursor-pointer ${
              activeTab === 'reservations' 
                ? 'text-[#1D9E75]' 
                : `${isDark ? 'text-[#C8B89A] hover:text-[#EDE9DF]' : 'text-slate-500 hover:text-[#141618]'}`
            }`}
          >
            Reservations Log
            {activeTab === 'reservations' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1D9E75]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('sites')}
            className={`pb-3 text-sm font-sans font-semibold tracking-wider uppercase transition-all relative cursor-pointer ${
              activeTab === 'sites' 
                ? 'text-[#1D9E75]' 
                : `${isDark ? 'text-[#C8B89A] hover:text-[#EDE9DF]' : 'text-slate-500 hover:text-[#141618]'}`
            }`}
          >
            Manage Sites
            {activeTab === 'sites' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1D9E75]" />
            )}
          </button>
        </div>

        {/* Reservations View */}
        {activeTab === 'reservations' && (
          <div className="space-y-10">
            {/* Status Breakdown & Top Booked Sites */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Status Breakdown Card */}
              <div className={`${colors.cardBg} ${colors.cardBorder} border rounded-xl p-6 shadow-md`}>
                <h2 className={`font-serif font-bold text-lg ${colors.text} mb-5 border-b ${colors.borderMuted} pb-3 flex items-center gap-2`}>
                  <BarChart3 className="w-5 h-5 text-[#1D9E75]" />
                  Bookings Status Distribution
                </h2>
                <div className="space-y-5">
                  {/* Confirmed progress bar */}
                  <div className="space-y-2">
                    <div className={`flex justify-between text-xs font-sans ${colors.subtext}`}>
                      <span>Confirmed Bookings</span>
                      <span className="text-[#1D9E75] font-semibold">{stats?.bookingsByStatus?.confirmed || 0}</span>
                    </div>
                    <div className={`w-full ${colors.progressBarBg} rounded-full h-2`}>
                      <div 
                        className="bg-[#1D9E75] h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${stats?.totalBookings ? ((stats.bookingsByStatus?.confirmed || 0) / stats.totalBookings) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Pending progress bar */}
                  <div className="space-y-2">
                    <div className={`flex justify-between text-xs font-sans ${colors.subtext}`}>
                      <span>Pending Bookings</span>
                      <span className="text-amber-500 font-semibold">{stats?.bookingsByStatus?.pending || 0}</span>
                    </div>
                    <div className={`w-full ${colors.progressBarBg} rounded-full h-2`}>
                      <div 
                        className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${stats?.totalBookings ? ((stats.bookingsByStatus?.pending || 0) / stats.totalBookings) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Cancelled progress bar */}
                  <div className="space-y-2">
                    <div className={`flex justify-between text-xs font-sans ${colors.subtext}`}>
                      <span>Cancelled Bookings</span>
                      <span className="text-red-500 font-semibold">{stats?.bookingsByStatus?.cancelled || 0}</span>
                    </div>
                    <div className={`w-full ${colors.progressBarBg} rounded-full h-2`}>
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${stats?.totalBookings ? ((stats.bookingsByStatus?.cancelled || 0) / stats.totalBookings) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Sites Card */}
              <div className={`lg:col-span-2 ${colors.cardBg} ${colors.cardBorder} border rounded-xl p-6 shadow-md`}>
                <h2 className={`font-serif font-bold text-lg ${colors.text} mb-5 border-b ${colors.borderMuted} pb-3 flex items-center gap-2`}>
                  <TrendingUp className="w-5 h-5 text-[#1D9E75]" />
                  Top 5 Most Booked Heritage Sites
                </h2>
                {stats?.topBookedSites?.length === 0 ? (
                  <p className={`font-sans text-sm ${colors.subtext} italic py-8 text-center`}>No data available.</p>
                ) : (
                  <div className="space-y-4">
                    {stats?.topBookedSites?.map((site, index) => (
                      <div key={index} className={`flex items-center justify-between p-3.5 ${colors.topSiteItem} border rounded-lg hover:border-[#1D9E75]/30 transition-all`}>
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#1D9E75]/15 border border-[#1D9E75]/35 flex items-center justify-center text-[#1D9E75] text-xs font-bold font-sans">
                            {index + 1}
                          </span>
                          <span className={`font-serif text-sm font-bold ${colors.text}`}>{site.siteName}</span>
                        </div>
                        <span className={`font-sans text-xs ${colors.subtext}`}>
                          <span className="text-[#1D9E75] font-semibold text-sm">{site.bookingCount}</span> reservations
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bookings Action Table */}
            <div className={`${colors.cardBg} ${colors.cardBorder} border rounded-xl p-6 shadow-md`}>
              <h2 className={`font-serif font-bold text-xl ${colors.text} mb-6 border-b ${colors.borderMuted} pb-3`}>
                System Reservations Log
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm border-collapse">
                  <thead>
                    <tr className={`border-b ${colors.tableBorder} text-xs uppercase tracking-wider ${colors.subtext} font-semibold`}>
                      <th className="pb-3 pr-2">Traveler</th>
                      <th className="pb-3 px-2">Destination</th>
                      <th className="pb-3 px-2">Date</th>
                      <th className="pb-3 px-2 text-center">Group Size</th>
                      <th className="pb-3 px-2">Price</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 pl-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${colors.borderDivided}`}>
                    {sortedBookings.length === 0 ? (
                      <tr>
                        <td colSpan="7" className={`py-8 text-center ${colors.subtext} italic`}>
                          No system bookings recorded.
                        </td>
                      </tr>
                    ) : (
                      sortedBookings.map((booking) => (
                        <tr key={booking._id} className={`${colors.rowHover} transition-colors`}>
                          {/* User Details */}
                          <td className="py-4 pr-2">
                            <p className={`font-serif font-bold ${colors.text} leading-none`}>
                              {booking.contactName || booking.user?.name}
                            </p>
                            <span className={`text-[11px] ${colors.subtext} font-light block mt-1`}>
                              {booking.contactEmail || booking.user?.email}
                            </span>
                            {(booking.phone || booking.user?.phone) && (
                              <span className={`text-[11px] ${colors.subtext} font-light block mt-0.5`}>
                                {booking.phone || booking.user?.phone}
                              </span>
                            )}
                          </td>
                          {/* Destination */}
                          <td className={`py-4 px-2 font-serif font-bold ${colors.text}`}>
                            {booking.siteId?.name || 'Ancient Monument'}
                          </td>
                          {/* Date */}
                          <td className={`py-4 px-2 text-xs ${colors.subtext}`}>
                            {new Date(booking.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          {/* Group Size */}
                          <td className={`py-4 px-2 ${colors.text} text-center font-medium`}>
                            {booking.numberOfPeople}
                          </td>
                          {/* Total Price */}
                          <td className="py-4 px-2 text-[#1D9E75] font-semibold">
                            Rs. {booking.totalPrice?.toLocaleString()}
                          </td>
                          {/* Status badge */}
                          <td className="py-4 px-2">
                            {booking.status === 'confirmed' ? (
                              <span className="inline-flex items-center gap-0.5 text-xs text-[#1D9E75] font-semibold bg-[#1D9E75]/10 px-2 py-0.5 rounded-full border border-[#1D9E75]/20">
                                <Check className="w-3 h-3" /> Confirmed
                              </span>
                            ) : booking.status === 'cancelled' ? (
                              <span className="inline-flex items-center gap-0.5 text-xs text-red-500 font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                <X className="w-3 h-3" /> Cancelled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-xs text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>
                          {/* Quick actions controls */}
                          <td className="py-4 pl-2 text-right">
                            {booking.status === 'pending' ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                                  disabled={actionLoading === booking._id}
                                  className="p-1.5 bg-[#1D9E75]/10 hover:bg-[#1D9E75] hover:text-[#EDE9DF] border border-[#1D9E75]/40 text-[#1D9E75] rounded transition-all duration-200 cursor-pointer"
                                  title="Confirm Tour"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                                  disabled={actionLoading === booking._id}
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-[#EDE9DF] border border-red-500/40 text-red-500 rounded transition-all duration-200 cursor-pointer"
                                  title="Cancel Tour"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className={`text-xs ${colors.subtext} italic font-light pr-2`}>Processed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Manage Sites View */}
        {activeTab === 'sites' && (
          <div className="space-y-6">
            {/* Control Bar */}
            <div className={`flex flex-col sm:flex-row gap-4 items-center justify-between ${colors.cardBg} ${colors.cardBorder} border rounded-xl p-4 shadow`}>
              {/* Search Box */}
              <div className="relative w-full sm:max-w-xs">
                <Search className={`absolute left-3 top-2.5 w-4 h-4 ${colors.subtext}`} />
                <input
                  type="text"
                  placeholder="Search by name, region, type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 ${colors.searchInputBg} border ${colors.inputBorder} rounded-lg text-sm ${colors.text} placeholder-slate-400 focus:outline-none focus:border-[#1D9E75] transition-all font-sans`}
                />
              </div>

              {/* Add Site Button */}
              <button
                onClick={handleOpenAddModal}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#1D9E75] hover:bg-[#15805F] text-[#EDE9DF] rounded-lg text-xs font-sans font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-center cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Heritage Site
              </button>
            </div>

            {/* Sites Table */}
            <div className={`${colors.cardBg} ${colors.cardBorder} border rounded-xl p-6 shadow-md`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm border-collapse">
                  <thead>
                    <tr className={`border-b ${colors.tableBorder} text-xs uppercase tracking-wider ${colors.subtext} font-semibold`}>
                      <th className="pb-3 pr-2">Site Details</th>
                      <th className="pb-3 px-2">Region</th>
                      <th className="pb-3 px-2">Type</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 pl-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${colors.borderDivided}`}>
                    {filteredSites.length === 0 ? (
                      <tr>
                        <td colSpan="5" className={`py-8 text-center ${colors.subtext} italic`}>
                          No heritage sites found matching your query.
                        </td>
                      </tr>
                    ) : (
                      filteredSites.map((site) => (
                        <tr key={site._id} className={`${colors.rowHover} transition-colors`}>
                          {/* Image & details */}
                          <td className="py-4 pr-2 flex items-center gap-3">
                            <img
                              src={site.images && site.images[0] ? site.images[0] : 'https://images.unsplash.com/photo-1596367401555-31e37f1f7bfb?auto=format&fit=crop&w=80&q=80'}
                              alt={site.name}
                              className={`w-12 h-12 object-cover rounded-lg border ${colors.cardBorder} shrink-0`}
                            />
                            <div>
                              <p className={`font-serif font-bold ${colors.text} leading-tight`}>{site.name}</p>
                              <span className={`text-[11px] ${colors.subtext} font-light block mt-1`}>
                                {site.nearbyCity || site.city || 'Unknown City'} &bull; {site.civilizationEra || site.era || 'Unknown Era'}
                              </span>
                            </div>
                          </td>

                          {/* Region */}
                          <td className={`py-4 px-2 font-serif text-sm font-bold ${colors.text}`}>
                            {site.region}
                          </td>

                          {/* Type */}
                          <td className="py-4 px-2">
                            <span className={`inline-flex items-center text-xs ${colors.actionBtn} px-2.5 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-850/50 font-medium`}>
                              {site.type}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-2">
                            {site.isHidden ? (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                <EyeOff className="w-3 h-3" /> Hidden
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-[#1D9E75] font-semibold bg-[#1D9E75]/10 px-2.5 py-0.5 rounded-full border border-[#1D9E75]/20">
                                <Eye className="w-3 h-3" /> Visible
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 pl-2 text-right">
                            <div className="flex justify-end gap-2">
                              {/* Toggle visibility */}
                              <button
                                onClick={() => handleToggleVisibility(site._id)}
                                disabled={actionLoading === site._id}
                                className={`p-1.5 rounded border transition-all duration-200 cursor-pointer ${
                                  site.isHidden
                                    ? 'bg-[#1D9E75]/10 hover:bg-[#1D9E75] hover:text-[#EDE9DF] border-[#1D9E75]/40 text-[#1D9E75]'
                                    : `${colors.actionBtn} hover:bg-[#BA7517]/20 hover:text-[#BA7517]`
                                }`}
                                title={site.isHidden ? "Make Visible" : "Hide Site"}
                              >
                                {site.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => handleOpenEditModal(site)}
                                disabled={actionLoading === site._id}
                                className={`p-1.5 ${colors.actionBtn} hover:bg-[#1D9E75] hover:text-[#EDE9DF] rounded transition-all duration-200 cursor-pointer`}
                                title="Edit Site"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteSite(site._id, site.name)}
                                disabled={actionLoading === site._id}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-[#EDE9DF] border border-red-500/20 text-red-500 rounded transition-all duration-200 cursor-pointer"
                                title="Delete Site"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal for Add / Edit Site */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in select-text">
          <div className={`relative ${colors.modalBg} ${colors.modalBorder} border rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 ${colors.modalText}`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between border-b ${colors.borderMuted} pb-4`}>
              <h3 className={`text-xl font-serif font-bold ${colors.modalText}`}>
                {editingSite ? `Edit Site: ${editingSite.name}` : 'Create New Heritage Site'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className={`hover:${colors.modalText} ${colors.modalSubText} transition-colors cursor-pointer`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className={`block text-xs font-sans ${colors.modalSubText} uppercase tracking-wider font-semibold`}>Site Name *</label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Shalimar Gardens"
                    className={`w-full px-4 py-2.5 ${colors.modalInputBg} border ${colors.modalInputBorder} rounded-lg text-sm ${colors.modalText} placeholder-slate-400 focus:outline-none focus:border-[#1D9E75] transition-all`}
                  />
                </div>

                {/* Region */}
                <div className="space-y-2">
                  <label className={`block text-xs font-sans ${colors.modalSubText} uppercase tracking-wider font-semibold`}>Region / Province *</label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 ${colors.modalInputBg} border ${colors.modalInputBorder} rounded-lg text-sm ${colors.modalText} focus:outline-none focus:border-[#1D9E75] transition-all`}
                  >
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="KPK">KPK</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                    <option value="AJK">AJK</option>
                  </select>
                </div>

                {/* Era */}
                <div className="space-y-2">
                  <label className={`block text-xs font-sans ${colors.modalSubText} uppercase tracking-wider font-semibold`}>Historical Era *</label>
                  <input
                    type="text"
                    required
                    name="era"
                    value={formData.era}
                    onChange={handleInputChange}
                    placeholder="e.g. Mughal, Buddhist, Indus Valley"
                    className={`w-full px-4 py-2.5 ${colors.modalInputBg} border ${colors.modalInputBorder} rounded-lg text-sm ${colors.modalText} placeholder-slate-400 focus:outline-none focus:border-[#1D9E75] transition-all`}
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <label className={`block text-xs font-sans ${colors.modalSubText} uppercase tracking-wider font-semibold`}>Site Type *</label>
                  <input
                    type="text"
                    required
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    placeholder="e.g. Fort, Tomb, Ruins, Palace"
                    className={`w-full px-4 py-2.5 ${colors.modalInputBg} border ${colors.modalInputBorder} rounded-lg text-sm ${colors.modalText} placeholder-slate-400 focus:outline-none focus:border-[#1D9E75] transition-all`}
                  />
                </div>

                {/* Nearby City */}
                <div className="space-y-2">
                  <label className={`block text-xs font-sans ${colors.modalSubText} uppercase tracking-wider font-semibold`}>Nearby City *</label>
                  <input
                    type="text"
                    required
                    name="nearbyCity"
                    value={formData.nearbyCity}
                    onChange={handleInputChange}
                    placeholder="e.g. Lahore, Larkana"
                    className={`w-full px-4 py-2.5 ${colors.modalInputBg} border ${colors.modalInputBorder} rounded-lg text-sm ${colors.modalText} placeholder-slate-400 focus:outline-none focus:border-[#1D9E75] transition-all`}
                  />
                </div>

                {/* Visiting Hours */}
                <div className="space-y-2">
                  <label className={`block text-xs font-sans ${colors.modalSubText} uppercase tracking-wider font-semibold`}>Visiting Hours</label>
                  <input
                    type="text"
                    name="visitingHours"
                    value={formData.visitingHours}
                    onChange={handleInputChange}
                    placeholder="e.g. 09:00 AM - 05:00 PM"
                    className={`w-full px-4 py-2.5 ${colors.modalInputBg} border ${colors.modalInputBorder} rounded-lg text-sm ${colors.modalText} placeholder-slate-400 focus:outline-none focus:border-[#1D9E75] transition-all`}
                  />
                </div>

                {/* Entry Fee */}
                <div className="space-y-2">
                  <label className={`block text-xs font-sans ${colors.modalSubText} uppercase tracking-wider font-semibold`}>Entry Fee</label>
                  <input
                    type="text"
                    name="entryFee"
                    value={formData.entryFee}
                    onChange={handleInputChange}
                    placeholder="e.g. Rs. 200 or Free"
                    className={`w-full px-4 py-2.5 ${colors.modalInputBg} border ${colors.modalInputBorder} rounded-lg text-sm ${colors.modalText} placeholder-slate-400 focus:outline-none focus:border-[#1D9E75] transition-all`}
                  />
                </div>

                {/* Coordinates Lat / Lng */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={`block text-[11px] font-sans ${colors.modalSubText} uppercase tracking-wider font-semibold`}>Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      name="lat"
                      value={formData.lat}
                      onChange={handleInputChange}
                      placeholder="e.g. 31.5497"
                      className={`w-full px-3 py-2.5 ${colors.modalInputBg} border ${colors.modalInputBorder} rounded-lg text-sm ${colors.modalText} placeholder-slate-400 focus:outline-none focus:border-[#1D9E75] transition-all`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`block text-[11px] font-sans ${colors.modalSubText} uppercase tracking-wider font-semibold`}>Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      name="lng"
                      value={formData.lng}
                      onChange={handleInputChange}
                      placeholder="e.g. 74.3436"
                      className={`w-full px-3 py-2.5 ${colors.modalInputBg} border ${colors.modalInputBorder} rounded-lg text-sm ${colors.modalText} placeholder-slate-400 focus:outline-none focus:border-[#1D9E75] transition-all`}
                    />
                  </div>
                </div>
              </div>

              {/* Images textarea */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`block text-xs font-sans ${colors.modalSubText} uppercase tracking-wider font-semibold`}>Image URLs</label>
                  <span className={`text-[11px] ${colors.modalSubText}/60`}>Enter one URL per line</span>
                </div>
                <textarea
                  name="images"
                  rows="3"
                  value={formData.images}
                  onChange={handleInputChange}
                  placeholder="https://images.unsplash.com/...&#10;https://images.unsplash.com/..."
                  className={`w-full px-4 py-2.5 ${colors.modalInputBg} border ${colors.modalInputBorder} rounded-lg text-sm ${colors.modalText} placeholder-slate-400 focus:outline-none focus:border-[#1D9E75] transition-all font-mono`}
                />
              </div>

              {/* Short Description */}
              <div className="space-y-2">
                <label className={`block text-xs font-sans ${colors.modalSubText} uppercase tracking-wider font-semibold`}>Short Description *</label>
                <textarea
                  name="shortDescription"
                  rows="2"
                  required
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  placeholder="A brief summary for site cards (1-2 sentences)..."
                  className={`w-full px-4 py-2.5 ${colors.modalInputBg} border ${colors.modalInputBorder} rounded-lg text-sm ${colors.modalText} placeholder-slate-400 focus:outline-none focus:border-[#1D9E75] transition-all`}
                />
              </div>

              {/* Full Description */}
              <div className="space-y-2">
                <label className={`block text-xs font-sans ${colors.modalSubText} uppercase tracking-wider font-semibold`}>Full Description *</label>
                <textarea
                  name="fullDescription"
                  rows="4"
                  required
                  value={formData.fullDescription}
                  onChange={handleInputChange}
                  placeholder="Detailed history and tourist overview..."
                  className={`w-full px-4 py-2.5 ${colors.modalInputBg} border ${colors.modalInputBorder} rounded-lg text-sm ${colors.modalText} placeholder-slate-400 focus:outline-none focus:border-[#1D9E75] transition-all`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Tags */}
                <div className="space-y-2">
                  <label className={`block text-xs font-sans ${colors.modalSubText} uppercase tracking-wider font-semibold`}>Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g. unesco, mughal, architecture, ruins"
                    className={`w-full px-4 py-2.5 ${colors.modalInputBg} border ${colors.modalInputBorder} rounded-lg text-sm ${colors.modalText} placeholder-slate-400 focus:outline-none focus:border-[#1D9E75] transition-all`}
                  />
                </div>

                {/* Is Hidden checkbox */}
                <div className="flex items-center gap-3 pt-6 md:pt-4">
                  <input
                    type="checkbox"
                    id="isHidden"
                    name="isHidden"
                    checked={formData.isHidden}
                    onChange={(e) => setFormData(prev => ({ ...prev, isHidden: e.target.checked }))}
                    className={`w-5 h-5 ${colors.modalInputBg} border ${colors.modalInputBorder} rounded text-[#1D9E75] focus:ring-transparent accent-[#1D9E75] cursor-pointer`}
                  />
                  <label htmlFor="isHidden" className={`text-sm ${colors.modalText} cursor-pointer font-sans select-none`}>
                    Hide from public listings & search index
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className={`flex gap-4 justify-end border-t ${colors.borderMuted} pt-4`}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-5 py-2.5 ${colors.cancelBtn} border rounded-lg text-xs font-sans font-medium transition-all cursor-pointer`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'saving'}
                  className="px-6 py-2.5 bg-[#1D9E75] hover:bg-[#15805F] disabled:bg-[#1D9E75]/50 text-[#EDE9DF] rounded-lg text-xs font-sans font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  {actionLoading === 'saving' ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#EDE9DF] border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Site'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
