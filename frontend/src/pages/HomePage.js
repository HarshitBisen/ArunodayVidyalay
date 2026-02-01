import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Users, BookOpen, Trophy } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-sunny-cream" data-testid="home-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="grain-texture absolute inset-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-fredoka font-bold text-sunny-navy leading-tight mb-6">
                Welcome to<br />
                <span className="text-sunny-yellow">Arunoday Vidyalay</span>
              </h1>
              <p className="text-lg md:text-xl font-outfit text-sunny-navy mb-8 leading-relaxed">
                Nurturing young minds with quality education, fostering creativity, and building future leaders through innovation and dedication.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/about"
                  className="bg-sunny-yellow text-sunny-navy font-bold rounded-full px-8 py-3 neo-brutal-shadow inline-flex items-center space-x-2"
                  data-testid="learn-more-button"
                >
                  <span>Learn More</span>
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/login"
                  className="bg-transparent border-2 border-sunny-navy text-sunny-navy font-bold rounded-full px-8 py-3 hover:bg-sunny-navy hover:text-white transition-colors"
                  data-testid="portal-login-button"
                >
                  Student/Admin Portal
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden border-4 border-sunny-navy feature-card-shadow">
                <img
                  src="https://images.unsplash.com/photo-1755432651903-9d274c16d9a8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBzY2hvb2wlMjBidWlsZGluZyUyMGV4dGVyaW9yJTIwc3VubnklMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzY5MjcxNTc5fDA&ixlib=rb-4.1.0&q=85"
                  alt="Arunoday Vidyalay Campus"
                  className="w-full h-96 object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section - Bento Grid */}
      <section className="py-16 md:py-20" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Users, value: '500+', label: 'Students', color: 'bg-sunny-blue' },
              { icon: Award, value: '25+', label: 'Expert Teachers', color: 'bg-sunny-yellow' },
              { icon: BookOpen, value: '50+', label: 'Courses', color: 'bg-sunny-orange' },
              { icon: Trophy, value: '100+', label: 'Awards Won', color: 'bg-sunny-blue' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow"
                data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className={`w-16 h-16 ${stat.color} rounded-full flex items-center justify-center mb-4`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-fredoka font-bold text-sunny-navy mb-2">{stat.value}</div>
                <div className="text-lg font-outfit text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="py-16 md:py-20 bg-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-fredoka font-bold text-sunny-navy mb-4">
              Why Choose <span className="text-sunny-yellow">Arunoday?</span>
            </h2>
            <p className="text-xl font-outfit text-gray-600 max-w-2xl mx-auto">
              We provide comprehensive education that goes beyond textbooks
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Quality Education',
                description: 'Experienced faculty delivering world-class education with modern teaching methods',
                image: 'https://images.pexels.com/photos/5212329/pexels-photo-5212329.jpeg',
              },
              {
                title: 'Modern Infrastructure',
                description: 'State-of-the-art facilities including smart classrooms, labs, and sports complex',
                image: 'https://images.pexels.com/photos/8471988/pexels-photo-8471988.jpeg',
              },
              {
                title: 'Holistic Development',
                description: 'Focus on academics, sports, arts, and personality development for well-rounded growth',
                image: 'https://images.pexels.com/photos/8926889/pexels-photo-8926889.jpeg',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-sunny-cream rounded-3xl overflow-hidden border-2 border-sunny-navy feature-card-shadow hover:scale-105 transition-transform duration-300"
                data-testid={`feature-card-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <img src={feature.image} alt={feature.title} className="w-full h-48 object-cover" />
                <div className="p-8">
                  <h3 className="text-2xl font-fredoka font-bold text-sunny-navy mb-3">{feature.title}</h3>
                  <p className="font-outfit text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-sunny-yellow" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-fredoka font-bold text-sunny-navy mb-6">
            Join Our Growing Family
          </h2>
          <p className="text-xl font-outfit text-sunny-navy mb-8">
            Enroll your child today and give them the gift of quality education
          </p>
          <Link
            to="/contact"
            className="bg-sunny-navy text-white font-bold rounded-full px-10 py-4 inline-flex items-center space-x-2 hover:scale-105 transition-transform"
            data-testid="contact-cta-button"
          >
            <span>Contact Us</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}