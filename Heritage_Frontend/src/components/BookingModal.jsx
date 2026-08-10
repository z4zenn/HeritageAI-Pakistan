import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API, { api } from '../services/api';
import { X, Calendar, Users, Wallet, CreditCard, Lock } from 'lucide-react';
import StripePayment from './StripePayment';

export default function BookingModal({ site, isOpen, onClose, initialDate, initialGuests }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Step state (1: Details, 2: Payment, 3: Confirmation)
  const [step, setStep] = useState(1);

  // Form states
  const [selectedDate, setSelectedDate] = useState('');
  const [guests, setGuests] = useState(1);
  
  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('jazzcash'); // 'jazzcash' or 'easypaisa'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // Stripe integration states
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [stripeTotal, setStripeTotal] = useState(0);
  
  // Submission states
  const [processing, setProcessing] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // Reset modal state on reopen or close
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedDate(initialDate || '');
      setGuests(initialGuests || 1);
      setPaymentMethod('jazzcash');
      setPhoneNumber('');
      setPhoneError('');
      setBookingResult(null);
      setSubmitError('');
      setClientSecret(null);
      setPaymentLoading(false);
      setStripeTotal(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialDate, initialGuests]);

  if (!isOpen || !site) return null;

  // Cost calculations
  const feeNum = parseInt(site.entryFee?.replace(/[^0-9]/g, '') || '0', 10);
  const total = feeNum * guests;

  const handleStep1Continue = async () => {
    if (!selectedDate) return;
    if (guests < 1) return;
    
    setStep(2);
    setPaymentLoading(true);
    setSubmitError('');
    try {
      const res = await API.post('/bookings/create-payment-intent', { 
        siteId: site._id, 
        numberOfPeople: guests 
      });
      if (res.data && res.data.success) {
        setClientSecret(res.data.data.clientSecret);
        setStripeTotal(res.data.data.totalAmount);
      } else {
        throw new Error(res.data?.message || 'Failed to initialize payment');
      }
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || err.message || 'Failed to initialize payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setSubmitError('');

    // Validation: starts with 03, 11 digits total
    const phoneRegex = /^03\d{9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[- ]/g, ''))) {
      setPhoneError('Please enter a valid Pakistani mobile number (e.g., 03XXXXXXXXX).');
      return;
    }

    setProcessing(true);
    try {
      // 1. Wait for 2.5 seconds to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // 2. Call API
      const bookingData = await api.createBooking(site._id, selectedDate, guests);
      
      // 3. Save booking result and advance
      setBookingResult(bookingData);
      setStep(3);
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Payment or booking validation failed. Please try again.');
      setProcessing(false);
    }
  };

  const formattedConfirmDate = bookingResult?.date
    ? new Date(bookingResult.date).toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  // Modal Portal Element
  return ReactDOM.createPortal(
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      {/* Styles Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scale-in {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes draw-check {
          to { stroke-dashoffset: 0; }
        }
        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-draw-check {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: draw-check 0.5s cubic-bezier(0.65, 0, 0.45, 1) 0.4s forwards;
        }
        .custom-date-picker::-webkit-calendar-picker-indicator {
          filter: invert(0.8);
          cursor: pointer;
        }
        .booking-modal-card {
          scrollbar-width: thin;
          scrollbar-color: #3D494F #23282D;
        }
      ` }} />

      {/* Modal Card */}
      <div
        className="booking-modal-card"
        style={{
          backgroundColor: '#23282D',
          border: '1px solid #3D494F',
          borderRadius: '20px',
          width: '520px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            color: '#C8B89A',
            fontSize: '24px',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            outline: 'none',
            lineHeight: 1,
          }}
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* --- PROGRESS BAR --- */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
          {/* Connecting Line background */}
          <div style={{ position: 'absolute', top: '16px', left: '20px', right: '20px', height: '2px', backgroundColor: '#3D494F', zIndex: 1 }} />
          {/* Active Connecting Line details to payment */}
          <div 
            style={{ 
              position: 'absolute', 
              top: '16px', 
              left: '20px', 
              width: step === 2 ? '50%' : step === 3 ? '100%' : '0%', 
              height: '2px', 
              backgroundColor: '#1D9E75', 
              zIndex: 1,
              transition: 'width 0.4s ease'
            }} 
          />

          {/* Step 1 Circle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: step >= 1 ? '#1D9E75' : '#3D494F',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 'bold',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {step > 1 ? '✓' : '1'}
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'Outfit, sans-serif', color: step >= 1 ? '#EDE9DF' : '#C8B89A', marginTop: '6px', fontWeight: step === 1 ? '600' : '400' }}>Details</span>
          </div>

          {/* Step 2 Circle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: step >= 2 ? '#1D9E75' : '#3D494F',
                color: step >= 2 ? '#ffffff' : '#C8B89A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 'bold',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {step > 2 ? '✓' : '2'}
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'Outfit, sans-serif', color: step >= 2 ? '#EDE9DF' : '#C8B89A', marginTop: '6px', fontWeight: step === 2 ? '600' : '400' }}>Payment</span>
          </div>

          {/* Step 3 Circle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: step === 3 ? '#1D9E75' : '#3D494F',
                color: step === 3 ? '#ffffff' : '#C8B89A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 'bold',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              3
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'Outfit, sans-serif', color: step === 3 ? '#EDE9DF' : '#C8B89A', marginTop: '6px', fontWeight: step === 3 ? '600' : '400' }}>Confirmed</span>
          </div>
        </div>

        {/* --- STEP 1: BOOKING DETAILS --- */}
        {step === 1 && (
          <div>
            {/* Site Info Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #3D494F', paddingBottom: '20px' }}>
              {site.images?.[0] ? (
                <img
                  src={site.images[0]}
                  alt={site.name}
                  style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    backgroundColor: '#1D9E75',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  🏛️
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '18px', color: '#EDE9DF', margin: 0, fontWeight: 'bold' }}>{site.name}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#C8B89A' }}>
                    {site.region} · {site.type}
                  </span>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#3D494F' }} />
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#1D9E75', fontWeight: '500' }}>
                    Entry: {site.entryFee}
                  </span>
                </div>
              </div>
            </div>

            {/* If user is not logged in, render the login CTA */}
            {!user ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', marginTop: '24px', backgroundColor: '#141618', borderRadius: '12px', border: '1px solid #3D494F' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔒</div>
                <h4 style={{ fontFamily: 'Libre Baskerville, serif', color: '#EDE9DF', fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                  Sign in to book this tour
                </h4>
                <p style={{ fontFamily: 'Outfit, sans-serif', color: '#C8B89A', fontSize: '13px', margin: '0 0 24px 0', lineHeight: '1.5' }}>
                  Create a free account to start booking heritage tours across Pakistan.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/login');
                  }}
                  style={{
                    backgroundColor: '#1D9E75',
                    color: '#ffffff',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: '600',
                    fontSize: '15px',
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
                  onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
                >
                  Sign In
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '24px' }}>
                {/* Date Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    htmlFor="booking-date-picker"
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '11px',
                      color: '#C8B89A',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontWeight: '600',
                    }}
                  >
                    Select Date
                  </label>
                  <input
                    type="date"
                    id="booking-date-picker"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="custom-date-picker"
                    style={{
                      backgroundColor: '#141618',
                      border: '1px solid #3D494F',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      color: '#EDE9DF',
                      width: '100%',
                      boxSizing: 'border-box',
                      fontFamily: 'Outfit, sans-serif',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1D9E75';
                      e.target.style.boxShadow = '0 0 0 3px rgba(29, 158, 117, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#3D494F';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Guests Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                  <label
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '11px',
                      color: '#C8B89A',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontWeight: '600',
                    }}
                  >
                    Number of Guests
                  </label>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                      type="button"
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#141618',
                        border: '1px solid #3D494F',
                        color: '#EDE9DF',
                        fontSize: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none',
                        transition: 'border 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = '#1D9E75'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = '#3D494F'}
                    >
                      &minus;
                    </button>
                    
                    <span
                      style={{
                        width: '60px',
                        textAlign: 'center',
                        fontFamily: 'Libre Baskerville, serif',
                        fontSize: '20px',
                        color: '#EDE9DF',
                        display: 'inline-block',
                      }}
                    >
                      {guests}
                    </span>

                    <button
                      type="button"
                      onClick={() => setGuests(Math.min(20, guests + 1))}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#141618',
                        border: '1px solid #3D494F',
                        color: '#EDE9DF',
                        fontSize: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none',
                        transition: 'border 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = '#1D9E75'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = '#3D494F'}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price Summary Box */}
                {selectedDate && guests > 0 && (
                  <div style={{ backgroundColor: '#141618', border: '1px solid #3D494F', borderRadius: '12px', padding: '16px', marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#C8B89A', marginBottom: '8px' }}>
                      <span>Entry Fee per person</span>
                      <span>{feeNum.toLocaleString()} PKR</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#C8B89A', marginBottom: '12px' }}>
                      <span>Number of guests</span>
                      <span>{guests}</span>
                    </div>
                    <div style={{ height: '1px', backgroundColor: '#3D494F', marginBottom: '12px' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 'bold', color: '#EDE9DF' }}>Total Amount</span>
                      <span style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '18px', fontWeight: 'bold', color: '#1D9E75' }}>
                        {total.toLocaleString()} PKR
                      </span>
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                <button
                  type="button"
                  onClick={handleStep1Continue}
                  disabled={!selectedDate || guests < 1}
                  style={{
                    backgroundColor: (!selectedDate || guests < 1) ? '#3D494F' : '#1D9E75',
                    color: '#ffffff',
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '15px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: (!selectedDate || guests < 1) ? 'not-allowed' : 'pointer',
                    marginTop: '24px',
                    opacity: (!selectedDate || guests < 1) ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    if (selectedDate && guests >= 1) {
                      e.currentTarget.style.filter = 'brightness(0.9)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.filter = 'none';
                  }}
                >
                  Continue to Payment &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- STEP 2: STRIPE PAYMENT --- */}
        {step === 2 && (
          <div>
            {/* Booking Summary Box */}
            <div style={{ backgroundColor: '#141618', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <h4 style={{ fontFamily: 'Libre Baskerville, serif', color: '#EDE9DF', fontSize: '14px', margin: '0 0 8px 0', fontWeight: 'bold' }}>{site.name}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#C8B89A' }}>
                <span>{new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>{guests} guest(s)</span>
                <span style={{ color: '#1D9E75', fontWeight: 'bold' }}>{(stripeTotal || total).toLocaleString()} PKR</span>
              </div>
            </div>

            {paymentLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '16px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    border: '3px solid #1D9E75',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: '#C8B89A' }}>
                  Setting up payment...
                </span>
              </div>
            ) : submitError && !clientSecret ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(224, 82, 82, 0.1)',
                    border: '1px solid rgba(224, 82, 82, 0.3)',
                    borderRadius: '8px',
                    padding: '16px',
                    color: '#E05252',
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '14px',
                    marginBottom: '24px'
                  }}
                >
                  {submitError}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#C8B89A',
                    border: 'none',
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  &larr; Go Back to Details
                </button>
              </div>
            ) : (
              <>
                {clientSecret && (
                  <StripePayment
                    clientSecret={clientSecret}
                    totalAmount={stripeTotal || total}
                    site={site}
                    date={selectedDate}
                    numberOfPeople={guests}
                    setProcessing={setProcessing}
                    onSuccess={(booking) => {
                      setBookingResult(booking);
                      setStep(3);
                    }}
                    onError={(msg) => setSubmitError(msg)}
                  />
                )}

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={processing}
                  style={{
                    backgroundColor: 'transparent',
                    color: processing ? '#3D494F' : '#C8B89A',
                    border: 'none',
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '14px',
                    cursor: processing ? 'not-allowed' : 'pointer',
                    marginTop: '16px',
                    display: 'block',
                    marginRight: 'auto',
                    marginLeft: 'auto',
                  }}
                >
                  &larr; Back
                </button>
              </>
            )}
          </div>
        )}

        {/* --- STEP 3: BOOKING CONFIRMED --- */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            {/* Animated Checkmark Circle */}
            <div
              className="animate-scale-in"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '3px solid #1D9E75',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style={{ width: '44px', height: '44px' }}>
                <path
                  className="animate-draw-check"
                  fill="none"
                  stroke="#1D9E75"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeMiterlimit="10"
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
            </div>

            {/* Heading */}
            <h3 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '24px', color: '#EDE9DF', marginTop: '20px', fontWeight: 'bold' }}>
              Booking Confirmed!
            </h3>

            {/* Subtext */}
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#C8B89A', marginTop: '8px', lineHeight: '1.5' }}>
              A confirmation email has been sent to <br />
              <strong style={{ color: '#EDE9DF' }}>{user?.email}</strong>
            </p>

            {/* Details Card */}
            <div
              style={{
                backgroundColor: '#141618',
                border: '1px solid #3D494F',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '24px',
                textAlign: 'left',
              }}
            >
              {[
                { label: 'Booking ID', value: `#${bookingResult?._id?.toString().substring(0, 8).toUpperCase() || ''}` },
                { label: 'Site', value: site.name },
                { label: 'Date', value: formattedConfirmDate },
                { label: 'Guests', value: `${bookingResult?.numberOfPeople || guests} people` },
                { label: 'Payment', value: bookingResult?.paymentMethod === 'stripe' ? 'Stripe Credit Card' : paymentMethod === 'jazzcash' ? 'JazzCash' : 'Easypaisa' },
                { label: 'Status', value: 'Confirmed ✓', isStatus: true },
                { label: 'Total Paid', value: `PKR ${(bookingResult?.totalPrice || total).toLocaleString()}`, isTotal: true },
              ].map((row, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: index === 6 ? '0' : '12px',
                    borderTop: index === 6 ? '1px solid #3D494F' : 'none',
                    paddingTop: index === 6 ? '12px' : '0',
                  }}
                >
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#C8B89A' }}>
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontFamily: row.isTotal ? 'Libre Baskerville, serif' : 'Outfit, sans-serif',
                      fontSize: row.isTotal ? '16px' : '13px',
                      fontWeight: (row.isTotal || row.isStatus) ? 'bold' : 'normal',
                      color: row.isStatus ? '#1D9E75' : row.isTotal ? '#1D9E75' : '#EDE9DF',
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/my-bookings');
                }}
                style={{
                  backgroundColor: '#1D9E75',
                  color: '#ffffff',
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '15px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
                onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
              >
                View My Bookings
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: 'transparent',
                  color: '#C8B89A',
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '15px',
                  fontWeight: '600',
                  border: '1px solid #3D494F',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(61, 73, 79, 0.2)';
                  e.currentTarget.style.color = '#EDE9DF';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#C8B89A';
                }}
              >
                Explore More Sites
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
