import Link from 'next/link';
import { Video } from 'lucide-react';

const footerLinks = {
    Product: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'FAQ', href: '#faq' },
        { label: 'Changelog', href: '#' },
    ],
    Resources: [
        { label: 'Blog', href: '#' },
        { label: 'Documentation', href: '#' },
        { label: 'API Reference', href: '#' },
        { label: 'Tutorials', href: '#' },
    ],
    Company: [
        { label: 'About', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#' },
        { label: 'Press Kit', href: '#' },
    ],
    Legal: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Cookie Policy', href: '#' },
    ],
};

export function Footer() {
    return (
        <footer className="border-t border-white/5 bg-zinc-950/50">
            <div className="max-w-6xl mx-auto px-6 py-16">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                                <Video className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-bold text-white">Ncliper</span>
                        </Link>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Turn long videos into viral clips with AI. Built for creators, agencies, and teams.
                        </p>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="text-sm font-semibold text-white mb-4">{category}</h4>
                            <ul className="space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-zinc-600">
                        © {new Date().getFullYear()} Ncliper. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        {['Twitter', 'GitHub', 'Discord'].map((social) => (
                            <a
                                key={social}
                                href="#"
                                className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
                            >
                                {social}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
