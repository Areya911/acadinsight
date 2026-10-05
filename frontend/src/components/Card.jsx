const iconMap = {
  skills: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  average: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  best: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  weak: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  students: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  class: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
};

const colorConfig = {
  blue: { bg: 'bg-[#4655F5]/10', text: 'text-slate-900', icon: 'text-[#4655F5]', iconBg: 'bg-[#4655F5]/10' },
  green: { bg: 'bg-emerald-50', text: 'text-slate-900', icon: 'text-emerald-600', iconBg: 'bg-emerald-50 border border-emerald-100' },
  yellow: { bg: 'bg-amber-50', text: 'text-slate-900', icon: 'text-amber-600', iconBg: 'bg-amber-50 border border-amber-100' },
  red: { bg: 'bg-rose-50', text: 'text-slate-900', icon: 'text-rose-600', iconBg: 'bg-rose-50 border border-rose-100' },
  purple: { bg: 'bg-purple-50', text: 'text-slate-900', icon: 'text-purple-600', iconBg: 'bg-purple-50 border border-purple-100' },
};

export default function Card({ title, value, subtitle, color = 'blue', icon, trend }) {
  const cc = colorConfig[color] || colorConfig.blue;
  const iconEl = icon && iconMap[icon];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs card-hover flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        {iconEl && (
          <div className={`w-9 h-9 rounded-lg ${cc.iconBg} flex items-center justify-center ${cc.icon} shrink-0`}>
            {iconEl}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        <div className="flex items-center gap-2 mt-2">
          {trend !== undefined && (
            <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${
              trend >= 0 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                : 'bg-rose-50 text-rose-700 border-rose-200/60'
            }`}>
              {trend >= 0 ? (
                <svg className="w-3.5 h-3.5 mr-0.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 mr-0.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {Math.abs(trend)} pts
            </span>
          )}
          {subtitle && <p className="text-xs text-slate-500 font-medium truncate">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
