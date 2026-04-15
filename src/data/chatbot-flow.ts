/**
 * Chatbot copy and option lists — edit here to change questions/answers.
 * Must stay in sync with allowed values in `netlify/functions/submit-chatbot-lead.js` (ALLOWED).
 */

export const PROJECT_TYPES = [
  'New website',
  'Website redesign',
  'AI chatbot',
  'Automation/workflows',
  'SEO/AEO',
  'Content/video system',
  'Not sure yet',
] as const;

export const BUSINESS_TYPES = [
  'Local service business',
  'Creator/personal brand',
  'Startup',
  'Agency',
  'Established business',
  'Other',
] as const;

export const GOALS = [
  'Get more leads',
  'Look more professional',
  'Save time with automation',
  'Improve conversions',
  'Launch something new',
  'Replace an outdated system',
] as const;

export const WEBSITE_STATUS = [
  'Yes, but it needs work',
  'No, I need one from scratch',
  'Yes, but I need new features',
  'Not sure',
] as const;

export const TIMELINES = ['ASAP', '2–4 weeks', '1–2 months', 'Flexible'] as const;

export const BUDGETS = [
  'Under $1k',
  '$1k–$3k',
  '$3k–$7k',
  '$7k+',
  'Not sure yet',
] as const;

export type StepId =
  | 'welcome'
  | 'project'
  | 'business'
  | 'goal'
  | 'website'
  | 'timeline'
  | 'budget'
  | 'contact';

export type QuickActionId = 'contact' | 'quote' | 'ai' | 'pricing' | 'inquiry';

export const QUICK_ACTIONS: {
  id: QuickActionId;
  label: string;
  hint: string;
  /** If set, skips the project-type step and starts here */
  projectType?: (typeof PROJECT_TYPES)[number];
}[] = [
  {
    id: 'contact',
    label: 'Contact Patrick / Book a call',
    hint: 'Open the contact form',
  },
  {
    id: 'quote',
    label: 'Get a website quote',
    hint: 'New site or redesign scope',
    projectType: 'New website',
  },
  {
    id: 'ai',
    label: 'Learn about AI automation services',
    hint: 'Workflows, agents, integrations',
    projectType: 'Automation/workflows',
  },
  {
    id: 'pricing',
    label: 'Ask about pricing or timeline',
    hint: 'Budget and schedule',
    projectType: 'Not sure yet',
  },
  {
    id: 'inquiry',
    label: 'Send a project inquiry',
    hint: 'Tell us what you have in mind',
    // No projectType — visitor chooses on the first question
  },
];

export const STEP_ORDER: StepId[] = [
  'welcome',
  'project',
  'business',
  'goal',
  'website',
  'timeline',
  'budget',
  'contact',
];
