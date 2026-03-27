/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import { 
  Terminal, MonitorPlay, Layers, 
  Zap, ChevronRight, Mail,
  Radio, Aperture, Settings, Users, PlaySquare, Search,
  Cpu, Code, Workflow, Camera, Briefcase, PenTool, Linkedin, BookOpen, Bot, Menu, X
} from 'lucide-react';

const ContactModal = lazy(() => import('./components/ContactModal').then(module => ({ default: module.ContactModal })));
// ⚡ Bolt Optimization: Lazy load heavy components to reduce initial bundle size.
// MediumFeed uses ScannerCardStream which includes the large 'three' library.
// FeaturedProject contains heavy animations and SVGs.
// Admin is a separate route, so it shouldn't be loaded for normal visitors.
// Expected Impact: Reduces main chunk size by >50% (~887kB down to ~354kB), improving Time To Interactive (TTI).
const MediumFeed = lazy(() => import('./components/MediumFeed'));
const FeaturedProject = lazy(() => import('./components/FeaturedProject'));
const Admin = lazy(() => import('./pages/Admin'));

const SectionHeading = ({ title, subtitle, align = 'left' }: { title: string, subtitle?: string, align?: 'left' | 'center' }) => (
  <div className={`mb-12 ${align === 'center' ? 'text-center' : ''}`}>
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-3xl md:text-5xl font-bold text-white mb-4 uppercase tracking-wider text-glow-cyan font-mono"
    >
      {title}
    </motion.h2>
    {subtitle && (
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-synth-magenta text-lg md:text-xl font-mono"
      >
        &gt; {subtitle}
      </motion.p>
    )}
  </div>
);

type RetroWindowProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
  key?: React.Key;
};

const RetroWindow = ({ title, children, className = '' }: RetroWindowProps) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    className={`retro-window box-glow-cyan ${className}`}
  >
    <div className="retro-window-header">
      <span>{title}.exe</span>
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500 opacity-80 window-dot text-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80 window-dot text-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500 opacity-80 window-dot text-green-500"></div>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </motion.div>
);

