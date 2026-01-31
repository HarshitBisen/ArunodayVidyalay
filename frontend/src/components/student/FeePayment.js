import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/utils/api';

export default function FeePayment() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/student/profile');
      setProfile(response.data);
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    if (profile.fee_status === 'paid') {
      toast.info('Fee already paid');
      return;
    }
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const transactionId = `BOB${Date.now()}${Math.floor(Math.random() * 10000)}`;
      await api.post('/student/pay-fee', {
        amount: profile.fee_amount,
        transaction_id: transactionId,
      });
      toast.success('Payment successful!');
      setShowPaymentModal(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="font-outfit">Loading...</div>;
  }

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
              <p className="font-outfit text-gray-600">Academic Year 2024-25</p>
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
              <span className="font-outfit text-gray-600">Total Fee Amount</span>
              <span className="font-outfit font-bold text-2xl text-sunny-navy">
                ₹{profile.fee_amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-outfit text-gray-600">Status</span>
              <span
                className={`px-4 py-2 rounded-full font-outfit font-semibold ${
                  profile.fee_status === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {profile.fee_status === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
          </div>

          {profile.fee_status !== 'paid' && (
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
              <h3 className="font-fredoka font-bold text-sunny-navy mb-2">Bank of Baroda PayPoint</h3>
              <p className="font-outfit text-gray-600 text-sm mb-4">
                Pay securely using Bank of Baroda's payment gateway. All transactions are encrypted and secure.
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

            {profile.fee_status === 'paid' && (
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
                  ₹{profile.fee_amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-outfit text-gray-600">Payment Gateway</span>
                <span className="font-outfit font-semibold text-gray-900">Bank of Baroda PayPoint</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="font-outfit text-sm text-blue-700">
                This is a demo payment. In production, you will be redirected to Bank of Baroda's secure payment page.
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