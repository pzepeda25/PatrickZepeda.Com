import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, CheckCircle, ChevronLeft } from 'lucide-react';
import type { ChatbotLeadPayload } from '@/types/chatbot-lead';
import {
  QUICK_ACTIONS,
  STEP_ORDER,
  PROJECT_TYPES,
  BUSINESS_TYPES,
  GOALS,
  WEBSITE_STATUS,
  TIMELINES,
  BUDGETS,
  type StepId,
} from '@/data/chatbot-flow';

const API_PATH = '/api/submit-chatbot-lead';
const OPEN_CONTACT_MODAL_EVENT = 'open-contact-modal';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

const initialDraft = (): Omit<ChatbotLeadPayload, 'pageUrl'> => ({
  projectType: '',
  businessType: '',
  goal: '',
  websiteStatus: '',
  timeline: '',
  budget: '',
  name: '',
  email: '',
  message: '',
});

function stepLabel(step: StepId): string {
  switch (step) {
    case 'welcome':
      return 'Start';
    case 'project':
      return 'Project';
    case 'business':
      return 'Business';
    case 'goal':
      return 'Goal';
    case 'website':
      return 'Website';
    case 'timeline':
      return 'Timeline';
    case 'budget':
      return 'Budget';
    case 'contact':
      return 'Contact';
    default:
      return '';
  }
}

