import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Star, Users, Zap, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { saveDonationRecord, DonationData, getDonationStats, sendDonationNotification } from '../utils/donationUtils';


interface PayPalButtonProps {
  amount: number;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
}

// PayPal Button Component with fixed ID generation
const PayPalButton: React.FC<PayPalButtonProps> = ({ amount, onSuccess, onError }) => {
  const [buttonId] = useState(`paypal-button-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    let isMounted = true;

    const renderPayPalButton = () => {
      const container = document.getElementById(buttonId);
      if (!window.paypal || !container) return;

      container.innerHTML = '';

      window.paypal.Buttons({
        createOrder: (_data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: amount.toString()
              },
              description: `Donation to Movie Zone - Thank you for your support!`
            }]
          });
        },
        onApprove: async (_data: any, actions: any) => {
          try {
            const details = await actions.order.capture();
            onSuccess(details);
          } catch (error) {
            onError(error);
          }
        },
        onError: (error: any) => {
          console.error('PayPal error:', error);
          onError(error);
        },
        style: {
          color: 'blue',
          shape: 'rect',
          label: 'donate',
          height: 45,
          tagline: false
        }
      }).render(`#${buttonId}`);
    };

    const loadPayPalSdk = async () => {
      const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
      if (!clientId) {
        toast.error('PayPal configuration missing. Please contact support.');
        console.error('PayPal Client ID not found in environment variables');
        return;
      }

      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src^="https://www.paypal.com/sdk/js"]'
      );

      if (!window.paypal && !existingScript) {
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
        script.async = true;
        script.onload = () => {
          if (isMounted) {
            renderPayPalButton();
          }
        };
        script.onerror = () => {
          toast.error('Failed to load PayPal. Please refresh and try again.');
          console.error('Failed to load PayPal SDK');
        };
        document.head.appendChild(script);
      } else if (window.paypal) {
        renderPayPalButton();
      } else if (existingScript) {
        existingScript.addEventListener('load', renderPayPalButton, { once: true });
      }
    };

    loadPayPalSdk();

    return () => {
      isMounted = false;
      const container = document.getElementById(buttonId);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [amount, buttonId, onError, onSuccess]);

  return <div id={buttonId} className="min-h-[45px] w-full"></div>;
};

