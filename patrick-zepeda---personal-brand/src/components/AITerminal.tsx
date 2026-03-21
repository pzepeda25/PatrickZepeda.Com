import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, Send, Image as ImageIcon, Search, MapPin, Zap, Brain, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

type Mode = 'fast' | 'pro' | 'search' | 'map' | 'imagine';
type Message = { 
  id: string;
  role: 'user' | 'model'; 
  text?: string; 
  imageUrl?: string; 
  urls?: { title: string, uri: string }[];
};

export default function AITerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('fast');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'SYS.READY. Select a mode and enter a command.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [showModeSelector, setShowModeSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && mode !== 'imagine') return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let ai: GoogleGenAI;
      let responseText = '';
      let imageUrl = '';
      let urls: { title: string, uri: string }[] = [];

      if (mode === 'imagine') {
        if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
          await window.aistudio.openSelectKey();
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: userMsg.text,
          config: {
            imageConfig: { imageSize }
          }
        });
        
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        } else {
          responseText = "Failed to generate image.";
        }
      } else {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        
        let modelName = 'gemini-3.1-flash-lite-preview';
        let config: any = {};

        if (mode === 'pro') {
          modelName = 'gemini-3.1-pro-preview';
        } else if (mode === 'search') {
          modelName = 'gemini-3-flash-preview';
          config.tools = [{ googleSearch: {} }];
        } else if (mode === 'map') {
          modelName = 'gemini-2.5-flash';
          config.tools = [{ googleMaps: {} }];
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: userMsg.text,
          config
        });

        responseText = response.text || '';

        // Extract grounding URLs
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          chunks.forEach((chunk: any) => {
            if (chunk.web?.uri) {
              urls.push({ title: chunk.web.title || chunk.web.uri, uri: chunk.web.uri });
            }
            if (chunk.maps?.uri) {
              urls.push({ title: chunk.maps.title || 'Map Link', uri: chunk.maps.uri });
            }
            if (chunk.maps?.placeAnswerSources?.reviewSnippets) {
              chunk.maps.placeAnswerSources.reviewSnippets.forEach((snippet: any) => {
                if (snippet.uri) urls.push({ title: 'Review Link', uri: snippet.uri });
              });
            }
          });
        }
      }

      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: responseText,
        imageUrl,
        urls: urls.length > 0 ? urls : undefined
      }]);

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: `ERROR: ${error.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const modes = [
    { id: 'fast', icon: Zap, label: 'Fast Chat', color: 'text-yellow-400' },
    { id: 'pro', icon: Brain, label: 'Deep Chat', color: 'text-synth-magenta' },
    { id: 'search', icon: Search, label: 'Web Search', color: 'text-synth-cyan' },
    { id: 'map', icon: MapPin, label: 'Local Search', color: 'text-emerald-400' },
    { id: 'imagine', icon: ImageIcon, label: 'Imagine', color: 'text-purple-400' },
  ];

  const currentMode = modes.find(m => m.id === mode)!;

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-synth-dark border-2 border-synth-cyan box-glow-cyan flex items-center justify-center z-50 ${isOpen ? 'hidden' : ''}`}
      >
        <Terminal className="w-6 h-6 text-synth-cyan" />
      </motion.button>

      {/* Terminal Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] max-w-[calc(100vw-3rem)] bg-synth-dark/95 backdrop-blur-md border border-synth-cyan box-glow-cyan flex flex-col z-50 overflow-hidden rounded-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-synth-cyan/10 border-b border-synth-cyan/30">
              <div className="flex items-center gap-2 font-mono text-sm text-synth-cyan">
                <Terminal className="w-4 h-4" />
                <span>AI_TERMINAL.exe</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
              {messages.map(msg => (
                <motion.div 
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={msg.id} 
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-synth-magenta/20 border border-synth-magenta/30 text-white' 
                      : 'bg-synth-cyan/10 border border-synth-cyan/20 text-gray-200'
                  }`}>
                    {msg.text && (
                      <div className="markdown-body text-sm">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    )}
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="Generated" className="mt-2 rounded border border-synth-cyan/50 max-w-full" />
                    )}
                    {msg.urls && msg.urls.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-synth-cyan/20 flex flex-col gap-1">
                        <span className="text-xs text-synth-cyan/70">Sources:</span>
                        {msg.urls.map((url, i) => (
                          <a key={i} href={url.uri} target="_blank" rel="noreferrer" className="text-xs text-synth-cyan hover:underline truncate block">
                            {url.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-synth-cyan font-mono text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PROCESSING...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-black/50 border-t border-synth-cyan/30 relative">
              
              {/* Mode Selector Dropdown */}
              <AnimatePresence>
                {showModeSelector && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 w-full bg-synth-dark border border-synth-cyan/50 mb-2 rounded overflow-hidden"
                  >
                    {modes.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setMode(m.id as Mode); setShowModeSelector(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-synth-cyan/10 transition-colors ${mode === m.id ? 'bg-synth-cyan/20' : ''}`}
                      >
                        <m.icon className={`w-4 h-4 ${m.color}`} />
                        <span className="font-mono text-sm text-white">{m.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {mode === 'imagine' && (
                <div className="flex gap-2 mb-2">
                  {['1K', '2K', '4K'].map(size => (
                    <button
                      key={size}
                      onClick={() => setImageSize(size as any)}
                      className={`flex-1 py-1 text-xs font-mono border ${imageSize === size ? 'bg-synth-magenta/20 border-synth-magenta text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowModeSelector(!showModeSelector)}
                  className="p-2 bg-synth-dark border border-synth-cyan/50 rounded hover:bg-synth-cyan/20 transition-colors flex items-center justify-center"
                  title="Select Mode"
                >
                  <currentMode.icon className={`w-5 h-5 ${currentMode.color}`} />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder={`Command [${currentMode.label}]...`}
                  className="flex-1 bg-transparent border border-synth-cyan/50 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-synth-cyan focus:box-glow-cyan transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || (!input.trim() && mode !== 'imagine')}
                  className="p-2 bg-synth-cyan text-synth-dark rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
