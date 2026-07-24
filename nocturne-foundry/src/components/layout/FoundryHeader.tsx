import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Overview", href: "#overview", blurb: "Product narrative and live signals." },
  { label: "Capabilities", href: "#capabilities", blurb: "What the platform is built to do." },
  { label: "Workflow", href: "#workflow", blurb: "Execution path from intent to run." },
  { label: "Roadmap", href: "#roadmap", blurb: "Where Foundry ships next." },
];

export default function FoundryHeader() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <header className="sticky top-4 z-40" ref={wrapperRef}>
      <div className="relative flex w-full items-center justify-between gap-4 rounded-2xl border border-white/15 bg-slate-950/70 px-5 py-3 backdrop-blur-xl">
        <div className="min-w-0 shrink-0">
          <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-indigo-200/70">Profiles After Dark / Labs</p>
          <h1 className="m-0 font-['Chakra_Petch'] text-xl leading-tight text-indigo-50">Nocturne Foundry</h1>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <a
              className="rounded-full px-3 py-2 text-xs uppercase tracking-[0.08em] text-indigo-100/85 no-underline transition hover:text-white"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-indigo-50 transition hover:-translate-y-0.5 hover:bg-white/15"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            Explore
          </button>
          <Link
            className="inline-flex items-center rounded-lg border border-cyan-100/30 bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:-translate-y-0.5"
            to="/dashboards/discord-bot"
          >
            Launch Dashboard
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 grid gap-2 rounded-2xl border border-white/15 bg-slate-950/85 p-3 backdrop-blur-xl md:grid-cols-2"
            exit={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {navItems.map((item, index) => (
              <motion.a
                className="group rounded-xl border border-white/10 bg-white/[0.03] p-3 no-underline"
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                whileHover={{ y: -3, borderColor: "rgba(103, 232, 249, 0.45)" }}
              >
                <p className="m-0 font-['Chakra_Petch'] text-lg text-indigo-50 transition group-hover:text-cyan-100">
                  {item.label}
                </p>
                <p className="m-0 mt-1 text-sm text-indigo-100/70">{item.blurb}</p>
              </motion.a>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