export default function App() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdminRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/admin' ||
      window.location.pathname.startsWith('/admin/') ||
      window.location.hash === '#/admin' ||
      window.location.hash.startsWith('#/admin/'));

  const isFormRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/form' ||
      window.location.pathname.startsWith('/form/') ||
      window.location.hash === '#/form' ||
      window.location.hash.startsWith('#/form/'));

  // Auto-open contact modal if on /form route
  React.useEffect(() => {
    if (isFormRoute) {
      setIsContactModalOpen(true);
    }
  }, [isFormRoute]);

  if (isAdminRoute) {
    return (
      <Suspense fallback={<div className="min-h-screen crt bg-black flex items-center justify-center text-synth-cyan font-mono animate-pulse">LOADING_ADMIN_SYS...</div>}>
        <Admin />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen crt relative selection:bg-synth-magenta selection:text-white">
      <div className="scanline-sweep"></div>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-synth-bg/80 backdrop-blur-md border-b border-synth-cyan/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.png" 
              alt="Brand Logo" 
              className="h-12 w-auto drop-shadow-[0_0_10px_rgba(255,0,255,0.5)]"
              onError={(e) => {
                // Hide if the user hasn't uploaded the image to public/logo.png yet
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="font-mono font-bold text-xl text-white tracking-tighter block">
              <span className="neon-flicker text-glow-cyan">P</span>_ZEPEDA<span className="text-synth-magenta animate-pulse">_</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 font-mono text-sm">
            <a href="#services" className="hover:text-synth-cyan transition-colors">SERVICES</a>
            <a href="#stack" className="hover:text-synth-cyan transition-colors">STACK</a>
            <a href="https://notebooklm.google.com/notebook/1ab7dcb4-d659-4da3-9d44-12bb22a62bee/preview" target="_blank" rel="noopener noreferrer" className="text-synth-cyan hover:text-white transition-colors flex items-center gap-1.5 bg-synth-cyan/10 px-3 py-1.5 rounded-full border border-synth-cyan/30">
              <Bot className="w-4 h-4" /> NOTEBOOK LM / JULES
            </a>
            <a href="#contact" className="text-synth-magenta hover:text-white transition-colors">CONTACT</a>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-synth-cyan hover:text-white transition-colors p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-full left-0 w-full bg-synth-bg/95 backdrop-blur-xl border-b border-synth-cyan/30 py-4 px-6 flex flex-col gap-4 font-mono text-sm shadow-2xl"
          >
            <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-synth-cyan transition-colors py-2 border-b border-synth-cyan/10">SERVICES</a>
            <a href="#stack" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-synth-cyan transition-colors py-2 border-b border-synth-cyan/10">STACK</a>
            <a href="https://notebooklm.google.com/notebook/1ab7dcb4-d659-4da3-9d44-12bb22a62bee/preview" target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} className="text-synth-cyan hover:text-white transition-colors flex items-center gap-2 py-2 border-b border-synth-cyan/10">
              <Bot className="w-4 h-4" /> NOTEBOOK LM / JULES
            </a>
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="text-synth-magenta hover:text-white transition-colors py-2">CONTACT</a>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="synth-grid-container">
          <div className="synth-grid"></div>
        </div>
        
        {/* Abstract Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-synth-purple rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-synth-magenta rounded-full mix-blend-screen filter blur-[120px] opacity-30"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full animate-hero-glitch">
          <div className="max-w-4xl">
            <div className="inline-block px-3 py-1 mb-6 border border-synth-magenta text-synth-magenta font-mono text-sm bg-synth-magenta/10 typewriter">
              SYS.INIT // CREATIVE_TECHNOLOGIST
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-6 uppercase tracking-tighter">
              <span className="text-white text-3d-synth">Analog</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-synth-magenta to-synth-cyan text-glow-magenta">Instinct.</span><br />
              <span className="text-white text-3d-synth">Digital</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-synth-cyan to-blue-500 text-glow-cyan">Precision.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl font-light leading-relaxed">
              I don't just build websites. I deploy personalized systems — wired for conversion, built to scale.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 font-mono">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsContactModalOpen(true)}
                className="px-8 py-4 bg-synth-cyan text-synth-bg font-bold hover:bg-white transition-all box-glow-cyan flex items-center justify-center gap-2 group hover-3d-glasses"
              >
                DESIGN WHAT'S NEXT
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.a 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="https://www.linkedin.com/in/patrickleezepeda/" 
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-4 border border-synth-magenta text-synth-magenta hover:bg-synth-magenta/10 transition-all flex items-center justify-center hover-3d-glasses"
                title="LinkedIn Profile"
              >
                <Linkedin className="w-5 h-5" />
              </motion.a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Project Section */}
      <Suspense fallback={<div className="py-24 lg:py-32 bg-synth-darker relative flex items-center justify-center min-h-[400px] text-synth-cyan font-mono animate-pulse border-y border-synth-cyan/20">LOADING_FEATURED_SYS...</div>}>
        <FeaturedProject />
      </Suspense>

      {/* Credibility & Roles */}
      <section className="py-24 bg-synth-dark relative border-y border-synth-cyan/20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading title="Identity Matrix" subtitle="Current Roles & Capabilities" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Cpu, title: "Creative Technologist & AI Innovator", desc: "Building the bridge between creative vision and automated execution." },
              { icon: Code, title: "Web Designer & Developer", desc: "Crafting high-performance, conversion-focused digital experiences across custom stacks." },
              { icon: Workflow, title: "Omni-channel Content Creator", desc: "Directing campaigns that span from traditional broadcast to hyper-targeted digital lifecycle flows." },
              { icon: Camera, title: "Photographer & Filmmaker", desc: "12+ years capturing the human element, ensuring digital systems never lose their soul." },
              { icon: Briefcase, title: "Marketing & Sales Ops Strategist", desc: "Currently leading digital experience and AI-driven initiatives for a national CPG portfolio." },
              { icon: PenTool, title: "Copywriter & Brand Storyteller", desc: "Engineering conversion-driven copy and narrative storytelling across digital touchpoints. From punchy UX microcopy to high-converting landing pages, I synthesize brand voices that cut through the static." }
            ].map((role, i) => (
              <RetroWindow key={i} title={`role_0${i+1}`}>
                <role.icon className="w-8 h-8 text-synth-magenta mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{role.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{role.desc}</p>
              </RetroWindow>
            ))}
          </div>
        </div>
      </section>

      {/* Medium Feed Section */}
      <Suspense fallback={<div className="py-24 relative overflow-hidden bg-synth-dark border-t border-synth-cyan/20 flex items-center justify-center min-h-[400px] text-synth-cyan font-mono animate-pulse">LOADING_TRANSMISSIONS...</div>}>
        <MediumFeed />
      </Suspense>

      {/* What I Do (Services) */}
      <section id="services" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading title="Core Services" subtitle="High-Leverage Engagements" align="center" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
            <motion.div 
              whileHover={{ y: -10, boxShadow: "0 0 20px rgba(255,0,255,0.3)" }}
              className="border border-synth-magenta/30 bg-synth-dark/50 p-8 relative group transition-shadow"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-synth-magenta to-transparent"></div>
              <MonitorPlay className="w-10 h-10 text-synth-magenta mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">AI-Driven Brand Sites</h3>
              <p className="text-gray-400 mb-6">High-performance web properties that don't just look good—they learn, adapt, and convert. Built on modern stacks with AI-native integrations.</p>
              <ul className="space-y-3 font-mono text-sm text-gray-300">
                <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-synth-cyan shrink-0 mt-0.5" /> Headless & Custom Architecture</li>
                <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-synth-cyan shrink-0 mt-0.5" /> Shopify & WordPress Optimization</li>
                <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-synth-cyan shrink-0 mt-0.5" /> Dynamic AI Content Integration</li>
              </ul>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10, boxShadow: "0 0 20px rgba(0,255,255,0.3)" }}
              className="border border-synth-cyan/30 bg-synth-dark/50 p-8 relative group transition-shadow"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-synth-cyan to-transparent"></div>
              <Layers className="w-10 h-10 text-synth-cyan mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Omni-Channel Campaign Systems</h3>
              <p className="text-gray-400 mb-6">Cohesive, automated marketing engines that deliver the right message across email, SMS, web, and social, without the manual overhead.</p>
              <ul className="space-y-3 font-mono text-sm text-gray-300">
                <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-synth-magenta shrink-0 mt-0.5" /> Automated Email Marketing</li>
                <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-synth-magenta shrink-0 mt-0.5" /> HubSpot & Segmentation Setup</li>
                <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-synth-magenta shrink-0 mt-0.5" /> Analytics & Conversion Tracking</li>
              </ul>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10, boxShadow: "0 0 20px rgba(59,130,246,0.3)" }}
              className="border border-blue-500/30 bg-synth-dark/50 p-8 relative group transition-shadow"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent"></div>
              <Terminal className="w-10 h-10 text-blue-500 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Niche AI Tools & Mini-Apps</h3>
              <p className="text-gray-400 mb-6">Custom internal tools, AI agents, and automation flows designed to eliminate bottlenecks and scale your team's capabilities.</p>
              <ul className="space-y-3 font-mono text-sm text-gray-300">
                <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Custom AI Agent Development</li>
                <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Internal Workflow Automation</li>
                <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Data Processing Pipelines</li>
              </ul>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10, boxShadow: "0 0 20px rgba(168,85,247,0.3)" }}
              className="border border-purple-500/30 bg-synth-dark/50 p-8 relative group transition-shadow"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-transparent"></div>
              <Search className="w-10 h-10 text-purple-500 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">AEO & Generative Search</h3>
              <p className="text-gray-400 mb-6">Future-proofing brand visibility for the AI era. Optimizing content architecture to be cited by LLMs, AI agents, and generative search engines.</p>
              <ul className="space-y-3 font-mono text-sm text-gray-300">
                <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" /> Answer Engine Optimization (AEO)</li>
                <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" /> LLM Knowledge Graph Structuring</li>
                <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" /> Semantic Content Architecture</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Stacks (Analog + AI) */}
      <section id="stack" className="py-24 bg-synth-dark border-y border-synth-cyan/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Analog Stack */}
            <div>
              <SectionHeading title="The Analog Stack" subtitle="Roots & Foundation" />
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                My foundation wasn't built in a code editor. It was built in live TV control rooms, darkrooms, and on stage.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 bg-synth-magenta/20 p-2 rounded text-synth-magenta h-fit">
                    <Aperture className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">Composition & Framing</h4>
                    <p className="text-gray-400">Years behind a lens taught me how to direct the eye and tell a story in a single frame.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 bg-synth-magenta/20 p-2 rounded text-synth-magenta h-fit">
                    <PlaySquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">Timing & Rhythm</h4>
                    <p className="text-gray-400">Live broadcast and music ingrained a sense of pacing that translates directly to user experience and campaign sequencing.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 bg-synth-magenta/20 p-2 rounded text-synth-magenta h-fit">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">Live Constraints</h4>
                    <p className="text-gray-400">When you're on air, there are no do-overs. I build digital systems with that same demand for reliability and grace under pressure.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Stack */}
            <div>
              <SectionHeading title="The AI Stack" subtitle="Tools & Systems" />
              
              <div className="space-y-4 font-mono">
                <RetroWindow title="intelligence.sys">
                  <div className="text-synth-cyan mb-2">Google Gemini / NotebookLM / Antigravity / Claude & Claude Code</div>
                </RetroWindow>

                <RetroWindow title="nervous_system.exe">
                  <div className="text-synth-magenta mb-2">n8n, APIs, MCP, CLI, HubSpot, GA4, Clarity</div>
                </RetroWindow>

                <RetroWindow title="infrastructure.cfg">
                  <div className="text-blue-400 mb-2">Shopify, WordPress, Webflow, Netlify, Supabase, Firebase</div>
                </RetroWindow>

                <RetroWindow title="visualization.exe">
                  <div className="text-yellow-400 mb-2">Figma / Figma AI / AI Studio</div>
                </RetroWindow>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* For Teams & Partners */}
      <section className="py-24 bg-synth-dark border-y border-synth-cyan/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1">
              <SectionHeading title="For Teams & Partners" subtitle="Engagement Models" />
              <p className="text-xl text-gray-300 mb-6">
                I don't just deliver assets; I build systems and the playbooks to run them.
              </p>
              <p className="text-gray-400 mb-8">
                Whether you need someone to lead the charge or architect a solution for your existing team to operate, I structure engagements for maximum leverage and knowledge transfer.
              </p>
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <div className="border border-synth-cyan/30 p-6 bg-synth-bg/50 hover:bg-synth-cyan/5 transition-colors">
                <h4 className="text-xl font-bold text-synth-cyan mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5" /> Growth Partner
                </h4>
                <p className="text-gray-400 text-sm">Ongoing, high-leverage strategic guidance and execution for scaling brands. (Retainer)</p>
              </div>
              
              <div className="border border-synth-magenta/30 p-6 bg-synth-bg/50 hover:bg-synth-magenta/5 transition-colors">
                <h4 className="text-xl font-bold text-synth-magenta mb-2 flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Embedded CMO / Head of Digital
                </h4>
                <p className="text-gray-400 text-sm">Fractional leadership to align your marketing, tech stack, and creative teams. (Fractional)</p>
              </div>
              
              <div className="border border-blue-500/30 p-6 bg-synth-bg/50 hover:bg-blue-500/5 transition-colors">
                <h4 className="text-xl font-bold text-blue-500 mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Systems Sprint
                </h4>
                <p className="text-gray-400 text-sm">Intensive, short-term engagements to audit, architect, and deploy specific AI or automation workflows. (Project)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-synth-purple/20"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black text-white mb-8 uppercase tracking-tighter text-glow-magenta"
          >
            Let's Design What's Next.
          </motion.h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Whether you're a CPG giant, a scaling DTC brand, or an AI-native startup, the future belongs to those who build the best systems. Let's build yours.
          </p>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsContactModalOpen(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-synth-magenta text-white font-bold text-lg hover:bg-white hover:text-synth-magenta transition-all box-glow-magenta font-mono hover-3d-glasses"
          >
            <Mail className="w-6 h-6" />
            INITIALIZE CONTACT
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-synth-cyan/20 bg-synth-dark text-center font-mono text-sm text-gray-500">
        <div className="flex justify-center items-center gap-6 mb-4">
          <a href="https://www.linkedin.com/in/patrickleezepeda/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-synth-magenta transition-colors" title="LinkedIn">
            <Linkedin className="w-5 h-5" />
          </a>
          <a href="https://patrickzepeda.medium.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-synth-cyan transition-colors" title="Medium">
            <BookOpen className="w-5 h-5" />
          </a>
          <a href="https://notebooklm.google.com/notebook/1ab7dcb4-d659-4da3-9d44-12bb22a62bee/preview" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-synth-cyan transition-colors flex items-center gap-2" title="Chat with my Notebook LM research">
            <Bot className="w-5 h-5" />
            <span className="hidden sm:inline">NOTEBOOK LM / JULES</span>
          </a>
        </div>
        <p className="hover-glitch inline-block cursor-default">SYSTEM.HALT // © {new Date().getFullYear()} PATRICK ZEPEDA. ALL RIGHTS RESERVED.</p>
      </footer>

      <Suspense fallback={null}>
        <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      </Suspense>
    </div>
  );
}
