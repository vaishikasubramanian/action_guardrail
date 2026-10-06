const configs = {
  blocked: {
    icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "BLOCKED",
    subtitle: "Action rejected by policy engine — tool was not executed.",
    bg: "bg-red-50 border-red-200",
    iconBg: "bg-red-100 text-red-600",
    titleColor: "text-red-700",
    badge: "bg-red-100 text-red-700",
  },
  pending_approval: {
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    title: "PENDING HUMAN REVIEW",
    subtitle: "Action paused — awaiting approval from a reviewer.",
    bg: "bg-amber-50 border-amber-200",
    iconBg: "bg-amber-100 text-amber-600",
    titleColor: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
  },
  simulation: {
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    title: "DRY RUN — NOT EXECUTED",
    subtitle: "Policy evaluated in simulation mode. No action was taken.",
    bg: "bg-indigo-50 border-indigo-200",
    iconBg: "bg-indigo-100 text-indigo-600",
    titleColor: "text-indigo-700",
    badge: "bg-indigo-100 text-indigo-700",
  },
  success: {
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "ALLOWED",
    subtitle: "Action passed all policy checks and was executed.",
    bg: "bg-emerald-50 border-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-600",
    titleColor: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
  },
};

function DecisionCard({ decision }) {
  const key =
    decision.status === "blocked" ? "blocked"
    : decision.status === "pending_approval" ? "pending_approval"
    : decision.status === "simulation" ? "simulation"
    : "success";

  const cfg = configs[key];

  return (
    <div className={`rounded-2xl border p-6 ${cfg.bg}`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-lg ${cfg.titleColor}`}>{cfg.title}</h3>
          <p className="text-slate-600 text-sm mt-1">{cfg.subtitle}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            {decision.rule_id && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cfg.badge}`}>
                Rule: {decision.rule_id}
              </span>
            )}
            {decision.decision && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cfg.badge}`}>
                Decision: {decision.decision}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DecisionCard;
