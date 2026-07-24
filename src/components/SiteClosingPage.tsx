import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

const LOGO_URL =
  "https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets//profiles-after-dark-logomark.png";

export default function SiteClosingPage() {
  return (
    <>
      <Helmet>
        <title>Profiles After Dark is closing</title>
        <meta
          name="description"
          content="Profiles After Dark is closing. Thank you for being part of the community."
        />
        <meta name="robots" content="noindex, follow" />
        <meta property="og:title" content="Profiles After Dark is closing" />
        <meta
          property="og:description"
          content="Thank you for being part of Profiles After Dark. The site is now closed."
        />
      </Helmet>

      <main className="relative min-h-screen overflow-hidden bg-[#0b1220] text-slate-100">
        {/* Atmospheric backdrop — matches the existing PAD night palette */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(6,182,212,0.08),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(15,23,42,0.2)_0%,_rgba(11,18,32,0.95)_100%)]" />
          <motion.div
            className="absolute -left-1/4 top-1/4 h-[42rem] w-[42rem] rounded-full bg-violet-600/10 blur-3xl"
            animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.06, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-1/4 bottom-0 h-[36rem] w-[36rem] rounded-full bg-cyan-500/10 blur-3xl"
            animate={{ opacity: [0.25, 0.45, 0.25], scale: [1.05, 1, 1.05] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
          <motion.img
            src={LOGO_URL}
            alt="Profiles After Dark"
            className="mb-10 h-14 w-auto object-contain sm:h-16"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />

          <motion.h1
            className="text-xl font-medium tracking-wide text-violet-200/90 sm:text-2xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: "easeOut" }}
          >
            This chapter is ending.
          </motion.h1>

          <motion.p
            className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22, ease: "easeOut" }}
          >
            Profiles After Dark is closing. Thank you for the aesthetics, the
            late nights, and everything you shared here — the site is no longer
            available.
          </motion.p>

          <motion.p
            className="mt-16 text-sm text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            © {new Date().getFullYear()} Profiles After Dark
          </motion.p>
        </div>
      </main>
    </>
  );
}
