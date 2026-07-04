/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState, memo, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Bot,
  BookOpen,
  Briefcase,
  Camera,
  ChevronRight,
  Code,
  Cpu,
  ExternalLink,
  Layers,
  Menu,
  MonitorPlay,
  PenTool,
  Play,
  Search,
  Send,
  Workflow,
  X,
  Youtube,
} from "lucide-react";

const GOOGLE_FORM_URL = "https://forms.gle/Kn427v39LZ8TedBX6";

const NAV_LINKS = [
  { id: "build", label: "WORK" },
  { id: "about", label: "ABOUT" },
  { id: "services", label: "SERVICES" },
  { id: "blog", label: "BLOG" },
  { id: "contact", label: "CONTACT" },
] as const;

type Role = {
  id: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  tags: readonly string[];
};

const ROLES: readonly Role[] = [
  {
    id: "role_01",
    icon: Cpu,
    title: "Creative Technologist & AI Innovator",
    desc: "Building the bridge between creative vision and automated execution.",
    tags: ["AI/ML", "Systems", "Prototyping"],
  },
  {
    id: "role_02",
    icon: Code,
    title: "Web Designer & Developer",
    desc: "Crafting high-performance, conversion-focused digital experiences across custom stacks.",
    tags: ["React", "UX", "Web Ops"],
  },
  {
    id: "role_03",
    icon: Workflow,
    title: "Omni-channel Content Creator",
    desc: "Directing campaigns that span from traditional broadcast to hyper-targeted digital lifecycle flows.",
    tags: ["Content", "Lifecycle", "Video"],
  },
  {
    id: "role_04",
    icon: Camera,
    title: "Photographer & Filmmaker",
    desc: "12+ years capturing the human element, ensuring digital systems never lose their soul.",
    tags: ["Photo", "Film", "Direction"],
  },
  {
    id: "role_05",
    icon: Briefcase,
    title: "Marketing & Sales Ops Strategist",
    desc: "Currently leading digital experience and AI-driven initiatives for a national CPG portfolio.",
    tags: ["CPG", "CRM", "Analytics"],
  },
  {
    id: "role_06",
    icon: PenTool,
    title: "Copywriter & Brand Storyteller",
    desc: "Engineering conversion-driven copy and narrative storytelling across digital touchpoints. From punchy UX microcopy to high-converting landing pages, I synthesize brand voices that cut through the static.",
    tags: ["Brand Voice", "UX Copy", "AEO"],
  },
] as const;

const SERVICES = [
  {
    icon: MonitorPlay,
    title: "AI-Driven Brand Sites",
    body: "High-performance web properties that don't just look good, they learn, adapt, and convert. Built on modern stacks with AI-native integrations.",
    list: [
      "Shopify & WordPress Optimization",
      "Dynamic AI Content Integration",
      "Headless & Custom Architecture",
    ],
  },
  {
    icon: Layers,
    title: "Omni-Channel Campaign Systems",
    body: "Cohesive, automated marketing engines that deliver the right message across email, SMS, web, and social, without the manual overhead.",
    list: [
      "Automated Email Marketing",
      "HubSpot & Segmentation Setup",
      "Analytics & Conversion Tracking",
    ],
  },
  {
    icon: Bot,
    title: "Niche AI Tools & Mini-Apps",
    body: "Custom internal tools, AI agents, and automation flows designed to eliminate bottlenecks and scale your team's capabilities.",
    list: [
      "Custom AI Agent Development",
      "Internal Workflow Automation",
      "Data Processing Pipelines",
    ],
  },
  {
    icon: Search,
    title: "AEO & Generative Search",
    body: "Future-proofing brand visibility for the AI era. Optimizing content architecture to be cited by LLMs, AI agents, and generative search engines.",
    list: [
      "Answer Engine Optimization (AEO)",
      "LLM Knowledge Graph Structuring",
      "Semantic Content Architecture",
    ],
  },
] as const;

const VIDEO_CARDS = [
  {
    title: "Synthetic Heads vs Real Animation | Claude Design and Hyperframes",
    date: "June 21, 2026",
    videoId: "DJ206BVadnE",
    image: "https://i.ytimg.com/vi/DJ206BVadnE/maxresdefault.jpg",
  },
  {
    title:
      "Turn Obsidian Into an AI Operating System, Using Claude Code, Codex, Gemini Or your Favorite LLM!",
    date: "May 2026",
    videoId: "8ohGlu1S-JQ",
    image: "https://i.ytimg.com/vi/8ohGlu1S-JQ/maxresdefault.jpg",
  },
  {
    title: "Automating Your Netlify Contact Forms with n8n, Notion & Telegram!",
    date: "May 2026",
    videoId: "dqVeJzIHsGs",
    image: "https://i.ytimg.com/vi/dqVeJzIHsGs/maxresdefault.jpg",
  },
  {
    title:
      "Spatial Control Is The New AI Image Frontier, Using Nano Banana 2, Claude Code & HyperFrames!",
    date: "May 2026",
    videoId: "wPvUJ5L7nUI",
    image: "https://i.ytimg.com/vi/wPvUJ5L7nUI/maxresdefault.jpg",
  },
] as const;

