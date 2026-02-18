import React from 'react';
import { motion } from 'framer-motion';
import { Target, Lightbulb, Users, Globe } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AimPage() {
  return (
    <div className="min-h-screen bg-sunny-cream" data-testid="aim-page">
      <Navbar />
      
      {/* Hero */}
      <section className="py-20 bg-white" data-testid="aim-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-fredoka font-bold text-sunny-navy mb-6">
              Our <span className="text-sunny-yellow">Aim</span>
            </h1>
            <p className="text-xl font-outfit text-gray-600 max-w-3xl mx-auto">
              To cultivate a nurturing and learning environment where every child discovers their unique potential, foster a lifelong love for learning, and empower them to become compassionate and responsible global citizens. To achieve this vision, our mission is to provide a stimulating and inclusive curriculum that caters to diverse learning styles, encouraging curiosity, critical thinking, and creativity. We are committed to nurturing strong character development through value-based education, promoting respect, empathy, and integrity. By a building a cooperative partnership between students, teachers, parents and the community, we create a supportive network that empowers each child to thrive and succeed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16" data-testid="mission-vision">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow"
              data-testid="mission-card"
            >
              <div className="w-16 h-16 bg-sunny-yellow rounded-full flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-sunny-navy" />
              </div>
              <h2 className="text-3xl font-fredoka font-bold text-sunny-navy mb-4">Our Mission</h2>
              <p className="font-outfit text-gray-600 text-lg leading-relaxed mb-4">
                To provide a nurturing environment where every student can discover their potential, develop critical thinking skills, and become responsible global citizens.
              </p>
              <ul className="space-y-3 font-outfit text-gray-600">
                <li className="flex items-start">
                  <span className="text-sunny-yellow mr-2">•</span>
                  <span>Foster academic excellence through innovative teaching methods</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sunny-yellow mr-2">•</span>
                  <span>Promote holistic development of mind, body, and character</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sunny-yellow mr-2">•</span>
                  <span>Cultivate values of integrity, compassion, and social responsibility</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow"
              data-testid="vision-card"
            >
              <div className="w-16 h-16 bg-sunny-blue rounded-full flex items-center justify-center mb-6">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-fredoka font-bold text-sunny-navy mb-4">Our Vision</h2>
              <p className="font-outfit text-gray-600 text-lg leading-relaxed mb-4">
                To be a leading educational institution recognized for excellence in academics, innovation in teaching, and commitment to character building.
              </p>
              <ul className="space-y-3 font-outfit text-gray-600">
                <li className="flex items-start">
                  <span className="text-sunny-blue mr-2">•</span>
                  <span>Create future leaders who contribute positively to society</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sunny-blue mr-2">•</span>
                  <span>Build a community of lifelong learners and thinkers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sunny-blue mr-2">•</span>
                  <span>Set benchmarks in educational excellence and innovation</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Educational Philosophy */}
      <section className="py-16 bg-white" data-testid="philosophy-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-fredoka font-bold text-sunny-navy text-center mb-12">
            Educational <span className="text-sunny-yellow">Philosophy</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Student-Centered Learning',
                description: 'We believe every student is unique. Our approach adapts to individual learning styles and paces.',
                color: 'bg-sunny-yellow',
              },
              {
                icon: Lightbulb,
                title: 'Experiential Learning',
                description: 'Learning by doing. We emphasize hands-on activities, projects, and real-world applications.',
                color: 'bg-sunny-blue',
              },
              {
                icon: Globe,
                title: 'Global Perspective',
                description: 'Preparing students for a connected world with awareness of diverse cultures and global issues.',
                color: 'bg-sunny-orange',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-sunny-cream rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow"
                data-testid={`philosophy-card-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center mb-6`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-fredoka font-bold text-sunny-navy mb-4">{item.title}</h3>
                <p className="font-outfit text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Goals */}
      <section className="py-16" data-testid="goals-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-fredoka font-bold text-sunny-navy text-center mb-12">
            Our <span className="text-sunny-yellow">Goals</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'Achieve 100% academic excellence',
              'Develop critical thinking and problem-solving skills',
              'Foster creativity and innovation',
              'Build strong moral and ethical values',
              'Promote physical fitness and sports',
              'Enhance communication and interpersonal skills',
              'Encourage environmental awareness',
              'Prepare students for higher education',
              'Create confident and responsible citizens',
            ].map((goal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 border-2 border-sunny-border hover:border-sunny-yellow transition-colors"
                data-testid={`goal-item-${index}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-sunny-yellow rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sunny-navy font-bold text-sm">{index + 1}</span>
                  </div>
                  <p className="font-outfit text-gray-700 text-lg">{goal}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}