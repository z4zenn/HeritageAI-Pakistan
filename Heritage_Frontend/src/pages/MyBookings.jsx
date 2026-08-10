import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Calendar, Users, CreditCard, ChevronRight, Landmark } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function MyBookings() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const colors = {
    bg: isDark ? '#141618' : '#FAF9F6',
    cardBg: isDark ? '#23282D' : '#FFFFFF',
    text: isDark ? '#EDE9DF' : '#141618',
    subtext: isDark ? '#C8B89A' : '#4B5563',
    border: isDark ? '#3D494F' : '#E5E7EB',
  };

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const data = await api.fetchMyBookings();
        setBookings(data);
      } catch (err) {
        console.error('Failed to load bookings:', err);
        setError('Failed to load your booking history. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const initiateCancelBooking = (bookingId, siteName, dateStr) => {
    setBookingToCancel({ id: bookingId, siteName, date: dateStr });
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    const { id, siteName, date } = bookingToCancel;
    setShowCancelModal(false);

    try {
      setError('');
      setSuccessMsg('');
      await api.cancelBooking(id);
      
      // Update state list
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
      setSuccessMsg(`Your booking to ${siteName} on ${formatDate(date)} has been cancelled successfully.`);
      
      setTimeout(() => {
        setSuccessMsg('');
      }, 5000);
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      setError(err.message || 'Failed to cancel the booking. Please try again.');
    } finally {
      setBookingToCancel(null);
    }
  };

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        minHeight: '100vh',
        color: colors.text,
        padding: '80px 24px 48px 24px',
        fontFamily: 'Outfit, sans-serif',
        transition: 'background-color 0.3s, color 0.3s',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: '24px', marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: 'Libre Baskerville, serif',
              fontSize: '32px',
              color: colors.text,
              margin: 0,
              fontWeight: 'bold',
            }}
          >
            My Bookings
          </h1>
          <p style={{ fontSize: '14px', color: colors.subtext, margin: '8px 0 0 0', fontWeight: '300' }}>
            Your heritage journey history
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              backgroundColor: 'rgba(29, 158, 117, 0.15)',
              border: '1px solid #1D9E75',
              color: '#1D9E75',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '14px',
            }}
          >
            {successMsg}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(224, 82, 82, 0.15)',
              border: '1px solid #E05252',
              color: '#E05252',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* Loading state: 3 skeleton cards pulsing */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '16px',
                  padding: '24px',
                  height: '128px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              >
                <div style={{ display: 'flex', gap: '20px', width: '70%' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '12px', backgroundColor: colors.border, opacity: 0.3 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, paddingTop: '4px' }}>
                    <div style={{ height: '18px', backgroundColor: colors.border, borderRadius: '4px', width: '60%', opacity: 0.3 }} />
                    <div style={{ height: '14px', backgroundColor: colors.border, borderRadius: '4px', width: '40%', opacity: 0.3 }} />
                    <div style={{ height: '14px', backgroundColor: colors.border, borderRadius: '4px', width: '80%', opacity: 0.3 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifycontent: 'space-between', width: '25%' }}>
                  <div style={{ width: '80px', height: '24px', borderRadius: '12px', backgroundColor: colors.border, opacity: 0.3 }} />
                  <div style={{ width: '100px', height: '20px', borderRadius: '4px', backgroundColor: colors.border, opacity: 0.3 }} />
                </div>
              </div>
            ))}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes pulse {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
              }
            ` }} />
          </div>
        ) : bookings.length === 0 ? (
          /* Empty state */
          <div
            style={{
              textAlign: 'center',
              padding: '64px 32px',
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '20px',
            }}
          >
            <Calendar className="w-12 h-12 text-[#1D9E75] mx-auto mb-4" />
            <h3
              style={{
                fontFamily: 'Libre Baskerville, serif',
                color: colors.text,
                fontSize: '20px',
                fontWeight: 'bold',
                margin: '0 0 8px 0',
              }}
            >
              No bookings yet
            </h3>
            <p style={{ color: colors.subtext, fontSize: '14px', margin: '0 0 24px 0', fontWeight: '300' }}>
              Start exploring Pakistan's heritage sites and plan your next tour.
            </p>
            <button
              onClick={() => navigate('/explore')}
              style={{
                backgroundColor: '#1D9E75',
                color: '#ffffff',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: '600',
                fontSize: '14px',
                padding: '12px 32px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
              onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
            >
              Explore Sites
            </button>
          </div>
        ) : (
          /* Bookings List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {bookings.map((booking) => {
              const site = booking.siteId || {};
              const firstImage = site.images?.[0];
              const shortId = booking._id?.toString().substring(0, 8).toUpperCase() || '';
              const isUpcoming = new Date(booking.date) > new Date();
              const canCancel = isUpcoming && booking.status !== 'cancelled';
              
              // Status Styling details
              let statusBg = 'rgba(255, 193, 7, 0.15)';
              let statusColor = '#FFC107';
              let statusBorder = '1px solid #FFC107';
              
              if (booking.status === 'confirmed') {
                statusBg = 'rgba(29, 158, 117, 0.15)';
                statusColor = '#1D9E75';
                statusBorder = '1px solid #1D9E75';
              } else if (booking.status === 'cancelled') {
                statusBg = 'rgba(224, 82, 82, 0.15)';
                statusColor = '#E05252';
                statusBorder = '1px solid #E05252';
              }

              return (
                <div
                  key={booking._id}
                  style={{
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.3s, border-color 0.3s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = isDark ? '0 8px 20px rgba(0,0,0,0.3)' : '0 8px 20px rgba(0,0,0,0.08)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Left Side */}
                  <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={site.name || 'Site Image'}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '12px',
                          objectFit: 'cover',
                          border: `1px solid ${colors.border}`,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '12px',
                          backgroundColor: '#1D9E75',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        <Landmark className="w-8 h-8 text-[#EDE9DF]" />
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h3
                        style={{
                          fontFamily: 'Libre Baskerville, serif',
                          fontSize: '18px',
                          color: colors.text,
                          margin: 0,
                          fontWeight: 'bold',
                        }}
                      >
                        {site.name || 'Unknown Archaeological Site'}
                      </h3>
                      <p style={{ fontSize: '13px', color: colors.subtext, margin: '4px 0 0 0', fontWeight: '300' }}>
                        {site.region || 'Pakistan'} · {site.type || 'Heritage Site'}
                      </p>
                      
                      {/* Booking Metadata Row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '12px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: colors.subtext }}>
                          <Calendar className="w-4 h-4 text-[#1D9E75]" />
                          <span>{formatDate(booking.date)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: colors.subtext }}>
                          <Users className="w-4 h-4 text-[#1D9E75]" />
                          <span>{booking.numberOfPeople || 1} Guests</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: colors.subtext }}>
                          <CreditCard className="w-4 h-4 text-[#1D9E75]" />
                          <span>{booking.paymentMethod || 'Paid'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', marginLeft: '16px' }}>
                    {/* Status Badge */}
                    <span
                      style={{
                        backgroundColor: statusBg,
                        color: statusColor,
                        border: statusBorder,
                        borderRadius: '20px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif',
                        textTransform: 'capitalize',
                      }}
                    >
                      {booking.status || 'Pending'}
                    </span>
                    
                    {/* ID Subtext */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '12px', color: isDark ? '#3D494F' : '#9CA3AF', fontFamily: 'Outfit, sans-serif', fontWeight: '500' }}>
                        #{shortId}
                      </span>
                      
                      {/* Total cost */}
                      {booking.totalPrice && (
                        <span
                          style={{
                            fontFamily: 'Libre Baskerville, serif',
                            fontSize: '16px',
                            color: colors.text,
                            marginTop: '8px',
                            fontWeight: 'bold',
                          }}
                        >
                          PKR {booking.totalPrice.toLocaleString()}
                        </span>
                      )}

                      {/* Cancel Button */}
                      {canCancel && (
                        <button
                          onClick={() => initiateCancelBooking(booking._id, site.name || 'Site', booking.date)}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#E05252',
                            border: '1px solid #E05252',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            fontFamily: 'Outfit, sans-serif',
                            marginTop: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(224, 82, 82, 0.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Modal for Booking Cancellation */}
      {showCancelModal && bookingToCancel && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
              color: colors.text,
              fontFamily: 'Outfit, sans-serif',
              animation: 'scaleIn 0.2s ease-out',
            }}
          >
            {/* Header */}
            <h3
              style={{
                fontFamily: 'Libre Baskerville, serif',
                fontSize: '22px',
                fontWeight: 'bold',
                margin: '0 0 16px 0',
                color: colors.text,
              }}
            >
              Cancel Tour Reservation
            </h3>
            
            {/* Body */}
            <p
              style={{
                fontSize: '15px',
                lineHeight: '1.6',
                color: colors.subtext,
                margin: '0 0 24px 0',
                fontWeight: '300',
              }}
            >
              Are you sure you want to cancel your upcoming tour to{' '}
              <strong style={{ fontWeight: '600', color: colors.text }}>
                {bookingToCancel.siteName}
              </strong>{' '}
              on{' '}
              <strong style={{ fontWeight: '600', color: colors.text }}>
                {formatDate(bookingToCancel.date)}
              </strong>
              ? This action cannot be undone.
            </p>
            
            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setBookingToCancel(null);
                }}
                style={{
                  backgroundColor: 'transparent',
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                No, Keep Booking
              </button>
              
              <button
                onClick={handleConfirmCancel}
                style={{
                  backgroundColor: '#E05252',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.filter = 'brightness(0.9)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.filter = 'none';
                }}
              >
                Yes, Cancel Booking
              </button>
            </div>
          </div>
          
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          ` }} />
        </div>
      )}
    </div>
  );
}
