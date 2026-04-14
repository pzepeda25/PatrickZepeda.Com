import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CardStack, type CardStackItem } from '@/components/ui/card-stack';
import { Youtube, ExternalLink } from 'lucide-react';

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

const FALLBACK_ITEMS: CardStackItem[] = [
  {
    id: 'fallback-1',
    title: 'Latest on YouTube',
    description: 'Open the channel for new uploads.',
    imageSrc:
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200&auto=format&fit=crop',
    href: YOUTUBE_CHANNEL_URL,
  },
  {
    id: 'fallback-2',
    title: 'Creative technologist',
    description: 'AI, systems, and digital craft.',
    imageSrc:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop',
    href: YOUTUBE_CHANNEL_URL,
  },
];

function useCardStackLayout() {
  const [layout, setLayout] = useState({
    cardWidth: 300,
    cardHeight: 200,
    maxVisible: 5,
    spreadDeg: 36,
    overlap: 0.5,
  });

  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      if (w < 480) {
        setLayout({
          cardWidth: Math.max(260, Math.min(300, w - 40)),
          cardHeight: 180,
          maxVisible: 3,
          spreadDeg: 28,
          overlap: 0.55,
        });
      } else if (w < 640) {
        setLayout({
          cardWidth: 300,
          cardHeight: 200,
          maxVisible: 5,
          spreadDeg: 32,
          overlap: 0.5,
        });
      } else if (w < 900) {
        setLayout({
          cardWidth: 380,
          cardHeight: 240,
          maxVisible: 5,
          spreadDeg: 38,
          overlap: 0.46,
        });
      } else if (w < 1200) {
        setLayout({
          cardWidth: 460,
          cardHeight: 270,
          maxVisible: 7,
          spreadDeg: 42,
          overlap: 0.44,
        });
      } else {
        setLayout({
          cardWidth: 560,
          cardHeight: 300,
          maxVisible: 7,
          spreadDeg: 44,
          overlap: 0.42,
        });
      }
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  return layout;
}

/*
 * ⚡ Bolt Performance Optimization:
 * Wrapped YouTubeLatestVideos in React.memo to prevent unnecessary re-renders
 * when App.tsx updates its activeNavSection scroll state.
 */
const YouTubeLatestVideos = React.memo(function YouTubeLatestVideos() {
  const [items, setItems] = useState<CardStackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { cardWidth, cardHeight, maxVisible, spreadDeg, overlap } =
    useCardStackLayout();

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
          if (!cancelled) setItems(FALLBACK_ITEMS);
          return;
        }

        const mapped: CardStackItem[] = data.items.slice(0, 8).map(
          (entry: { title?: string; link?: string; thumbnail?: string; pubDate?: string }, i: number) => {
            const title = decodeHtmlEntities(entry.title ?? 'Video');
            const pub = entry.pubDate
              ? new Date(entry.pubDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '';
            return {
              id: entry.link ?? `yt-${i}`,
              title,
              description: pub ? `Published ${pub}` : undefined,
              imageSrc: entry.thumbnail,
              href: entry.link,
            };
          },
        );

        if (!cancelled) setItems(mapped);
      } catch {
        if (!cancelled) setItems(FALLBACK_ITEMS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayItems = items.length > 0 ? items : FALLBACK_ITEMS;

  if (loading) {
    return (
      <div className="mb-6 sm:mb-10 md:mb-16">
        <div className="h-[220px] sm:h-[300px] md:h-[420px] flex items-center justify-center rounded-lg border border-synth-cyan/20 bg-synth-bg/30 text-synth-cyan font-mono text-xs sm:text-sm animate-pulse px-2 text-center">
          LOADING_CHANNEL_FEED...
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 sm:mb-10 md:mb-16 w-full">
      <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl font-bold text-white uppercase tracking-wider text-glow-cyan font-mono flex items-center gap-3"
          >
            <Youtube className="w-8 h-8 text-red-500 shrink-0" />
            Latest from YouTube
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-synth-magenta text-base md:text-lg font-mono mt-2"
          >
            &gt; Recent uploads from @Patrick_Lee_Zepeda
          </motion.p>
        </div>
        <a
          href={YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-mono text-synth-cyan hover:text-white border border-synth-cyan/40 px-4 py-2 rounded transition-colors shrink-0"
        >
          Open channel
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* overflow-x-clip avoids horizontal bleed; do not use overflow-x-hidden (forces vertical scrollbars). */}
      <div className="mx-auto w-full max-w-[min(100%,82rem)] overflow-x-clip overflow-y-visible">
        <CardStack
          items={displayItems}
          initialIndex={0}
          autoAdvance
          intervalMs={3200}
          pauseOnHover
          showDots
          maxVisible={maxVisible}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
          overlap={overlap}
          spreadDeg={spreadDeg}
        />
      </div>
    </div>
  );
});

export default YouTubeLatestVideos;
