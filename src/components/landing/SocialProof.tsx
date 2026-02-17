'use client';

import { motion } from 'framer-motion';

const platforms = [
    'YouTube', 'TikTok', 'Instagram', 'Twitter/X', 'LinkedIn',
    'Facebook', 'Twitch', 'Vimeo', 'Rumble', 'Shorts',
];

export function SocialProof() {
    return (
        <section className="relative py-16 overflow-hidden">
            {/* Divider line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="max-w-6xl mx-auto px-6">
                <p className="text-center text-sm font-medium text-zinc-500 tracking-wider uppercase mb-8">
                    Works with your favorite platforms
                </p>

                {/* Scrolling Platform Logos */}
                <div className="relative">
                    {/* Fade edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#09090b] to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#09090b] to-transparent z-10" />

                    <motion.div
                        animate={{ x: ['0%', '-50%'] }}
                        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                        className="flex gap-12 items-center whitespace-nowrap"
                    >
                        {[...platforms, ...platforms].map((platform, i) => (
                            <div
                                key={`${platform}-${i}`}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] flex-shrink-0"
                            >
                                <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500/20 to-pink-500/20" />
                                <span className="text-sm font-medium text-zinc-400">{platform}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Bottom divider */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </section>
    );
}
