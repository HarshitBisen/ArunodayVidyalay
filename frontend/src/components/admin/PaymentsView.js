import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CreditCard, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const classOptions = [
  { value: 'Nursery', label: 'Nursery' },
  { value: 'LKG', label: 'LKG' },
  { value: 'UKG', label: 'UKG' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
];

export default function PaymentsView() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState(['Nursery']);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0,7));
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const classDropdownRef = useRef(null);
  const [showBreakupModal, setShowBreakupModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const params = {};
      const studentsParams = {};

      if (selectedClasses && selectedClasses.length > 0) {
        const joinedClasses = selectedClasses.join(',');
        params.class_name = joinedClasses;
        studentsParams.class_name = joinedClasses;
      }

      if (selectedMonth) {
        params.month = selectedMonth;
      }

      const [paymentsRes, studentsRes] = await Promise.all([
        api.get('/admin/payments', { params }),
        api.get('/admin/students', { params: studentsParams }),
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
  }, [selectedClasses, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!classDropdownRef.current) return;
      if (!classDropdownRef.current.contains(event.target)) {
        setClassDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  

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

      <div className="inline-flex items-end gap-4 rounded-2xl shadow-lg border border-sunny-border p-4 mb-4 bg-gradient-to-r from-sunny-cream/40 via-white to-sunny-blue/5">
        <div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </div>

        <div className="relative w-72" ref={classDropdownRef}>
          <button
            type="button"
            onClick={() => setClassDropdownOpen((open) => !open)}
            className="w-full flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm hover:shadow-md transition"
            aria-expanded={classDropdownOpen}
          >
            <div className="flex-1 text-sm text-gray-700">
              {selectedClasses.length === 0 ? (
                <span className="text-gray-700">&nbsp;</span>
              ) : (
                <div className="flex flex-wrap items-center gap-1 max-h-32 overflow-hidden">
                  {selectedClasses.map((value) => {
                    const option = classOptions.find((opt) => opt.value === value);
                    return (
                      <span key={value} className="inline-flex items-center rounded-full bg-sunny-cream/70 px-2 py-1 text-xs text-sunny-navy">
                        {option?.label || value}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <ChevronDown size={18} className="text-gray-400 mt-1" />
          </button>

          <div
            className={`absolute right-0 mt-2 w-full bg-white rounded-2xl shadow-xl z-50 border p-3 ${classDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
            style={{
              transition: 'opacity 200ms ease, transform 200ms ease',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Input
                placeholder="Search classes"
                value={classSearchQuery}
                onChange={(e) => setClassSearchQuery(e.target.value)}
                className="rounded-md"
                data-testid="payment-class-search"
              />
              <div className="ml-2 flex gap-2">
                <button type="button" onClick={() => setSelectedClasses(classOptions.map((o) => o.value))} className="text-sm text-sky-600 hover:underline">
                  Select All
                </button>
                <button type="button" onClick={() => setSelectedClasses([])} className="text-sm text-gray-400 hover:underline">
                  Clear
                </button>
              </div>
            </div>
            <div className="max-h-56 overflow-auto divide-y rounded-xl">
              {classOptions
                .filter((o) => o.label.toLowerCase().includes(classSearchQuery.toLowerCase()))
                .map((opt) => (
                  <label key={opt.value} className="flex items-center justify-between gap-2 py-2 px-2 hover:bg-gray-50 rounded-md cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(opt.value)}
                        onChange={() => {
                          if (selectedClasses.includes(opt.value)) {
                            setSelectedClasses((prev) => prev.filter((value) => value !== opt.value));
                          } else {
                            setSelectedClasses((prev) => [...prev, opt.value]);
                          }
                        }}
                        className="h-4 w-4 accent-sky-600"
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </div>
                    {selectedClasses.includes(opt.value) && <span className="text-sky-600">✓</span>}
                  </label>
                ))}
            </div>
          </div>
        </div>
      </div>

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
