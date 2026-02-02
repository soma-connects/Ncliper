export function TranscriptEditor() {
    return (
        <div className="flex-1 bg-card/20 rounded-2xl border border-border p-6 flex flex-col">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Transcript</h3>
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-lg leading-relaxed text-muted-foreground hover:text-white transition-colors cursor-pointer">
                    <span className="text-primary font-medium">00:00</span> So the biggest mistake I made when scaling...
                </p>
                <p className="text-lg leading-relaxed text-white font-medium bg-primary/10 p-2 rounded-lg -mx-2">
                    <span className="text-primary">00:04</span> ...was assuming that culture would just build itself.
                </p>
                <p className="text-lg leading-relaxed text-muted-foreground hover:text-white transition-colors cursor-pointer">
                    <span className="text-primary font-medium">00:08</span> It doesn't. You have to be intentional.
                </p>
                {/* Mock lines */}
                {Array.from({ length: 15 }).map((_, i) => (
                    <p key={i} className="text-lg leading-relaxed text-muted-foreground/50 hover:text-white transition-colors cursor-pointer">
                        <span className="text-muted-foreground/30 text-xs mr-2">00:{12 + i * 2}</span>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
                    </p>
                ))}
            </div>
        </div>
    );
}
