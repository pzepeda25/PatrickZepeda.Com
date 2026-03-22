import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Clock, Zap, ShieldCheck, ArrowRight, Check, AlertCircle, Download, Share2 } from 'lucide-react';

// --- Types ---
type State = {
  step: number;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  website: string;
  city: string;
  businessType: string;
  websiteStatus: string;
  socialStatus: string;
  mainGoal: string;
  challenges: string[];
  budget: string;
  contentCreationInterest: string[];
};

const initialState: State = {
  step: 0,
  name: '',
  email: '',
  phone: '',
  businessName: '',
  website: '',
  city: '',
  businessType: '',
  websiteStatus: '',
  socialStatus: '',
  mainGoal: '',
  challenges: [],
  budget: '',
  contentCreationInterest: [],
};

// --- Logic ---
function calculateScore(state: State) {
  let score = 0;
  switch (state.businessType) {
    case 'Home Services': score += 65; break;
    case 'Medical / Dental': score += 72; break;
    case 'Law Firm': score += 70; break;
    case 'Restaurant / Food': score += 60; break;
    case 'Coaching / Consulting': score += 75; break;
    case 'E-Commerce': score += 68; break;
    default: score += 63; break;
  }

  switch (state.websiteStatus) {
    case "1. Non-existent / Don't have one": score -= 15; break;
    case "2. Outdated / Embarrassing": score -= 12; break;
    case "3. Functional, but generates no leads": score -= 8; break;
    case "4. Could be better, generates some results": score -= 3; break;
    case "5. Great and converts amazingly": score += 5; break;
  }

  switch (state.socialStatus) {
    case "Non-existent": score -= 10; break;
    case "Post occasionally (inconsistent)": score -= 6; break;
    case "Active and growing (some engagement)": score -= 2; break;
    case "Strong and consistent (high engagement and leads)": score += 4; break;
  }

  if (state.challenges.includes("Not enough leads")) score -= 5;
  if (state.challenges.includes("Poor website design or no website")) score -= 8;
  if (state.challenges.includes("No social media presence or content")) score -= 4;
  if (state.challenges.includes("Not showing up on Google")) score -= 6;
  if (state.challenges.includes("All of the above")) score -= 10;

  switch (state.budget) {
    case "Under $500": score += 0; break;
    case "$500 - $1,000": score += 2; break;
    case "$1,000 - $2,500": score += 4; break;
    case "$2,500+": score += 8; break;
  }

  score = Math.max(18, Math.min(94, score));

  let websiteHealth = 50;
  if (state.websiteStatus === "1. Non-existent / Don't have one") websiteHealth = 10;
  else if (state.websiteStatus.includes("Outdated")) websiteHealth = 30;
  else if (state.websiteStatus.includes("no leads")) websiteHealth = 50;
  else if (state.websiteStatus.includes("Could be better")) websiteHealth = 75;
  else if (state.websiteStatus.includes("Great")) websiteHealth = 95;
  if (state.challenges.includes("Poor website design or no website") || state.challenges.includes("All of the above")) websiteHealth -= 15;

  let contentStrength = 50;
  if (state.socialStatus === "Non-existent") contentStrength = 15;
  else if (state.socialStatus.includes("Post occasionally")) contentStrength = 40;
  else if (state.socialStatus.includes("Active and growing")) contentStrength = 70;
  else if (state.socialStatus.includes("Strong and consistent")) contentStrength = 90;
  if (state.challenges.includes("No social media presence or content") || state.challenges.includes("All of the above")) contentStrength -= 15;

  let leadFlow = 50;
  if (state.challenges.includes("Not enough leads") || state.challenges.includes("All of the above")) leadFlow -= 25;
  if (state.websiteStatus.includes("no leads")) leadFlow -= 15;
  if (state.websiteStatus.includes("Great")) leadFlow += 30;

  let localVisibility = 60;
  if (state.challenges.includes("Not showing up on Google") || state.challenges.includes("All of the above")) localVisibility -= 30;
  if (state.businessType === "Home Services" || state.businessType === "Restaurant / Food") localVisibility += 10;

  let quickFix = "Start by claiming and verifying your Google Business Profile today—it's free and drives immediate local traffic.";
  if (state.challenges.includes("Not enough leads")) quickFix = "Add a clear, high-contrast 'Call to Action' button (like 'Get a Quote') to the top right of your website header today.";
  else if (state.challenges.includes("Poor website design or no website")) quickFix = "Claim your free Google Business Profile. It takes 10 minutes and instantly puts you on the local map.";
  else if (state.challenges.includes("No social media presence or content")) quickFix = "Post one behind-the-scenes photo of your business on Facebook or Instagram today. Authenticity builds trust.";
  else if (state.challenges.includes("Not showing up on Google")) quickFix = "Ask your 3 best recent customers for a Google Review right now. Reviews are the #1 local ranking factor.";

  return {
    total: score,
    categories: {
      websiteHealth: Math.max(5, Math.min(98, websiteHealth)),
      contentStrength: Math.max(5, Math.min(98, contentStrength)),
      leadFlow: Math.max(5, Math.min(98, leadFlow)),
      localVisibility: Math.max(5, Math.min(98, localVisibility)),
    },
    quickFix
  };
}

