import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import FoundryBackground from "../components/layout/FoundryBackground";
import FoundryFooter from "../components/layout/FoundryFooter";
import FoundryHeader from "../components/layout/FoundryHeader";
import { capabilities, heroStats, roadmapMilestones, workflowPhases } from "../data/foundryContent";

export default function LandingPage() {
  const sectionReveal = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  } as const;

  return (
    <main className="relative isolate min-h-screen w-full overflow-hidden px-4 pb-16 pt-6 md:px-8">
      <FoundryBackground />
      <FoundryHeader />

      <section
        className="mt-10 grid items-end gap-10 pb-16 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
        id="overview"
      >
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.45 }} variants={sectionReveal}>
          <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-indigo-200/80">Developer Infrastructure Surface</p>
          <h2 className="m-0 mt-3 max-w-[16ch] font-['Chakra_Petch'] text-[clamp(2.2rem,5.4vw,5rem)] leading-[0.96] text-indigo-50">
            Clean product design for serious Discord automation.
          </h2>
          <p className="m-0 mt-5 max-w-[66ch] text-[1.06rem] leading-relaxed text-indigo-100/80">
            Foundry is the control layer where setup infrastructure becomes operable at scale. Every interaction
            maps to a real workflow: configure, validate, execute, and replay.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center rounded-lg border border-cyan-100/30 bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white no-underline transition hover:-translate-y-0.5"
              to="/dashboards/discord-bot"
            >
              Open Setup Dashboard
            </Link>
            <a
              className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-indigo-50 no-underline transition hover:-translate-y-0.5 hover:bg-white/15"
              href="#workflow"
            >
              Inspect Workflow
            </a>
          </div>
        </motion.div>

        <motion.aside
          className="rounded-2xl border border-white/15 bg-slate-950/60 p-5 backdrop-blur-md"
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="m-0 text-[11px] uppercase tracking-[0.14em] text-indigo-200/70">Live Operator Snapshot</p>
          <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/70 p-4">
            <p className="m-0 text-sm text-indigo-100/75">Current environment</p>
            <p className="m-0 mt-1 font-['Chakra_Petch'] text-xl text-indigo-50">discord-main</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-sm">
                <span className="text-indigo-100/80">Channels synced</span>
                <strong className="text-cyan-200">36</strong>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-sm">
                <span className="text-indigo-100/80">Roles provisioned</span>
                <strong className="text-cyan-200">14</strong>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-sm">
                <span className="text-indigo-100/80">Last setup run</span>
                <strong className="text-emerald-200">2m ago</strong>
              </div>
            </div>
          </div>
        </motion.aside>
      </section>

      <motion.section
        className="grid gap-3 pb-16 md:grid-cols-3"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        {heroStats.map((stat) => (
          <motion.article
            className="border-b border-white/20 pb-3"
            key={stat.label}
            variants={sectionReveal}
          >
            <p className="m-0 text-[11px] uppercase tracking-[0.12em] text-indigo-200/70">{stat.label}</p>
            <p className="m-0 mt-2 text-base font-semibold text-indigo-50">{stat.value}</p>
          </motion.article>
        ))}
      </motion.section>

      <motion.section
        className="grid gap-10 py-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
        id="capabilities"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.35 }}
        variants={sectionReveal}
      >
        <div>
          <p className="m-0 text-[11px] uppercase tracking-[0.16em] text-indigo-200/70">Capabilities</p>
          <h3 className="m-0 mt-2 font-['Chakra_Petch'] text-[clamp(1.8rem,3.4vw,2.8rem)] leading-tight text-indigo-50">
            A website that reads like a product, not a moodboard.
          </h3>
          <p className="m-0 mt-4 max-w-[55ch] leading-relaxed text-indigo-100/80">
            This is a developer-facing system surface. Content hierarchy, motion pacing, and module framing are all
            built to support trust and clarity while still feeling modern.
          </p>
        </div>
        <div className="space-y-5">
          {capabilities.map((item, index) => (
            <article className="grid grid-cols-[auto_1fr] gap-4 border-b border-white/20 pb-4" key={item.title}>
              <p className="m-0 font-['Chakra_Petch'] text-2xl leading-none text-cyan-200/90">
                {String(index + 1).padStart(2, "0")}
              </p>
              <div>
                <h4 className="m-0 font-['Chakra_Petch'] text-xl text-indigo-50">{item.title}</h4>
                <p className="m-0 mt-2 leading-relaxed text-indigo-100/80">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="py-16"
        id="workflow"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        <p className="m-0 text-[11px] uppercase tracking-[0.16em] text-indigo-200/70">Workflow</p>
        <h3 className="m-0 mt-2 font-['Chakra_Petch'] text-[clamp(1.8rem,3.2vw,2.6rem)] text-indigo-50">Execution path</h3>
        <div className="relative mt-6 grid gap-3 md:grid-cols-2">
          <span className="pointer-events-none absolute left-0 top-0 hidden h-[1px] w-full bg-gradient-to-r from-cyan-200/45 via-indigo-200/20 to-transparent md:block" />
          {workflowPhases.map((phase) => (
            <motion.article
              className="group border border-white/15 bg-slate-950/35 p-5 transition hover:border-cyan-200/45"
              key={phase.title}
              variants={sectionReveal}
            >
              <div className="flex items-center gap-3">
                <span className="font-['Chakra_Petch'] text-2xl text-cyan-200">{phase.step}</span>
                <h4 className="m-0 font-['Chakra_Petch'] text-xl text-indigo-50">{phase.title}</h4>
              </div>
              <p className="m-0 mt-3 text-indigo-100/80">{phase.body}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="py-8"
        id="roadmap"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.35 }}
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        <p className="m-0 text-[11px] uppercase tracking-[0.16em] text-indigo-200/70">Roadmap</p>
        <div className="mt-4 border-l border-cyan-200/40 pl-5">
          {roadmapMilestones.map((item) => (
            <motion.article className="relative mb-8 last:mb-0" key={item.title} variants={sectionReveal}>
              <span className="absolute -left-[1.68rem] top-1 h-3 w-3 rounded-full border border-cyan-200/70 bg-slate-950" />
              <p className="m-0 text-[11px] uppercase tracking-[0.14em] text-indigo-200/75">{item.quarter}</p>
              <h4 className="m-0 mt-1 font-['Chakra_Petch'] text-2xl text-indigo-50">{item.title}</h4>
              <p className="m-0 mt-2 max-w-[72ch] leading-relaxed text-indigo-100/75">{item.detail}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="pt-16"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
        variants={sectionReveal}
      >
        <div className="flex flex-col items-start justify-between gap-5 border-t border-b border-white/20 py-8 md:flex-row md:items-end">
          <div>
            <p className="m-0 text-[11px] uppercase tracking-[0.14em] text-indigo-200/70">Current Build Track</p>
            <h3 className="m-0 mt-1 font-['Chakra_Petch'] text-3xl text-indigo-50">Discord Setup Dashboard</h3>
            <p className="m-0 mt-2 max-w-[62ch] leading-relaxed text-indigo-100/80">
              Enter the module console to configure channels, rules, and roles with production-safe operations.
            </p>
          </div>
          <Link
            className="inline-flex items-center rounded-lg border border-cyan-100/30 bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white no-underline transition hover:-translate-y-0.5"
            to="/dashboards/discord-bot"
          >
            Launch Console
          </Link>
        </div>
      </motion.section>

      <FoundryFooter />
    </main>
  );
}
