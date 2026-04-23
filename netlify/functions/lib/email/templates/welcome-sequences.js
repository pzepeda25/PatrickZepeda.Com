export const WELCOME_SEQUENCES = {
  'website-design': {
    step1: {
      subject: 'Quick note on your {{serviceInterest}} goals',
      preheader: "I reviewed your note. Here's the cleanest next move.",
      title: 'Thanks for reaching out, {{firstName}}',
      bodyHtml:
        '<p>I got your inquiry and saw that your main focus is <strong>{{serviceInterest}}</strong>.</p><p>I can help you tighten the strategy and execution so the end result is clear and conversion-focused.</p><p>If you want, start here: {{primaryCtaUrl}}</p>',
      ctaLabel: 'Share your references',
    },
    step2: {
      subject: 'Want a second set of eyes on your {{serviceInterest}} direction?',
      preheader: 'If timing still works, send me your refs and constraints.',
      title: 'Quick follow-up, {{firstName}}',
      bodyHtml:
        '<p>Circling back in case this slipped through.</p><p>If <strong>{{serviceInterest}}</strong> is still a priority, send over your references, goals, and constraints so I can give you a focused recommendation.</p><p>You can send everything here: {{primaryCtaUrl}}</p>',
      ctaLabel: 'Send project context',
    },
  },
  'content-creation': {
    step1: {
      subject: 'Your {{serviceInterest}} plan can stay simple',
      preheader: 'Quick framework to keep output consistent.',
      title: 'Great to connect, {{firstName}}',
      bodyHtml:
        '<p>Thanks for reaching out about <strong>{{serviceInterest}}</strong>.</p><p>A clear offer, one repeatable structure, and fast feedback loops usually wins here.</p><p>When you are ready, send details here: {{primaryCtaUrl}}</p>',
      ctaLabel: 'Send your current content',
    },
    step2: {
      subject: 'Still exploring {{serviceInterest}}?',
      preheader: 'I can help you simplify the system and next steps.',
      title: 'Quick follow-up, {{firstName}}',
      bodyHtml:
        '<p>Wanted to follow up in case this got buried.</p><p>If you still want support with <strong>{{serviceInterest}}</strong>, share what you are publishing now and where things feel stuck.</p><p>Drop details here: {{primaryCtaUrl}}</p>',
      ctaLabel: 'Share your current workflow',
    },
  },
  'website-strategy': {
    step1: {
      subject: 'First pass on your {{serviceInterest}} direction',
      preheader: 'Let’s make the next decision obvious.',
      title: 'Thanks for the inquiry, {{firstName}}',
      bodyHtml:
        '<p>I reviewed your note around <strong>{{serviceInterest}}</strong>.</p><p>Best next step is defining the highest-leverage pages and what each one should do.</p><p>Drop context here and I can reply with a focused recommendation: {{primaryCtaUrl}}</p>',
      ctaLabel: 'Share your current site',
    },
    step2: {
      subject: 'Should we map your {{serviceInterest}} priorities next?',
      preheader: 'I can help you choose the highest-leverage pages first.',
      title: 'Following up, {{firstName}}',
      bodyHtml:
        '<p>Following up in case you still want help with <strong>{{serviceInterest}}</strong>.</p><p>If you send your current site and primary goal, I can point you to the highest-impact next move.</p><p>Start here: {{primaryCtaUrl}}</p>',
      ctaLabel: 'Send your site and goal',
    },
  },
  'content-strategy': {
    step1: {
      subject: 'A cleaner {{serviceInterest}} system for your brand',
      preheader: 'Short path from random posts to a consistent engine.',
      title: 'Good to hear from you, {{firstName}}',
      bodyHtml:
        '<p>Thanks for reaching out about <strong>{{serviceInterest}}</strong>.</p><p>With the right message architecture, content decisions get much easier and faster.</p><p>Send your goals and current assets here: {{primaryCtaUrl}}</p>',
      ctaLabel: 'Send goals and assets',
    },
    step2: {
      subject: 'Need help turning {{serviceInterest}} into a clear system?',
      preheader: 'Happy to give you a practical next-step plan.',
      title: 'Checking in, {{firstName}}',
      bodyHtml:
        '<p>Quick follow-up in case this is still on your list.</p><p>If <strong>{{serviceInterest}}</strong> is still in motion, send me your offer and audience and I can suggest a practical structure.</p><p>Share details: {{primaryCtaUrl}}</p>',
      ctaLabel: 'Send offer and audience',
    },
  },
  other: {
    step1: {
      subject: 'Thanks for reaching out, {{firstName}}',
      preheader: 'I got your inquiry and can help you map next steps.',
      title: 'Your inquiry came through',
      bodyHtml:
        '<p>Thanks for reaching out.</p><p>I reviewed your message and can help shape the right next move based on your priorities.</p><p>Share a few details here and I will reply directly: {{primaryCtaUrl}}</p>',
      ctaLabel: 'Reply with project details',
    },
    step2: {
      subject: 'Still want help moving this forward, {{firstName}}?',
      preheader: 'Happy to review details and suggest the best next step.',
      title: 'Following up on your inquiry',
      bodyHtml:
        '<p>Wanted to check in one more time.</p><p>If you still want help with <strong>{{serviceInterest}}</strong>, reply with your goals and timeline and I can point you in the right direction.</p><p>You can send it here: {{primaryCtaUrl}}</p>',
      ctaLabel: 'Reply with goals and timeline',
    },
  },
};
