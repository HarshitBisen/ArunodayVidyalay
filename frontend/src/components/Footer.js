import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-sunny-navy text-white mt-20" data-testid="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-sunny-yellow rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-sunny-navy" />
              </div>
              <h3 className="text-xl font-fredoka font-bold">Arunoday Vidyalay</h3>
            </div>
            <p className="font-outfit text-sm text-gray-300">
              Empowering young minds to achieve excellence through quality education and holistic development.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-fredoka font-bold mb-4">Quick Links</h3>
            <div className="space-y-2 font-outfit text-sm">
              <Link to="/about" className="block hover:text-sunny-yellow transition-colors">
                About Us
              </Link>
              <Link to="/aim" className="block hover:text-sunny-yellow transition-colors">
                Our Aim
              </Link>
              <Link to="/activities" className="block hover:text-sunny-yellow transition-colors">
                Activities
              </Link>
              <Link to="/gallery" className="block hover:text-sunny-yellow transition-colors">
                Gallery
              </Link>
              <Link to="/contact" className="block hover:text-sunny-yellow transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-fredoka font-bold mb-4">Contact Us</h3>
            <div className="space-y-3 font-outfit text-sm">
              <div className="flex items-start space-x-2">
                <MapPin size={18} className="text-sunny-yellow mt-1 flex-shrink-0" />
                <span>123 Education Street, Learning City, State - 110001</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={18} className="text-sunny-yellow flex-shrink-0" />
                <span>+91 9876543210</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={18} className="text-sunny-yellow flex-shrink-0" />
                <span>info@arunodayvidyalay.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center font-outfit text-sm">
          <p>&copy; 2025 Arunoday Vidyalay. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}