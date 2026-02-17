'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';

const plans = [
    {
        name: 'Free',
        monthlyPrice: 0,
        yearlyPrice: 0,
        desc: 'Get started with basic AI clipping',
        features: [
            '3 videos per month',
            'Up to 10 min source videos',
            'Basic virality scoring',
            'Watermarked exports',
            '720p quality',
        ],
        cta: 'Start Free',
        highlighted: false,
    },
    {
        name: 'Pro',
        monthlyPrice: 29,
        yearlyPrice: 19,
        desc: 'For creators serious about growth',
        features: [
            'Unlimited videos',
            'Up to 3 hour source videos',
            'Advanced AI analysis',
            'No watermarks',
            '1080p + 4K exports',
            'Smart captions',
            'Custom brand kit',
            'Priority processing',
        ],
        cta: 'Start Pro Trial',
        highlighted: true,
    },
    {
        name: 'Enterprise',
        monthlyPrice: 99,
        yearlyPrice: 79,
        desc: 'For teams and agencies',
        features: [
            'Everything in Pro',
            'Team workspace (5 seats)',
            'API access',
            'Custom AI training',
            'Dedicated support',
            'SLA guarantee',
            'White-label exports',
            'Analytics dashboard',
        ],
        cta: 'Contact Sales',
        highlighted: false,
    },
];

export function PricingSection() {
    const [annual, setAnnual] = useState(true);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section id="pricing" className="relative py-32 px-6">
            <div className="max-w-6xl mx-auto" ref={ref}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-12"
                >
                    <span className="text-sm font-semibold text-violet-400 tracking-wider uppercase mb-3 block">
                        Pricing
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8">
                        Start free. Upgrade when you&apos;re ready to go viral.
                    </p>

                    {/* Toggle */}
                    <div className="inline-flex items-center gap-3 bg-zinc-900 border border-white/5 rounded-full p-1">
                        <button
                            onClick={() => setAnnual(false)}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!annual ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-300'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setAnnual(true)}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${annual ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-300'
                                }`}
                        >
                            Annual
                            <span className="ml-1.5 text-xs text-green-400">Save 30%</span>
                        </button>
                    </div>
                </motion.div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: i * 0.15 }}
                            className={`relative rounded-2xl p-8 border transition-all duration-300 ${plan.highlighted
                                    ? 'border-violet-500/30 bg-gradient-to-b from-violet-500/[0.08] to-zinc-900/80 shadow-[0_0_40px_rgba(139,92,246,0.15)]'
                                    : 'border-white/5 bg-zinc-900/50 hover:border-white/10'
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-xs font-semibold text-white">
                                    Most Popular
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                            <p className="text-sm text-zinc-400 mb-6">{plan.desc}</p>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">
                                    ${annual ? plan.yearlyPrice : plan.monthlyPrice}
                                </span>
                                <span className="text-zinc-400 ml-1">/month</span>
                            </div>

                            <Link
                                href="/sign-up"
                                className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all duration-300 mb-8 ${plan.highlighted
                                        ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]'
                                        : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                {plan.cta}
                            </Link>

                            <ul className="space-y-3">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-3 text-sm text-zinc-300">
                                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
