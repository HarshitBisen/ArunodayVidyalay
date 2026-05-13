import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, GraduationCap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const policyContent = {
  refund: {
    title: 'Refund Policy',
    body: `Welcome to Arunoday Vidyalay. By taking admission in the school, parents/guardians agree to the following cancellation and refund terms.

1. Admission Cancellation
	•	Admission once confirmed may be cancelled only through a written application submitted by the parent/guardian to the school administration.
	•	Cancellation requests will be processed as per school rules and applicable procedures.

2. Refund Policy
	•	The school does not provide refunds for:
	•	Admission fees
	•	Tuition fees
	•	Annual charges
	•	Examination fees
	•	Transport fees
	•	Activity fees
	•	Any other charges paid to the school

3. Caution Money Refund
	•	A refundable Caution Money/Security Deposit is collected only once at the time of admission.
	•	The caution money will be refunded only when:
	•	The student officially leaves the school, and
	•	All dues, fines, library books, uniforms, ID cards, or other school property (if applicable) are cleared/returned.
	•	The refund process may take reasonable processing time after verification by the school administration.

4. Mode of Refund
	•	Approved caution money refunds will be credited through bank transfer or any other mode decided by the school administration.

5. School’s Right
	•	The school reserves the right to modify or update this policy at any time without prior notice.`,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `Welcome to Arunoday Vidyalay. We value the privacy of students, parents, staff, and website visitors.

1. Information We Collect

The school may collect the following information:
	•	Student and parent/guardian details
	•	Contact information such as phone number, email address, and address
	•	Academic and admission-related information
	•	Information submitted through website forms or enquiries

2. Use of Information

The collected information may be used for:
	•	Admission and academic purposes
	•	Communication with parents/guardians
	•	School administration and record maintenance
	•	Responding to enquiries and support requests
	•	Improving school services and website functionality

3. Information Sharing
	•	The school does not sell, trade, or rent personal information to third parties.
	•	Information may be shared only when required by law or government authorities.

4. Data Security
	•	The school takes reasonable measures to protect personal information from unauthorized access, misuse, or disclosure.

5. Website Usage
	•	The website may use basic cookies or analytics tools to improve user experience and website performance.

6. External Links
	•	The school website may contain links to external websites. The school is not responsible for the privacy practices or content of such websites.

7. Consent
	•	By using the website or submitting information to the school, users consent to this Privacy Policy.

8. Policy Updates
	•	The school reserves the right to update or modify this Privacy Policy at any time without prior notice.
`,
  },
};

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
                <span>29/1902 Saraynamu Shekhanpur Milkipur Ayodhya U.P - 224158</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={18} className="text-sunny-yellow flex-shrink-0" />
                <span>7518466635, 8765442626</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={18} className="text-sunny-yellow flex-shrink-0" />
                <span>arunodayvidyalay2022@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center font-outfit text-sm">
          <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
            {Object.entries(policyContent).map(([key, policy]) => (
              <Dialog key={key}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-gray-300 hover:text-sunny-yellow transition-colors underline underline-offset-4"
                    data-testid={`${key}-policy-link`}
                  >
                    {policy.title}
                  </button>
                </DialogTrigger>
                <DialogContent
                  className="max-w-md bg-white text-sunny-navy border-2 border-sunny-navy rounded-2xl"
                  data-testid={`${key}-policy-modal`}
                >
                  <DialogHeader>
                    <DialogTitle className="font-fredoka text-2xl text-sunny-navy">
                      {policy.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto pr-2">
                    <p className="font-outfit text-left text-sm leading-7 text-gray-700 whitespace-pre-line">
                      {policy.body}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
          <p>&copy; 2025 Arunoday Vidyalay. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
