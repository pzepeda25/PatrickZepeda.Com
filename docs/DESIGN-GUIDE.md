# Patrick Zepeda Design Guide

Use this as the working contract for site changes. Keep the experience tactile, precise, warm, and concise.

## Direction

**Retro-modern systems studio:** practical digital craft presented through 1980s hardware cues, technical grids, warm product imagery, and restrained terminal details.

- Lead with useful outcomes, not aesthetic language.
- Prefer asymmetry, technical labels, and visible structure.
- Keep one accent color. Avoid neon cyan, magenta, glassmorphism, and generic AI gradients.
- Every decorative element should reinforce systems, tools, motion, or craft.

## Core Tokens

Canonical tokens live in [`src/index.css`](../src/index.css).

| Role | Token | Value |
| --- | --- | --- |
| Page background | `synth-bg` | `#191816` |
| Section background | `synth-dark` | `#24221f` |
| Primary text / warm hardware | `synth-cyan` | `#d8d3cb` |
| Main text | — | `#f3f2ed` |
| Secondary text | — | `#c8c2b8` |
| Accent coral | `synth-magenta` | `#f06a5c` |
| Dark warm accent | `synth-purple` | `#6e4730` |

Coral text on dark backgrounds must remain at least WCAG AA contrast. Do not darken `#f06a5c` for body-sized text.

## Typography

- **Display/body:** Inter, system sans fallback.
- **Labels/navigation/code:** JetBrains Mono, Courier New fallback.
- Headlines are bold, tight, and sentence case: `Build systems. Ship value.`
- Technical labels are uppercase mono with generous tracking.
- Keep paragraphs short and outcome-focused. Target roughly 45–65 characters per line.

## Layout

- Use a split-screen or asymmetric composition before considering centered layouts.
- Main content width: `max-w-7xl`; page gutters: `px-6`.
- Standard section spacing: `py-24`; compact media sections may use responsive `py-10 sm:py-16 md:py-24`.
- Use grids for repeated content. Avoid unnecessary card containers.
- Preserve clear mobile stacking and test at `390px` width.

## Components

- **Primary actions:** coral fill, warm-white text, square/low-radius shape, offset key-like shadow.
- **Secondary actions:** transparent dark fill, warm-white border, no bright accent fill.
- **Windows/cards:** dark surface, thin warm border, restrained radius, hardware-window header only when meaningful.
- **Images/video:** subtle border, small radius, intentional aspect ratio; no oversized pill framing.
- **Icons:** use the existing Lucide family. Keep stroke weight and sizing consistent.
- **Focus states:** visible warm-white dashed outline. Never remove keyboard focus styling.

## Motion

- Motion should feel mechanical: stepped easing, scan lines, key presses, short translations.
- Typical duration: `120–350ms`.
- Use continuous animation sparingly and honor `prefers-reduced-motion`.
- Avoid floating blobs, excessive parallax, and decorative infinite loops.

## Imagery

- Favor top-down or three-quarter product compositions featuring keyboards, mice, coffee, cameras, diagrams, and working tools.
- Palette: charcoal, warm beige, off-white hardware, coffee brown, one coral detail.
- Keep lighting soft and tactile. Avoid glossy sci-fi, purple/blue neon, and generic office stock photography.
- Canonical social image: [`public/og-image.png`](../public/og-image.png).

## Brand Assets

- Favicon: [`public/favicon.svg`](../public/favicon.svg)
- PNG favicon: [`public/favicon-32x32.png`](../public/favicon-32x32.png)
- Apple touch icon: [`public/apple-touch-icon.png`](../public/apple-touch-icon.png)
- Social share image: [`public/og-image.png`](../public/og-image.png)
- Hero motion assets: [`public/design-assets/`](../public/design-assets/)

Do not replace or restyle these independently. Update the complete asset set and metadata references together.

## Voice

- Clear, confident, practical, and human.
- Prefer: “Build systems. Ship value.”
- Avoid inflated claims, jargon piles, and vague phrases such as “revolutionary solutions.”
- Explain what was built, why it matters, and what outcome it creates.

## SEO And AEO

- Keep page metadata and JSON-LD in [`index.html`](../index.html) accurate and evidence-based.
- Keep [`public/llms.txt`](../public/llms.txt) and [`public/sitemap.xml`](../public/sitemap.xml) current.
- Do not add FAQ or service claims that are not supported by visible page content.
- When changing the social image, preserve `1200 × 630` and update its alt text if the concept changes.

## Pre-Ship Check

- Accent color and typography follow this guide.
- Text contrast remains accessible.
- Desktop and `390px` mobile layouts have no horizontal overflow.
- Images, video, favicon, and social card load successfully.
- Metadata and JSON-LD remain valid.
- `npm run lint` and `npm run build` pass.
