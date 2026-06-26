import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-slate-950 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="space-y-4 col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 text-white transition hover:opacity-90">
              <img src="/logo_1.png" alt="CogniFlow Logo" className="h-7 w-auto object-contain" />
              <span className="font-display text-lg font-bold tracking-wide">CogniFlow</span>
            </Link>
            <p className="max-w-xs text-xs text-slate-400 leading-relaxed">
              The premium academic operating system for students who want one unified workspace for planning, focus, and progress.
            </p>
          </div>
          
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Product</h4>
            <div className="mt-4 flex flex-col gap-3 text-xs text-slate-400">
              <a href="/#features" className="transition hover:text-white">Features</a>
              <a href="/#testimonials" className="transition hover:text-white">Stories</a>
              <a href="/#pricing" className="transition hover:text-white">Pricing</a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Company</h4>
            <div className="mt-4 flex flex-col gap-3 text-xs text-slate-400">
              <Link href="/privacy-policy" className="transition hover:text-white">Privacy Policy</Link>
              <Link href="/terms-of-service" className="transition hover:text-white">Terms of Service</Link>
              <a href="mailto:support@cogniflow.co" className="transition hover:text-white">Contact Us</a>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-white/5 pt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} CogniFlow. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition uppercase tracking-wider">Twitter</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition uppercase tracking-wider">GitHub</a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition uppercase tracking-wider">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
