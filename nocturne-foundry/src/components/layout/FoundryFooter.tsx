import { Link } from "react-router-dom";

export default function FoundryFooter() {
  return (
    <footer className="mt-20 border-t border-white/15 pt-8">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-indigo-200/70">Profiles After Dark / Labs</p>
          <p className="m-0 mt-1 font-['Chakra_Petch'] text-lg text-indigo-50">Nocturne Foundry</p>
          <p className="m-0 mt-2 max-w-2xl text-sm text-indigo-100/70">
            Clean, operator-focused infrastructure product surface for Discord setup automation and marketplace-scale
            runtime evolution.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <a className="text-sm text-indigo-100/75 no-underline transition hover:text-white" href="#overview">
            Overview
          </a>
          <a className="text-sm text-indigo-100/75 no-underline transition hover:text-white" href="#capabilities">
            Capabilities
          </a>
          <a className="text-sm text-indigo-100/75 no-underline transition hover:text-white" href="#workflow">
            Workflow
          </a>
          <a className="text-sm text-indigo-100/75 no-underline transition hover:text-white" href="#roadmap">
            Roadmap
          </a>
          <Link className="text-sm text-indigo-100/75 no-underline transition hover:text-white" to="/dashboards/discord-bot">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
