import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, GraduationCap, Users } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="font-outfit">Loading...</div>;
  }

  return (
    <div data-testid="student-profile">
      <h1 className="text-4xl font-fredoka font-bold text-sunny-navy mb-8">My Profile</h1>

      <div className="bg-white rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow max-w-3xl">
        {/* Header */}
        <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-gray-200">
          <div className="w-24 h-24 bg-sunny-yellow rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-sunny-navy" />
          </div>
          <div>
            <h2 className="text-3xl font-fredoka font-bold text-sunny-navy">{profile.name}</h2>
            <p className="font-outfit text-gray-600 text-lg">Roll Number: {profile.roll_number}</p>
            <p className="font-outfit text-gray-600">Class: {profile.class_name}-{profile.section}</p>
          </div>
        </div>

        {/* Personal Details */}
        <div className="mb-8">
          <h3 className="text-xl font-fredoka font-bold text-sunny-navy mb-4">Personal Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-sunny-blue mt-1" />
              <div>
                <p className="font-outfit text-sm text-gray-600">Email</p>
                <p className="font-outfit text-gray-900">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-sunny-blue mt-1" />
              <div>
                <p className="font-outfit text-sm text-gray-600">Phone</p>
                <p className="font-outfit text-gray-900">{profile.phone}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-sunny-blue mt-1" />
              <div>
                <p className="font-outfit text-sm text-gray-600">Address</p>
                <p className="font-outfit text-gray-900">{profile.address}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <GraduationCap className="w-5 h-5 text-sunny-blue mt-1" />
              <div>
                <p className="font-outfit text-sm text-gray-600">Class & Section</p>
                <p className="font-outfit text-gray-900">{profile.class_name}-{profile.section}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Parent Details */}
        <div>
          <h3 className="text-xl font-fredoka font-bold text-sunny-navy mb-4">Parent/Guardian Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-sunny-orange mt-1" />
              <div>
                <p className="font-outfit text-sm text-gray-600">Parent Name</p>
                <p className="font-outfit text-gray-900">{profile.parent_name}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-sunny-orange mt-1" />
              <div>
                <p className="font-outfit text-sm text-gray-600">Parent Phone</p>
                <p className="font-outfit text-gray-900">{profile.parent_phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}