import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';

const classOptions = ['Nursery', 'JKG', 'SKG', ...Array.from({ length: 7 }, (_, i) => String(i + 1))];

export default function ReportsView() {
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [status, setStatus] = useState('pending');
  const [downloading, setDownloading] = useState(false);

  const toggleClass = (className) => {
    setSelectedClasses((classes) => (
      classes.includes(className) ? classes.filter((item) => item !== className) : [...classes, className]
    ));
  };

  const downloadReport = async () => {
    if (!selectedClasses.length) {
      toast.error('Select at least one class');
      return;
    }
    setDownloading(true);
    try {
      const params = new URLSearchParams({ status });
      selectedClasses.forEach((className) => params.append('class_name', className));
      const response = await api.get('/admin/reports/fees', { params, responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fee-${status}-report.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download the report');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div data-testid="reports-view">
      <h1 className="text-4xl font-fredoka font-bold text-sunny-navy mb-8">Reports</h1>
      <div className="rounded-2xl shadow-lg border border-sunny-border p-6 bg-white max-w-3xl">
        <p className="font-outfit text-gray-600 mb-6">
          Reports use outstanding dues through the current month. Paid amounts match the Fees page paid summary.
        </p>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[220px]">
            <span id="report-class-label" className="block font-outfit font-semibold mb-2">Class</span>
            <details className="relative">
              <summary aria-labelledby="report-class-label" className="cursor-pointer rounded-md border px-3 py-2 bg-white">
                {selectedClasses.length ? selectedClasses.join(', ') : 'Select classes'}
              </summary>
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg p-2">
                {classOptions.map((className) => (
                  <label key={className} className="flex items-center gap-2 px-2 py-1 font-outfit">
                    <input type="checkbox" checked={selectedClasses.includes(className)} onChange={() => toggleClass(className)} />
                    {className}
                  </label>
                ))}
              </div>
            </details>
          </div>
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="report-status" className="block font-outfit font-semibold mb-2">Pending/Paid</label>
            <select id="report-status" value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-md border px-3 py-2 bg-white">
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
        <Button type="button" onClick={downloadReport} disabled={downloading || !selectedClasses.length}>
          <Download size={18} className="mr-2" />
          {downloading ? 'Downloading...' : 'Download Excel'}
        </Button>
      </div>
    </div>
  );
}
