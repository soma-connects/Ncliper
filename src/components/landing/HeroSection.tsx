'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import Link from 'next/link';

const rotatingWords = ['Viral Clips', 'Short-Form Gold', 'Engaging Reels', 'TikTok Hits'];

export function HeroSection() {
    const [wordIndex, setWordIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Animated Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]" />

            {/* Radial Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-r from-violet-600/20 via-pink-500/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

            {/* Floating Orbs */}
            <motion.div
                animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-32 left-[15%] w-72 h-72 bg-violet-600/10 rounded-full blur-[80px]"
            />
            <motion.div
                animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-32 right-[15%] w-80 h-80 bg-pink-500/10 rounded-full blur-[80px]"
            />

            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm mb-8"
                >
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-medium text-violet-300">Powered by Gemini AI</span>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.15 }}
                    className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
                >
                    <span className="text-white">Turn Long Videos Into</span>
                    <br />
                    <span className="relative inline-block h-[1.2em] overflow-hidden">
                        {rotatingWords.map((word, i) => (
                            <motion.span
                                key={word}
                                initial={{ y: 50, opacity: 0 }}
                                animate={{
                                    y: i === wordIndex ? 0 : -50,
                                    opacity: i === wordIndex ? 1 : 0,
                                }}
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute left-0 right-0 bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent"
                            >
                                {word}
                            </motion.span>
                        ))}
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    Paste any video URL. Our AI finds the most viral moments, generates
                    captions, and exports clips ready for TikTok, Reels, and Shorts —
                    all in seconds.
                </motion.p>

                {/* CTA Group */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.45 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link
                        href="/sign-up"
                        className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold text-lg shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] transition-all duration-300 hover:scale-[1.02]"
                    >
                        Get Started Free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 rounded-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                        </div>
                    </Link>
                    <button className="group inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/10 text-zinc-300 font-medium hover:bg-white/5 hover:border-white/20 transition-all duration-300">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <Play className="w-4 h-4 text-white ml-0.5" />
                        </div>
                        Watch Demo
                    </button>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.7 }}
                    className="mt-16 flex items-center justify-center gap-8 sm:gap-16 text-center"
                >
                    {[
                        { value: '10M+', label: 'Clips Generated' },
                        { value: '50K+', label: 'Creators' },
                        { value: '4.9★', label: 'Rating' },
                    ].map((stat) => (
                        <div key={stat.label}>
                            <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                            <div className="text-sm text-zinc-500 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Floating Video Cards Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.9 }}
                    className="relative mt-20 mx-auto max-w-4xl"
                >
                    {/* Main Preview Card */}
                    <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl p-2 shadow-[0_0_60px_rgba(139,92,246,0.15)]">
                        <div className="rounded-xl bg-zinc-900 aspect-video flex items-center justify-center overflow-hidden">
                            <div className="relative w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
                                {/* Simulated editor UI */}
                                <div className="absolute inset-0 flex">
                                    {/* Video area */}
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="w-48 sm:w-64 aspect-[9/16] rounded-xl bg-gradient-to-b from-violet-900/30 to-pink-900/30 border border-white/5 flex items-center justify-center">
                                            <Play className="w-12 h-12 text-white/30" />
                                        </div>
                                    </div>
                                    {/* Sidebar clips */}
                                    <div className="hidden sm:flex w-56 flex-col gap-2 p-4 border-l border-white/5">
                                        {[92, 87, 84, 76].map((score, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 1.2 + i * 0.15 }}
                                                className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/5"
                                            >
                                                <div className="w-10 h-14 rounded bg-gradient-to-b from-violet-800/30 to-pink-800/30 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="h-2.5 w-3/4 bg-white/10 rounded mb-1.5" />
                                                    <div className="h-2 w-1/2 bg-white/5 rounded" />
                                                </div>
                                                <span className={`text-xs font-bold ${score >= 90 ? 'text-green-400' : score >= 80 ? 'text-yellow-400' : 'text-zinc-500'}`}>
                                                    {score}%
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Glow underneath */}
                    <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-3/4 h-40 bg-gradient-to-r from-violet-600/20 via-pink-500/20 to-violet-600/20 blur-[80px] rounded-full" />
                </motion.div>
            </div>
        </section>
    );
}
