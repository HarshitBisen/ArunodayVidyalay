import React, { useState, useEffect } from 'react';
import { Users, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import api from '@/utils/api';

export default function AdminOverview() {
  const [stats, setStats] = useState({ total: 0, feePaid: 0, feePending: 0 });
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, paymentsRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/payments'),
      ]);

      const students = studentsRes.data;
      const feePaid = students.filter((s) => s.fee_status === 'paid').length;
      setStats({
        total: students.length,
        feePaid,
        feePending: students.length - feePaid,
      });

      setRecentPayments(paymentsRes.data.slice(0, 5));
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
    <div data-testid="admin-overview">
      <h1 className="text-4xl font-fredoka font-bold text-sunny-navy mb-8">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border-t-4 border-sunny-blue shadow-sm" data-testid="stat-total-students">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-outfit text-gray-600 text-sm">Total Students</p>
              <p className="text-3xl font-fredoka font-bold text-sunny-navy mt-2">{stats.total}</p>
            </div>
            <div className="w-14 h-14 bg-sunny-blue rounded-full flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-t-4 border-green-500 shadow-sm" data-testid="stat-fees-paid">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-outfit text-gray-600 text-sm">Fees Paid</p>
              <p className="text-3xl font-fredoka font-bold text-sunny-navy mt-2">{stats.feePaid}</p>
            </div>
            <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-t-4 border-red-500 shadow-sm" data-testid="stat-fees-pending">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-outfit text-gray-600 text-sm">Fees Pending</p>
              <p className="text-3xl font-fredoka font-bold text-sunny-navy mt-2">{stats.feePending}</p>
            </div>
            <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center">
              <XCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl p-6 shadow-sm" data-testid="recent-payments">
        <h2 className="text-2xl font-fredoka font-bold text-sunny-navy mb-4">Recent Payments</h2>
        {recentPayments.length === 0 ? (
          <p className="font-outfit text-gray-600">No payments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3">Transaction ID</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3">Amount</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3">Date</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment) => (
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