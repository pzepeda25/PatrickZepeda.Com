import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Youtube, ExternalLink, Play } from 'lucide-react';

/** Maps to https://www.youtube.com/@Patrick_Lee_Zepeda */
const YOUTUBE_CHANNEL_ID = 'UCifMOkKKdt0Qg-1kuWBaToQ';
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@Patrick_Lee_Zepeda';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
const RSS2JSON = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;

function decodeHtmlEntities(text: string) {
  const ta = document.createElement('textarea');
  ta.innerHTML = text;
  return ta.value;
}

type VideoItem = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  href: string;
  publishedAt?: string;
};

const FALLBACK_ITEMS: VideoItem[] = [
  {
    id: 'fallback-1',
    title: 'Why I Tried to Ghost Claude for Gemini, & Why My Codebase Wouldn\'t Let Me.',
    description: 'A developer narrative exploring the transition from Claude to Google Gemini for coding automation. Learn how leveraging Gemini APIs and advanced agentic workflows turned compile errors and agent crashes into success.',
    imageSrc: `${import.meta.env.BASE_URL}images/ghost-claude-gemini-hero.png`,
    href: 'https://www.youtube.com/watch?v=DJ206BVadnE',
    publishedAt: 'May 2026',
  },
  {
    id: 'fallback-2',
    title: 'Turn Obsidian Into an AI Operating System, Using Claude Code, Codex, Gemini Or your Favorite LLM!',
    description: 'How to turn Obsidian into a lightweight AI Operating System using flat markdown files, progressive disclosure boot sequences, and self-maintaining memory blocks.',
    imageSrc: 'https://i.ytimg.com/vi/8ohGlu1S-JQ/maxresdefault.jpg',
    href: 'https://www.youtube.com/watch?v=8ohGlu1S-JQ',
    publishedAt: 'May 2026',
  },
  {
    id: 'fallback-3',
    title: 'Automating Your Netlify Contact Forms with n8n, Notion & Telegram!',
    description: 'Set up a custom, headless pipeline that automatically pushes form captures to Notion and alerts your phone in real time.',
    imageSrc: 'https://i.ytimg.com/vi/dqVeJzIHsGs/maxresdefault.jpg',
    href: 'https://www.youtube.com/watch?v=dqVeJzIHsGs',
    publishedAt: 'May 2026',
  },
  {
    id: 'fallback-4',
    title: 'Level Up Your React Forms with Netlify Blobs & Cursor',
    description: 'How to persist client-side files, logs, and form states directly inside Netlify Blobs using Cursor\'s AI coding assistant.',
    imageSrc: 'https://i.ytimg.com/vi/snjBNLDZc2Q/maxresdefault.jpg',
    href: 'https://www.youtube.com/watch?v=snjBNLDZc2Q',
    publishedAt: 'May 2026',
  },
  {
    id: 'fallback-5',
    title: 'Spatial Control Is The New AI Image Frontier, Using Nano Banana 2, Claude Code & HyperFrames!',
    description: 'Directing AI image models with spatial grids, markdown rules, and next-generation control mechanisms for structured asset generation.',
    imageSrc: 'https://i.ytimg.com/vi/wPvUJ5L7nUI/maxresdefault.jpg',
    href: 'https://www.youtube.com/watch?v=wPvUJ5L7nUI',
    publishedAt: 'May 2026',
  },
];

const getDailyIndex = (length: number) => {
  if (length <= 0) return 0;
  const now = new Date();
  const dayStamp = Math.floor(
    (now.getTime() - now.getTimezoneOffset() * 60 * 1000) / (1000 * 60 * 60 * 24)
  );
  return dayStamp % length;
};

function getYoutubeEmbedUrl(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  }
  // Default fallback video ID if url doesn't have a valid ID (e.g. channel page)
  return 'https://www.youtube.com/embed/DJ206BVadnE?autoplay=1&rel=0';
}