function Donate() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showPayment, setShowPayment] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donationStats] = useState(() => getDonationStats());

  const formattedStats = useMemo(() => ({
    totalAmount: donationStats.totalAmount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    }),
    donationCount: donationStats.donationCount.toLocaleString('en-US'),
  }), [donationStats]);

  const donationAmounts = [
    { amount: 5, label: 'Coffee', description: 'Buy us a coffee' },
    { amount: 15, label: 'Supporter', description: 'Show your support', popular: true },
    { amount: 30, label: 'Patron', description: 'Become a patron' },
    { amount: 50, label: 'Sponsor', description: 'Help us grow' }
  ];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setShowPayment(true);
  };

  const handleCustomAmount = () => {
    const amount = parseFloat(customAmount);
    if (amount && amount >= 1) {
      setSelectedAmount(amount);
      setShowPayment(true);
    } else {
      toast.error('Please enter a valid amount (minimum $1)');
    }
  };

  const handlePaymentSuccess = async (details: any) => {
    toast.success('🎉 Thank you for your generous donation!');
    console.log('Payment successful:', details);

    try {
      const capture = details?.purchase_units?.[0]?.payments?.captures?.[0];
      const paypalOrderId =
        capture?.id ||
        details?.id ||
        (window.crypto?.randomUUID ? window.crypto.randomUUID() : `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      const amountPaid = parseFloat(capture?.amount?.value ?? `${selectedAmount ?? 0}`);

      if (!amountPaid || !selectedAmount) {
        throw new Error('Missing donation details');
      }

      const donationRecord: DonationData = {
        paypalOrderId,
        amount: amountPaid,
        donorName: isAnonymous ? undefined : donorName.trim() || undefined,
        message: message.trim() || undefined,
        isAnonymous,
        timestamp: new Date().toISOString(),
        tier: donationAmounts.find(d => d.amount === selectedAmount)?.label || 'Custom',
      };

      await saveDonationRecord(donationRecord);
      await sendDonationNotification(donationRecord);
    } catch (error) {
      console.error('Failed to record donation:', error);
      toast.error('We received your payment but failed to record the donation locally.');
    }

    // Reset form
    setSelectedAmount(null);
    setCustomAmount('');
    setShowPayment(false);
    setDonorName('');
    setMessage('');
    setIsAnonymous(false);
  };

  const handlePaymentError = (error: any) => {
    toast.error('Payment failed. Please try again.');
    console.error('Payment error:', error);
  };

  return (
    <div className="mt-[68px] min-h-screen bg-[#141414]">
      <div className="relative">
        <div className="relative px-4 py-16 md:px-8 lg:px-16">
          <div className="max-w-6xl mx-auto">
            
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Support Movie Zone
              </h1>
              
              <p className="text-xl text-zinc-300 max-w-2xl mx-auto mb-8">
                Help us keep Movie Zone free for everyone. Your support keeps our servers running 
                and helps us add new features.
              </p>
              
              {/* Stats */}
              <div className="flex items-center justify-center gap-8 text-sm text-zinc-400 mb-8">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{formattedStats.donationCount} supporters</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>{formattedStats.totalAmount} raised</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  <span>100% free platform</span>
                </div>
              </div>
            </div>

            {!showPayment ? (
              <>
                {/* Donation Amounts */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-white text-center mb-8">
                    Choose an amount
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
                    {donationAmounts.map((donation) => (
                      <button
                        key={donation.amount}
                        onClick={() => handleAmountSelect(donation.amount)}
                        className={`relative p-6 bg-zinc-900/80 border border-zinc-800 rounded-lg hover:border-red-600 hover:bg-zinc-900 transition-all duration-300 group ${
                          donation.popular ? 'ring-2 ring-red-600/50 border-red-600' : ''
                        }`}
                      >
                        {donation.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                              Popular
                            </span>
                          </div>
                        )}
                        
                        <div className="text-3xl font-bold text-white mb-2">
                          ${donation.amount}
                        </div>
                        <div className="text-red-500 font-medium mb-1">
                          {donation.label}
                        </div>
                        <div className="text-sm text-zinc-400">
                          {donation.description}
                        </div>
                        
                        <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-red-500 transition-colors mt-4 mx-auto" />
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Amount */}
                  <div className="max-w-md mx-auto">
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 text-center">
                        Or enter a custom amount
                      </h3>
                      
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
                            $
                          </span>
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="25.00"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-md px-4 py-3 pl-8 focus:outline-none focus:border-red-600"
                          />
                        </div>
                        <button
                          onClick={handleCustomAmount}
                          className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Why Support */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
                  <h3 className="text-xl font-bold text-white text-center mb-6">
                    Why your support matters
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-6 h-6 text-red-500" />
                      </div>
                      <h4 className="font-semibold text-white mb-2">Server Costs</h4>
                      <p className="text-sm text-zinc-400">
                        Keep our servers running 24/7 for fast, reliable streaming
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="w-6 h-6 text-red-500" />
                      </div>
                      <h4 className="font-semibold text-white mb-2">New Features</h4>
                      <p className="text-sm text-zinc-400">
                        Fund development of new features and improvements
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-6 h-6 text-red-500" />
                      </div>
                      <h4 className="font-semibold text-white mb-2">Ad-Free</h4>
                      <p className="text-sm text-zinc-400">
                        Keep the platform completely free and ad-free for everyone
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Payment Section */
              <div className="max-w-2xl mx-auto">
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-8">
                  
                  {/* Payment Header */}
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Complete your donation
                    </h2>
                    <p className="text-lg text-red-500 font-semibold">
                      ${selectedAmount?.toFixed(2)} USD
                    </p>
                  </div>

                  {/* Optional Details */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="anonymous"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-4 h-4 text-red-600 bg-zinc-800 border-zinc-600 rounded focus:ring-red-600 focus:ring-2"
                      />
                      <label htmlFor="anonymous" className="text-white">
                        Make this donation anonymous
                      </label>
                    </div>
                    
                    {!isAnonymous && (
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Your name (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your name"
                          value={donorName}
                          onChange={(e) => setDonorName(e.target.value)}
                          className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-md px-4 py-3 focus:outline-none focus:border-red-600"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Message (optional)
                      </label>
                      <textarea
                        placeholder="Leave a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-md px-4 py-3 focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>

                  {/* PayPal Button */}
                  <div className="space-y-4">
                    <PayPalButton
                      amount={selectedAmount || 0}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                    
                    <div className="text-center">
                      <button
                        onClick={() => setShowPayment(false)}
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        ← Back to amounts
                      </button>
                    </div>
                    
                    <p className="text-xs text-zinc-500 text-center">
                      Secure payment powered by PayPal. Your information is encrypted and secure.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// Extend window interface for PayPal
declare global {
  interface Window {
    paypal: any;
  }
}

export default Donate;