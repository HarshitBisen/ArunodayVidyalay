import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import api from '@/utils/api';

export default function StudentOverview() {
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, paymentsRes] = await Promise.all([
        api.get('/student/profile'),
        api.get('/student/payments'),
      ]);
      setProfile(profileRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="font-outfit">Loading...</div>;
  }

  return (
    <div data-testid="student-overview">
      <h1 className="text-4xl font-fredoka font-bold text-sunny-navy mb-8">Dashboard Overview</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow" data-testid="profile-card">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-sunny-yellow rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-sunny-navy" />
            </div>
            <div>
              <h2 className="text-2xl font-fredoka font-bold text-sunny-navy">{profile.name}</h2>
              <p className="font-outfit text-gray-600">Roll No: {profile.roll_number}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-gray-600">
              <Mail size={18} className="text-sunny-blue" />
              <span className="font-outfit">{profile.email}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600">
              <User size={18} className="text-sunny-blue" />
              <span className="font-outfit">Class: {profile.class_name}-{profile.section}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600">
              <Phone size={18} className="text-sunny-blue" />
              <span className="font-outfit">{profile.phone}</span>
            </div>
          </div>
        </div>

        {/* Fee Status Card */}
        <div className="bg-white rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow" data-testid="fee-status-card">
          <h3 className="text-2xl font-fredoka font-bold text-sunny-navy mb-6">Fee Status</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-outfit text-gray-600 mb-2">Total Fee Amount</p>
              <p className="text-4xl font-fredoka font-bold text-sunny-navy">
                ₹{profile.fee_amount.toLocaleString()}
              </p>
            </div>
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                profile.fee_status === 'paid' ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {profile.fee_status === 'paid' ? (
                <CheckCircle className="w-10 h-10 text-white" />
              ) : (
                <XCircle className="w-10 h-10 text-white" />
              )}
            </div>
          </div>
          <div className="mt-6">
            <span
              className={`px-4 py-2 rounded-full font-outfit font-semibold ${
                profile.fee_status === 'paid'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {profile.fee_status === 'paid' ? 'Fee Paid' : 'Fee Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="mt-8 bg-white rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow" data-testid="payment-history">
        <h3 className="text-2xl font-fredoka font-bold text-sunny-navy mb-6">Payment History</h3>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="font-outfit text-gray-600">No payments made yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3">Transaction ID</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3">Amount</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3">Date</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="font-outfit text-gray-600 py-3">{payment.transaction_id}</td>
                    <td className="font-outfit text-gray-900 font-semibold py-3">
                      ₹{payment.amount.toLocaleString()}
                    </td>
                    <td className="font-outfit text-gray-600 py-3">
                      {new Date(payment.paid_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-outfit">
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}