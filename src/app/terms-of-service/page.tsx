import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for CogniFlow - Read about the rules and terms of using our academic workspace.",
};

export default function TermsOfServicePage() {
  return (
    <main className="relative overflow-hidden bg-slate-950 text-white min-h-screen flex flex-col justify-between">
      <div className="noise-grid pointer-events-none absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.015),_transparent)]" />
      <div>
        <Navbar />
        
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="space-y-8 rounded-3xl border border-white/5 bg-slate-900/40 p-8 md:p-12 backdrop-blur-md">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">Terms of Service</h1>
              <p className="text-sm text-slate-400">Last updated: June 24, 2026</p>
            </div>
            
            <div className="h-px bg-white/10" />

            <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
              <section className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-white">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using CogniFlow, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-white">2. Description of Service</h2>
                <p>
                  CogniFlow provides students with a unified academic operating system containing tools for study planning, task tracking, note-taking, habit logging, focus sessions, resume building, and performance analytics. We reserve the right to modify or discontinue any part of the service at our sole discretion.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-white">3. User Accounts</h2>
                <p>
                  To use certain features of CogniFlow, you must register for an account. You are responsible for:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>Maintaining the confidentiality of your account credentials.</li>
                  <li>All activities that occur under your account.</li>
                  <li>Providing accurate, current, and complete information.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-white">4. User Conduct</h2>
                <p>
                  You agree not to use CogniFlow for any unlawful purpose or to engage in any activity that interferes with or disrupts the service, including:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>Attempting to bypass security barriers or access data not belonging to you.</li>
                  <li>Uploading malware, spam, or inappropriate content.</li>
                  <li>Using automated crawlers, bots, or scraping tools without permission.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-white">5. Intellectual Property</h2>
                <p>
                  All components, graphics, codebases, logos, and layouts of CogniFlow are the property of CogniFlow and are protected by international intellectual property laws. You may not copy, redistribute, or reproduce any part of the platform without our written consent.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-white">6. Limitation of Liability</h2>
                <p>
                  CogniFlow is provided "as is" and "as available". We do not warrant that the service will be uninterrupted, secure, or error-free. In no event shall CogniFlow be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the service.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-white">7. Contact Us</h2>
                <p>
                  For any inquiries or issues regarding these Terms of Service, please reach out to us at <a href="mailto:support@cogniflow.co" className="text-cyan-400 hover:underline">support@cogniflow.co</a>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
