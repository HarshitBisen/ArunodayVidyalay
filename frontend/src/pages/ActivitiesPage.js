import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Music, Dumbbell, FlaskConical, Theater, Trophy } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ActivitiesPage() {
  const activities = [
    {
      icon: Palette,
      title: 'Arts & Crafts',
      description: 'Painting, drawing, sculpture, and creative workshops to nurture artistic talents.',
      image: 'https://images.pexels.com/photos/8467274/pexels-photo-8467274.jpeg',
      color: 'bg-sunny-yellow',
    },
    {
      icon: Music,
      title: 'Music & Dance',
      description: 'Vocal and instrumental music, classical and contemporary dance classes.',
      image: 'https://images.pexels.com/photos/8926889/pexels-photo-8926889.jpeg',
      color: 'bg-sunny-blue',
    },
    {
      icon: Dumbbell,
      title: 'Sports & Fitness',
      description: 'Cricket, football, basketball, athletics, yoga, and various indoor games.',
      image: 'https://images.pexels.com/photos/8926889/pexels-photo-8926889.jpeg',
      color: 'bg-sunny-orange',
    },
    {
      icon: FlaskConical,
      title: 'Science Club',
      description: 'Experiments, projects, science fairs, and hands-on learning activities.',
      image: 'https://images.pexels.com/photos/8471988/pexels-photo-8471988.jpeg',
      color: 'bg-sunny-yellow',
    },
    {
      icon: Theater,
      title: 'Drama & Theater',
      description: 'Stage performances, plays, public speaking, and creative expression.',
      image: 'https://images.pexels.com/photos/5212329/pexels-photo-5212329.jpeg',
      color: 'bg-sunny-blue',
    },
    {
      icon: Trophy,
      title: 'Competitions',
      description: 'Inter-school competitions, quizzes, debates, and olympiads.',
      image: 'https://images.pexels.com/photos/10638214/pexels-photo-10638214.jpeg',
      color: 'bg-sunny-orange',
    },
  ];

  return (
    <div className="min-h-screen bg-sunny-cream" data-testid="activities-page">
      <Navbar />
      
      {/* Hero */}
      <section className="py-20 bg-white" data-testid="activities-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-fredoka font-bold text-sunny-navy mb-6">
              Co-Curricular <span className="text-sunny-yellow">Activities</span>
            </h1>
            <p className="text-xl font-outfit text-gray-600 max-w-3xl mx-auto">
              Beyond academics, we offer diverse activities to discover and develop every student's unique talents
            </p>
          </motion.div>
        </div>
      </section>

      {/* Activities Grid */}
      <section className="py-16" data-testid="activities-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl overflow-hidden border-2 border-sunny-navy feature-card-shadow hover:scale-105 transition-transform duration-300"
                data-testid={`activity-card-${activity.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <img src={activity.image} alt={activity.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <div className={`w-14 h-14 ${activity.color} rounded-full flex items-center justify-center mb-4`}>
                    <activity.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-fredoka font-bold text-sunny-navy mb-3">{activity.title}</h3>
                  <p className="font-outfit text-gray-600">{activity.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Annual Events */}
      <section className="py-16 bg-white" data-testid="annual-events">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-fredoka font-bold text-sunny-navy text-center mb-12">
            Annual <span className="text-sunny-yellow">Events</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Sports Day',
                description: 'A day filled with athletic competitions, team games, and celebration of sportsmanship.',
                month: 'November',
              },
              {
                title: 'Annual Function',
                description: 'Showcasing student talents through cultural performances, drama, music, and dance.',
                month: 'December',
              },
              {
                title: 'Science Fair',
                description: 'Students present innovative projects, experiments, and scientific discoveries.',
                month: 'February',
              },
              {
                title: 'Art Exhibition',
                description: 'Displaying creative artworks, crafts, and artistic expressions of our students.',
                month: 'March',
              },
            ].map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-sunny-cream rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow"
                data-testid={`event-card-${event.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-2xl font-fredoka font-bold text-sunny-navy">{event.title}</h3>
                  <span className="bg-sunny-yellow text-sunny-navy font-bold px-4 py-1 rounded-full text-sm">
                    {event.month}
                  </span>
                </div>
                <p className="font-outfit text-gray-600 text-lg">{event.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Clubs */}
      <section className="py-16" data-testid="clubs-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-fredoka font-bold text-sunny-navy text-center mb-12">
            Student <span className="text-sunny-yellow">Clubs</span>
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              'Reading Club',
              'Eco Club',
              'Robotics Club',
              'Photography Club',
              'Chess Club',
              'Drama Club',
              'Quiz Club',
              'Community Service',
            ].map((club, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 border-2 border-sunny-border hover:border-sunny-yellow transition-colors text-center"
                data-testid={`club-item-${club.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <p className="font-fredoka text-lg font-bold text-sunny-navy">{club}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}