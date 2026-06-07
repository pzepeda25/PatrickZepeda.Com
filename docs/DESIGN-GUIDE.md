# Patrick Zepeda Brand & Style Guide

The canonical guide for Patrick Zepeda’s website, social assets, presentations, and branded digital experiences.

## 1. Brand Foundation

### Positioning

Patrick Zepeda is a **Creative Technologist and Systems Director** who turns creative instinct into practical digital systems that move brands, teams, and ideas forward.

### Brand Promise

**Build systems. Ship value.**

### Brand Idea

**Retro-modern systems studio:** tactile creative craft, modern automation, and visible technical structure.

### Brand Restraint Rule

The retro-modern language is a **supporting layer, not the subject**. Start with the communication goal, then apply only enough brand styling to make the work recognizable.

- Brand mood must never reduce clarity, legibility, or information hierarchy.
- Use at most **one hero hardware illustration** per composition.
- Do not turn every process, concept, or container into a retro computer.
- Functional diagrams should be approximately **80% information design / 20% brand expression**.

### Quality Calibration

A successful branded technical visual feels clear first and distinctive second.

**Good:** one focal idea, obvious reading order, editable labels, simple diagram shapes, visible coral signal, selective hardware reference.

**Too much:** multiple detailed computers, dense wiring everywhere, monochrome beige treatment, tiny generated labels, equal visual weight across the entire canvas.

### Audience

- Teams seeking practical AI, automation, web, brand, or content systems
- Creative and marketing leaders who value both ideas and execution
- Collaborators, clients, recruiters, and technical partners

### Personality

| Trait | Expressed As | Avoid |
| --- | --- | --- |
| Practical | Clear outcomes and working systems | Empty futurism |
| Inventive | Unexpected combinations and prototypes | Novelty without purpose |
| Tactile | Hardware, tools, texture, human craft | Sterile generic tech |
| Precise | Visible structure and concise language | Jargon piles |
| Warm | Coffee tones, human voice, honest detail | Cold corporate language |

## 2. Voice & Messaging

### Voice

Clear, confident, practical, curious, and human. Explain what was built, why it matters, and what outcome it creates.

### Writing Rules

- Lead with verbs and outcomes.
- Use short sentences and specific nouns.
- Prefer plain language over buzzwords.
- Use technical language only when it adds precision.
- Keep headings memorable and body copy easy to scan.

### Message Examples

**Use**

- Build systems. Ship value.
- Simple tools. Powerful systems.
- Practical digital systems that move ideas forward.
- Direct. Design. Build.

**Avoid**

- Revolutionary solutions for tomorrow’s digital landscape.
- Harnessing cutting-edge innovation to unlock limitless potential.
- Best-in-class, world-class, game-changing experiences.

## 3. Logo System

### Primary Mark

The core identity is the coral **PZ hardware-key mark**: a compact technical signature that connects retro computing with modern systems work.

Canonical assets:

- Favicon / compact mark: [`public/favicon.svg`](../public/favicon.svg)
- PNG favicon: [`public/favicon-32x32.png`](../public/favicon-32x32.png)
- Apple touch icon: [`public/apple-touch-icon.png`](../public/apple-touch-icon.png)

### Usage

- Use the compact mark for favicons, avatars, app icons, and small navigation placements.
- Pair the mark with the full name when brand recognition is important.
- Keep clear space around the mark equal to at least **25% of its width**.
- Minimum digital size: **24px**. Prefer **40px+** in navigation and social avatars.

### Logo Don’ts

- Do not use the old neon cyan/magenta PZ mark.
- Do not recolor the mark outside the approved palette.
- Do not stretch, rotate, add glow, or place it on a low-contrast background.
- Do not introduce a separate logo treatment without updating the complete asset set.

## 4. Color System

Canonical implementation tokens live in [`src/index.css`](../src/index.css).

### Core Palette

| Name | Role | Token | Hex |
| --- | --- | --- | --- |
| Studio Black | Primary background | `synth-bg` | `#191816` |
| Workbench Charcoal | Section/card background | `synth-dark` | `#24221f` |
| Hardware White | Main text / light hardware | — | `#f3f2ed` |
| Warm Aluminum | Borders / large secondary elements | `synth-cyan` | `#d8d3cb` |
| Muted Label | Secondary text | — | `#c8c2b8` |
| Signal Coral | Primary accent / visible accent text | `synth-magenta` | `#f06a5c` |
| Button Coral | Primary action fill | — | `#e75d50` |
| Hover Coral | Primary action hover | — | `#ff7b6d` |
| Coffee Brown | Ambient warmth / restrained support | `synth-purple` | `#6e4730` |

### Color Ratios

- Approximately **70% dark neutrals**
- Approximately **20% warm whites and beige hardware tones**
- Approximately **5–10% Signal Coral**, including at least one visible focal accent

### Accessible Combinations

- Hardware White on Studio Black or Workbench Charcoal
- Warm Aluminum on Studio Black
- Signal Coral on Workbench Charcoal: approximately **5.23:1**
- Hardware White on Button Coral for bold, short labels

