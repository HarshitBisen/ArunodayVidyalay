import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', formData);
      toast.success('Thank you! We will get back to you soon.');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-sunny-cream" data-testid="contact-page">
      <Navbar />
      
      {/* Hero */}
      <section className="py-20 bg-white" data-testid="contact-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-fredoka font-bold text-sunny-navy mb-6">
              Contact <span className="text-sunny-yellow">Us</span>
            </h1>
            <p className="text-xl font-outfit text-gray-600 max-w-3xl mx-auto">
              Get in touch with us. We'd love to hear from you!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16" data-testid="contact-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow"
              data-testid="contact-form"
            >
              <h2 className="text-3xl font-fredoka font-bold text-sunny-navy mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-2">Name *</label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border-2 border-sunny-border rounded-lg px-4 py-2 focus:border-sunny-orange focus:ring-0 outline-none"
                    data-testid="contact-name-input"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-2">Email *</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border-2 border-sunny-border rounded-lg px-4 py-2 focus:border-sunny-orange focus:ring-0 outline-none"
                    data-testid="contact-email-input"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-2">Phone *</label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full border-2 border-sunny-border rounded-lg px-4 py-2 focus:border-sunny-orange focus:ring-0 outline-none"
                    data-testid="contact-phone-input"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-2">Message *</label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full border-2 border-sunny-border rounded-lg px-4 py-2 focus:border-sunny-orange focus:ring-0 outline-none resize-none"
                    data-testid="contact-message-input"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sunny-yellow text-sunny-navy font-bold rounded-full px-8 py-3 neo-brutal-shadow hover:bg-sunny-yellow"
                  data-testid="contact-submit-button"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow" data-testid="contact-info-address">
                <div className="w-14 h-14 bg-sunny-yellow rounded-full flex items-center justify-center mb-4">
                  <MapPin className="w-7 h-7 text-sunny-navy" />
                </div>
                <h3 className="text-xl font-fredoka font-bold text-sunny-navy mb-2">Visit Us</h3>
                <p className="font-outfit text-gray-600">
                  123 Education Street,<br />
                  Learning City, State - 110001,<br />
                  India
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow" data-testid="contact-info-phone">
                <div className="w-14 h-14 bg-sunny-blue rounded-full flex items-center justify-center mb-4">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-fredoka font-bold text-sunny-navy mb-2">Call Us</h3>
                <p className="font-outfit text-gray-600">
                  +91 9876543210<br />
                  +91 9876543211
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow" data-testid="contact-info-email">
                <div className="w-14 h-14 bg-sunny-orange rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-fredoka font-bold text-sunny-navy mb-2">Email Us</h3>
                <p className="font-outfit text-gray-600">
                  info@arunodayvidyalay.com<br />
                  admission@arunodayvidyalay.com
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow" data-testid="contact-info-hours">
                <div className="w-14 h-14 bg-sunny-yellow rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-7 h-7 text-sunny-navy" />
                </div>
                <h3 className="text-xl font-fredoka font-bold text-sunny-navy mb-2">Office Hours</h3>
                <p className="font-outfit text-gray-600">
                  Monday - Friday: 8:00 AM - 4:00 PM<br />
                  Saturday: 8:00 AM - 12:00 PM<br />
                  Sunday: Closed
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}