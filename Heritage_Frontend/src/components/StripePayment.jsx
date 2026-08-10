import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CARD_OPTIONS = {
  style: {
    base: {
      color: '#EDE9DF',
      fontFamily: 'Outfit, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '15px',
      '::placeholder': { color: '#3D494F' },
      iconColor: '#1D9E75',
      backgroundColor: 'transparent'
    },
    invalid: {
      color: '#E05252',
      iconColor: '#E05252'
    }
  },
  hidePostalCode: true
};

function PaymentForm({ 
  clientSecret, totalAmount, site, date, numberOfPeople, 
  contactName, contactEmail, contactPhone,
  onSuccess, onError, setProcessing 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    if (setProcessing) setProcessing(true);
    setErrorMsg('');

    try {
      // 1. Confirm Card Payment
      const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: user?.name || 'Explorer',
            email: user?.email || ''
          }
        }
      });

      if (error) {
        setErrorMsg(error.message);
        onError(error.message);
        setLoading(false);
        if (setProcessing) setProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // 2. Call backend to create booking
        const res = await api.post('/bookings/confirm', {
          siteId: site._id,
          date,
          numberOfPeople,
          paymentIntentId: paymentIntent.id,
          totalAmount,
          phone: contactPhone,
          contactEmail,
          contactName
        });

        if (setProcessing) setProcessing(false);
        onSuccess(res.data.data);
      } else {
        throw new Error('Payment status verification failed.');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Payment processing failed.';
      setErrorMsg(msg);
      onError(msg);
      setLoading(false);
      if (setProcessing) setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
      {/* Styles for CardElement focus */}
      <style dangerouslySetInnerHTML={{ __html: `
        .StripeElement--focus {
          border-color: #1D9E75 !important;
          box-shadow: 0 0 0 3px rgba(29, 158, 117, 0.15) !important;
        }
      ` }} />

      {/* Label */}
      <label
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '11px',
          color: '#C8B89A',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: '600',
          display: 'block',
          marginBottom: '8px'
        }}
      >
        Card Details
      </label>

      {/* Card Element Wrapper */}
      <div
        style={{
          backgroundColor: '#141618',
          border: '1px solid #3D494F',
          borderRadius: '8px',
          padding: '14px 16px',
          transition: 'all 0.2s'
        }}
      >
        <CardElement options={CARD_OPTIONS} />
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div
          style={{
            backgroundColor: 'rgba(224, 82, 82, 0.1)',
            border: '1px solid rgba(224, 82, 82, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '12px',
            color: '#E05252',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px'
          }}
        >
          {errorMsg}
        </div>
      )}


      {/* Pay Button */}
      <button
        type="submit"
        disabled={loading || !stripe}
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
          cursor: loading ? 'wait' : 'pointer',
          marginTop: '24px',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseOver={(e) => {
          if (!loading) e.currentTarget.style.filter = 'brightness(0.9)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.filter = 'none';
        }}
      >
        {loading ? (
          <>
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
            <span>Processing...</span>
          </>
        ) : (
          <span>Pay PKR {totalAmount.toLocaleString()}</span>
        )}
      </button>
    </form>
  );
}

export default function StripePayment(props) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret: props.clientSecret }}>
      <PaymentForm {...props} />
    </Elements>
  );
}