Do not darken Signal Coral for body-sized text. Avoid Coffee Brown for text.

### Color Don’ts

- No neon cyan, electric magenta, or purple-blue gradients.
- No additional competing accent colors.
- Do not use coral as a large page background.
- Do not use pure white or pure black unless a technical asset requires it.

## 5. Typography

### Font Families

| Role | Family | Fallback |
| --- | --- | --- |
| Display and body | Inter | system-ui, sans-serif |
| Navigation, labels, code | JetBrains Mono | Courier New, monospace |

### Type Hierarchy

| Style | Guidance |
| --- | --- |
| Hero display | `48–72px`, 800–900 weight, tight tracking, `0.92–1.0` line height |
| Section heading | `30–48px`, 700 weight, mono, uppercase where technical |
| Card heading | `20–30px`, 700 weight |
| Body | `16–20px`, regular/light, `1.6` line height |
| Technical label | `10–14px`, mono, 700 weight, uppercase, `0.08–0.16em` tracking |
| Caption | `10–13px`, mono, muted |

### Typography Rules

- Headlines are bold, compact, and usually sentence case.
- Technical labels may use uppercase mono.
- Use coral punctuation or labels for emphasis, not whole paragraphs.
- Keep paragraphs around **45–65 characters per line**.
- Avoid mixing additional display fonts without a documented brand update.
- Never ask an image-generation model to render final functional text. Composite all titles, labels, captions, and diagram copy using real typography after image generation.
- Keep headings to **two lines maximum** and supporting paragraphs to **three lines maximum** in visual assets.

## 6. Layout & Spacing

### Principles

- Prefer split-screen and asymmetric compositions.
- Make technical structure visible through grids, rules, labels, and borders.
- Keep content density moderate. Let important work breathe.
- Use cards only when a container communicates a meaningful unit.
- Establish one obvious reading path. A viewer should understand the title, main idea, and flow within five seconds.

### Web Layout Standards

- Main content width: `max-w-7xl`
- Default page gutter: `px-6`
- Standard section spacing: `py-24`
- Compact media spacing: `py-10 sm:py-16 md:py-24`
- Repeated content: CSS Grid
- Required mobile test width: `390px`

### Radius & Borders

- Use restrained radii, generally `0–8px`.
- Buttons may be square or slightly rounded, never pill-shaped.
- Use thin warm borders with subtle contrast.

## 7. Imagery

### Image Direction

Photography and generated imagery should feel like a well-used creative systems desk:

- Top-down or three-quarter product compositions
- Keyboards, mice, cameras, coffee, diagrams, circuits, notebooks, and tools
- Charcoal, warm beige, off-white hardware, coffee brown, and one coral detail
- Soft studio light, tactile surfaces, subtle grain, and restrained shadows

### Image Composition

- Use deliberate negative space for copy.
- Keep product arrangements clean and functional.
- Crop with intention; do not cut through the primary subject awkwardly.
- Use subtle borders and small corner radii on the site.

### Image Don’ts

- No glossy sci-fi interfaces or generic AI imagery.
- No purple/blue neon, cyberpunk cityscapes, or holographic brains.
- No generic office stock photography.
- No decorative objects that do not support the systems-and-craft story.

### Image Prompt Starter

Use this only for **marketing/editorial imagery**, not diagrams or information-dense slides:

> Retro-modern creative systems studio, dark charcoal technical grid, warm beige hardware, off-white keyboard and mouse, iced coffee, one coral-red detail, soft tactile studio lighting, restrained editorial product photography, precise composition, subtle grain, no neon, no text, no watermark.

When copy is needed, generate an image with intentional negative space and add the final text deterministically in Figma, HTML/CSS, or presentation software.

## 8. Diagrams & Information Design

Diagrams explain systems. They are not product-photo collages.

### Diagram Rules

- Start with nodes, relationships, sequence, and hierarchy before styling.
- Use simple geometric containers, lines, arrows, and Lucide icons.
- Use retro hardware imagery only as one optional framing metaphor or hero illustration.
- Keep labels horizontal and readable. Use real text, never generated text.
- Make primary flow lines stronger than decorative circuit traces.
- Use Signal Coral to identify the start point, critical path, key decision, or output.
- Use Warm Aluminum for secondary structure and Hardware White for primary labels.
- Decorative grid lines and circuit traces must remain below **20% visual prominence**.

### Complexity Budget

- One core message per diagram
- Three to seven primary nodes
- Maximum two hierarchy levels visible at once
- Maximum three type sizes
- Maximum one paragraph; prefer short labels and a separate caption
- At least 20% open negative space

### Diagram Don’ts

- Do not represent every node as a detailed computer, terminal, or device.
- Do not fill all available space with wires, components, or decoration.
- Do not use tiny paragraphs inside illustrations.
- Do not make all lines, nodes, and labels the same visual weight.
- Do not use monochrome beige alone; include an intentional coral focal signal.

### Diagram Brief Starter

