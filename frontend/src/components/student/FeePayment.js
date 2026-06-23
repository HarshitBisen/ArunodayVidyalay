import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/utils/api';

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });

export default function FeePayment() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feeDetails, setFeeDetails] = useState(null);
  const [feeLoading, setFeeLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/student/profile');
      const profileData = response.data;
      setProfile(profileData);

      setFeeLoading(true);
      try {
        const feeRes = await api.post('/fees/calculate', {
          ...profileData,
          frequency: 'monthly',
        });
        setFeeDetails(feeRes.data);
      } catch (error) {
        setFeeDetails(null);
      } finally {
        setFeeLoading(false);
      }
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    if ((profile?.fee_status ?? 'pending') === 'paid') {
      toast.info('Fee already paid');
      return;
    }
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    setProcessing(true);

    try {
      if (payableAmount <= 0) {
        toast.error('Invalid payable amount');
        setProcessing(false);
        return;
      }

      const orderRes = await api.post('/razorpay/create-order', {
        amount: payableAmount,
        currency: 'INR',
        receipt: `fee_${profile?.id}_${Date.now()}`,
      });

      await loadRazorpayScript();

      const { id: order_id, amount, currency, key_id } = orderRes.data;
      const options = {
        key: key_id,
        amount,
        currency,
        name: 'Arunoday Vidyalay',
        description: 'School fee payment',
        order_id,
        prefill: {
          name: profile?.name || '',
          email: profile?.email || '',
          contact: profile?.phone || '',
        },
        notes: {
          student_id: profile?.id || '',
        },
        theme: {
          color: '#0f172a',
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
        handler: async function (response) {
          try {
            await api.post('/razorpay/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: payableAmount,
            });

            toast.success('Payment successful!');
            setShowPaymentModal(false);
            fetchProfile();
          } catch (error) {
            toast.error(error.response?.data?.detail || 'Payment verification failed');
          } finally {
            setProcessing(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(response.error?.description || 'Payment failed');
        setProcessing(false);
      });
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Unable to start payment');
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="font-outfit">Loading...</div>;
  }

  const feeAmount = Number(profile?.fee_amount ?? 0);
  const feeStatus = profile?.fee_status ?? 'pending';
  const payableAmount = Number(feeDetails?.total_fee ?? feeAmount);
  const effectiveStatus = feeDetails?.message === 'Payment already exists' ? 'paid' : feeStatus;
  const breakupHeading = effectiveStatus === 'paid' ? 'Last Transaction Breakup' : 'Pending Fee Breakup';

  return (
    <div data-testid="fee-payment">
      <h1 className="text-4xl font-fredoka font-bold text-sunny-navy mb-8">Fee Payment</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Fee Details Card */}
        <div className="bg-white rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow" data-testid="fee-details-card">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-sunny-yellow rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-sunny-navy" />
            </div>
	            <div>
	              <h2 className="text-2xl font-fredoka font-bold text-sunny-navy">Fee Details</h2>
	              <p className="font-outfit text-gray-600">
	                Academic Year {profile?.academic_year || '-'}
	              </p>
	            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="font-outfit text-gray-600">Student Name</span>
              <span className="font-outfit font-semibold text-gray-900">{profile.name}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="font-outfit text-gray-600">Roll Number</span>
              <span className="font-outfit font-semibold text-gray-900">{profile.roll_number}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="font-outfit text-gray-600">Class</span>
              <span className="font-outfit font-semibold text-gray-900">{profile.class_name}-{profile.section}</span>
            </div>
		            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
		              <span className="font-outfit text-gray-600">Total Fee Pending</span>
		              <span className="font-outfit font-bold text-2xl text-sunny-navy">
		                ₹{payableAmount.toLocaleString()}
		              </span>
		            </div>
	            <div className="flex justify-between items-center">
	              <span className="font-outfit text-gray-600">Status</span>
		              <span
		                className={`px-4 py-2 rounded-full font-outfit font-semibold ${
		                  effectiveStatus === 'paid'
		                    ? 'bg-green-100 text-green-700'
		                    : 'bg-red-100 text-red-700'
		                }`}
		              >
		                {effectiveStatus === 'paid' ? 'Paid' : 'Pending'}
		              </span>
		            </div>
	          </div>

	          <div className="mt-6 rounded-2xl border border-sunny-border bg-sunny-cream/40 p-5">
            <h3 className="font-fredoka font-bold text-sunny-navy mb-4">{breakupHeading}</h3>
	            {feeLoading ? (
                  <p className="font-outfit text-sm text-gray-600">Calculating...</p>
                ) : feeDetails ? (
                  <div className="space-y-2 text-sm font-outfit">
                    <div className="flex items-center justify-between text-gray-700">
                      <span>Admission Fee</span>
                      <span className="font-semibold text-gray-900 tabular-nums">₹{Number(feeDetails.admission_fee ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-700">
	                  <span>Annual Fee</span>
	                  <span className="font-semibold text-gray-900 tabular-nums">₹{Number(feeDetails.annual_fee ?? 0).toLocaleString()}</span>
	                </div>
	                <div className="flex items-center justify-between text-gray-700">
	                  <span>Tuition Fee</span>
	                  <span className="font-semibold text-gray-900 tabular-nums">₹{Number(feeDetails.tuition_fee ?? 0).toLocaleString()}</span>
	                </div>
	                <div className="flex items-center justify-between text-gray-700">
	                  <span>Bus Fee</span>
	                  <span className="font-semibold text-gray-900 tabular-nums">₹{Number(feeDetails.bus_fee ?? 0).toLocaleString()}</span>
	                </div>
	                {Number(feeDetails.late_fee ?? 0) > 0 && (
	                  <div className="flex items-center justify-between text-gray-700">
	                    <span>Late Fee</span>
	                    <span className="font-semibold text-gray-900 tabular-nums">₹{Number(feeDetails.late_fee ?? 0).toLocaleString()}</span>
	                  </div>
	                )}
	                <div className="flex items-center justify-between text-gray-700">
	                  <span>Caution Money</span>
	                  <span className="font-semibold text-gray-900 tabular-nums">₹{Number(feeDetails.caution_money ?? 0).toLocaleString()}</span>
	                </div>
	                {Number(feeDetails.concession ?? 0) > 0 && (
	                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
	                    <span className="font-semibold">Concession</span>
	                    <span className="font-bold tabular-nums">- ₹{Number(feeDetails.concession ?? 0).toLocaleString()}</span>
	                  </div>
	                )}
	                <div className="my-3 h-px bg-sunny-border" />
	                <div className="flex items-center justify-between rounded-xl bg-sunny-navy px-4 py-3 text-white">
	                  <span className="font-semibold">Total Pending</span>
	                  <span className="text-lg font-bold tabular-nums">₹{Number(feeDetails.total_fee ?? 0).toLocaleString()}</span>
	                </div>
	              </div>
	            ) : (
	              <p className="font-outfit text-sm text-gray-600">Unable to calculate fee right now.</p>
	            )}
	          </div>

		          {effectiveStatus !== 'paid' && (
		            <Button
		              onClick={handlePayNow}
		              className="w-full mt-8 bg-sunny-yellow text-sunny-navy font-bold rounded-full px-8 py-3 neo-brutal-shadow hover:bg-sunny-yellow text-lg"
		              data-testid="pay-now-button"
		            >
		              Pay Now
		            </Button>
		          )}
        </div>

        {/* Payment Method Card */}
        <div className="bg-white rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow" data-testid="payment-method-card">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-sunny-blue rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-fredoka font-bold text-sunny-navy">Payment Method</h2>
              <p className="font-outfit text-gray-600">Secure & Fast</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-sunny-cream rounded-xl p-6 border border-sunny-border">
              <h3 className="font-fredoka font-bold text-sunny-navy mb-2">Razorpay</h3>
              <p className="font-outfit text-gray-600 text-sm mb-4">
                Pay securely using Razorpay's checkout. All transactions are encrypted and secure.
              </p>
              <div className="space-y-2 text-sm font-outfit text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>100% Secure Payment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Instant Receipt</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>

		            {effectiveStatus === 'paid' && (
		              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="font-fredoka font-bold text-green-700">Payment Completed</h3>
                </div>
                <p className="font-outfit text-green-600 text-sm">
                  Your fee has been successfully paid. Thank you!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent data-testid="payment-modal">
          <DialogHeader>
            <DialogTitle className="text-2xl font-fredoka font-bold text-sunny-navy">Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
	            <div className="bg-sunny-cream rounded-xl p-6">
	              <div className="flex justify-between items-center mb-2">
		                <span className="font-outfit text-gray-600">Amount to Pay</span>
		                <span className="font-fredoka font-bold text-2xl text-sunny-navy">
		                  ₹{payableAmount.toLocaleString()}
		                </span>
		              </div>
              <div className="flex justify-between items-center">
                <span className="font-outfit text-gray-600">Payment Gateway</span>
                <span className="font-outfit font-semibold text-gray-900">Bank of Baroda</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="font-outfit text-sm text-blue-700">
                You will be redirected to Razorpay's secure checkout to complete the payment.
              </p>
            </div>

            <Button
              onClick={processPayment}
              disabled={processing}
              className="w-full bg-sunny-yellow text-sunny-navy font-bold rounded-full px-8 py-3 neo-brutal-shadow hover:bg-sunny-yellow text-lg"
              data-testid="confirm-payment-button"
            >
              {processing ? 'Processing Payment...' : 'Proceed to Pay'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
