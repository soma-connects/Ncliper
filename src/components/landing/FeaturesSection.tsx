'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
    Sparkles,
    Zap,
    Captions,
    Share2,
    BarChart3,
    Scissors,
} from 'lucide-react';

const features = [
    {
        icon: Sparkles,
        title: 'AI Clip Detection',
        desc: 'Gemini AI analyzes every second of your video to find the most engaging, viral-worthy moments automatically.',
        gradient: 'from-violet-500 to-indigo-500',
        size: 'col-span-1 md:col-span-2',
    },
    {
        icon: BarChart3,
        title: 'Virality Score',
        desc: 'Each clip gets a data-driven virality score based on pacing, hooks, and retention patterns.',
        gradient: 'from-pink-500 to-rose-500',
        size: 'col-span-1',
    },
    {
        icon: Captions,
        title: 'Smart Captions',
        desc: 'Auto-generated, perfectly timed captions with custom styling that boost watch time.',
        gradient: 'from-amber-500 to-orange-500',
        size: 'col-span-1',
    },
    {
        icon: Scissors,
        title: 'Intelligent Merging',
        desc: 'AI stitches disjointed but thematically related segments into cohesive, narrative-driven clips.',
        gradient: 'from-emerald-500 to-teal-500',
        size: 'col-span-1 md:col-span-2',
    },
    {
        icon: Zap,
        title: 'Lightning Fast',
        desc: 'Stream-based processing means your clips are ready in seconds, not minutes.',
        gradient: 'from-blue-500 to-cyan-500',
        size: 'col-span-1',
    },
    {
        icon: Share2,
        title: 'Multi-Platform Export',
        desc: 'Export to TikTok, Instagram Reels, YouTube Shorts with platform-optimized ratios.',
        gradient: 'from-violet-500 to-purple-500',
        size: 'col-span-1 md:col-span-2',
    },
];

export function FeaturesSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section id="features" className="relative py-32 px-6">
            <div className="max-w-6xl mx-auto" ref={ref}>
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-16"
                >
                    <span className="text-sm font-semibold text-violet-400 tracking-wider uppercase mb-3 block">
                        Features
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
                        AI That Understands Your Video
                    </h2>
                    <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                        Powered by Gemini AI to find pattern interrupts, high-retention hooks, and viral moments in every frame.
                    </p>
                </motion.div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className={`${feature.size} group relative rounded-2xl border border-white/5 bg-zinc-900/50 p-6 sm:p-8 hover:border-white/10 transition-all duration-500 overflow-hidden`}
                        >
                            {/* Hover glow */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                            <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