type BlogPost = {
  tag: string;
  date: string;
  title: string;
  link: string;
  image: string;
};

const BLOG_POSTS: readonly BlogPost[] = [
  {
    tag: "VIDEO AI",
    date: "JUN 2026",
    title:
      "From Code to Cinema: How Claude and HyperFrames Are Quietly Disrupting Video Production",
    link: "https://patrickzepeda.medium.com/",
    image:
      "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=900&q=80",
  },
  {
    tag: "AI MOATS",
    date: "JUN 2026",
    title:
      "Forget Prompt Engineering: Why Your Knowledge Graph is the Only AI Moat That Matters",
    link: "https://patrickzepeda.medium.com/",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
  },
  {
    tag: "SYSTEMS",
    date: "JUN 2026",
    title:
      "Why Your Business is Lagging: Insights from the Full-Stack Engine Architecture",
    link: "https://patrickzepeda.medium.com/",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
  },
  {
    tag: "AGENTS",
    date: "JUN 2026",
    title: "Coding is Dead, Orchestrating AI Agents is the Future (Cursor SDK)",
    link: "https://patrickzepeda.medium.com/",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
  },
  {
    tag: "ARCHITECTURE",
    date: "JUN 2026",
    title: "Agentic OS: The Architecture of the Agent Harness",
    link: "https://patrickzepeda.medium.com/",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
  },
  {
    tag: "WORKFLOW",
    date: "MAY 2026",
    title: "Code to Video Workflow: A CURSOR + HyperFrame Production",
    link: "https://patrickzepeda.medium.com/",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
  },
] as const;

const MEDIUM_FEED_URL =
  "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@patrickzepeda";

function decodeHtmlEntities(text: string) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function extractMediumImage(item: any, fallback: string) {
  if (item.thumbnail) return item.thumbnail;
  const description = String(item.description || "");
  const imageMatch = description.match(/<img[^>]+src="([^">]+)"/);
  return imageMatch?.[1] || fallback;
}

function inferPostTag(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes("hyperframe") || normalized.includes("video"))
    return "VIDEO AI";
  if (normalized.includes("graph")) return "AI MOATS";
  if (normalized.includes("agent")) return "AGENTS";
  if (normalized.includes("supabase") || normalized.includes("crm"))
    return "BACKEND";
  if (normalized.includes("prompt") || normalized.includes("xml"))
    return "PROMPTS";
  return "SYSTEMS";
}

function formatFeedDate(date: string) {
  if (!date) return "LATEST";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "LATEST";
  return parsed
    .toLocaleDateString("en-US", { month: "short", year: "numeric" })
    .toUpperCase();
}

function getRandomItems<T>(items: readonly T[], count = items.length) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex]!,
      shuffled[index]!,
    ];
  }
  return shuffled.slice(0, count);
}

function GridFloor() {
  return <div className="pz-grid-floor" aria-hidden="true" />;
}

function ScanLine() {
  return (
    <div className="pz-scan-wrap" aria-hidden="true">
      <div />
    </div>
  );
}

