'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
    {
        q: 'How does Ncliper work?',
        a: 'Paste any video URL from YouTube, TikTok, or 20+ platforms. Our Gemini-powered AI analyzes every second, identifies the most engaging moments, scores them for virality, and lets you export polished clips with captions — all in under 60 seconds.',
    },
    {
        q: 'What types of videos can I use?',
        a: 'Any long-form video! Podcasts, interviews, vlogs, gaming streams, webinars, tutorials, and more. We support YouTube, TikTok, Twitch, Vimeo, Facebook, and direct file uploads (MP4, MOV, WEBM).',
    },
    {
        q: 'How accurate is the AI clip detection?',
        a: 'Our AI is powered by Google Gemini 1.5 Pro, which analyzes visual content, audio patterns, and speech to identify high-retention hooks and pattern interrupts. Most users find 80-90% of AI-selected clips are directly usable.',
    },
    {
        q: 'Can I add captions and branding?',
        a: 'Yes! Smart captions are automatically generated and perfectly synced. Pro users can also apply custom brand kits with your logos, fonts, and color palettes for consistent branding across all clips.',
    },
    {
        q: 'Is Ncliper free to use?',
        a: 'We offer a generous free tier with 3 videos per month. For unlimited videos, advanced AI features, and no watermarks, check out our Pro plan starting at $19/month (annual billing).',
    },
    {
        q: 'What export formats are available?',
        a: 'Export clips in 9:16 (TikTok/Reels/Shorts), 1:1 (Instagram posts), or 16:9 (YouTube) aspect ratios. Files can be downloaded as MP4 in up to 4K resolution with Pro plans.',
    },
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section id="faq" className="relative py-32 px-6">
            <div className="max-w-3xl mx-auto" ref={ref}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-16"
                >
                    <span className="text-sm font-semibold text-violet-400 tracking-wider uppercase mb-3 block">
                        FAQ
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
                        Got Questions?
                    </h2>
                    <p className="text-lg text-zinc-400">
                        Everything you need to know about Ncliper.
                    </p>
                </motion.div>

                {/* Accordion */}
                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between p-5 rounded-xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 hover:border-white/10 transition-all duration-300 text-left group"
                            >
                                <span className="text-base font-medium text-white pr-4">{faq.q}</span>
                                <ChevronDown
                                    className={`w-5 h-5 text-zinc-400 flex-shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180 text-violet-400' : ''
                                        }`}
                                />
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="px-5 pb-5 pt-3 text-zinc-400 leading-relaxed">{faq.a}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
