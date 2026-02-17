import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex justify-center">
            <SignIn
                appearance={{
                    elements: {
                        formButtonPrimary: 'bg-primary hover:bg-primary/90 text-sm normal-case',
                        card: 'bg-zinc-900/50 border border-white/10 backdrop-blur-xl',
                        headerTitle: 'text-white',
                        headerSubtitle: 'text-zinc-400',
                        socialButtonsBlockButton: 'bg-white/5 border-white/10 text-white hover:bg-white/10',
                        socialButtonsBlockButtonText: 'text-white font-medium',
                        formFieldLabel: 'text-zinc-400',
                        formFieldInput: 'bg-black/50 border-white/10 text-white',
                        footerActionLink: 'text-primary hover:text-primary/90'
                    }
                }}
                forceRedirectUrl="/dashboard"
            />
        </div>
    );
}
