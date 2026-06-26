import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for CogniFlow - Learn how we collect, store, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="relative overflow-hidden bg-slate-950 text-white min-h-screen flex flex-col justify-between">
      <div className="noise-grid pointer-events-none absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.015),_transparent)]" />
      <div>
        <Navbar />
        
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="space-y-8 rounded-3xl border border-white/5 bg-slate-900/40 p-8 md:p-12 backdrop-blur-md">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">Privacy Policy</h1>
              <p className="text-sm text-slate-400">Last updated: June 24, 2026</p>
            </div>
            
            <div className="h-px bg-white/10" />

            <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
              <section className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-white">1. Introduction</h2>
                <p>
                  At CogniFlow, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information about you when you use our website, application, and services (collectively, "CogniFlow").
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-white">2. Information We Collect</h2>
                <p>
                  We collect information that you provide directly to us when creating an account, updating your profile, or using our features:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li><strong>Account Information:</strong> Email address, login credentials, and user preferences.</li>
                  <li><strong>Academic Data:</strong> Subjects, tasks, habits, focus logs, and study schedules.</li>
                  <li><strong>Resume Data:</strong> Contact information, employment history, education, skills, and certifications entered into the Resume Builder.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-white">3. How We Use Your Information</h2>
                <p>
                  We use the information we collect to operate, maintain, and improve our services, including:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>Personalizing your academic dashboard and study recommendations.</li>
                  <li>Tracking your study habits, progress, and focus sessions.</li>
                  <li>Generating and previewing professional resumes.</li>
                  <li>Providing customer support and communicating updates.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-white">4. Data Storage and Security</h2>
                <p>
                  Your account data and student logs are stored securely using Supabase database infrastructure. We implement standard security practices to protect your personal information against unauthorized access, modification, or disclosure.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-white">5. Data Portability and Rights (GDPR)</h2>
                <p>
                  We believe you own your data. You have the right to request a copy of all database records associated with your account or delete your account at any time. You can export your data as structured JSON directly from the application settings page.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-white">6. Changes to this Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-white">7. Contact Us</h2>
                <p>
                  If you have any questions or concerns about this Privacy Policy, please contact us at <a href="mailto:support@cogniflow.co" className="text-cyan-400 hover:underline">support@cogniflow.co</a>.
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
