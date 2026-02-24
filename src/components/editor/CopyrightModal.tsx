'use client';

import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CopyrightModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    clipDuration: number;
}

export function CopyrightModal({ isOpen, onClose, onConfirm, clipDuration }: CopyrightModalProps) {
    const [accepted, setAccepted] = useState(false);

    const handleConfirm = () => {
        if (!accepted) return;
        onConfirm();
        setAccepted(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5 text-yellow-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold">Copyright Confirmation</h3>
                                        <p className="text-xs text-muted-foreground">Required before generating</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                                >
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-5 space-y-4">
                                <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                                    <p className="text-sm text-yellow-200/90 leading-relaxed">
                                        ⚠️ By generating this clip (<span className="font-mono font-bold">{clipDuration}s</span>), you confirm that:
                                    </p>
                                </div>

                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={accepted}
                                        onChange={(e) => setAccepted(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary/50 bg-secondary"
                                    />
                                    <span className="text-sm text-muted-foreground group-hover:text-white transition-colors leading-relaxed">
                                        I am the <strong className="text-white">original creator</strong> of this video content, or I have been granted the <strong className="text-white">legal right</strong> to repurpose, clip, and distribute it.
                                    </span>
                                </label>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center gap-3 p-5 border-t border-border">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-muted-foreground bg-secondary/50 rounded-xl hover:bg-secondary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={!accepted}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-primary rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                                >
                                    Confirm & Generate
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
