// src/services/api.js
// Central API client handling requests to Express server and schema mapping

import axios from 'axios';

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api',
  timeout: 15000,
  withCredentials: true,
});

// Auto-attach JWT token if present in localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('heritage_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Maps backend DB Site schema fields to the exact properties expected by frontend components
export const mapDbSiteToFrontend = (dbSite) => {
  if (!dbSite) return null;
  return {
    _id: dbSite._id,
    id: dbSite._id || dbSite.slug,
    slug: dbSite.slug,
    name: dbSite.name,
    city: dbSite.nearbyCity || '',
    nearbyCity: dbSite.nearbyCity || '',
    province: dbSite.region || '',
    region: dbSite.region || '',
    civilizationEra: dbSite.era || '',
    siteType: dbSite.type || '',
    type: dbSite.type || '',
    entryFee: dbSite.entryFee || 'Free',
    unescoListed: dbSite.tags ? dbSite.tags.includes('unesco') : false,
    period: dbSite.era || '', // fallback
    lat: dbSite.coordinates ? dbSite.coordinates.lat : 0,
    lon: dbSite.coordinates ? dbSite.coordinates.lng : 0,
    satisfactionRating: dbSite.satisfactionRating || 4.7, // fallback
    description: dbSite.fullDescription || dbSite.shortDescription || '',
    shortDescription: dbSite.shortDescription || '',
    fullDescription: dbSite.fullDescription || '',
    visitingHours: dbSite.visitingHours || '09:00 AM - 05:00 PM',
    highlights: dbSite.highlights && dbSite.highlights.length > 0
      ? dbSite.highlights 
      : [dbSite.shortDescription || 'A site of profound historical archaeological significance.'],
    visitorTips: dbSite.visitorTips || `Visiting Hours: ${dbSite.visitingHours || '09:00 AM - 05:00 PM'}. Entry Fee: ${dbSite.entryFee || 'Free'}.`,
    images: dbSite.images && dbSite.images.length > 0
      ? dbSite.images
      : ['https://images.unsplash.com/photo-1596367401555-31e37f1f7bfb?auto=format&fit=crop&w=800&q=80'], // fallback image
    tags: dbSite.tags || [],
    recommendationReason: dbSite.recommendationReason || '', // For Claude recommendations reasoning
    isHidden: dbSite.isHidden || false
  };
};

// API Services Exporter
export const api = {
  // 1. Sites Services
  async fetchSites(filters = {}) {
    const response = await API.get('/sites', { params: filters });
    if (response.data && response.data.success) {
      return response.data.data.map(mapDbSiteToFrontend);
    }
    throw new Error(response.data?.message || 'Failed to fetch sites');
  },

  async fetchSiteById(idOrSlug) {
    const response = await API.get(`/sites/${idOrSlug}`);
    if (response.data && response.data.success) {
      return mapDbSiteToFrontend(response.data.data);
    }
    throw new Error(response.data?.message || 'Failed to fetch site details');
  },

  // 2. Auth Services
  async register(name, email, password, role = 'user') {
    const response = await API.post('/auth/register', { name, email, password, role });
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Registration failed');
  },

  async login(email, password) {
    const response = await API.post('/auth/login', { email, password });
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Login failed');
  },

  async getMe() {
    const response = await API.get('/auth/me');
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to fetch user profile');
  },

  // 3. Booking Services
  async createBooking(siteId, date, numberOfPeople, phone, contactEmail, contactName) {
    const response = await API.post('/bookings', { siteId, date, numberOfPeople, phone, contactEmail, contactName });
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to create booking');
  },

  async fetchMyBookings() {
    const response = await API.get('/bookings/me');
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to fetch bookings list');
  },

  async cancelBooking(bookingId) {
    const response = await API.patch(`/bookings/${bookingId}/cancel`);
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to cancel booking');
  },

  // 4. AI Services
  async fetchRecommendations(interests, region, travelStyle) {
    const response = await API.post('/ai/recommend', { interests, region, travelStyle });
    if (response.data && response.data.success) {
      return response.data.data.map(mapDbSiteToFrontend);
    }
    throw new Error(response.data?.message || 'Failed to fetch recommendations');
  },

  async searchSites(query) {
    const response = await API.post('/ai/search', { query });
    if (response.data && response.data.success) {
      return response.data.data.map(mapDbSiteToFrontend);
    }
    throw new Error(response.data?.message || 'AI search failed');
  },

  async identifySite(base64Image) {
    const response = await API.post('/ai/identify', { image: base64Image });
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Image identification failed');
  },

  async getSiteInfo(siteName) {
    const response = await API.post('/ai/site-info', { siteName });
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to fetch site info');
  },

  // 5. Admin Services
  async fetchAdminStats() {
    const response = await API.get('/admin/stats');
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to fetch admin stats');
  },

  async fetchAdminUsers() {
    const response = await API.get('/admin/users');
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to fetch admin users list');
  },

  async updateBookingStatus(bookingId, status) {
    const response = await API.patch(`/admin/bookings/${bookingId}`, { status });
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to update booking status');
  },

  async fetchAdminSites() {
    const response = await API.get('/sites', { params: { includeHidden: 'true' } });
    if (response.data && response.data.success) {
      return response.data.data.map(mapDbSiteToFrontend);
    }
    throw new Error(response.data?.message || 'Failed to fetch admin sites list');
  },

  async createAdminSite(siteData) {
    const response = await API.post('/admin/sites', siteData);
    if (response.data && response.data.success) {
      return mapDbSiteToFrontend(response.data.data);
    }
    throw new Error(response.data?.message || 'Failed to create new site');
  },

  async updateAdminSite(id, siteData) {
    const response = await API.put(`/admin/sites/${id}`, siteData);
    if (response.data && response.data.success) {
      return mapDbSiteToFrontend(response.data.data);
    }
    throw new Error(response.data?.message || 'Failed to update site details');
  },

  async toggleAdminSiteVisibility(id) {
    const response = await API.patch(`/admin/sites/${id}/visibility`);
    if (response.data && response.data.success) {
      return mapDbSiteToFrontend(response.data.data);
    }
    throw new Error(response.data?.message || 'Failed to toggle site visibility');
  },

  async deleteAdminSite(id) {
    const response = await API.delete(`/admin/sites/${id}`);
    if (response.data && response.data.success) {
      return response.data;
    }
    throw new Error(response.data?.message || 'Failed to delete site');
  }
};

export default API;
