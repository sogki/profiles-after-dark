import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import FoundryBackground from "../components/layout/FoundryBackground";
import { dashboardModules } from "../data/foundryContent";

export default function DiscordBotDashboardPage() {
  const reveal = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  } as const;

  return (
    <main className="relative isolate min-h-screen w-full overflow-hidden px-4 pb-16 pt-6 md:px-8">
      <FoundryBackground />
      <header className="sticky top-4 z-40">
        <div className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/15 bg-slate-950/70 px-5 py-3 backdrop-blur-xl">
          <div>
            <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-indigo-200/70">Nocturne Foundry</p>
            <h1 className="m-0 font-['Chakra_Petch'] text-xl text-indigo-50">Discord Setup Dashboard</h1>
          </div>
          <Link
            className="inline-flex items-center rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-indigo-50 no-underline transition hover:-translate-y-0.5 hover:bg-white/15"
            to="/"
          >
            Back to Foundry
          </Link>
        </div>
      </header>

      <motion.section
        className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.div variants={reveal}>
          <p className="m-0 text-[11px] uppercase tracking-[0.16em] text-indigo-200/75">Operator Surface</p>
          <h2 className="m-0 mt-2 max-w-[18ch] font-['Chakra_Petch'] text-[clamp(2rem,4.5vw,3.8rem)] leading-[0.98] text-indigo-50">
            Run setup modules with production confidence.
          </h2>
          <p className="m-0 mt-4 max-w-[64ch] text-indigo-100/80">
            Each module maps to a defined endpoint and execution path. This page is intentionally product-like:
            fast to scan, clear in behavior, and consistent with developer workflows.
          </p>
        </motion.div>
        <motion.aside className="rounded-xl border border-white/15 bg-slate-950/60 p-5" variants={reveal}>
          <p className="m-0 text-[11px] uppercase tracking-[0.14em] text-indigo-200/75">Environment</p>
          <p className="m-0 mt-2 font-['Chakra_Petch'] text-2xl text-indigo-50">Production Preview</p>
          <ul className="m-0 mt-4 list-none space-y-2 p-0 text-sm text-indigo-100/80">
            <li className="rounded-md bg-white/5 px-3 py-2">Guild: `profiles-after-dark`</li>
            <li className="rounded-md bg-white/5 px-3 py-2">Run mode: `validate_then_apply`</li>
            <li className="rounded-md bg-white/5 px-3 py-2">Active operator: `owner`</li>
          </ul>
        </motion.aside>
      </motion.section>

      <motion.section
        className="py-12"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        <div className="mb-4">
          <p className="m-0 text-[11px] uppercase tracking-[0.16em] text-indigo-200/75">Modules</p>
          <h3 className="m-0 mt-1 font-['Chakra_Petch'] text-[clamp(1.6rem,2.7vw,2.3rem)] text-indigo-50">Execution capabilities</h3>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {dashboardModules.map((module) => (
            <motion.article
              className="rounded-xl border border-white/15 bg-slate-950/60 p-5"
              key={module.name}
              variants={reveal}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h4 className="m-0 font-['Chakra_Petch'] text-xl text-indigo-50">{module.name}</h4>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    module.status === "Live"
                      ? "border-emerald-200/45 bg-emerald-500/15 text-emerald-100"
                      : module.status === "Building"
                        ? "border-cyan-200/45 bg-cyan-500/15 text-cyan-100"
                        : "border-indigo-200/35 bg-indigo-900/35 text-indigo-100/85"
                  }`}
                >
                  {module.status}
                </span>
              </div>
              <p className="m-0 mt-3 text-indigo-100/80">{module.description}</p>
              <p className="m-0 mt-4 rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-indigo-100/80">
                {module.endpoint}
              </p>
              <button
                className="mt-4 inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-indigo-50 transition hover:-translate-y-0.5 hover:bg-white/15"
                type="button"
              >
                Open Module
              </button>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section className="pt-4" initial="hidden" animate="show" variants={reveal}>
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-white/15 bg-slate-950/60 p-6 md:flex-row md:items-end">
          <div>
            <p className="m-0 text-[11px] uppercase tracking-[0.14em] text-indigo-200/75">Next Milestone</p>
            <h3 className="m-0 mt-1 font-['Chakra_Petch'] text-2xl text-indigo-50">Production-ready setup runs</h3>
            <p className="m-0 mt-2 text-indigo-100/80">
              Connect module execution logs to persisted run history and rollback-aware replays.
            </p>
          </div>
          <Link
            className="inline-flex items-center rounded-lg border border-cyan-100/30 bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white no-underline transition hover:-translate-y-0.5"
            to="/"
          >
            Return To Foundry Overview
          </Link>
        </div>
      </motion.section>

      <footer className="mt-16 border-t border-white/15 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 font-['Chakra_Petch'] text-lg text-indigo-50">Nocturne Foundry / Discord Setup Dashboard</p>
          <Link className="text-sm text-indigo-100/80 no-underline transition hover:text-white" to="/">
            Back to landing
          </Link>
        </div>
      </footer>
    </main>
  );
}
