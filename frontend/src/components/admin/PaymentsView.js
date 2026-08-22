import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CreditCard, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Loader from '@/components/ui/loader';

const classOptions = [
  { value: 'Nursery', label: 'Nursery' },
  { value: 'JKG', label: 'JKG' },
  { value: 'SKG', label: 'SKG' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
];

export default function PaymentsView() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState(['Nursery']);
  const [selectedMonths, setSelectedMonths] = useState([currentMonth]);
  const [monthInput, setMonthInput] = useState(currentMonth);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const monthDropdownRef = useRef(null);
  const classDropdownRef = useRef(null);
  const [showBreakupModal, setShowBreakupModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showAdvance, setShowAdvance] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      const studentsParams = {};

      if (selectedClasses && selectedClasses.length > 0) {
        const joinedClasses = selectedClasses.join(',');
        params.class_name = joinedClasses;
        studentsParams.class_name = joinedClasses;
      }

      if (selectedMonths.length > 0) {
        params.month = selectedMonths.join(',');
      }

      if (showAdvance) {
        params.include_advance = 'true';
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
  }, [selectedClasses, selectedMonths, showAdvance]);

  const addMonthToFilter = (value) => {
    if (!value) return;
    setSelectedMonths((prev) => (prev.includes(value) ? prev : [...prev, value]));
  };

  const removeMonthFromFilter = (value) => {
    setSelectedMonths((prev) => prev.filter((month) => month !== value));
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => { setCurrentPage(1); }, [selectedMonths, selectedClasses, showAdvance]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) {
        setMonthDropdownOpen(false);
      }
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target)) {
        setClassDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  

  const isAdvancePayment = (payment) => {
    const cm = new Date().toISOString().slice(0, 7);
    return Array.isArray(payment?.selected_months) && payment.selected_months.some((m) => m > cm);
  };

  if (loading) {
    return <Loader message="Loading payments" />;
  }

  const formatKey = (key) =>
    String(key || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());

  const formatMonthLabel = (monthValue) => {
    const match = String(monthValue || '').match(/^(\d{4})-(\d{1,2})$/);
    if (!match) return monthValue || 'N/A';
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return monthValue || 'N/A';
    }
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  const formatPaidFor = (payment) => {
    const selectedMonths = Array.isArray(payment?.selected_months) ? payment.selected_months.filter(Boolean) : [];
    if (selectedMonths.length > 0) {
      return selectedMonths.map((month) => formatMonthLabel(month)).join(', ');
    }

    if (payment?.paid_for_month) {
      return formatMonthLabel(payment.paid_for_month);
    }

    if (payment?.paid_at) {
      return formatMonthLabel(String(payment.paid_at).slice(0, 7));
    }

    return 'N/A';
  };

  const sumItems = selectedPayment?.breakup?.sum || null;
  const subsItems = selectedPayment?.breakup?.subs || null;
  const breakupTotal = selectedPayment?.breakup?.total;
  const concessionMeta = selectedPayment?.breakup?.meta?.concession || null;
  const selectedStudent = selectedPayment ? students[selectedPayment.student_id] || {} : {};

  const pagedPayments = payments.slice((currentPage - 1) * 10, currentPage * 10);
  const totalPages = Math.ceil(payments.length / 10);

  return (
    <div data-testid="payments-view">
      <h1 className="text-4xl font-fredoka font-bold text-sunny-navy mb-8">Fee Payments</h1>

      <div className="w-full flex flex-wrap items-start gap-4 rounded-2xl shadow-lg border border-sunny-border p-4 mb-4 bg-gradient-to-r from-sunny-cream/40 via-white to-sunny-blue/5">
        <div className="relative flex-1 min-w-[280px]" ref={monthDropdownRef}>
          <button
            type="button"
            onClick={() => setMonthDropdownOpen((open) => !open)}
            className="w-full flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm hover:shadow-md transition"
            aria-expanded={monthDropdownOpen}
          >
            <div className="flex-1 text-sm text-gray-700">
              {selectedMonths.length === 0 ? (
                <span className="text-gray-700">&nbsp;</span>
              ) : (
                <div className="flex flex-wrap items-center gap-1 max-h-32 overflow-hidden">
                  {selectedMonths.map((month) => (
                    <span key={month} className="inline-flex items-center rounded-full bg-sunny-cream/70 px-2 py-1 text-xs text-sunny-navy">
                      {month}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <ChevronDown size={18} className="text-gray-400 mt-1" />
          </button>

          <div
            className={`absolute right-0 mt-2 w-full bg-white rounded-2xl shadow-xl z-50 border p-3 ${monthDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
            style={{
              transition: 'opacity 200ms ease, transform 200ms ease',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <input
                type="month"
                value={monthInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setMonthInput(value);
                  addMonthToFilter(value);
                }}
                className="w-full rounded-md border px-3 py-2"
              />
              <button
                type="button"
                onClick={() => addMonthToFilter(monthInput)}
                className="text-sm text-sky-600 hover:underline"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setSelectedMonths([])}
                className="text-sm text-gray-400 hover:underline"
              >
                Clear
              </button>
            </div>
            <div className="max-h-56 overflow-auto divide-y rounded-xl">
              {selectedMonths.length === 0 ? (
                <div className="px-2 py-3 text-sm text-gray-500 font-outfit">No month selected</div>
              ) : (
                selectedMonths.map((month) => (
                  <div key={month} className="flex items-center justify-between gap-2 py-2 px-2 hover:bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-700">{month}</span>
                    <button
                      type="button"
                      onClick={() => removeMonthFromFilter(month)}
                      className="text-sm text-gray-400 hover:text-gray-700"
                      aria-label={`Remove month ${month}`}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="relative flex-1 min-w-[280px]" ref={classDropdownRef}>
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

      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => setShowAdvance((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-outfit font-semibold transition ${
            showAdvance
              ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
              : 'border-blue-200 bg-white text-blue-700 hover:border-blue-500'
          }`}
        >
          {showAdvance ? '✓ ' : ''}Advance Payments
        </button>
        {showAdvance && (
          <span className="text-xs font-outfit text-blue-600">
            Showing payments that include future months
          </span>
        )}
      </div>
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
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Paid For</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Amount</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Payment Method</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Date</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Status</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Breakup</th>
                </tr>
              </thead>
              <tbody>
                {pagedPayments.map((payment) => {
                  const student = students[payment.student_id] || {};
                  return (
                    <tr key={payment.id} className="border-t hover:bg-gray-50" data-testid={`payment-row-${payment.id}`}>
                      <td className="font-outfit text-gray-900 py-3 px-4">{payment.transaction_id}</td>
                      <td className="font-outfit text-gray-900 py-3 px-4">{student.name || 'N/A'}</td>
                      <td className="font-outfit text-gray-600 py-3 px-4">{student.roll_number || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="font-outfit text-gray-700 text-sm">{formatPaidFor(payment)}</span>
                          {isAdvancePayment(payment) && (
                            <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-outfit font-semibold text-blue-700">Advance</span>
                          )}
                        </div>
                      </td>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 mt-2">
          <span className="text-sm font-outfit text-gray-600">
            Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, payments.length)} of {payments.length}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded-lg border text-sm font-outfit disabled:opacity-40 hover:bg-gray-50">Previous</button>
            <span className="text-sm font-outfit text-gray-700">{currentPage} / {totalPages}</span>
            <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded-lg border text-sm font-outfit disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}

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
                    {formatPaidFor(selectedPayment)}
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