function ActionButton({
  children,
  href,
  onClick,
  variant = "cyan",
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "cyan" | "ghost" | "pink";
}) {
  const className = `pz-action pz-action-${variant}`;
  const content = (
    <>
      <span>{children}</span>
      <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
    </>
  );

  if (href) {
    return (
      <a
        className={className}
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button className={className} type="button" onClick={onClick}>
      {content}
    </button>
  );
}

function SectionTitle({
  title,
  kicker,
  center = false,
}: {
  title: string;
  kicker?: string;
  center?: boolean;
}) {
  return (
    <div
      className={`pz-section-title ${center ? "pz-section-title-center" : ""}`}
    >
      <h2>{title}</h2>
      {kicker ? <p>{kicker}</p> : null}
    </div>
  );
}

function TerminalCard({
  role,
  index,
}: {
  key?: React.Key;
  role: Role;
  index: number;
}) {
  const Icon = role.icon;
  return (
    <motion.article
      className="pz-terminal-card"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.55,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="pz-terminal-chrome">
        <div aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span>{role.id}.exe</span>
      </div>
      <div className="pz-terminal-body">
        <Icon className="h-7 w-7" strokeWidth={1.4} />
        <h3>{role.title}</h3>
        <p>{role.desc}</p>
        <div className="pz-chip-row">
          {role.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

const Nav = memo(function Nav({
  activeSection,
  onContact,
}: {
  activeSection: string;
  onContact: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById("nav-sentinel");
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setScrolled(!entry.isIntersecting);
      },
      { rootMargin: "-60px 0px 0px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <nav className={`pz-nav ${scrolled ? "pz-nav-scrolled" : ""}`}>
        <div className="pz-nav-inner">
          <a className="pz-logo" href="#home" aria-label="Patrick Zepeda home">
            <span>Z_</span>EPEDA
          </a>

          <div className="pz-nav-links">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                aria-current={
                  activeSection === link.id ? "location" : undefined
                }
              >
                {link.label}
              </a>
            ))}
          </div>

          <button
            className="pz-menu-button"
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <motion.div
          className="pz-mobile-menu"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {NAV_LINKS.map((link) =>
            link.id === "contact" ? (
              <button
                key={link.id}
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onContact();
                }}
              >
                {link.label}
              </button>
            ) : (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ),
          )}
        </motion.div>
      ) : null}
    </>
  );
});

