function MetricsCards({ metrics }) {
  const cards = [
    {
      title: "Total Actions",
      value: metrics.total,
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      color: "bg-indigo-50 text-indigo-600",
      border: "border-indigo-100",
    },
    {
      title: "Blocked",
      value: metrics.blocked,
      icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
      color: "bg-red-50 text-red-600",
      border: "border-red-100",
    },
    {
      title: "Pending HITL",
      value: metrics.hitl,
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      color: "bg-amber-50 text-amber-600",
      border: "border-amber-100",
    },
    {
      title: "Allowed",
      value: metrics.allowed,
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "bg-emerald-50 text-emerald-600",
      border: "border-emerald-100",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-5 mb-6">
      {cards.map((card) => (
        <div key={card.title} className={`bg-white rounded-2xl border ${card.border} p-5 shadow-sm`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 text-sm font-medium">{card.title}</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

export default MetricsCards;
