import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API, { api } from '../services/api';
import { siteData } from '../data/siteData';
import { ArrowLeft, Calendar, Users, Wallet, CreditCard, Lock, ShieldCheck, Mail, Phone, User } from 'lucide-react';
import StripePayment from '../components/StripePayment';

export default function Checkout() {
  const { siteSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme } = useTheme();

  // Retrieve initial states from navigation state
  const initialDate = location.state?.date || '';
  const initialGuests = location.state?.guests || 1;

  // Site fetch states
  const [site, setSite] = useState(null);
  const [siteLoading, setSiteLoading] = useState(true);

  // Step state (1: Details, 2: Payment, 3: Confirmation)
  const [step, setStep] = useState(1);

  // Step 1 Form states
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [guests, setGuests] = useState(initialGuests);
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState('');

  // Step 2 Payment states
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'jazzcash', 'easypaisa'
  const [walletPhone, setWalletPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // Stripe integration states
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [stripeTotal, setStripeTotal] = useState(0);
  
  // Submission states
  const [processing, setProcessing] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // Load site on mount
  useEffect(() => {
    const loadSite = async () => {
      try {
        setSiteLoading(true);
        const data = await api.fetchSiteById(siteSlug);
        setSite(data);
      } catch (err) {
        console.error("Failed to fetch site details for checkout:", err);
        // Fallback to local siteData matching slug or _id
        const fallback = siteData.find(s => s.id === siteSlug) || siteData[0];
        // Ensure format is mapped for frontend
        setSite({
          _id: fallback._id || fallback.id,
          id: fallback.id,
          name: fallback.name,
          images: fallback.images || [],
          entryFee: fallback.entryFee || '500 PKR',
          region: fallback.province || fallback.region,
          type: fallback.siteType || fallback.type
        });
      } finally {
        setSiteLoading(false);
      }
    };
    loadSite();
  }, [siteSlug]);

  // Set local state once user profile is loaded
  useEffect(() => {
    if (user) {
      if (!contactName) setContactName(user.name || '');
      if (!contactEmail) setContactEmail(user.email || '');
      if (!contactPhone && user.phone) setContactPhone(user.phone || '');
    }
  }, [user]);

  if (siteLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#F5F2ED] dark:bg-[#141618] text-[#1A1E21] dark:text-[#EDE9DF] transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
          <p className="font-sans text-xs font-light text-[#6B6560] dark:text-[#C8B89A] tracking-wider uppercase">Loading Checkout Engine...</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#F5F2ED] dark:bg-[#141618] text-[#1A1E21] dark:text-[#EDE9DF] transition-colors duration-300">
        <div className="text-center">
          <p className="text-lg text-[#E05252]">Site not found</p>
          <Link to="/explore" className="text-[#1D9E75] hover:underline mt-4 inline-block">&larr; Back to Explore</Link>
        </div>
      </div>
    );
  }

  // Cost calculations
  const feeNum = parseInt(site.entryFee?.replace(/[^0-9]/g, '') || '500', 10);
  const ticketCost = feeNum * guests;
  const serviceFee = 150; // flat service/convenience fee
  const total = ticketCost + serviceFee;

  const handleStep1Continue = async (e) => {
    e.preventDefault();
    if (!selectedDate) return;
    if (guests < 1) return;
    
    setStep(2);
    setPaymentLoading(true);
    setSubmitError('');
    try {
      const res = await API.post('/bookings/create-payment-intent', { 
        siteId: site._id || site.id, 
        numberOfPeople: guests 
      });
      if (res.data && res.data.success) {
        setClientSecret(res.data.data.clientSecret);
        setStripeTotal(res.data.data.totalAmount + serviceFee); // include service fee if stripe supports it or adjust
      } else {
        throw new Error(res.data?.message || 'Failed to initialize payment');
      }
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || err.message || 'Failed to initialize Stripe payment. Falling back to manual payments.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleMobileWalletSubmit = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setSubmitError('');

    // Validation: starts with 03, 11 digits total
    const phoneRegex = /^03\d{9}$/;
    if (!phoneRegex.test(walletPhone.replace(/[- ]/g, ''))) {
      setPhoneError('Please enter a valid Pakistani mobile number (e.g., 03XXXXXXXXX).');
      return;
    }

    setProcessing(true);
    try {
      // 1. Wait for 2.5 seconds to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // 2. Call API to create a booking (simulated non-card path)
      const bookingData = await api.createBooking(
        site._id || site.id,
        selectedDate,
        guests,
        contactPhone,
        contactEmail,
        contactName
      );
      
      // 3. Save booking result and advance
      setBookingResult(bookingData);
      setStep(3);
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Mobile Wallet booking validation failed. Please try again.');
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

  return (
    <div className="checkout-body flex-1 w-full bg-[#F5F2ED] dark:bg-[#141618] text-[#1A1E21] dark:text-[#EDE9DF] min-h-screen pb-16 transition-colors duration-300">
      
      {/* Dynamic Font Styling Injections for Checkout Route */}
      <style dangerouslySetInnerHTML={{ __html: `
        .font-syncopate {
          font-family: 'Syncopate', sans-serif !important;
          letter-spacing: 0.08em;
        }
        .checkout-body, .checkout-body input, .checkout-body button, .checkout-body select, .checkout-body span {
          font-family: 'Crimson Pro', serif !important;
          font-size: 17px;
        }
        .checkout-body label {
          font-family: 'Syncopate', sans-serif !important;
          font-size: 11px;
          letter-spacing: 0.08em;
          font-weight: 700;
          color: ${theme === 'dark' ? '#C8B89A' : '#6B6560'};
        }
        .custom-date-picker::-webkit-calendar-picker-indicator {
          filter: ${theme === 'dark' ? 'invert(0.8)' : 'invert(0.2)'};
          cursor: pointer;
        }
      ` }} />

      {/* --- STICKY TOP PROGRESS BAR --- */}
      <div className="sticky top-0 z-40 w-full bg-[#EDEAE4]/95 dark:bg-[#23282D]/95 border-b border-[#D5CFC6] dark:border-[#3D494F] py-4 backdrop-blur-md shadow-lg transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          {/* Back button */}
          <Link 
            to={`/site/${site.id || site._id}`}
            className="flex items-center gap-2 text-[#6B6560] dark:text-[#C8B89A] hover:text-[#1A1E21] dark:hover:text-[#EDE9DF] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-syncopate text-xs uppercase font-bold">Back to Site</span>
          </Link>

          {/* Progress Indicator */}
          <div className="flex items-center gap-8 md:gap-12 relative">
            
            {/* Connecting lines */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#D5CFC6] dark:bg-[#3D494F]" />
            <div 
              className="absolute top-4 left-4 h-0.5 bg-[#1D9E75] transition-all duration-355" 
              style={{ width: step === 2 ? '50%' : step === 3 ? '100%' : '0%' }}
            />

            {/* Step 1 */}
            <div className="flex flex-col items-center z-10 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 1 ? 'bg-[#1D9E75] text-[#ffffff]' : 'bg-[#D5CFC6] dark:bg-[#3D494F] text-[#6B6560] dark:text-[#C8B89A]'}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className="font-syncopate text-[9px] uppercase mt-1 font-bold text-[#1A1E21] dark:text-[#EDE9DF]">Details</span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center z-10 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 2 ? 'bg-[#1D9E75] text-[#ffffff]' : 'bg-[#D5CFC6] dark:bg-[#3D494F] text-[#6B6560] dark:text-[#C8B89A]'}`}>
                {step > 2 ? '✓' : '2'}
              </div>
              <span className="font-syncopate text-[9px] uppercase mt-1 font-bold text-[#1A1E21] dark:text-[#EDE9DF]">Payment</span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center z-10 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === 3 ? 'bg-[#1D9E75] text-[#ffffff]' : 'bg-[#D5CFC6] dark:bg-[#3D494F] text-[#6B6560] dark:text-[#C8B89A]'}`}>
                3
              </div>
              <span className="font-syncopate text-[9px] uppercase mt-1 font-bold text-[#1A1E21] dark:text-[#EDE9DF]">Confirmed</span>
            </div>

          </div>
        </div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="max-w-7xl mx-auto px-6 mt-10">
        
        {/* Responsive Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- LEFT COLUMN: MAIN FORM AREA (60% width) --- */}
          <div className="lg:col-span-7 space-y-6">
            
            {step === 1 && (
              <form onSubmit={handleStep1Continue} className="bg-[#EDEAE4] dark:bg-[#23282D] border border-[#D5CFC6] dark:border-[#3D494F] rounded-2xl p-6 md:p-8 space-y-6 transition-colors duration-300">
                <h2 className="font-syncopate text-lg text-[#1A1E21] dark:text-[#EDE9DF] border-b border-[#D5CFC6] dark:border-[#3D494F] pb-4">
                  1. Tour Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Date Picker */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="checkout-date-picker">Travel Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        id="checkout-date-picker"
                        required
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="custom-date-picker w-full bg-[#F5F2ED] dark:bg-[#141618] border border-[#D5CFC6] dark:border-[#3D494F] focus:border-[#1D9E75] rounded-xl px-4 py-3 text-[#1A1E21] dark:text-[#EDE9DF] outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Guests Stepper */}
                  <div className="flex flex-col gap-2">
                    <label>Number of Guests</label>
                    <div className="flex items-center gap-4 bg-[#F5F2ED] dark:bg-[#141618] border border-[#D5CFC6] dark:border-[#3D494F] rounded-xl px-4 py-2 justify-between">
                      <button
                        type="button"
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        className="w-8 h-8 rounded-full border border-[#D5CFC6] dark:border-[#3D494F] hover:border-[#1D9E75] flex items-center justify-center text-lg text-[#1A1E21] dark:text-[#EDE9DF] transition-colors bg-transparent cursor-pointer"
                      >
                        &minus;
                      </button>
                      <span className="font-serif text-xl text-[#1A1E21] dark:text-[#EDE9DF]">{guests}</span>
                      <button
                        type="button"
                        onClick={() => setGuests(Math.min(20, guests + 1))}
                        className="w-8 h-8 rounded-full border border-[#D5CFC6] dark:border-[#3D494F] hover:border-[#1D9E75] flex items-center justify-center text-lg text-[#1A1E21] dark:text-[#EDE9DF] transition-colors bg-transparent cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                </div>

                <div className="border-t border-[#D5CFC6] dark:border-[#3D494F] pt-6 space-y-4">
                  <h3 className="font-syncopate text-xs text-[#6B6560] dark:text-[#C8B89A] uppercase tracking-wider font-bold">
                    2. Contact Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Name input */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="contact-name">Full Name</label>
                      <div className="relative flex items-center">
                        <User className="absolute left-4 w-4 h-4 text-[#6B6560]/50 dark:text-[#3D494F]" />
                        <input
                          type="text"
                          id="contact-name"
                          required
                          placeholder="Your Name"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full bg-[#F5F2ED] dark:bg-[#141618] border border-[#D5CFC6] dark:border-[#3D494F] focus:border-[#1D9E75] rounded-xl pl-12 pr-4 py-3 text-[#1A1E21] dark:text-[#EDE9DF] outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Email input */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="contact-email">Email Address</label>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-4 w-4 h-4 text-[#6B6560]/50 dark:text-[#3D494F]" />
                        <input
                          type="email"
                          id="contact-email"
                          required
                          placeholder="you@example.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full bg-[#F5F2ED] dark:bg-[#141618] border border-[#D5CFC6] dark:border-[#3D494F] focus:border-[#1D9E75] rounded-xl pl-12 pr-4 py-3 text-[#1A1E21] dark:text-[#EDE9DF] outline-none transition-all"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Phone input */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="contact-phone">Contact Phone Number</label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-4 w-4 h-4 text-[#6B6560]/50 dark:text-[#3D494F]" />
                      <input
                        type="tel"
                        id="contact-phone"
                        required
                        placeholder="e.g. +92 300 1234567"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full bg-[#F5F2ED] dark:bg-[#141618] border border-[#D5CFC6] dark:border-[#3D494F] focus:border-[#1D9E75] rounded-xl pl-12 pr-4 py-3 text-[#1A1E21] dark:text-[#EDE9DF] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Continue button */}
                <button
                  type="submit"
                  disabled={!selectedDate || guests < 1 || !contactName || !contactEmail || !contactPhone}
                  className="w-full py-4 rounded-xl bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-[#ffffff] font-syncopate text-xs uppercase font-bold shadow-lg transition-all active:scale-[0.98] disabled:bg-[#D5CFC6] dark:disabled:bg-[#3D494F] disabled:text-[#6B6560]/40 dark:disabled:text-[#C8B89A]/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Continue to Payment &rarr;
                </button>

              </form>
            )}

            {step === 2 && (
              <div className="bg-[#EDEAE4] dark:bg-[#23282D] border border-[#D5CFC6] dark:border-[#3D494F] rounded-2xl p-6 md:p-8 space-y-6 transition-colors duration-300">
                <h2 className="font-syncopate text-lg text-[#1A1E21] dark:text-[#EDE9DF] border-b border-[#D5CFC6] dark:border-[#3D494F] pb-4">
                  2. Select Payment Method
                </h2>

                {/* Payment method toggle buttons */}
                <div className="grid grid-cols-3 gap-4">
                  
                  {/* Card Payment Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('card');
                      setPhoneError('');
                    }}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer bg-transparent ${paymentMethod === 'card' ? 'border-[#1D9E75] text-[#1D9E75] bg-[#1D9E75]/5' : 'border-[#D5CFC6] dark:border-[#3D494F] text-[#6B6560] dark:text-[#C8B89A] hover:border-[#1D9E75]/60 hover:bg-[#EDEAE4]/80 dark:hover:bg-[#2a3035]'}`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="font-syncopate text-[10px] uppercase font-bold">Credit Card</span>
                  </button>

                  {/* JazzCash Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('jazzcash');
                      setPhoneError('');
                    }}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer bg-transparent ${paymentMethod === 'jazzcash' ? 'border-[#1D9E75] text-[#1D9E75] bg-[#1D9E75]/5' : 'border-[#D5CFC6] dark:border-[#3D494F] text-[#6B6560] dark:text-[#C8B89A] hover:border-[#1D9E75]/60 hover:bg-[#EDEAE4]/80 dark:hover:bg-[#2a3035]'}`}
                  >
                    <Wallet className="w-6 h-6" />
                    <span className="font-syncopate text-[10px] uppercase font-bold">JazzCash</span>
                  </button>

                  {/* EasyPaisa Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('easypaisa');
                      setPhoneError('');
                    }}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer bg-transparent ${paymentMethod === 'easypaisa' ? 'border-[#1D9E75] text-[#1D9E75] bg-[#1D9E75]/5' : 'border-[#D5CFC6] dark:border-[#3D494F] text-[#6B6560] dark:text-[#C8B89A] hover:border-[#1D9E75]/60 hover:bg-[#EDEAE4]/80 dark:hover:bg-[#2a3035]'}`}
                  >
                    <Wallet className="w-6 h-6" />
                    <span className="font-syncopate text-[10px] uppercase font-bold">EasyPaisa</span>
                  </button>

                </div>

                {/* Sub-Forms based on selection */}
                <div className="pt-4">
                  {paymentMethod === 'card' ? (
                    <div>
                      {paymentLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <div className="w-8 h-8 border-3 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
                          <span className="text-[#6B6560] dark:text-stone-400">Loading payment gateway...</span>
                        </div>
                      ) : submitError && !clientSecret ? (
                        <div className="text-center py-6">
                          <div className="bg-[#E05252]/10 border border-[#E05252]/30 rounded-xl p-4 text-[#E05252] text-sm mb-4">
                            {submitError}
                          </div>
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-[#6B6560] dark:text-[#C8B89A] hover:underline bg-transparent border-none cursor-pointer"
                          >
                            &larr; Return to Details
                          </button>
                        </div>
                      ) : (
                        clientSecret && (
                          <StripePayment
                            clientSecret={clientSecret}
                            totalAmount={stripeTotal || total}
                            site={site}
                            date={selectedDate}
                            numberOfPeople={guests}
                            contactName={contactName}
                            contactEmail={contactEmail}
                            contactPhone={contactPhone}
                            setProcessing={setProcessing}
                            onSuccess={(booking) => {
                              setBookingResult(booking);
                              setStep(3);
                            }}
                            onError={(msg) => setSubmitError(msg)}
                          />
                        )
                      )}
                    </div>
                  ) : (
                    /* JazzCash / EasyPaisa flow */
                    <form onSubmit={handleMobileWalletSubmit} className="space-y-6">
                      <div className="flex flex-col gap-2">
                        <label htmlFor="wallet-phone">Mobile Account Number</label>
                        <input
                          type="text"
                          id="wallet-phone"
                          required
                          placeholder="e.g. 03001234567"
                          value={walletPhone}
                          onChange={(e) => setWalletPhone(e.target.value)}
                          className="w-full bg-[#F5F2ED] dark:bg-[#141618] border border-[#D5CFC6] dark:border-[#3D494F] focus:border-[#1D9E75] rounded-xl px-4 py-3 text-[#1A1E21] dark:text-[#EDE9DF] outline-none transition-all"
                        />
                        <span className="text-[12px] text-[#6B6560]/75 dark:text-stone-500 font-sans mt-0.5">
                          Enter your 11-digit {paymentMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} account number. You will receive an MPIN popup request on your mobile phone to authorize the transaction.
                        </span>
                      </div>

                      {phoneError && (
                        <div className="bg-[#E05252]/10 border border-[#E05252]/30 rounded-xl p-3 text-[#E05252] text-sm">
                          {phoneError}
                        </div>
                      )}

                      {submitError && (
                        <div className="bg-[#E05252]/10 border border-[#E05252]/30 rounded-xl p-3 text-[#E05252] text-sm">
                          {submitError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={processing || !walletPhone}
                        className="w-full py-4 rounded-xl bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-[#ffffff] font-syncopate text-xs uppercase font-bold shadow-lg transition-all active:scale-[0.98] disabled:bg-[#D5CFC6] dark:disabled:bg-[#3D494F] disabled:text-[#6B6560]/40 dark:disabled:text-[#C8B89A]/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                      >
                        {processing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Confirming Transaction...</span>
                          </>
                        ) : (
                          <span>Pay PKR {total.toLocaleString()}</span>
                        )}
                      </button>

                    </form>
                  )}
                </div>

                {/* Back button */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={processing}
                  className="w-full text-center text-[#6B6560] dark:text-[#C8B89A] hover:underline bg-transparent border-none mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &larr; Back to Details
                </button>

              </div>
            )}

            {step === 3 && (
              <div className="bg-[#EDEAE4] dark:bg-[#23282D] border border-[#D5CFC6] dark:border-[#3D494F] rounded-2xl p-6 md:p-8 space-y-6 text-center transition-colors duration-300">
                
                {/* Animated checkmark */}
                <div className="w-16 h-16 rounded-full border-2 border-[#1D9E75] mx-auto flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" className="w-8 h-8">
                    <path
                      fill="none"
                      stroke="#1D9E75"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeMiterlimit="10"
                      d="M14.1 27.2l7.1 7.2 16.7-16.8"
                    />
                  </svg>
                </div>

                <h2 className="font-syncopate text-xl text-[#1A1E21] dark:text-[#EDE9DF] font-bold">
                  Booking Confirmed!
                </h2>

                <p className="text-[#6B6560] dark:text-stone-400 text-sm max-w-sm mx-auto leading-relaxed">
                  A receipt and entry ticket have been compiled and sent to your email address at <strong className="text-[#1A1E21] dark:text-[#EDE9DF]">{contactEmail}</strong>.
                </p>

                {/* Order confirmation summary */}
                <div className="bg-[#F5F2ED] dark:bg-[#141618] border border-[#D5CFC6] dark:border-[#3D494F] rounded-xl p-6 text-left space-y-3 max-w-md mx-auto">
                  <div className="flex justify-between text-xs text-[#6B6560] dark:text-[#C8B89A]">
                    <span>Booking Reference</span>
                    <span className="text-[#1A1E21] dark:text-[#EDE9DF] font-mono font-bold">#{bookingResult?._id?.toString().substring(0, 8).toUpperCase() || 'HB9F1A2'}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#6B6560] dark:text-[#C8B89A]">
                    <span>Monument Site</span>
                    <span className="text-[#1A1E21] dark:text-[#EDE9DF] font-bold">{site.name}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#6B6560] dark:text-[#C8B89A]">
                    <span>Travel Date</span>
                    <span className="text-[#1A1E21] dark:text-[#EDE9DF]">{formattedConfirmDate || new Date(selectedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#6B6560] dark:text-[#C8B89A]">
                    <span>Ticket Quantity</span>
                    <span className="text-[#1A1E21] dark:text-[#EDE9DF]">{bookingResult?.numberOfPeople || guests} guests</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#6B6560] dark:text-[#C8B89A]">
                    <span>Payment Channel</span>
                    <span className="text-[#1A1E21] dark:text-[#EDE9DF]">{bookingResult?.paymentMethod === 'stripe' ? 'Stripe (Credit Card)' : paymentMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#6B6560] dark:text-[#C8B89A] border-t border-[#D5CFC6] dark:border-[#3D494F] pt-3">
                    <span className="font-bold text-[#1A1E21] dark:text-[#EDE9DF]">Total Paid</span>
                    <span className="text-[#1D9E75] font-serif text-lg font-bold">PKR {(bookingResult?.totalPrice || total).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-3 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => navigate('/my-bookings')}
                    className="w-full py-3.5 rounded-xl bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-[#ffffff] font-syncopate text-xs uppercase font-bold cursor-pointer"
                  >
                    View My Bookings
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/explore')}
                    className="w-full py-3.5 rounded-xl bg-transparent border border-[#D5CFC6] dark:border-[#3D494F] hover:border-[#1D9E75] text-[#6B6560] dark:text-[#C8B89A] hover:text-[#1A1E21] dark:hover:text-[#EDE9DF] font-syncopate text-xs uppercase font-bold cursor-pointer"
                  >
                    Explore More Sites
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* --- RIGHT COLUMN: ORDER SUMMARY SIDEBAR (40% width, sticky) --- */}
          <div className="lg:col-span-5 lg:sticky lg:top-[100px] space-y-6">
            
            <div className="bg-[#EDEAE4] dark:bg-[#23282D] border border-[#D5CFC6] dark:border-[#3D494F] rounded-2xl p-6 space-y-6 transition-colors duration-300">
              
              <h3 className="font-syncopate text-sm text-[#1A1E21] dark:text-[#EDE9DF] uppercase tracking-wider font-bold border-b border-[#D5CFC6] dark:border-[#3D494F] pb-3">
                Order Summary
              </h3>

              {/* Site summary card */}
              <div className="flex gap-4 items-center">
                {site.images?.[0] ? (
                  <img
                    src={site.images[0]}
                    alt={site.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#D5CFC6] dark:border-[#3D494F]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center text-2xl border border-[#D5CFC6] dark:border-[#3D494F] shrink-0">
                    🏛️
                  </div>
                )}
                <div>
                  <h4 className="font-serif font-bold text-[#1A1E21] dark:text-[#EDE9DF] text-base leading-tight">
                    {site.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-sans tracking-wider border border-[#D5CFC6] dark:border-[#3D494F] rounded px-1.5 py-0.5 text-[#6B6560] dark:text-stone-400">
                      {site.region}
                    </span>
                    <span className="text-[10px] uppercase font-sans tracking-wider bg-[#1D9E75]/10 border border-[#1D9E75]/20 text-[#1D9E75] rounded px-1.5 py-0.5 font-bold">
                      {site.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected date / guests (Live-updates) */}
              <div className="bg-[#F5F2ED] dark:bg-[#141618] border border-[#D5CFC6] dark:border-[#3D494F] rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-3 text-xs text-[#6B6560] dark:text-[#C8B89A]">
                  <Calendar className="w-4 h-4 text-[#1D9E75] shrink-0" />
                  <span>Date:</span>
                  <span className="text-[#1A1E21] dark:text-[#EDE9DF] font-bold ml-auto">
                    {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not selected'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6B6560] dark:text-[#C8B89A]">
                  <Users className="w-4 h-4 text-[#1D9E75] shrink-0" />
                  <span>Guests:</span>
                  <span className="text-[#1A1E21] dark:text-[#EDE9DF] font-bold ml-auto">
                    {guests} guest(s)
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t border-[#D5CFC6] dark:border-[#3D494F] pt-4">
                <div className="flex justify-between text-xs text-[#6B6560] dark:text-[#C8B89A]">
                  <span>Entry Fee ({guests} × {feeNum.toLocaleString()} PKR)</span>
                  <span className="text-[#1A1E21] dark:text-[#EDE9DF] font-semibold">{ticketCost.toLocaleString()} PKR</span>
                </div>
                <div className="flex justify-between text-xs text-[#6B6560] dark:text-[#C8B89A]">
                  <span>Convenience Fee</span>
                  <span className="text-[#1A1E21] dark:text-[#EDE9DF] font-semibold">{serviceFee.toLocaleString()} PKR</span>
                </div>
                <div className="border-t border-[#D5CFC6] dark:border-[#3D494F] pt-3 flex justify-between items-center">
                  <span className="font-syncopate text-xs text-[#1A1E21] dark:text-[#EDE9DF] font-bold">Estimated Total</span>
                  <span className="text-[#1D9E75] font-serif text-xl font-bold">
                    {total.toLocaleString()} PKR
                  </span>
                </div>
              </div>

              {/* Reassurance Row */}
              <div className="flex items-center justify-center gap-2 pt-2 text-[12px] text-[#6B6560]/75 dark:text-stone-500 font-sans border-t border-[#D5CFC6] dark:border-[#3D494F]">
                <Lock className="w-3.5 h-3.5" />
                <span>Secure SSL Checkouts · Encrypted Transaction Channels</span>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
