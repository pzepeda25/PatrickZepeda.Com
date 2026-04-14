import React, { useEffect, useState } from 'react';
import { ScannerCardStream, CardData } from './ui/scanner-card-stream';
import { motion } from 'motion/react';
import { BookOpen, ExternalLink } from 'lucide-react';

const MEDIUM_PROFILE_URL = 'https://patrickzepeda.medium.com/';

const FALLBACK_CARDS: CardData[] = [
  {
    title: "The Future of AI in Marketing",
    link: "https://patrickzepeda.medium.com/",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop",
    date: "Mar 2026"
  },
  {
    title: "Building Systems That Scale",
    link: "https://patrickzepeda.medium.com/",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop",
    date: "Feb 2026"
  },
  {
    title: "Analog Instincts in a Digital World",
    link: "https://patrickzepeda.medium.com/",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
    date: "Jan 2026"
  }
];

/*
 * ⚡ Bolt Performance Optimization:
 * Wrapped MediumFeed in React.memo to prevent unnecessary re-renders when
 * App.tsx updates its activeNavSection scroll state.
 * This component contains a heavy Three.js canvas (ScannerCardStream) which
 * shouldn't be re-rendered during normal scrolling.
 */
const MediumFeed = React.memo(function MediumFeed() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@patrickzepeda');
        const data = await res.json();
        if (data.status === 'ok' && data.items && data.items.length > 0) {
          const formattedCards = data.items.map((item: any) => {
            // Extract image from description if thumbnail is empty
            let imageUrl = item.thumbnail;
            if (!imageUrl) {
              const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
              if (imgMatch) imageUrl = imgMatch[1];
            }
            
            // Format date
            const pubDate = new Date(item.pubDate);
            const dateStr = pubDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            return {
              title: item.title,
              link: item.link,
              image: imageUrl || "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop",
              date: dateStr
            };
          });
          setCards(formattedCards);
        } else {
          setCards(FALLBACK_CARDS);
        }
      } catch (error) {
        console.error("Failed to fetch Medium posts:", error);
        setCards(FALLBACK_CARDS);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <section
        id="read"
        className="py-24 relative overflow-hidden bg-synth-dark border-t border-synth-cyan/20 scroll-mt-24"
      >
        <div className="h-[400px] flex items-center justify-center text-synth-cyan font-mono animate-pulse">
          LOADING_TRANSMISSIONS...
        </div>
      </section>
    );
  }

  return (
    <section
      id="read"
      className="py-24 relative overflow-hidden bg-synth-dark border-t border-synth-cyan/20 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-6 mb-12 relative z-30 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-4 uppercase tracking-wider text-glow-cyan font-mono flex items-center gap-3"
          >
            <BookOpen className="w-8 h-8 text-synth-cyan shrink-0" />
            Latest Transmissions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-synth-magenta text-lg md:text-xl font-mono"
          >
            &gt; Decrypting thoughts from the Medium feed...
          </motion.p>
        </div>
        <a
          href={MEDIUM_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-mono text-synth-cyan hover:text-white border border-synth-cyan/40 px-4 py-2 rounded transition-colors shrink-0 self-start sm:self-auto"
        >
          Visit Medium
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      
      <div className="relative w-full">
        <ScannerCardStream cardsData={cards} direction={1} initialSpeed={80} />
      </div>
    </section>
  );
});

export default MediumFeed;
