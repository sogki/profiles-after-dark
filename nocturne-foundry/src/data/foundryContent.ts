export interface HeroStat {
  label: string;
  value: string;
}

export interface Capability {
  title: string;
  body: string;
}

export interface WorkflowPhase {
  step: string;
  title: string;
  body: string;
}

export interface RoadmapMilestone {
  title: string;
  quarter: string;
  detail: string;
}

export interface DashboardModule {
  name: string;
  status: "Live" | "Building" | "Queued";
  description: string;
  endpoint: string;
}

export const heroStats: HeroStat[] = [
  { label: "Setup duration", value: "< 2 mins average" },
  { label: "Config model", value: "Schema-driven + persisted" },
  { label: "Primary scope", value: "Discord setup control plane" },
];

export const capabilities: Capability[] = [
  {
    title: "Infrastructure-grade setup runs",
    body: "Every flow is deterministic, with explicit validation and replay-safe operations for long-term maintainability.",
  },
  {
    title: "Developer-first control surfaces",
    body: "Clean UI blocks map directly to API behaviors, making the dashboard feel like an operator console, not a design experiment.",
  },
  {
    title: "Production-ready growth path",
    body: "Built for single-guild reliability now and multi-guild orchestration next, without rewiring core setup primitives.",
  },
];

export const workflowPhases: WorkflowPhase[] = [
  {
    step: "01",
    title: "Model server intent",
    body: "Choose naming style, onboarding defaults, and moderation rails.",
  },
  {
    step: "02",
    title: "Compile plan",
    body: "Build a typed action plan for channels, roles, and embed publishing.",
  },
  {
    step: "03",
    title: "Execute safely",
    body: "Run operations with guardrails and persist resulting IDs for future edits.",
  },
  {
    step: "04",
    title: "Iterate modules",
    body: "Re-run specific modules without resetting the whole environment.",
  },
];

export const roadmapMilestones: RoadmapMilestone[] = [
  {
    title: "Finish dashboard module parity",
    quarter: "Q2 2026",
    detail: "Bring channels, roles, and embeds to production-ready confidence.",
  },
  {
    title: "Template export and share layer",
    quarter: "Q3 2026",
    detail: "Enable reusable setup blueprints across guild environments.",
  },
  {
    title: "Public marketplace ingestion",
    quarter: "Q4 2026",
    detail: "Ingest profile assets into multi-guild runtime delivery.",
  },
];

export const dashboardModules: DashboardModule[] = [
  {
    name: "Channel Preset Engine",
    status: "Building",
    description: "Preview and apply channel trees with safe normalization and merge rules.",
    endpoint: "POST /api/v1/discord/setup/channels",
  },
  {
    name: "Rules Embed Composer",
    status: "Live",
    description: "Create and ship production rules embeds with channel targeting and history.",
    endpoint: "POST /api/v1/discord/setup/rules-embed",
  },
  {
    name: "Role Provisioning",
    status: "Building",
    description: "Create role packs with permission templates and controlled rollout behavior.",
    endpoint: "POST /api/v1/discord/setup/roles",
  },
  {
    name: "Setup Audit Replay",
    status: "Queued",
    description: "Inspect previous runs and replay non-destructive setup actions.",
    endpoint: "GET /api/v1/discord/setup/runs",
  },
];
