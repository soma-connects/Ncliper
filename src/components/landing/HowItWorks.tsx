'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { LinkIcon, Brain, Download } from 'lucide-react';

const steps = [
    {
        step: '01',
        icon: LinkIcon,
        title: 'Paste Your URL',
        desc: 'Drop any YouTube, TikTok, or video link. We support 20+ platforms and direct uploads.',
        gradient: 'from-violet-500 to-indigo-500',
    },
    {
        step: '02',
        icon: Brain,
        title: 'AI Analyzes',
        desc: 'Gemini AI scans every frame, identifies hooks, scores virality, and segments the best clips.',
        gradient: 'from-pink-500 to-rose-500',
    },
    {
        step: '03',
        icon: Download,
        title: 'Export & Publish',
        desc: 'Download optimized clips with captions, or publish directly to all your social platforms.',
        gradient: 'from-amber-500 to-orange-500',
    },
];

export function HowItWorks() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section id="how-it-works" className="relative py-32 px-6">
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.02] to-transparent" />

            <div className="max-w-6xl mx-auto relative" ref={ref}>
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-20"
                >
                    <span className="text-sm font-semibold text-violet-400 tracking-wider uppercase mb-3 block">
                        How It Works
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
                        Three Steps to Viral
                    </h2>
                    <p className="text-lg text-zinc-400 max-w-xl mx-auto">
                        From long-form video to short-form gold in under 60 seconds.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connection line */}
                    <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-px bg-gradient-to-r from-violet-500/20 via-pink-500/20 to-amber-500/20" />

                    {steps.map((step, i) => (
                        <motion.div
                            key={step.step}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: i * 0.2 }}
                            className="relative text-center group"
                        >
                            {/* Step Number Circle */}
                            <div className="relative inline-flex mb-8">
                                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.2)] group-hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-shadow duration-500 group-hover:scale-105 transition-transform`}>
                                    <step.icon className="w-8 h-8 text-white" />
                                </div>
                                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                                    {step.step}
                                </span>
                            </div>

                            <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                            <p className="text-zinc-400 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
