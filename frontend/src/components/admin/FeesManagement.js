import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Key } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function FeesManagement() {

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [feeDetails, setFeeDetails] = useState(null);
    const [frequency, setFrequency] = useState({});

    const handleFrequencyChange = (studentId, value) => {
        setFrequency((prev) => ({
          ...prev,
          [studentId]: value
        }));
      };
    
     useEffect(() => {
        fetchStudents();
      }, []);

    const fetchStudents = async () => {
        try {
          const response = await api.get('/admin/students');
          setStudents(response.data);
        } catch (error) {
          toast.error('Failed to fetch students');
        } finally {
          setLoading(false);
        }
      };

      const openFeeModal = async (student) => {

        const selectedFrequency = frequency[student.id] || "quarterly";
      
        const res = await api.post("/fees/calculate", {
          ...student,
          frequency: selectedFrequency
        });
      
        setFeeDetails(res.data);
        setShowFeeModal(true);
      };

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-fredoka font-bold text-sunny-navy">
            Fees Management
          </h1>
        </div>
  
        <div
          className="bg-white rounded-xl shadow-sm overflow-hidden"
          data-testid="fees-table"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">
                    Enrollment No
                  </th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">
                    Name
                  </th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">
                    Class
                  </th >
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">
                    Frequency
                  </th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">
                    Fee Pending
                  </th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">
                    Concession
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                                <tr key={student.id} className="border-t hover:bg-gray-50">
                                  <td className="font-outfit text-gray-900 py-3 px-4">{student.enrollment_number}</td>
                                  <td className="font-outfit text-gray-900 py-3 px-4">{student.name}</td>
                                  <td className="font-outfit text-gray-600 py-3 px-4">{student.class_name}</td>
                                  <td className="font-outfit text-gray-600 py-3 px-4">
                                  <select
                                    value={frequency[student.id] || "quarterly"}
                                    onChange={(e) => handleFrequencyChange(student.id, e.target.value)}
                                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-sunny-blue"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                </select>
                                  </td>
                                  
                                  <td className="py-3 px-4">
                                    <div className="flex space-x-2">
                                    <button
                                    onClick={() => openFeeModal(student)}
                                    className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200"
                                    data-testid={`fee-pending-${student.id}`}
                                    >
                                    View Fee
                                    </button>
                                    </div>
                                  </td>
                                  <td>
                                  <div className="flex space-x-2">
                                      <button
                                        onClick={() => openEditModal(student)}
                                        className="text-sunny-blue hover:text-sunny-navy"
                                        data-testid={`edit-student-${student.id}`}>
                                        <Edit size={18} />
                                      </button>
                                    </div>
                                  </td>
                                  
                                </tr>
                              ))}
              </tbody>
            </table>
            {showFeeModal && feeDetails && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
                    
                    <div className="bg-white rounded-lg p-6 w-96">

                    <h2 className="text-lg font-semibold mb-4">
                        Fee Details
                    </h2>

                    <div className="space-y-2">

                        <p>
                        <strong>Admission Fee:</strong> ₹{feeDetails.admission_fee}
                        </p>
                        <p>
                        <strong>Annual Fee:</strong> ₹{feeDetails.annual_fee}
                        </p>
                        <p>
                        <strong>Tuition Fee:</strong> ₹{feeDetails.tuition_fee}
                        </p>

                        <p>
                        <strong>Bus Fee:</strong> ₹{feeDetails.bus_fee}
                        </p>

                        <p>
                        <strong>Caution Money:</strong> ₹{feeDetails.caution_money}
                        </p>

                        <p className="font-bold">
                        Total Pending: ₹{feeDetails.total_fee}
                        </p>

                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                        onClick={() => setShowFeeModal(false)}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                        Close
                        </button>
                    </div>

                    </div>
                </div>
                )}
          </div>
        </div>
      </div>
    );
  }


