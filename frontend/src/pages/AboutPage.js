import React from 'react';
import { motion } from 'framer-motion';
import { Target, Heart, Star } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-sunny-cream" data-testid="about-page">
      <Navbar />
      
      {/* Hero */}
      <section className="py-20 bg-white" data-testid="about-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-fredoka font-bold text-sunny-navy mb-6">
              About <span className="text-sunny-yellow">Us</span>
            </h1>
            <p className="text-xl font-outfit text-gray-600 max-w-3xl mx-auto">
              Arunoday Vidyalay is established by the Mangalam Welfare Trust with the motto of providing holistic education. Over the years, it has built a stellar reputation for itself, thanks to its futuristic vision, modern and traditional teaching methods, and state-of-the-art infrastructure. Located on a sprawling campus of over seven thousand feet near Kuchera in Ayodhya. The school offers child-centric education, powered by a team of dedicated and competent faculty members. The entire establishment works with the sole objective of providing wholesome education to every child, fostering their physical, moral, intellectual and spiritual growth. We strive to create an inspiring and challenging environment that encourages our students to adopt, adapt and excel.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16" data-testid="our-story">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src="https://images.pexels.com/photos/5212329/pexels-photo-5212329.jpeg"
                alt="Our School"
                className="rounded-3xl border-4 border-sunny-navy feature-card-shadow"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-fredoka font-bold text-sunny-navy mb-6">Our Story</h2>
              <p className="font-outfit text-gray-600 text-lg leading-relaxed mb-4">
                Arunoday Vidyalay was founded with a vision to provide quality education that nurtures not just academic excellence, but also character development and life skills.
              </p>
              <p className="font-outfit text-gray-600 text-lg leading-relaxed mb-4">
                Our name "Arunoday" means "dawn" or "sunrise" - symbolizing new beginnings, hope, and the light of knowledge that dispels the darkness of ignorance.
              </p>
              <p className="font-outfit text-gray-600 text-lg leading-relaxed">
                Over the years, we have grown into a community of passionate educators, dedicated staff, and enthusiastic learners, all working together to create an environment where every child can thrive.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white" data-testid="values-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-fredoka font-bold text-sunny-navy text-center mb-12">
            Our Core <span className="text-sunny-yellow">Values</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: 'Excellence',
                description: 'We strive for excellence in everything we do, from academics to extracurricular activities.',
                color: 'bg-sunny-yellow',
              },
              {
                icon: Heart,
                title: 'Compassion',
                description: 'We foster a caring environment where every student feels valued, respected, and supported.',
                color: 'bg-sunny-blue',
              },
              {
                icon: Star,
                title: 'Innovation',
                description: 'We embrace modern teaching methods and technology to prepare students for the future.',
                color: 'bg-sunny-orange',
              },
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-sunny-cream rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow"
                data-testid={`value-card-${value.title.toLowerCase()}`}
              >
                <div className={`w-16 h-16 ${value.color} rounded-full flex items-center justify-center mb-6`}>
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-fredoka font-bold text-sunny-navy mb-4">{value.title}</h3>
                <p className="font-outfit text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure */}
      <section className="py-16" data-testid="infrastructure-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-fredoka font-bold text-sunny-navy text-center mb-12">
            World-Class <span className="text-sunny-yellow">Infrastructure</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Smart Classrooms',
                description: 'Interactive digital boards and multimedia resources for engaging learning',
                image: 'https://images.pexels.com/photos/5212329/pexels-photo-5212329.jpeg',
              },
              {
                title: 'Science & Computer Labs',
                description: 'Well-equipped laboratories for hands-on practical learning',
                image: 'https://images.pexels.com/photos/8471988/pexels-photo-8471988.jpeg',
              },
              {
                title: 'Library',
                description: 'Extensive collection of books, journals, and digital resources',
                image: 'https://images.pexels.com/photos/10638214/pexels-photo-10638214.jpeg',
              },
              {
                title: 'Sports Complex',
                description: 'Modern facilities for cricket, football, basketball, and indoor games',
                image: 'https://images.pexels.com/photos/8926889/pexels-photo-8926889.jpeg',
              },
            ].map((facility, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl overflow-hidden border-2 border-sunny-navy feature-card-shadow"
                data-testid={`facility-card-${facility.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <img src={facility.image} alt={facility.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-fredoka font-bold text-sunny-navy mb-2">{facility.title}</h3>
                  <p className="font-outfit text-gray-600">{facility.description}</p>
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