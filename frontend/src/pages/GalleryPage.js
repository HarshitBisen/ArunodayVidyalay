import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function GalleryPage() {
  const galleryImages = [
    {
      url: 'https://images.unsplash.com/photo-1755432651903-9d274c16d9a8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBzY2hvb2wlMjBidWlsZGluZyUyMGV4dGVyaW9yJTIwc3VubnklMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzY5MjcxNTc5fDA&ixlib=rb-4.1.0&q=85',
      title: 'School Campus',
      category: 'Infrastructure',
    },
    {
      url: 'https://images.pexels.com/photos/5212329/pexels-photo-5212329.jpeg',
      title: 'Classroom Learning',
      category: 'Academics',
    },
    {
      url: 'https://images.pexels.com/photos/8471988/pexels-photo-8471988.jpeg',
      title: 'Science Laboratory',
      category: 'Facilities',
    },
    {
      url: 'https://images.pexels.com/photos/10638214/pexels-photo-10638214.jpeg',
      title: 'Library',
      category: 'Facilities',
    },
    {
      url: 'https://images.pexels.com/photos/8926889/pexels-photo-8926889.jpeg',
      title: 'Sports Activity',
      category: 'Sports',
    },
    {
      url: 'https://images.pexels.com/photos/8467274/pexels-photo-8467274.jpeg',
      title: 'Art Class',
      category: 'Arts',
    },
  ];

  return (
    <div className="min-h-screen bg-sunny-cream" data-testid="gallery-page">
      <Navbar />
      
      {/* Hero */}
      <section className="py-20 bg-white" data-testid="gallery-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-fredoka font-bold text-sunny-navy mb-6">
              Photo <span className="text-sunny-yellow">Gallery</span>
            </h1>
            <p className="text-xl font-outfit text-gray-600 max-w-3xl mx-auto">
              A glimpse into life at Arunoday Vidyalay - moments of learning, growth, and joy
            </p>
          </motion.div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16" data-testid="gallery-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleryImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="group cursor-pointer"
                data-testid={`gallery-image-${index}`}
              >
                <div className="rounded-3xl overflow-hidden border-2 border-sunny-navy feature-card-shadow">
                  <div className="relative overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-72 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-sunny-navy bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-4">
                        <h3 className="text-2xl font-fredoka font-bold text-white mb-2">{image.title}</h3>
                        <p className="text-sunny-yellow font-outfit">{image.category}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* More Photos Coming Soon */}
      <section className="py-16 bg-white" data-testid="coming-soon">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-sunny-cream rounded-3xl p-12 border-2 border-sunny-navy feature-card-shadow"
          >
            <h2 className="text-3xl font-fredoka font-bold text-sunny-navy mb-4">
              More Photos Coming Soon!
            </h2>
            <p className="font-outfit text-gray-600 text-lg">
              We regularly update our gallery with new photos from events, activities, and daily life at school.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}