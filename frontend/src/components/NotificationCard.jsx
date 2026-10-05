export default function NotificationCard({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Performance Alerts</h3>
          <p className="text-[11px] text-slate-500">Priority student risk updates</p>
        </div>
        <span className="ml-auto text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-full">
          {alerts.length} New
        </span>
      </div>
      <div className="space-y-2">
        {alerts.slice(0, 5).map((alert, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 p-3 rounded-lg border transition-colors ${
              alert.type === 'critical' || alert.severity === 'high'
                ? 'bg-rose-50/40 border-rose-200/60'
                : 'bg-amber-50/40 border-amber-200/60'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
              alert.type === 'critical' || alert.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 leading-relaxed">{alert.message}</p>
            </div>
            <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
              alert.type === 'critical' || alert.severity === 'high'
                ? 'text-rose-700 bg-white border border-rose-200/70'
                : 'text-amber-700 bg-white border border-amber-200/70'
            }`}>
              {alert.type || 'Alert'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