export default function YouTubeLatestVideos() {
  const [video, setVideo] = useState<VideoItem>(() => {
    const idx = getDailyIndex(FALLBACK_ITEMS.length);
    return FALLBACK_ITEMS[idx]!;
  });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(RSS2JSON);
        const data = await res.json();
        if (
          cancelled ||
          data.status !== 'ok' ||
          !Array.isArray(data.items) ||
          data.items.length === 0
        ) {
          return;
        }

        const mapped: VideoItem[] = data.items.map((entry: any, i: number) => {
          const title = decodeHtmlEntities(entry.title ?? 'Upload');
          const pub = entry.pubDate
            ? new Date(entry.pubDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
            : '';
          const desc = entry.description 
            ? entry.description.replace(/<[^>]*>/g, '').slice(0, 200) + '...'
            : 'Watch this video directly on Patrick\'s YouTube channel.';
          return {
            id: entry.link ?? `yt-${i}`,
            title,
            description: desc,
            imageSrc: entry.thumbnail ?? FALLBACK_ITEMS[0].imageSrc,
            href: entry.link ?? FALLBACK_ITEMS[0].href,
            publishedAt: pub,
          };
        });

        if (!cancelled && mapped.length > 0) {
          const idx = getDailyIndex(mapped.length);
          setVideo(mapped[idx]!);
        }
      } catch {
        // Stay with fallback daily video
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const embedUrl = getYoutubeEmbedUrl(video.href);

  return (
    <div className="mb-6 sm:mb-10 md:mb-16 w-full">
      <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl font-bold text-white uppercase tracking-wider text-glow-cyan font-mono flex items-center gap-3"
          >
            <Youtube className="w-8 h-8 text-red-500 shrink-0" />
            Featured Content
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-synth-magenta text-base md:text-lg font-mono mt-2"
          >
            &gt; Daily video case study & walkthrough
          </motion.p>
        </div>
        <a
          href={YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-mono text-synth-cyan hover:text-white border border-synth-cyan/40 px-4 py-2 rounded transition-colors shrink-0"
        >
          View Channel
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-2xl border border-synth-cyan/30 bg-synth-dark/40 backdrop-blur-md shadow-2xl p-6 lg:p-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Video Thumbnail / Player (Left 7 Cols on desktop) */}
          <div className="lg:col-span-7 relative overflow-hidden rounded-xl border border-white/10 aspect-video shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-black">
            {isPlaying && embedUrl ? (
              <iframe
                title={video.title}
                src={embedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div
                onClick={() => setIsPlaying(true)}
                className="relative w-full h-full cursor-pointer group"
              >
                <img
                  src={video.imageSrc}
                  alt={video.title}
                  className="w-full h-full object-cover transform group-hover:scale-103 transition-transform duration-500"
                />
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-synth-cyan/90 group-hover:bg-white text-synth-bg flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.6)] group-hover:scale-110">
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description details (Right 5 Cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-synth-magenta/10 border border-synth-magenta/30 text-synth-magenta uppercase tracking-wider">
                FEATURED VIDEO
              </span>
              {video.publishedAt && (
                <span className="text-xs font-mono text-gray-400">
                  {video.publishedAt}
                </span>
              )}
            </div>

            <h3 className="text-xl md:text-3xl font-bold text-white uppercase tracking-wider font-mono leading-tight hover:text-synth-cyan transition-colors">
              {isPlaying ? (
                <span>{video.title}</span>
              ) : (
                <a href={video.href} target="_blank" rel="noopener noreferrer">
                  {video.title}
                </a>
              )}
            </h3>

            <p className="text-gray-300 text-sm md:text-base leading-relaxed font-light">
              {video.description}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <a
                href={video.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-synth-cyan text-synth-bg font-bold hover:bg-white transition-all box-glow-cyan font-mono text-sm tracking-wider w-full sm:w-auto"
              >
                WATCH ON YOUTUBE
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
