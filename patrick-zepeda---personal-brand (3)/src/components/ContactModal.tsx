import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, CheckCircle } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [urgency, setUrgency] = useState('3');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const googleFormData = new FormData();
    googleFormData.append('entry.1286933682', formData.get('firstName') as string);
    googleFormData.append('entry.370837008', formData.get('lastName') as string);
    googleFormData.append('entry.604185615', formData.get('email') as string);
    googleFormData.append('entry.531212216', formData.get('phone') as string);
    
    // Map selected services to the new Google Form field
    const services = formData.getAll('services');
    services.forEach(service => {
      googleFormData.append('entry.636352534', service as string);
    });
    
    // Map Urgency to the new Google Form field
    googleFormData.append('entry.1287721858', urgency);
    
    // Combine description and social links into the description field
    const facebook = formData.get('facebook') as string;
    const instagram = formData.get('instagram') as string;
    const linkedin = formData.get('linkedin') as string;
    const desc = formData.get('description') as string;
    
    const fullDescription = `
Facebook: ${facebook || 'N/A'}
Instagram: ${instagram || 'N/A'}
LinkedIn: ${linkedin || 'N/A'}

Description:
${desc}
    `.trim();

    googleFormData.append('entry.1287804119', fullDescription);
    googleFormData.append('entry.2001844038', formData.get('contactMethod') as string);

    const date = formData.get('date') as string;
    if (date) {
      const [year, month, day] = date.split('-');
      googleFormData.append('entry.1497977169_year', year);
      googleFormData.append('entry.1497977169_month', month);
      googleFormData.append('entry.1497977169_day', day);
      googleFormData.append('entry.1497977169', date);
    }

    try {
      await fetch('https://docs.google.com/forms/d/e/1FAIpQLSfJ2UOUBezt8PGgQq-MgLtqQ_hQEQA3uTQHXUoCaWf3DYm_yw/formResponse', {
        method: 'POST',
        mode: 'no-cors',
        body: googleFormData
      });
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting the form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50 p-6"
          >
            <div className="retro-window w-full">
              <div className="retro-window-header flex justify-between items-center">
                <span>SYS.CONTACT_FORM</span>
                <button onClick={onClose} className="hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 bg-synth-dark/90 text-gray-300">
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="w-16 h-16 text-synth-cyan mb-4 box-glow-cyan rounded-full" />
                    <h3 className="text-2xl font-bold text-white mb-2">Transmission Successful</h3>
                    <p className="text-gray-400">Your signal has been received. I'll be in touch soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Info */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-synth-cyan/20 pb-2">01. Identity</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-mono text-synth-cyan uppercase">First Name *</label>
                          <input required type="text" name="firstName" className="w-full bg-black/50 border border-synth-cyan/30 p-2.5 text-white focus:border-synth-cyan focus:outline-none focus:ring-1 focus:ring-synth-cyan transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-mono text-synth-cyan uppercase">Last Name *</label>
                          <input required type="text" name="lastName" className="w-full bg-black/50 border border-synth-cyan/30 p-2.5 text-white focus:border-synth-cyan focus:outline-none focus:ring-1 focus:ring-synth-cyan transition-all" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-mono text-synth-cyan uppercase">Email Address *</label>
                          <input required type="email" name="email" className="w-full bg-black/50 border border-synth-cyan/30 p-2.5 text-white focus:border-synth-cyan focus:outline-none focus:ring-1 focus:ring-synth-cyan transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-mono text-synth-cyan uppercase">Phone Number</label>
                          <input type="tel" name="phone" className="w-full bg-black/50 border border-synth-cyan/30 p-2.5 text-white focus:border-synth-cyan focus:outline-none focus:ring-1 focus:ring-synth-cyan transition-all" />
                        </div>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-synth-cyan/20 pb-2">02. Digital Footprint</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-mono text-gray-400 uppercase">LinkedIn URL</label>
                          <input type="url" name="linkedin" placeholder="https://" className="w-full bg-black/50 border border-synth-cyan/30 p-2.5 text-white focus:border-synth-cyan focus:outline-none focus:ring-1 focus:ring-synth-cyan transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-mono text-gray-400 uppercase">Instagram URL</label>
                          <input type="url" name="instagram" placeholder="https://" className="w-full bg-black/50 border border-synth-cyan/30 p-2.5 text-white focus:border-synth-cyan focus:outline-none focus:ring-1 focus:ring-synth-cyan transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-mono text-gray-400 uppercase">Facebook URL</label>
                          <input type="url" name="facebook" placeholder="https://" className="w-full bg-black/50 border border-synth-cyan/30 p-2.5 text-white focus:border-synth-cyan focus:outline-none focus:ring-1 focus:ring-synth-cyan transition-all" />
                        </div>
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-synth-cyan/20 pb-2">03. Project Scope</h4>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-mono text-synth-cyan uppercase block">Services Needed (Select all that apply)</label>
                        <div className="flex flex-wrap gap-6 p-3 bg-black/30 border border-synth-cyan/20">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" name="services" value="Website Design" className="w-4 h-4 accent-synth-cyan bg-black/50 border-synth-cyan/30" />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Website Design</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" name="services" value="Content Creation" className="w-4 h-4 accent-synth-cyan bg-black/50 border-synth-cyan/30" />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Content Creation</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" name="services" value="Strategy" className="w-4 h-4 accent-synth-cyan bg-black/50 border-synth-cyan/30" />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Strategy</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-mono text-synth-cyan uppercase flex justify-between">
                          <span>Project Urgency</span>
                          <span className="text-white font-bold">{urgency} / 5</span>
                        </label>
                        <input 
                          type="range" 
                          name="urgency" 
                          min="1" 
                          max="5" 
                          value={urgency}
                          onChange={(e) => setUrgency(e.target.value)}
                          className="w-full accent-synth-cyan cursor-pointer" 
                        />
                        <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase">
                          <span>1 - Chill</span>
                          <span>3 - Normal</span>
                          <span>5 - ASAP</span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-2">
                        <label className="text-xs font-mono text-synth-cyan uppercase">Description of Inquiry *</label>
                        <textarea required name="description" rows={4} className="w-full bg-black/50 border border-synth-cyan/30 p-2.5 text-white focus:border-synth-cyan focus:outline-none focus:ring-1 focus:ring-synth-cyan transition-all resize-none"></textarea>
                      </div>
                    </div>

                    {/* Logistics */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-blue-500/20 pb-2">04. Logistics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-mono text-blue-400 uppercase">Preferred Contact Method *</label>
                          <select required name="contactMethod" className="w-full bg-black/50 border border-blue-500/30 p-2.5 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all appearance-none">
                            <option value="">Select an option...</option>
                            <option value="Email">Email</option>
                            <option value="Phone Call">Phone Call</option>
                            <option value="Text Message (SMS)">Text Message (SMS)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-mono text-blue-400 uppercase">Earliest Available Date</label>
                          <input type="date" name="date" className="w-full bg-black/50 border border-blue-500/30 p-2.5 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all [color-scheme:dark]" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full py-4 bg-synth-cyan text-synth-bg font-bold hover:bg-white transition-all box-glow-cyan flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'TRANSMITTING...' : 'INITIALIZE SEQUENCE'}
                        {!isSubmitting && <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
