import { NavLink, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getAlerts } from '../services/api';

export default function Layout({ children, user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  useEffect(() => {
    getAlerts().then(res => setAlerts(res.data)).catch(() => {});
  }, []);

  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';
  const isAdmin = user?.role === 'admin';

  // Navigation Items per Role
  const studentNavItems = [
    {
      path: '/student-dashboard',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
        </svg>
      )
    },
    {
      path: '/analytics/students/me',
      label: 'My Performance',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      path: `/analytics/students/${user?.id || 'me'}/roadmap`,
      label: 'Recovery Roadmap',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    },
    {
      path: '/heatmap',
      label: 'Skill Heatmap',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      )
    },
    {
      path: '/reports',
      label: 'Reports & Marks',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      path: '/profile',
      label: 'My Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  const facultyNavItems = [
    {
      path: '/analytics/faculty',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
        </svg>
      )
    },
    {
      path: '/analytics/attrition',
      label: 'Attrition Risk',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    {
      path: '/interventions',
      label: 'Interventions',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      path: '/students/manage',
      label: 'Manage Students',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      path: '/heatmap',
      label: 'Skill Heatmap',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      )
    },
    {
      path: '/reports',
      label: 'Reports & Marks',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      path: '/profile',
      label: 'My Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  const adminNavItems = [
    {
      path: '/analytics/admin',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
        </svg>
      )
    },
    {
      path: '/analytics/attrition',
      label: 'Attrition Risk',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    {
      path: '/interventions',
      label: 'Interventions',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      path: '/heatmap',
      label: 'Skill Heatmap',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      )
    },
    {
      path: '/reports',
      label: 'Reports & Marks',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      path: '/admin/users',
      label: 'User Management',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      path: '/profile',
      label: 'My Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  const currentNavItems = isAdmin ? adminNavItems : (isFaculty ? facultyNavItems : studentNavItems);
  const allNavItems = [...adminNavItems, ...facultyNavItems, ...studentNavItems];
  const pageTitle = allNavItems.find(n => n.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="flex h-screen bg-[#F5F5F7] font-sans antialiased text-[#171717] overflow-hidden">
      {/* Mobile menu toggle */}
      <div className="lg:hidden fixed top-3.5 left-4 z-50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2.5 bg-white text-[#171717] rounded-xl shadow-md border border-[#EAEAEA]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Reference-Style Clean White Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } sidebar-transition bg-white border-r border-slate-200/80 flex flex-col shrink-0 fixed lg:relative h-full z-40 select-none shadow-xs ${
          !collapsed ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header with Collapse Toggle */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo Icon */}
            <div className="w-8.5 h-8.5 rounded-lg bg-[#4655F5] flex items-center justify-center shrink-0 shadow-xs shadow-[#4655F5]/25">
              <span className="font-bold text-white text-base tracking-tight">A</span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight truncate">AcadInsight</h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase leading-tight truncate">Academic Intelligence</p>
              </div>
            )}
          </div>

          {/* Chevron Collapse Toggle (visible on desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 items-center justify-center transition-colors shrink-0 border border-slate-200/70"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation Links with Blue Active Pills & Slate Inactive Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {!collapsed && (
            <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Platform</p>
          )}
          {currentNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 ${
                  collapsed ? 'justify-center px-2' : 'px-3.5'
                } py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#4655F5] text-white font-semibold shadow-xs shadow-[#4655F5]/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`
              }
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Status / Advisory Card */}
        {!collapsed && (
          <div className="mx-3 mb-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 relative overflow-hidden shrink-0 animate-fadeIn">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-xs text-slate-800 tracking-tight">Academic Advisory</h4>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-2.5">
              Supervise student recovery roadmaps and intervention actions.
            </p>
            <a
              href="/interventions"
              className="block w-full py-1.5 px-3 text-center text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100/80 rounded-lg border border-slate-200 shadow-2xs transition-colors"
            >
              Open Interventions →
            </a>
          </div>
        )}

        {/* Bottom Logout Button */}
        <div className="p-3 border-t border-slate-200/80 shrink-0">
          <button
            onClick={onLogout}
            title="Sign Out"
            className={`w-full flex items-center ${
              collapsed ? 'justify-center px-2' : 'px-3'
            } py-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50/70 rounded-lg text-xs font-medium transition-colors`}
          >
            <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span className="ml-2.5 truncate font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {!collapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/20 z-30 backdrop-blur-xs"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Main Content Area (Header + Scrollable Body) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-hidden">
        
        {/* Clean Modern Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 sm:px-8 shrink-0 z-20 shadow-2xs">
          {/* Left: Dynamic Page Title / Breadcrumb */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-slate-400 hidden sm:inline">AcadInsight</span>
            <span className="text-xs text-slate-300 hidden sm:inline">/</span>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">{pageTitle}</h2>
            </div>
          </div>

          {/* Center: Search Box (hidden for student role) */}
          {!isStudent && (
            <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-md mx-6">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students, subjects, metrics..."
                  className="w-full bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs pl-8.5 pr-10 py-1.5 rounded-lg outline-none focus:bg-white focus:border-[#4655F5] focus:ring-1 focus:ring-[#4655F5]/30 transition-all"
                />
                <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                  <kbd className="text-[10px] text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-2xs font-mono font-medium">⌘K</kbd>
                </span>
              </div>
            </div>
          )}

          {/* Right: Actions, Notifications & User Info */}
          <div className="flex items-center gap-3 sm:gap-3.5 shrink-0">
            {/* Live Indicator Pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Engine</span>
            </div>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="w-9 h-9 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center relative transition-colors focus:outline-none border border-slate-200/80"
                title="View Alerts & Notifications"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {alerts.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#4655F5] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {alerts.length}
                  </span>
                )}
              </button>

              {/* Alert Dropdown Panel */}
              {showAlerts && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAlerts(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-lg z-50 animate-fadeIn overflow-hidden">
                    <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/75">
                      <h4 className="text-xs font-semibold text-slate-900">Recent Alerts & Updates</h4>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-[#4655F5]">
                        {alerts.length} New
                      </span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {alerts.length === 0 ? (
                        <p className="p-6 text-xs text-slate-500 text-center">No current alerts</p>
                      ) : (
                        alerts.map((alert, i) => (
                          <div key={i} className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-start gap-2.5">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${alert.severity === 'high' || alert.type === 'critical' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-800 leading-relaxed">{alert.message}</p>
                              {alert.created_at && (
                                <p className="text-[10px] text-slate-400 mt-0.5">{new Date(alert.created_at).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            {/* User Profile Thumbnail - Clickable to My Profile */}
            <Link
              to="/profile"
              title="Go to My Profile"
              className="flex items-center gap-2.5 pl-1 p-1 -m-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group"
            >
              <div className="w-8.5 h-8.5 rounded-full bg-slate-900 group-hover:bg-[#4655F5] flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-2xs transition-colors">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-900 group-hover:text-[#4655F5] leading-tight truncate max-w-[130px] transition-colors">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight truncate max-w-[130px] capitalize">{user?.role || 'Guest'}</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