export function LeadChatbot() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<StepId>('welcome');
  const [draft, setDraft] = useState(initialDraft);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [questionDraft, setQuestionDraft] = useState('');

  const resetFlow = useCallback(() => {
    setStep('welcome');
    setDraft(initialDraft());
    setSubmitError(null);
    setSuccess(false);
    setSubmitting(false);
    setMessages([]);
    setQuestionDraft('');
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const goToStep = (s: StepId) => {
    setSubmitError(null);
    setStep(s);
  };

  const openContact = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(OPEN_CONTACT_MODAL_EVENT));
  };

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[number]) => {
    if (action.id === 'contact') {
      openContact();
      setOpen(false);
      return;
    }

    setDraft((d) => ({ ...d, projectType: action.projectType ?? '' }));
    goToStep(action.projectType ? 'business' : 'project');
  };

  const detectIntent = (text: string): 'contact' | 'pricing' | 'services' | 'timeline' | 'unknown' => {
    const t = text.toLowerCase();
    if (
      /\b(contact|reach|email|call|book|meeting|schedule|consult|consultation)\b/.test(t) ||
      /\bphone\b/.test(t)
    )
      return 'contact';
    if (/\b(price|pricing|cost|rate|budget)\b/.test(t)) return 'pricing';
    if (/\b(services|offer|do you do|can you|help with|automation|ai|chatbot|website|seo|aeo)\b/.test(t))
      return 'services';
    if (/\b(timeline|how long|turnaround|delivery|launch|weeks|months|asap)\b/.test(t)) return 'timeline';
    return 'unknown';
  };

  const assistantReplyFor = (intent: ReturnType<typeof detectIntent>): string => {
    switch (intent) {
      case 'contact':
        return "Yep — easiest is the contact form. Want me to open it for you?";
      case 'pricing':
        return "Pricing depends on scope (new build vs redesign vs automation). If you share what you’re trying to achieve, I’ll point you to the right range — or you can send a quick inquiry and Patrick will follow up.";
      case 'timeline':
        return "Timelines vary by scope, but a focused build can be weeks while bigger systems are usually 1–2+ months. If you tell me your deadline, I’ll recommend a path.";
      case 'services':
        return "Patrick builds high-conversion sites, AI automation/workflows, and SEO/AEO systems. If you tell me what you’re building and what ‘success’ means, I’ll route you to the best next step.";
      default:
        return "Ask me anything — or hit “Contact Patrick” and send a quick note. What are you trying to build?";
    }
  };

  const sendQuestion = () => {
    const text = questionDraft.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      role: 'user',
      text,
    };
    const intent = detectIntent(text);
    const botText = assistantReplyFor(intent);
    const botMsg: ChatMessage = {
      id: `${Date.now()}-a`,
      role: 'assistant',
      text: botText,
    };

    setMessages((m) => [...m, userMsg, botMsg]);
    setQuestionDraft('');

    if (intent === 'contact') {
      // Keep it one-tap: open contact automatically after the reply.
      openContact();
      setOpen(false);
    }
  };

  const currentIndex = STEP_ORDER.indexOf(step);
  const canGoBack = currentIndex > 1 && !success;

  const goBack = () => {
    if (!canGoBack) return;
    goToStep(STEP_ORDER[currentIndex - 1] as StepId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const pageUrl =
      typeof window !== 'undefined' ? window.location.href : 'https://patrickleezepeda.com/';

    const requiredKeys: (keyof typeof draft)[] = [
      'projectType',
      'businessType',
      'goal',
      'websiteStatus',
      'timeline',
      'budget',
    ];
    const missing = requiredKeys.filter((k) => !draft[k]?.trim());
    if (missing.length > 0) {
      setSubmitError('Please complete all questions (use Back if you need to change an answer).');
      setSubmitting(false);
      return;
    }

    const payload: ChatbotLeadPayload = {
      ...draft,
      pageUrl,
    };

    try {
      const res = await fetch(API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        details?: string[];
      };

      if (!res.ok) {
        const msg =
          data.details?.join('. ') ||
          data.error ||
          `Request failed (${res.status})`;
        throw new Error(msg);
      }

      setSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderChips = (key: keyof typeof draft, options: readonly string[]) => (
    <div className="flex flex-col gap-2 mt-3">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => {
            setDraft((d) => ({ ...d, [key]: opt }));
            const next = STEP_ORDER[currentIndex + 1] as StepId;
            if (next) goToStep(next);
          }}
          className={`text-left px-4 py-3 rounded border font-mono text-sm transition-colors ${
            draft[key] === opt
              ? 'border-synth-cyan bg-synth-cyan/15 text-white'
              : 'border-synth-cyan/30 bg-synth-bg/80 text-gray-300 hover:border-synth-magenta/50 hover:bg-synth-magenta/5'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Open site assistant chat"
        onClick={() => {
          setOpen(true);
          if (success) resetFlow();
        }}
        className="fixed bottom-5 right-5 z-[100] flex h-14 w-14 items-center justify-center rounded-full border-2 border-synth-cyan bg-synth-bg/95 text-synth-cyan shadow-[0_0_24px_rgba(0,255,255,0.35)] hover:bg-synth-cyan/10 hover:text-white transition-colors md:bottom-8 md:right-8"
      >
        <Bot className="h-7 w-7" strokeWidth={1.75} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm md:bg-black/50"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="chatbot-title"
              initial={{ opacity: 0, x: 320 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 320 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed z-[101] inset-x-0 bottom-0 top-[12vh] md:inset-auto md:bottom-8 md:right-8 md:top-auto md:h-[min(640px,calc(100vh-8rem))] md:w-[min(100%,420px)] flex flex-col md:rounded-lg overflow-hidden border border-synth-cyan/40 bg-synth-bg shadow-2xl"
            >
              <div className="retro-window-header shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-synth-cyan/20">
                <div className="flex items-center gap-2 min-w-0">
                  <Bot className="h-5 w-5 text-synth-magenta shrink-0" />
                  <div className="min-w-0">
                    <h2 id="chatbot-title" className="font-mono text-sm font-bold text-synth-magenta truncate">
                      assistant.exe
                    </h2>
                    <p className="text-[10px] text-synth-cyan/80 font-mono truncate">
                      {step === 'welcome'
                        ? 'How can I help?'
                        : success
                          ? 'Received'
                          : `Step · ${stepLabel(step)}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded text-gray-400 hover:text-white hover:bg-white/10"
                  aria-label="Close chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm">
                {success ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                    <CheckCircle className="h-12 w-12 text-synth-cyan" />
                    <p className="text-white text-lg font-semibold">Thanks — you&apos;re in.</p>
                    <p className="text-gray-400 max-w-xs">
                      I&apos;ll review your submission and follow up by email. If it&apos;s urgent, use
                      the contact form on the page too.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        resetFlow();
                        setOpen(false);
                      }}
                      className="mt-2 px-4 py-2 border border-synth-magenta text-synth-magenta font-mono text-sm hover:bg-synth-magenta/10 rounded"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    {step === 'welcome' && (
                      <div>
                        <p className="text-gray-300 leading-relaxed mb-4">
                          I&apos;m Patrick&apos;s site assistant. I can answer questions about services,
                          and capture a short project brief if you&apos;d like a reply.
                        </p>

                        {messages.length > 0 && (
                          <div className="mb-4 space-y-2">
                            {messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[85%] rounded px-3 py-2 text-sm leading-relaxed ${
                                    msg.role === 'user'
                                      ? 'bg-synth-cyan/15 border border-synth-cyan/30 text-white'
                                      : 'bg-synth-dark/60 border border-synth-magenta/20 text-gray-200'
                                  }`}
                                >
                                  {msg.text}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mb-4">
                          <label htmlFor="cb-question" className="block text-xs font-mono text-synth-cyan mb-1">
                            Ask a question
                          </label>
                          <div className="flex gap-2">
                            <input
                              id="cb-question"
                              value={questionDraft}
                              onChange={(e) => setQuestionDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  sendQuestion();
                                }
                              }}
                              placeholder="e.g. Can we book a call?"
                              className="flex-1 px-3 py-2 rounded bg-synth-dark border border-synth-cyan/30 text-white focus:border-synth-cyan outline-none"
                            />
                            <button
                              type="button"
                              onClick={sendQuestion}
                              className="px-3 py-2 rounded bg-synth-magenta text-white hover:bg-white hover:text-synth-magenta transition-colors border border-synth-magenta/60"
                              aria-label="Send question"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="mt-1 text-[10px] text-gray-500">
                            If you ask to contact/book a call, I&apos;ll open the contact form.
                          </p>
                        </div>

                        <p className="text-synth-magenta font-mono text-xs mb-3 uppercase tracking-wider">
                          Quick actions
                        </p>
                        <div className="flex flex-col gap-2">
                          {QUICK_ACTIONS.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => handleQuickAction(a)}
                              className="text-left px-4 py-3 rounded border border-synth-magenta/30 bg-synth-dark/50 hover:bg-synth-magenta/10 transition-colors"
                            >
                              <span className="block text-white font-medium">{a.label}</span>
                              <span className="block text-xs text-gray-500 mt-0.5">{a.hint}</span>
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => goToStep('project')}
                          className="w-full mt-4 py-2 text-synth-cyan font-mono text-xs border border-dashed border-synth-cyan/40 rounded hover:bg-synth-cyan/5"
                        >
                          Skip to questions →
                        </button>
                      </div>
                    )}

                    {step === 'project' && (
                      <div>
                        <p className="text-white font-medium mb-1">What do you need help with?</p>
                        <p className="text-gray-500 text-xs mb-1">Choose the closest match.</p>
                        {renderChips('projectType', PROJECT_TYPES)}
                      </div>
                    )}

                    {step === 'business' && (
                      <div>
                        <p className="text-white font-medium mb-1">What kind of business are you?</p>
                        {renderChips('businessType', BUSINESS_TYPES)}
                      </div>
                    )}

                    {step === 'goal' && (
                      <div>
                        <p className="text-white font-medium mb-1">What&apos;s the main goal?</p>
                        {renderChips('goal', GOALS)}
                      </div>
                    )}

                    {step === 'website' && (
                      <div>
                        <p className="text-white font-medium mb-1">Do you already have a website?</p>
                        {renderChips('websiteStatus', WEBSITE_STATUS)}
                      </div>
                    )}

                    {step === 'timeline' && (
                      <div>
                        <p className="text-white font-medium mb-1">What timeline are you aiming for?</p>
                        {renderChips('timeline', TIMELINES)}
                      </div>
                    )}

                    {step === 'budget' && (
                      <div>
                        <p className="text-white font-medium mb-1">What budget range are you thinking about?</p>
                        {renderChips('budget', BUDGETS)}
                      </div>
                    )}

                    {step === 'contact' && !success && (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-gray-300">
                          Almost done. Add your name, email, and any details you want me to know.
                        </p>
                        <div>
                          <label htmlFor="cb-name" className="block text-xs font-mono text-synth-cyan mb-1">
                            Name
                          </label>
                          <input
                            id="cb-name"
                            required
                            autoComplete="name"
                            value={draft.name}
                            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                            className="w-full px-3 py-2 rounded bg-synth-dark border border-synth-cyan/30 text-white focus:border-synth-cyan outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="cb-email" className="block text-xs font-mono text-synth-cyan mb-1">
                            Email
                          </label>
                          <input
                            id="cb-email"
                            type="email"
                            required
                            autoComplete="email"
                            value={draft.email}
                            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                            className="w-full px-3 py-2 rounded bg-synth-dark border border-synth-cyan/30 text-white focus:border-synth-cyan outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="cb-msg" className="block text-xs font-mono text-synth-cyan mb-1">
                            Project details (optional)
                          </label>
                          <textarea
                            id="cb-msg"
                            rows={4}
                            value={draft.message}
                            onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))}
                            placeholder="Context, links, constraints…"
                            className="w-full px-3 py-2 rounded bg-synth-dark border border-synth-cyan/30 text-white focus:border-synth-cyan outline-none resize-none"
                          />
                        </div>
                        {submitError && (
                          <p className="text-red-400 text-xs">{submitError}</p>
                        )}
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded bg-synth-magenta text-white font-mono font-bold hover:bg-white hover:text-synth-magenta transition-colors disabled:opacity-50"
                        >
                          {submitting ? (
                            'Sending…'
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Submit inquiry
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>

              {!success && step !== 'welcome' && (
                <div className="shrink-0 border-t border-synth-cyan/20 p-3 flex justify-between items-center bg-synth-dark/80">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={!canGoBack}
                    className={`inline-flex items-center gap-1 text-xs font-mono text-synth-cyan ${
                      !canGoBack ? 'opacity-30 cursor-not-allowed' : 'hover:text-white'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                  <span className="text-[10px] text-gray-600 font-mono">
                    patrickleezepeda.com
                  </span>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