function getTier(score: number) {
  if (score < 40) return { label: "Critical — Immediate Action Needed", color: "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]", bg: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" };
  if (score < 60) return { label: "At Risk — You're Losing Leads Daily", color: "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]", bg: "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" };
  if (score < 75) return { label: "Average — Room for Significant Growth", color: "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]", bg: "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" };
  return { label: "Strong — Let's Optimize and Scale", color: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]", bg: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" };
}

// --- Components ---
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.4 };

const RadioCard: React.FC<{ label: string, selected: boolean, onClick: () => void }> = ({ label, selected, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 border-2 transition-all duration-200 flex items-center justify-between group ${
        selected 
          ? 'bg-fuchsia-900/40 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]' 
          : 'bg-slate-900/80 border-cyan-900/50 hover:border-cyan-500/50 hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]'
      }`}
    >
      <span className={`font-bold uppercase tracking-wide ${selected ? 'text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]' : 'text-cyan-100'}`}>{label}</span>
      <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-colors shrink-0 ml-4 ${
        selected ? 'bg-fuchsia-500 border-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]' : 'border-cyan-700 group-hover:border-cyan-500'
      }`}>
        {selected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
      </div>
    </button>
  );
};

const CheckboxCard: React.FC<{ label: string, selected: boolean, onClick: () => void }> = ({ label, selected, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 border-2 transition-all duration-200 flex items-center justify-between group ${
        selected 
          ? 'bg-fuchsia-900/40 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]' 
          : 'bg-slate-900/80 border-cyan-900/50 hover:border-cyan-500/50 hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]'
      }`}
    >
      <span className={`font-bold uppercase tracking-wide ${selected ? 'text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]' : 'text-cyan-100'}`}>{label}</span>
      <div className={`w-6 h-6 border-2 flex items-center justify-center transition-colors shrink-0 ml-4 ${
        selected ? 'bg-fuchsia-500 border-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]' : 'border-cyan-700 group-hover:border-cyan-500'
      }`}>
        {selected && <Check className="w-4 h-4 text-white" />}
      </div>
    </button>
  );
};

function ProgressBar({ step, total }: { step: number, total: number }) {
  const progress = (step / total) * 100;
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex justify-between text-xs text-cyan-400 mb-2 font-bold uppercase tracking-widest">
        <span>Step {step} // {total}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-slate-800 border border-cyan-900/50 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.8)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

export default function AuditPage() {
  const [state, setState] = useState<State>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  const nextStep = () => setState(s => ({ ...s, step: s.step + 1 }));
  const prevStep = () => setState(s => ({ ...s, step: s.step - 1 }));

  const handleStart = () => nextStep();

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!state.name.trim()) newErrors.name = "Name is required";
    if (!state.email.trim() || !/^\S+@\S+\.\S+$/.test(state.email)) newErrors.email = "Valid email is required";
    if (!state.businessName.trim()) newErrors.businessName = "Business name is required";
    if (!state.city.trim()) newErrors.city = "City is required";
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) nextStep();
  };

  const handleRadioSelect = (field: keyof State, value: string, autoAdvance = false) => {
    setState(s => {
      const newState = { ...s, [field]: value };
      
      // Auto advance for multi-question steps
      if (s.step === 3) {
        if ((field === 'websiteStatus' && newState.socialStatus) || 
            (field === 'socialStatus' && newState.websiteStatus)) {
          setTimeout(() => nextStep(), 400);
        }
      }
      
      return newState;
    });
    setErrors(e => ({ ...e, [field]: '' }));
    if (autoAdvance) {
      setTimeout(() => nextStep(), 400);
    }
  };

  const handleCheckboxSelect = (value: string) => {
    setState(s => {
      let newChallenges = [...s.challenges];
      if (value === "All of the above") {
        newChallenges = newChallenges.includes("All of the above") ? [] : ["All of the above"];
      } else {
        if (newChallenges.includes("All of the above")) {
          newChallenges = newChallenges.filter(c => c !== "All of the above");
        }
        if (newChallenges.includes(value)) {
          newChallenges = newChallenges.filter(c => c !== value);
        } else {
          newChallenges.push(value);
        }
      }
      return { ...s, challenges: newChallenges };
    });
    setErrors(e => ({ ...e, challenges: '' }));
  };

  const handleContentCheck = (value: string) => {
    setState(s => {
      let newInterests = [...s.contentCreationInterest];
      if (newInterests.includes(value)) {
        newInterests = newInterests.filter(v => v !== value);
      } else {
        newInterests.push(value);
      }
      return { ...s, contentCreationInterest: newInterests };
    });
    setErrors(e => ({ ...e, contentCreationInterest: '' }));
  };

  const handleTextChange = (field: keyof State, value: string) => {
    setState(s => ({ ...s, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!state.websiteStatus) newErrors.websiteStatus = "Please select an option";
    if (!state.socialStatus) newErrors.socialStatus = "Please select an option";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) nextStep();
  };

  const validateStep4 = () => {
    const newErrors: Record<string, string> = {};
    if (!state.mainGoal.trim()) newErrors.mainGoal = "Please tell us your main goal";
    if (state.challenges.length === 0) newErrors.challenges = "Please select at least one challenge";
    if (!state.budget) newErrors.budget = "Please select your budget";
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      nextStep();
    }
  };

  const submitForm = async (finalState: State) => {
    setIsCalculating(true);
    setState(s => ({ ...s, step: 6 }));
    
    try {
      const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSebHezMizGcX8Rdpjnnx5oz3PI2Prs__8xR75ch43dwjP8Xew/formResponse";
      
      const formData = new FormData();
      formData.append("entry.1317529223", finalState.name);
      formData.append("entry.1753847946", finalState.email);
      formData.append("entry.1467250544", finalState.businessName);
      formData.append("entry.1366731122", finalState.city);
      
      // Phone Number
      formData.append("entry.1307076066", finalState.phone || "Not provided");
      // Website URL
      formData.append("entry.1355671775", finalState.website || "Not provided");
      
      formData.append("entry.1175430683", finalState.businessType);
      
      formData.append("entry.978137684", "Not provided");
      
      formData.append("entry.1503695291", finalState.websiteStatus);
      formData.append("entry.1277852683", finalState.socialStatus);
      
      formData.append("entry.1925368554", finalState.mainGoal || "Not provided");
      
      if (finalState.challenges.length > 0) {
        finalState.challenges.forEach(challenge => {
          formData.append("entry.2014537788", challenge);
        });
      } else {
        formData.append("entry.2014537788", "Not provided");
      }
      
      formData.append("entry.536321989", finalState.budget);

      if (finalState.contentCreationInterest.length > 0) {
        finalState.contentCreationInterest.forEach(interest => {
          formData.append("entry.1904679443", interest);
        });
      } else {
        formData.append("entry.1904679443", "Not provided");
      }

      // We use no-cors because Google Forms doesn't return CORS headers for formResponse
      await fetch(GOOGLE_FORM_URL, {
        method: "POST",
        mode: "no-cors",
        body: formData
      });
      console.log("Successfully submitted to Google Form");
    } catch (error) {
      console.error("Error submitting to Google Form:", error);
    }

    setTimeout(() => {
      setIsCalculating(false);
    }, 2500);
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (state.contentCreationInterest.length === 0) newErrors.contentCreationInterest = "Please select at least one option";
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      submitForm(state);
    }
  };

  const printReport = () => {
    window.print();
  };

  const isContentRetainerLead =
    state.contentCreationInterest.includes("retainer_interest") ||
    state.contentCreationInterest.includes("quarterly_package") ||
    state.contentCreationInterest.includes("seasonal_package");

  return (
    <div className="audit-scope min-h-screen bg-slate-950 text-white font-sans selection:bg-fuchsia-500/30 overflow-x-hidden relative">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      
      <header className="absolute top-0 left-0 right-0 p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-3 z-50 max-w-7xl mx-auto w-full text-center md:text-left">
        <Link 
          to="/"
          className="text-xl md:text-2xl font-black italic tracking-tighter text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] leading-none hover:opacity-80 transition-opacity"
        >
          PATRICK LEE <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">ZEPEDA</span>
        </Link>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setState(initialState)}
            className="text-xs md:text-sm text-white hover:text-fuchsia-400 font-bold uppercase tracking-widest transition-colors"
          >
            Free Audit
          </button>
          <Link to="/" className="text-xs md:text-sm text-cyan-400 hover:text-fuchsia-400 font-bold uppercase tracking-widest transition-colors">
            Back to main site &rarr;
          </Link>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 pt-32 pb-12 md:pt-24 md:pb-12 min-h-screen flex flex-col items-center justify-start">
        <AnimatePresence mode="wait">
          
          {/* STEP 0: HERO */}
          {state.step === 0 && (
            <motion.div
              key="step0"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
              className="max-w-5xl text-center w-full my-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1 border-2 border-cyan-500 bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-8 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                <Zap className="w-4 h-4" />
                <span>Free Business Growth Audit</span>
              </div>
              <h1 className="text-[6.5vw] sm:text-5xl md:text-7xl font-black italic tracking-tighter mb-6 leading-tight uppercase text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                Is Your Website<br />
                <span className="whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,0.6)]">Costing You Customers?</span>
              </h1>
              <p className="text-base md:text-lg text-cyan-100 mb-10 max-w-2xl mx-auto leading-relaxed font-medium px-2">
                Take the free 60-second Business Growth Audit by Patrick Lee Zepeda and find out exactly what's holding your business back online.
              </p>
              
              <button
                onClick={handleStart}
                className="group relative inline-flex items-center justify-center gap-3 px-6 md:px-8 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black italic uppercase tracking-widest text-base md:text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(217,70,239,0.8)] border-2 border-fuchsia-400 w-full sm:w-auto"
              >
                DESIGN WHAT'S NEXT
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <p className="mt-4 text-sm text-gray-500 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                No credit card. No spam. Just clarity.
              </p>
              
              <div className="flex flex-wrap justify-center gap-8 mt-16 pt-8 border-t border-white/5">
                <div className="flex items-center gap-2 text-gray-400">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>100% Free</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>Takes 60 Seconds</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span>Instant Results</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 1: BUSINESS INFO */}
          {state.step === 1 && (
            <motion.div
              key="step1"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
              className="w-full max-w-2xl my-auto"
            >
              <ProgressBar step={1} total={4} />
              <div className="bg-slate-900/80 backdrop-blur-md border-2 border-cyan-500/30 p-8 md:p-12 shadow-[0_0_30px_rgba(34,211,238,0.15)] relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500"></div>
                <h2 className="text-3xl font-black uppercase italic mb-2 text-cyan-50 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">Let's get to know you</h2>
                <p className="text-cyan-200/70 mb-8 font-medium">Where should we send your personalized audit report?</p>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={state.name}
                        onChange={e => setState({ ...state, name: e.target.value })}
                        className={`w-full bg-slate-900/50 border-2 ${errors.name ? 'border-red-500' : 'border-cyan-900/50 focus:border-cyan-500'} p-4 text-white outline-none transition-colors shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]`}
                        placeholder="John Doe"
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={state.email}
                        onChange={e => setState({ ...state, email: e.target.value })}
                        className={`w-full bg-slate-900/50 border-2 ${errors.email ? 'border-red-500' : 'border-cyan-900/50 focus:border-cyan-500'} p-4 text-white outline-none transition-colors shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]`}
                        placeholder="john@example.com"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.email}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">Business Name</label>
                      <input
                        type="text"
                        value={state.businessName}
                        onChange={e => setState({ ...state, businessName: e.target.value })}
                        className={`w-full bg-slate-900/50 border-2 ${errors.businessName ? 'border-red-500' : 'border-cyan-900/50 focus:border-cyan-500'} p-4 text-white outline-none transition-colors shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]`}
                        placeholder="Acme Corp"
                      />
                      {errors.businessName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.businessName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">City</label>
                      <input
                        type="text"
                        value={state.city}
                        onChange={e => setState({ ...state, city: e.target.value })}
                        className={`w-full bg-slate-900/50 border-2 ${errors.city ? 'border-red-500' : 'border-cyan-900/50 focus:border-cyan-500'} p-4 text-white outline-none transition-colors shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]`}
                        placeholder="New York, NY"
                      />
                      {errors.city && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.city}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={state.phone}
                        onChange={e => setState({ ...state, phone: e.target.value })}
                        className={`w-full bg-slate-900/50 border-2 ${errors.phone ? 'border-red-500' : 'border-cyan-900/50 focus:border-cyan-500'} p-4 text-white outline-none transition-colors shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]`}
                        placeholder="(555) 123-4567"
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.phone}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">Website URL</label>
                      <input
                        type="url"
                        value={state.website}
                        onChange={e => setState({ ...state, website: e.target.value })}
                        className={`w-full bg-slate-900/50 border-2 ${errors.website ? 'border-red-500' : 'border-cyan-900/50 focus:border-cyan-500'} p-4 text-white outline-none transition-colors shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]`}
                        placeholder="https://example.com"
                      />
                      {errors.website && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.website}</p>}
                    </div>
                  </div>
                </div>
                
                <div className="mt-10 flex justify-end">
                  <button
                    onClick={validateStep1}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-2 border-fuchsia-400 font-black italic uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(217,70,239,0.6)] w-full sm:w-auto"
                  >
                    Continue <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: BUSINESS TYPE */}
          {state.step === 2 && (
            <motion.div
              key="step2"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
              className="w-full max-w-2xl my-auto"
            >
              <ProgressBar step={2} total={4} />
              <div className="bg-slate-900/80 backdrop-blur-md border-2 border-cyan-500/30 p-8 md:p-12 shadow-[0_0_30px_rgba(34,211,238,0.15)] relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500"></div>
                <button onClick={prevStep} className="text-xs font-bold uppercase tracking-widest text-cyan-500 hover:text-fuchsia-400 mb-6 flex items-center gap-1 transition-colors">
                  <ChevronRight className="w-4 h-4 rotate-180" /> Back
                </button>
                <h2 className="text-3xl font-black uppercase italic mb-2 text-cyan-50 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">What type of business do you run?</h2>
                <p className="text-cyan-200/70 mb-8 font-medium">This helps us benchmark your score against industry standards.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Home Services', 
                    'Medical / Dental', 
                    'Law Firm', 
                    'Restaurant / Food', 
                    'Coaching / Consulting', 
                    'E-Commerce', 
                    'Other'
                  ].map(type => (
                    <RadioCard
                      key={type}
                      label={type}
                      selected={state.businessType === type}
                      onClick={() => handleRadioSelect('businessType', type, true)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: ONLINE PRESENCE */}
          {state.step === 3 && (
            <motion.div
              key="step3"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
              className="w-full max-w-2xl my-auto"
            >
              <ProgressBar step={3} total={4} />
              <div className="bg-slate-900/80 backdrop-blur-md border-2 border-cyan-500/30 p-8 md:p-12 shadow-[0_0_30px_rgba(34,211,238,0.15)] relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500"></div>
                <button onClick={prevStep} className="text-xs font-bold uppercase tracking-widest text-cyan-500 hover:text-fuchsia-400 mb-6 flex items-center gap-1 transition-colors">
                  <ChevronRight className="w-4 h-4 rotate-180" /> Back
                </button>
                <h2 className="text-3xl font-black uppercase italic mb-8 text-cyan-50 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">Let's look at your current setup</h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-widest mb-4 text-cyan-400">How would you describe your current website?</h3>
                    <div className="space-y-3">
                      {[
                        "1. Non-existent / Don't have one",
                        "2. Outdated / Embarrassing",
                        "3. Functional, but generates no leads",
                        "4. Could be better, generates some results",
                        "5. Great and converts amazingly"
                      ].map(opt => (
                        <RadioCard
                          key={opt}
                          label={opt}
                          selected={state.websiteStatus === opt}
                          onClick={() => handleRadioSelect('websiteStatus', opt)}
                        />
                      ))}
                    </div>
                    {errors.websiteStatus && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.websiteStatus}</p>}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-widest mb-4 text-cyan-400">What about your social media presence and content?</h3>
                    <div className="space-y-3">
                      {[
                        "Non-existent",
                        "Post occasionally (inconsistent)",
                        "Active and growing (some engagement)",
                        "Strong and consistent (high engagement and leads)"
                      ].map(opt => (
                        <RadioCard
                          key={opt}
                          label={opt}
                          selected={state.socialStatus === opt}
                          onClick={() => handleRadioSelect('socialStatus', opt)}
                        />
                      ))}
                    </div>
                    {errors.socialStatus && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.socialStatus}</p>}
                  </div>
                </div>
                
                <div className="mt-10 flex justify-end">
                  <button
                    onClick={validateStep3}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-2 border-fuchsia-400 font-black italic uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(217,70,239,0.6)] w-full sm:w-auto"
                  >
                    Continue <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: CHALLENGE & BUDGET */}
          {state.step === 4 && (
            <motion.div
              key="step4"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
              className="w-full max-w-2xl my-auto"
            >
              <ProgressBar step={4} total={4} />
              <div className="bg-slate-900/80 backdrop-blur-md border-2 border-cyan-500/30 p-8 md:p-12 shadow-[0_0_30px_rgba(34,211,238,0.15)] relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500"></div>
                <button onClick={prevStep} className="text-xs font-bold uppercase tracking-widest text-cyan-500 hover:text-fuchsia-400 mb-6 flex items-center gap-1 transition-colors">
                  <ChevronRight className="w-4 h-4 rotate-180" /> Back
                </button>
                <h2 className="text-3xl font-black uppercase italic mb-8 text-cyan-50 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">Almost done. What are your goals?</h2>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-lg font-bold uppercase tracking-widest mb-4 text-cyan-400">
                      What is the main goal you are trying to achieve?
                    </label>
                    <p className="text-cyan-200/70 mb-4 text-sm">e.g., "Without costing you customers on one line under the top line"</p>
                    <textarea
                      value={state.mainGoal}
                      onChange={e => handleTextChange('mainGoal', e.target.value)}
                      className={`w-full bg-slate-900/50 border-2 ${errors.mainGoal ? 'border-red-500' : 'border-cyan-900/50 focus:border-cyan-500'} p-4 text-white outline-none transition-colors shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] min-h-[100px] resize-y`}
                      placeholder="Enter your main goal here..."
                    />
                    {errors.mainGoal && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.mainGoal}</p>}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-widest mb-4 text-cyan-400">What's your #1 online challenge right now? (Select all that apply)</h3>
                    <div className="space-y-3">
                      {[
                        "Not enough leads",
                        "Poor website design or no website",
                        "No social media presence or content",
                        "Not showing up on Google",
                        "All of the above"
                      ].map(opt => (
                        <CheckboxCard
                          key={opt}
                          label={opt}
                          selected={state.challenges.includes(opt)}
                          onClick={() => handleCheckboxSelect(opt)}
                        />
                      ))}
                    </div>
                    {errors.challenges && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.challenges}</p>}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-widest mb-4 text-cyan-400">What's your monthly budget for marketing?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        "Under $500",
                        "$500 - $1,000",
                        "$1,000 - $2,500",
                        "$2,500+"
                      ].map(opt => (
                        <RadioCard
                          key={opt}
                          label={opt}
                          selected={state.budget === opt}
                          onClick={() => handleRadioSelect('budget', opt)}
                        />
                      ))}
                    </div>
                    {errors.budget && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.budget}</p>}
                  </div>
                </div>
                
                <div className="mt-10 flex justify-end">
                  <button
                    onClick={validateStep4}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-2 border-fuchsia-400 font-black italic uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(217,70,239,0.6)] w-full sm:w-auto"
                  >
                    Continue <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: CONTENT CREATION */}
          {state.step === 5 && (
            <motion.div
              key="step5"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
              className="w-full max-w-2xl my-auto"
            >
              <ProgressBar step={5} total={5} />
              <div className="bg-slate-900/80 backdrop-blur-md border-2 border-cyan-500/30 p-8 md:p-12 shadow-[0_0_30px_rgba(34,211,238,0.15)] relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500"></div>
                
                <h2 className="text-3xl font-black uppercase italic mb-8 text-cyan-50 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">One last thing...</h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-widest mb-4 text-cyan-400">Would consistent, quality content creation help grow your business? (Select all that apply)</h3>
                    <div className="space-y-3">
                      {[
                        { value: "blog_content", label: "Yes — blog content" },
                        { value: "social_media_content", label: "Yes — social media content" },
                        { value: "website_copy", label: "Yes — website copy & page updates" },
                        { value: "quarterly_package", label: "Quarterly content packages interest me" },
                        { value: "seasonal_package", label: "Seasonal content packages interest me" },
                        { value: "retainer_interest", label: "I'd like to learn more about content retainer plans" },
                        { value: "not_sure", label: "Not sure yet" },
                        { value: "not_interested", label: "No, not at this time" },
                      ].map(opt => (
                        <CheckboxCard
                          key={opt.value}
                          label={opt.label}
                          selected={state.contentCreationInterest.includes(opt.value)}
                          onClick={() => handleContentCheck(opt.value)}
                        />
                      ))}
                    </div>
                    {errors.contentCreationInterest && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.contentCreationInterest}</p>}
                  </div>
                </div>
                
                <div className="mt-10 flex justify-end">
                  <button
                    onClick={handleSubmit}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-2 border-fuchsia-400 font-black italic uppercase tracking-widest text-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(217,70,239,0.8)] w-full sm:w-auto"
                  >
                    Reveal My Score <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 6: RESULTS */}
          {state.step === 6 && (
            <motion.div
              key="step5"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
              className="w-full max-w-4xl my-auto"
            >
              {isCalculating ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-24 h-24 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-8" />
                  <h2 className="text-2xl font-bold mb-2">Analyzing your business...</h2>
                  <p className="text-gray-400">Comparing against {state.businessType} benchmarks</p>
                </div>
              ) : (
                <div className="space-y-8 print:text-black print:bg-white print:p-0">
                  {/* Score Card */}
                  <div className="bg-slate-900/80 backdrop-blur-md border-2 border-cyan-500/30 p-8 md:p-12 shadow-[0_0_30px_rgba(34,211,238,0.15)] relative print:border-gray-200 print:bg-white print:shadow-none">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500 print:hidden"></div>
                    <div className="text-center mb-10">
                      <h2 className="text-3xl md:text-4xl font-black uppercase italic mb-4 text-cyan-50 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] print:text-black print:drop-shadow-none">Your Business Growth Score</h2>
                      <p className="text-cyan-200/70 text-lg font-medium print:text-gray-600">Based on your answers, here is how {state.businessName} is performing online.</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-12">
                      {/* Gauge */}
                      <div className="relative w-64 h-64 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50" cy="50" r="45"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-white/10 print:text-gray-200"
                          />
                          <motion.circle
                            cx="50" cy="50" r="45"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                            className={getTier(calculateScore(state).total).color}
                            strokeDasharray="283"
                            initial={{ strokeDashoffset: 283 }}
                            animate={{ strokeDashoffset: 283 - (283 * calculateScore(state).total) / 100 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <motion.span 
                            className="text-6xl font-black tracking-tighter"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                          >
                            {calculateScore(state).total}
                          </motion.span>
                          <span className="text-gray-400 text-sm font-medium uppercase tracking-widest mt-1">Out of 100</span>
                        </div>
                      </div>

                      {/* Tier & Details */}
                      <div className="flex-1 text-center md:text-left">
                        <motion.div 
                          className={`inline-block px-4 py-2 font-black uppercase italic tracking-widest text-sm mb-6 ${getTier(calculateScore(state).total).bg} text-white print:bg-gray-100 print:text-black`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 }}
                        >
                          {getTier(calculateScore(state).total).label}
                        </motion.div>
                        
                        <div className="space-y-6">
                          {Object.entries(calculateScore(state).categories).map(([key, val], i) => (
                            <div key={key}>
                              <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
                                <span className="text-cyan-400 print:text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-fuchsia-400 print:text-black">{val}/100</span>
                              </div>
                              <div className="h-2 bg-slate-800 border border-cyan-900/50 overflow-hidden print:bg-gray-200">
                                <motion.div 
                                  className="h-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.8)] print:bg-blue-600"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${val}%` }}
                                  transition={{ delay: 1 + (i * 0.2), duration: 1, ease: "easeOut" }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick Fix Section */}
                    <div className="mt-8 mb-4 bg-fuchsia-900/20 border-2 border-fuchsia-500/50 p-6 relative overflow-hidden shadow-[0_0_20px_rgba(217,70,239,0.2)] print:bg-fuchsia-50 print:border-fuchsia-200">
                      <div className="absolute top-0 left-0 w-2 h-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.8)]"></div>
                      <div className="flex items-start gap-4">
                        <div className="bg-fuchsia-500/20 p-3 border border-fuchsia-400 shrink-0 print:bg-fuchsia-100">
                          <Zap className="w-6 h-6 text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)] print:text-fuchsia-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black uppercase italic tracking-wider text-fuchsia-100 mb-2 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)] print:text-fuchsia-900">Your 5-Minute Quick Fix</h3>
                          <p className="text-fuchsia-200/80 leading-relaxed font-medium print:text-fuchsia-800">
                            {calculateScore(state).quickFix}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Plan / CTA */}
                  <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border-2 border-cyan-500/30 p-8 md:p-12 shadow-[0_0_40px_rgba(34,211,238,0.15)] relative print:border-gray-200 print:bg-white print:shadow-none">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500 print:hidden"></div>
                    <h2 className="text-3xl font-black uppercase italic mb-6 text-cyan-50 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] print:text-black print:drop-shadow-none">Here's What We'd Fix First for {state.businessName}</h2>
                    
                    <div className="space-y-4 mb-10">
                      {isContentRetainerLead && (
                        <div className="flex gap-4 p-4 bg-fuchsia-900/30 border-2 border-fuchsia-500/50 shadow-[0_0_20px_rgba(217,70,239,0.2)] print:bg-fuchsia-50 print:border-fuchsia-200">
                          <div className="mt-1"><Zap className="w-5 h-5 text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]" /></div>
                          <div>
                            <h4 className="font-bold uppercase tracking-wide text-lg mb-1 text-fuchsia-100 print:text-black">Content Retainer Opportunity</h4>
                            <p className="text-cyan-100/70 print:text-gray-600">Since you're interested in consistent content creation, we can discuss our specialized content retainer packages that provide ongoing, high-quality content tailored for your business.</p>
                          </div>
                        </div>
                      )}
                      {calculateScore(state).categories.websiteHealth < 60 && (
                        <div className="flex gap-4 p-4 bg-slate-900/50 border-2 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)] print:bg-gray-50 print:border-gray-200">
                          <div className="mt-1"><AlertCircle className="w-5 h-5 text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" /></div>
                          <div>
                            <h4 className="font-bold uppercase tracking-wide text-lg mb-1 text-red-100 print:text-black">Overhaul Website Conversion Path</h4>
                            <p className="text-cyan-100/70 print:text-gray-600">Your current website setup is leaking leads. We need to implement a modern, fast-loading design with clear calls-to-action tailored for {state.city} customers.</p>
                          </div>
                        </div>
                      )}
                      {calculateScore(state).categories.contentStrength < 60 && (
                        <div className="flex gap-4 p-4 bg-slate-900/50 border-2 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)] print:bg-gray-50 print:border-gray-200">
                          <div className="mt-1"><AlertCircle className="w-5 h-5 text-orange-400 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]" /></div>
                          <div>
                            <h4 className="font-bold uppercase tracking-wide text-lg mb-1 text-orange-100 print:text-black">Establish Consistent Social Authority</h4>
                            <p className="text-cyan-100/70 print:text-gray-600">Your social presence isn't building trust. We recommend a structured content calendar focusing on your expertise in {state.businessType} to engage local prospects.</p>
                          </div>
                        </div>
                      )}
                      {calculateScore(state).categories.localVisibility < 60 && (
                        <div className="flex gap-4 p-4 bg-slate-900/50 border-2 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] print:bg-gray-50 print:border-gray-200">
                          <div className="mt-1"><AlertCircle className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]" /></div>
                          <div>
                            <h4 className="font-bold uppercase tracking-wide text-lg mb-1 text-yellow-100 print:text-black">Dominate Local Search</h4>
                            <p className="text-cyan-100/70 print:text-gray-600">You are missing out on high-intent searches. We need to optimize your Google Business Profile and local SEO to capture people actively looking for your services.</p>
                          </div>
                        </div>
                      )}
                      {calculateScore(state).total >= 75 && (
                        <div className="flex gap-4 p-4 bg-slate-900/50 border-2 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] print:bg-gray-50 print:border-gray-200">
                          <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" /></div>
                          <div>
                            <h4 className="font-bold uppercase tracking-wide text-lg mb-1 text-emerald-100 print:text-black">Scale Your Success</h4>
                            <p className="text-gray-400 print:text-gray-600">You have a strong foundation. The next step is implementing advanced retargeting and automated lead nurturing to maximize your ROI.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 print:hidden">
                      <a 
                        href="https://patrickleezepeda.com/contact"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-8 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-2 border-fuchsia-400 font-black italic uppercase tracking-widest text-lg text-center transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(217,70,239,0.8)]"
                      >
                        Book My Free 20-Min Strategy Call
                      </a>
                      <button 
                        onClick={printReport}
                        className="w-full sm:w-auto px-6 py-4 bg-slate-800 border-2 border-cyan-500/50 hover:bg-cyan-900/40 text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                      >
                        <Download className="w-5 h-5" />
                        Download Report
                      </button>
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-center gap-2 text-sm text-gray-400 print:hidden">
                      <Share2 className="w-4 h-4" />
                      Share your results: <a href="https://patrickleezepeda.com/audit" className="text-blue-400 hover:underline">patrickleezepeda.com/audit/result/123</a>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
