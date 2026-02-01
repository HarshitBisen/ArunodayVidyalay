import React, { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';

export default function PaymentsView() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, studentsRes] = await Promise.all([
        api.get('/admin/payments'),
        api.get('/admin/students'),
      ]);

      setPayments(paymentsRes.data);
      
      const studentsMap = {};
      studentsRes.data.forEach((student) => {
        studentsMap[student.id] = student;
      });
      setStudents(studentsMap);
    } catch (error) {
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="font-outfit">Loading...</div>;
  }

  return (
    <div data-testid="payments-view">
      <h1 className="text-4xl font-fredoka font-bold text-sunny-navy mb-8">Fee Payments</h1>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden" data-testid="payments-table">
        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="font-outfit text-gray-600">No payments received yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Transaction ID</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Student</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Roll No</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Amount</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Payment Method</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Date</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const student = students[payment.student_id] || {};
                  return (
                    <tr key={payment.id} className="border-t hover:bg-gray-50" data-testid={`payment-row-${payment.id}`}>
                      <td className="font-outfit text-gray-900 py-3 px-4">{payment.transaction_id}</td>
                      <td className="font-outfit text-gray-900 py-3 px-4">{student.name || 'N/A'}</td>
                      <td className="font-outfit text-gray-600 py-3 px-4">{student.roll_number || 'N/A'}</td>
                      <td className="font-outfit text-gray-900 font-semibold py-3 px-4">
                        ₹{payment.amount.toLocaleString()}
                      </td>
                      <td className="font-outfit text-gray-600 py-3 px-4">{payment.payment_method}</td>
                      <td className="font-outfit text-gray-600 py-3 px-4">
                        {new Date(payment.paid_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-outfit">
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}