const Hero = memo(function Hero({ onContact }: { onContact: () => void }) {
  const reduceMotion = useReducedMotion();
  const [typed, setTyped] = useState("");
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    if (reduceMotion) {
      setTyped("CREATIVE TECHNOLOGIST / SYSTEMS DIRECTOR");
      return undefined;
    }
    let i = 0;
    const full = "CREATIVE TECHNOLOGIST / SYSTEMS DIRECTOR";
    const timeout = window.setTimeout(() => {
      const interval = window.setInterval(() => {
        i += 1;
        setTyped(full.slice(0, i));
        if (i >= full.length) window.clearInterval(interval);
      }, 32);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const interval = window.setInterval(
      () => setCursor((value) => !value),
      530,
    );
    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  return (
    <section id="home" className="pz-hero">
      <div className="pz-ambient pz-ambient-cyan" aria-hidden="true" />
      <div className="pz-ambient pz-ambient-magenta" aria-hidden="true" />

      <motion.div
        className="pz-hero-copy"
        initial={reduceMotion ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="pz-system-tag">
          <span aria-hidden="true" />
          {typed}
          <b style={{ opacity: cursor ? 1 : 0 }}>_</b>
        </div>

        <p className="pz-name">PATRICK ZEPEDA.</p>
        <h1>
          <span>BUILD SYSTEMS.</span>
          <span>SHIP VALUE.</span>
        </h1>
        <p className="pz-hero-lede">
          I turn creative instinct into practical digital systems that move
          brands, teams, and ideas forward.
        </p>

        <div className="pz-actions">
          <ActionButton onClick={onContact}>Start a Project</ActionButton>
          <ActionButton href="#build" variant="ghost">
            View the Work
          </ActionButton>
        </div>
      </motion.div>

      <motion.div
        className="pz-hero-card"
        initial={reduceMotion ? false : { opacity: 0, x: 42, rotate: 2 }}
        animate={{ opacity: 1, x: 0, rotate: -1 }}
        transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="pz-hero-card-label">
          <span>WORKING SYSTEM / 001</span>
          <span>CAMERA STUDY</span>
        </div>
        <div className="pz-reel">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={`${import.meta.env.BASE_URL}design-assets/studio-camera-illustration-poster.png`}
            aria-label="Animated studio camera study"
          >
            <source
              src={`${import.meta.env.BASE_URL}design-assets/studio-camera-illustration.mp4`}
              type="video/mp4"
            />
          </video>
          <div className="pz-reel-caption">
            <span>Simple tools.</span>
            <strong>Powerful systems.</strong>
          </div>
        </div>
        <div className="pz-hero-card-label pz-hero-card-meta">
          <span>DIRECT / DESIGN / BUILD</span>
          <span>IN MOTION</span>
        </div>
      </motion.div>

      <ScanLine />
      <GridFloor />
    </section>
  );
});

const FeaturedBuild = memo(function FeaturedBuild() {
  return (
    <section id="build" className="pz-feature-section">
      <div className="pz-feature-grid">
        <motion.div
          className="pz-feature-copy"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="pz-kicker">My Latest Featured Build</div>
          <h2>XML Image Forge</h2>
          <p className="pz-feature-lede">Power up your image prompts.</p>
          <p>
            I engineered this tool to generate precise, structured XML configs
            for your Image Prompt Generator workflows in seconds, so every
            render is consistent, controllable, and production-ready.
          </p>

          <div className="pz-feature-actions">
            <ActionButton href="https://xmlimageforge.com/">
              Open App
            </ActionButton>
            <span>Now Serving Downloadable JSON Output!</span>
          </div>
        </motion.div>

        <motion.div
          className="pz-forge-board"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="pz-browser">
            <div className="pz-browser-bar">
              <i />
              <i />
              <i />
              <span>xmlimageforge.com</span>
            </div>
            <img
              src="/xml-image-forge/main-image-forge.webp"
              alt="XML Image Forge interface"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="pz-output-grid" aria-label="Example Outputs">
            <figure>
              <img
                src="/xml-image-forge/dog-chef.webp"
                alt="Dachshund Chef generated output"
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                &lt;subject&gt;Dachshund Chef&lt;/subject&gt;
              </figcaption>
            </figure>
            <figure>
              <img
                src="/xml-image-forge/tv-fish-bowl.webp"
                alt="TV Fish Bowl generated output"
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                &lt;subject&gt;TV Fish Bowl&lt;/subject&gt;
              </figcaption>
            </figure>
            <figure>
              <img
                src="/xml-image-forge/lake-cabin.webp"
                alt="Lake Sunset generated output"
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                &lt;environment&gt;Lake Sunset&lt;/environment&gt;
              </figcaption>
            </figure>
          </div>
          <p className="pz-example-label">Example Outputs</p>
        </motion.div>
      </div>
    </section>
  );
});

const IdentityMatrix = memo(function IdentityMatrix() {
  return (
    <section id="about" className="pz-section pz-section-violet">
      <div className="pz-container">
        <SectionTitle
          title="Identity Matrix"
          kicker="Current Roles & Capabilities"
        />
        <div className="pz-role-grid">
          {ROLES.map((role, index) => (
            <TerminalCard key={role.id} role={role} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
});

const YoutubeSection = memo(function YoutubeSection() {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const videos = useMemo(() => getRandomItems(VIDEO_CARDS), []);

  return (
    <section className="pz-section pz-section-base">
      <div className="pz-container">
        <div className="pz-card-section-header">
          <div>
            <div className="pz-kicker">
              <Youtube className="h-4 w-4" />
              Featured Content
            </div>
            <h2>Latest upload from the channel</h2>
          </div>
          <a
            href="https://www.youtube.com/@Patrick_Lee_Zepeda"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Channel <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="pz-video-card-grid">
          {videos.map((video, index) => (
            <motion.button
              className="pz-video-card"
              key={video.title}
              type="button"
              onClick={() => setPlayingVideoId(video.videoId)}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.52,
                delay: index * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="pz-video-thumb">
                {playingVideoId === video.videoId ? (
                  <iframe
                    title={video.title}
                    src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <img
                      src={video.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                    <span>
                      <Play className="h-5 w-5" fill="currentColor" />
                    </span>
                  </>
                )}
              </div>
              <div>
                <p>{video.date}</p>
                <h3>{video.title}</h3>
                <span>
                  {playingVideoId === video.videoId
                    ? "Playing on site"
                    : "Play Video"}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
});

const CoreServices = memo(function CoreServices() {
  return (
    <section id="services" className="pz-section pz-section-base">
      <div className="pz-container">
        <SectionTitle
          title="Core Services"
          kicker="High-Leverage Engagements"
          center
        />
        <div className="pz-services-grid">
          {SERVICES.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.article
                className="pz-service-card"
                key={service.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Icon className="h-8 w-8" strokeWidth={1.35} />
                <h3>{service.title}</h3>
                <p>{service.body}</p>
                <ul>
                  {service.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
});

const Transmissions = memo(function Transmissions() {
  const [posts, setPosts] = useState<readonly BlogPost[]>(() =>
    getRandomItems(BLOG_POSTS, 6),
  );

  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      try {
        const response = await fetch(MEDIUM_FEED_URL);
        const data = await response.json();
        if (data.status !== "ok" || !Array.isArray(data.items)) return;

        const mapped = data.items.map((item: any, index: number) => {
          const fallback = BLOG_POSTS[index % BLOG_POSTS.length]!;
          const title = decodeHtmlEntities(item.title || fallback.title);
          return {
            tag: inferPostTag(title),
            date: formatFeedDate(item.pubDate),
            title,
            link: item.link || fallback.link,
            image: extractMediumImage(item, fallback.image),
          };
        });

        if (!cancelled && mapped.length > 0)
          setPosts(getRandomItems(mapped, Math.min(6, mapped.length)));
      } catch {
        if (!cancelled) setPosts(getRandomItems(BLOG_POSTS, 6));
      }
    };

    loadPosts();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="blog" className="pz-section pz-section-surface">
      <div className="pz-container">
        <div className="pz-card-section-header">
          <div>
            <div className="pz-kicker">
              <BookOpen className="h-4 w-4" />
              Latest Transmissions
            </div>
            <h2>Decrypting thoughts from the Medium feed...</h2>
          </div>
          <a
            href="https://patrickzepeda.medium.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read on Medium <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="pz-blog-card-grid">
          {posts.map((post, index) => (
            <motion.a
              className="pz-blog-card"
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              key={post.title}
              style={{ ["--card-index" as string]: index }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{
                duration: 0.5,
                delay: Math.min(index * 0.035, 0.22),
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="pz-blog-art">
                <img src={post.image} alt="" loading="lazy" decoding="async" />
              </div>
              <div className="pz-blog-card-body">
                <div>
                  <span>{post.tag}</span>
                  <time>{post.date}</time>
                </div>
                <h3>{post.title}</h3>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
});

function GoogleFormModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="pz-form-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-form-title"
    >
      <button
        className="pz-form-backdrop"
        type="button"
        aria-label="Close form"
        onClick={onClose}
      />
      <motion.div
        className="pz-form-panel"
        initial={{ opacity: 0, y: 26, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="pz-form-header">
          <div>
            <p>Project Intake</p>
            <h2 id="project-form-title">Start a Project</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close form">
            <X className="h-5 w-5" />
          </button>
        </div>
        <iframe
          title="Patrick Zepeda project intake form"
          src={GOOGLE_FORM_URL}
        />
        <div className="pz-form-footer">
          <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer">
            Open form in a new tab <Send className="h-4 w-4" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}

const CTA = memo(function CTA({ onContact }: { onContact: () => void }) {
  return (
    <section id="contact" className="pz-cta">
      <div className="pz-cta-glow" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2>
          BUILD SYSTEMS.
          <span>SHIP VALUE.</span>
        </h2>
        <p>
          I turn creative instinct into practical digital systems that move
          brands, teams, and ideas forward.
        </p>
        <ActionButton onClick={onContact} variant="pink">
          Start a Project
        </ActionButton>
      </motion.div>
    </section>
  );
});

const Footer = memo(function Footer() {
  return (
    <footer className="pz-footer">
      <div>
        <a className="pz-logo" href="#home">
          <span>Z_</span>EPEDA
        </a>
        <div className="pz-footer-links">
          <a
            href="https://www.linkedin.com/in/patrickleezepeda/"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
          <a
            href="https://patrickzepeda.medium.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Medium
          </a>
          <a
            href="https://www.youtube.com/@Patrick_Lee_Zepeda"
            target="_blank"
            rel="noopener noreferrer"
          >
            YouTube
          </a>
        </div>
      </div>
      <p>© {new Date().getFullYear()} PATRICK ZEPEDA. ALL RIGHTS RESERVED.</p>
    </footer>
  );
});

export default function App() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const sectionIds = useMemo(
    () => ["home", ...NAV_LINKS.map((link) => link.id)],
    [],
  );

  const isFormRoute =
    typeof window !== "undefined" &&
    (window.location.pathname === "/form" ||
      window.location.pathname.startsWith("/form/") ||
      window.location.hash === "#/form" ||
      window.location.hash.startsWith("#/form/"));

  useEffect(() => {
    if (isFormRoute) setIsContactModalOpen(true);
  }, [isFormRoute]);

  useEffect(() => {
    const handler = () => setIsContactModalOpen(true);
    window.addEventListener("open-contact-modal", handler as EventListener);
    return () =>
      window.removeEventListener(
        "open-contact-modal",
        handler as EventListener,
      );
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.2, 0.45, 0.7] },
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  // Memoize the openContact handler so we can pass it to memoized child components
  // without breaking their memoization when App re-renders due to scroll state changes
  const openContact = useCallback(() => setIsContactModalOpen(true), []);

  return (
    <div className="pz-site selection:bg-pz-magenta selection:text-pz-white">
      <Nav activeSection={activeSection} onContact={openContact} />
      <span id="nav-sentinel" className="pz-nav-sentinel" aria-hidden="true" />
      <main>
        <Hero onContact={openContact} />
        <FeaturedBuild />
        <IdentityMatrix />
        <YoutubeSection />
        <CoreServices />
        <Transmissions />
        <CTA onContact={openContact} />
      </main>
      <Footer />

      <GoogleFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  );
}
