import React from 'react';
import { ExternalLink, Sparkles, Code } from 'lucide-react';
import { motion } from 'motion/react';

const FeaturedProject = () => {
  return (
    <section
      id="latest-build"
      className="py-24 lg:py-32 bg-synth-darker relative overflow-hidden border-y border-synth-cyan/20 lg:min-h-[800px] scroll-mt-24"
    >
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-synth-purple/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-synth-cyan/10 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-1/2 space-y-6 lg:space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-synth-cyan/10 border border-synth-cyan/30 text-synth-cyan text-sm font-mono uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>My Latest Featured Build</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-synth-cyan via-white to-synth-purple uppercase tracking-tighter leading-none">
              XML Image Forge
            </h2>
            
            <div className="space-y-4">
              <p className="text-lg lg:text-xl text-gray-300 font-light leading-relaxed">
                Power up your image prompts. I engineered this tool to generate precise, structured XML configs for your Image Prompt Generator workflows in seconds—so every render is consistent, controllable, and production-ready.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {['Frontend Development', 'Prompt Engineering', 'UI/UX Design'].map(skill => (
                  <span key={skill} className="px-2 py-1 bg-synth-cyan/10 border border-synth-cyan/30 rounded text-xs font-mono text-synth-cyan">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
              <a 
                href="https://xmlimageforge.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-2 px-10 py-4 bg-synth-cyan text-black font-black uppercase tracking-widest overflow-hidden rounded-sm transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative z-10">Open App</span>
                <ExternalLink className="w-5 h-5 relative z-10" />
              </a>
              
              <div className="flex items-center justify-center gap-3 px-8 py-4 border border-synth-purple/30 bg-synth-purple/5 rounded-sm w-full sm:w-auto">
                <Code className="text-synth-purple w-5 h-5" />
                <span className="text-gray-300 font-mono text-sm uppercase tracking-wider">Now Serving Downloadable JSON Output!</span>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Creative Image Gallery */}
          <div className="w-full lg:w-1/2 relative lg:min-h-[600px] mt-8 lg:mt-0 flex flex-col gap-4 lg:block">
            {/* Center piece - Website Screenshot */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative lg:absolute lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 w-full lg:w-[85%] xl:w-[75%] z-20 hover:z-50 transition-all duration-500 lg:hover:scale-105 group"
            >
              <div className="absolute inset-0 bg-synth-cyan/20 blur-2xl group-hover:bg-synth-cyan/40 transition-colors duration-500 hidden lg:block"></div>
              <div className="relative rounded-xl overflow-hidden border-2 border-synth-cyan/50 shadow-[0_0_30px_rgba(0,0,0,0.4)] lg:shadow-[0_0_50px_rgba(0,0,0,0.6)] bg-synth-darker">
                <div className="h-6 lg:h-8 bg-black/80 border-b border-synth-cyan/30 flex items-center px-3 lg:px-4 gap-1.5 lg:gap-2">
                  <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-green-500/80"></div>
                  <div className="mx-auto text-[10px] lg:text-xs font-mono text-synth-cyan/70 tracking-widest">xmlimageforge.com</div>
                </div>
                <div className="relative aspect-[16/9] bg-synth-dark flex items-center justify-center overflow-hidden">
                   <img src="/xml-image-forge/main-image-forge.webp" alt="XML Image Forge Interface" className="w-full h-full object-cover opacity-90 lg:opacity-80 group-hover:opacity-100 transition-opacity duration-500" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=1000&auto=format&fit=crop"; e.currentTarget.classList.add('opacity-40'); }} />
                   <div className="absolute inset-0 bg-gradient-to-t from-synth-darker via-transparent to-transparent opacity-30 lg:opacity-50"></div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-3 gap-3 lg:block">
              {/* Floating Output 1 - Dog Chef */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative lg:absolute lg:top-[5%] lg:left-[0%] w-full lg:w-[45%] xl:w-[40%] z-30 hover:z-50 transition-all duration-500 lg:hover:scale-110 lg:hover:-translate-y-4 group cursor-pointer lg:-rotate-6 lg:hover:rotate-0"
              >
                <div className="relative rounded-lg overflow-hidden border border-synth-purple/50 lg:border-2 shadow-lg lg:shadow-[0_20px_40px_rgba(0,0,0,0.8)] transition-all duration-500 group-hover:border-synth-purple">
                  <img src="/xml-image-forge/dog-chef.webp" alt="Generated Output: Dog Chef" className="w-full aspect-square object-cover lg:grayscale-[30%] group-hover:grayscale-0 transition-all duration-500" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop"; }} />
                  <div className="absolute bottom-0 left-0 w-full bg-black/90 backdrop-blur-md p-1.5 lg:p-2 border-t border-synth-purple/30 lg:translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-[8px] lg:text-[10px] xl:text-xs font-mono text-fuchsia-400 truncate">&lt;subject&gt;Dachshund Chef&lt;/subject&gt;</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating Output 2 - TV Fish Bowl */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative lg:absolute lg:bottom-[5%] lg:left-[5%] w-full lg:w-[45%] xl:w-[40%] z-10 hover:z-50 transition-all duration-500 lg:hover:scale-110 lg:hover:-translate-y-4 group cursor-pointer lg:rotate-4 lg:hover:rotate-0"
              >
                <div className="relative rounded-lg overflow-hidden border border-synth-cyan/50 lg:border-2 shadow-lg lg:shadow-[0_20px_40px_rgba(0,0,0,0.8)] transition-all duration-500 group-hover:border-synth-cyan">
                  <img src="/xml-image-forge/tv-fish-bowl.webp" alt="Generated Output: TV Fish Bowl" className="w-full aspect-square object-cover lg:grayscale-[30%] group-hover:grayscale-0 transition-all duration-500" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop"; }} />
                  <div className="absolute bottom-0 left-0 w-full bg-black/90 backdrop-blur-md p-1.5 lg:p-2 border-t border-synth-cyan/30 lg:translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-[8px] lg:text-[10px] xl:text-xs font-mono text-synth-cyan truncate">&lt;subject&gt;TV Fish Bowl&lt;/subject&gt;</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating Output 3 - Lake Cabin */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="relative lg:absolute lg:top-[15%] lg:right-[0%] w-full lg:w-[45%] xl:w-[40%] z-10 hover:z-50 transition-all duration-500 lg:hover:scale-110 lg:hover:-translate-y-4 group cursor-pointer lg:rotate-8 lg:hover:rotate-0"
              >
                <div className="relative rounded-lg overflow-hidden border border-pink-500/50 lg:border-2 shadow-lg lg:shadow-[0_20px_40px_rgba(0,0,0,0.8)] transition-all duration-500 group-hover:border-pink-500">
                  <img src="/xml-image-forge/lake-cabin.webp" alt="Generated Output: Lake Cabin" className="w-full aspect-square object-cover lg:grayscale-[30%] group-hover:grayscale-0 transition-all duration-500" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop"; }} />
                  <div className="absolute bottom-0 left-0 w-full bg-black/90 backdrop-blur-md p-1.5 lg:p-2 border-t border-pink-500/30 lg:translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-[8px] lg:text-[10px] xl:text-xs font-mono text-pink-400 truncate">&lt;environment&gt;Lake Sunset&lt;/environment&gt;</p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Decorative connection lines (SVG) */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20 hidden lg:block" style={{ filter: 'drop-shadow(0 0 5px rgba(0,255,255,0.5))' }}>
              <motion.path 
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.5 }}
                d="M 25 25 L 50 50" stroke="#0ff" strokeWidth="0.5" strokeDasharray="1 1" fill="none" 
              />
              <motion.path 
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.7 }}
                d="M 75 30 L 50 50" stroke="#f0f" strokeWidth="0.5" strokeDasharray="1 1" fill="none" 
              />
              <motion.path 
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.9 }}
                d="M 25 75 L 50 50" stroke="#0ff" strokeWidth="0.5" strokeDasharray="1 1" fill="none" 
              />
            </svg>

          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProject;