> Create a clear architecture diagram first and apply Patrick Zepeda brand styling second. Use simple editable geometric nodes, a single left-to-right reading path, three to seven primary nodes, strong hierarchy, dark charcoal background, warm-white labels, muted warm-gray secondary lines, and Signal Coral only for the critical path and output. Keep at least 20% negative space. Use no detailed computer illustrations, no generated text, no dense decorative wiring, and no more than one subtle retro-hardware reference.

## 9. Iconography

- Use the existing **Lucide** icon family.
- Keep icons outlined, simple, and technical.
- Standard sizes: `16px`, `20px`, `24px`, and `32px`.
- Use one consistent stroke weight within a surface.
- Icons support labels; they do not replace unclear language.

Avoid emoji, filled novelty icons, and mixed icon families.

## 10. UI Components

### Buttons

- **Primary:** Button Coral fill, Hardware White text, short mono label, offset key-like shadow.
- **Secondary:** Transparent dark fill, Hardware White border/text.
- **Interaction:** small stepped translation and shadow shift.

### Cards & Windows

- Use Workbench Charcoal surfaces with thin warm borders.
- Hardware-window headers are reserved for technical modules and system artifacts.
- Avoid wrapping every content group in a card.

### Media

- Use intentional aspect ratios.
- Add a subtle border and restrained radius.
- Videos may use a light scrim for captions.

### Forms

- Keep labels visible and specific.
- Inputs use dark fills, warm borders, and clear focus states.
- Errors must use readable text, not color alone.

### Focus & Accessibility

- Keep visible warm-white dashed focus outlines.
- Never remove keyboard navigation states.
- Preserve contrast and respect reduced-motion preferences.

## 11. Motion

Motion should feel mechanical and purposeful.

- Typical duration: **120–350ms**
- Preferred behaviors: key presses, stepped transitions, scan lines, short reveals
- Continuous animation should be rare
- Always honor `prefers-reduced-motion`

Avoid floating blobs, excessive parallax, springy novelty motion, and decorative infinite loops.

## 12. Social, Presentations & Marketing Assets

### Social Share Card

- Canonical asset: [`public/og-image.png`](../public/og-image.png)
- Required size: **1200 × 630**
- Keep text within safe margins of at least **60px**
- Use the primary brand promise, role, name, and canonical domain
- Use tactile workstation imagery and clear left-side copy space

### Profile Image

Use the compact PZ mark on Studio Black or Signal Coral. Keep it simple enough to read at small sizes.

### Presentations

- Use dark backgrounds with warm-white text.
- One key statement or one clear diagram per slide.
- Use Signal Coral for key numbers, punctuation, and short labels.
- Favor diagrams, product imagery, and system flows over decorative illustration.
- Keep titles under **12 words**.
- Use no more than **six meaningful objects** on a standard slide.
- Put detailed explanation in speaker notes or a follow-up slide.
- Build text and diagrams with editable vectors and typography. AI-generated imagery may be used only as a background or supporting illustration.

### Asset Mode Selection

Choose one mode before creating:

| Mode | Primary Goal | Brand Expression |
| --- | --- | --- |
| Marketing image | Create mood and recognition | High |
| Social card | Communicate one message quickly | Medium-high |
| Presentation slide | Explain one idea | Medium |
| Architecture diagram | Explain relationships and flow | Low-medium |
| Technical documentation | Maximize comprehension | Low |

When in doubt, reduce decoration and increase hierarchy.

## 13. Metadata, SEO & AEO

- Metadata and JSON-LD source: [`index.html`](../index.html)
- AI discovery source: [`public/llms.txt`](../public/llms.txt)
- Sitemap: [`public/sitemap.xml`](../public/sitemap.xml)

Rules:

- Keep claims accurate and supported by visible content.
- Use clear entity language: Patrick Zepeda, Creative Technologist, Systems Director.
- Update social image alt text when the concept changes.
- Do not add unsupported FAQ or service claims.

## 14. Governance

### Canonical Assets

- Logo/favicon: [`public/favicon.svg`](../public/favicon.svg)
- Social share card: [`public/og-image.png`](../public/og-image.png)
- Hero media: [`public/design-assets/`](../public/design-assets/)
- Color/type tokens: [`src/index.css`](../src/index.css)

### Change Rule

When changing a core brand element, update the complete system:

- Color change: tokens, accessibility checks, imagery guidance, and social assets
- Logo change: SVG, favicon PNG, Apple touch icon, and social/profile uses
- Messaging change: visible site copy, metadata, JSON-LD, and `llms.txt`

## 15. Pre-Ship Checklist

- Brand promise and voice remain clear.
- The correct asset mode was selected before styling.
- The main message and reading path are obvious within five seconds.
- Only approved colors and fonts are used.
- Signal Coral creates a visible focal point without becoming a large background.
- Accent text remains accessible.
- All functional copy uses real, editable typography rather than generated image text.
- Diagrams respect the complexity budget and use hardware imagery sparingly.
- Desktop and `390px` mobile have no horizontal overflow.
- Focus states and reduced-motion behavior work.
- Images, video, favicon, and social card load successfully.
- Metadata, JSON-LD, `llms.txt`, and sitemap are accurate.
- `npm run lint` and `npm run build` pass.
