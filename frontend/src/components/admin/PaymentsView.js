import React, { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function PaymentsView() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [showBreakupModal, setShowBreakupModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

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

  const formatKey = (key) =>
    String(key || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());

  const sumItems = selectedPayment?.breakup?.sum || null;
  const subsItems = selectedPayment?.breakup?.subs || null;
  const breakupTotal = selectedPayment?.breakup?.total;
  const concessionMeta = selectedPayment?.breakup?.meta?.concession || null;
  const selectedStudent = selectedPayment ? students[selectedPayment.student_id] || {} : {};

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
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Breakup</th>
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
                        ₹{Number(payment.amount || 0).toLocaleString()}
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
                      <td className="py-3 px-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="bg-white border-sunny-border text-sunny-navy hover:bg-sunny-cream/60 hover:text-sunny-navy"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowBreakupModal(true);
                          }}
                          data-testid={`payment-breakup-${payment.id}`}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={showBreakupModal}
        onOpenChange={(open) => {
          setShowBreakupModal(open);
          if (!open) setSelectedPayment(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-fredoka text-sunny-navy">Payment Breakup</DialogTitle>
          </DialogHeader>

          {!selectedPayment ? (
            <div className="font-outfit text-sm text-gray-600">No payment selected.</div>
          ) : !selectedPayment.breakup ? (
            <div className="font-outfit text-sm text-gray-600">
              Breakup not available for this payment.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-sunny-border bg-sunny-cream/40 p-4">
                <div className="grid md:grid-cols-2 gap-3 text-sm font-outfit">
                  <div className="text-gray-700">
                    <span className="font-semibold text-gray-900">Student:</span>{' '}
                    {selectedStudent.name || 'N/A'} {selectedStudent.roll_number ? `(${selectedStudent.roll_number})` : ''}
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold text-gray-900">Transaction:</span> {selectedPayment.transaction_id}
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold text-gray-900">Paid For:</span>{' '}
                    {selectedPayment.paid_for_month || (selectedPayment.paid_at ? String(selectedPayment.paid_at).slice(0, 7) : 'N/A')}
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold text-gray-900">Paid At:</span> {new Date(selectedPayment.paid_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="font-fredoka font-bold text-sunny-navy mb-3">Added</h3>
                  <div className="space-y-2 text-sm font-outfit">
                    {sumItems &&
                      Object.entries(sumItems).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-gray-700">
                          <span>{formatKey(k)}</span>
                          <span className="font-semibold text-gray-900 tabular-nums">₹{Number(v || 0).toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="font-fredoka font-bold text-sunny-navy mb-3">Subtractions</h3>
                  <div className="space-y-2 text-sm font-outfit">
                    {!subsItems || Object.keys(subsItems).length === 0 ? (
                      <div className="text-gray-600">No deductions</div>
                    ) : (
                      Object.entries(subsItems).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-gray-700">
                          <span>{formatKey(k)}</span>
                          <span className="font-semibold text-emerald-700 tabular-nums">- ₹{Number(v || 0).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {concessionMeta && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <h3 className="font-fredoka font-bold text-emerald-900 mb-3">Concession Details</h3>
                  <div className="grid md:grid-cols-2 gap-3 text-sm font-outfit text-emerald-950">
                    <div>
                      <span className="font-semibold">Reason:</span> {concessionMeta.reason || '—'}
                    </div>
                    <div>
                      <span className="font-semibold">Percent:</span>{' '}
                      {Number(concessionMeta.percent || 0) ? `${Number(concessionMeta.percent).toFixed(0)}%` : '—'}
                    </div>
                    <div>
                      <span className="font-semibold">Applied By:</span>{' '}
                      {concessionMeta.applied_by?.name || concessionMeta.applied_by?.email || '—'}
                    </div>
                    <div>
                      <span className="font-semibold">Applied At:</span>{' '}
                      {concessionMeta.applied_at ? new Date(concessionMeta.applied_at).toLocaleString() : '—'}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl bg-sunny-navy px-4 py-3 text-white">
                <span className="font-outfit font-semibold">Total Paid</span>
                <span className="font-outfit text-lg font-bold tabular-nums">
                  ₹{Number(breakupTotal ?? selectedPayment.amount ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
