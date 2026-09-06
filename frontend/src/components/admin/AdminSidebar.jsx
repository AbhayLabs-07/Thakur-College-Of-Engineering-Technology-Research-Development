import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Cpu, 
  Users, 
  Inbox, 
  ArrowLeftRight, 
  History, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { authStorage } from '../../utils/storage';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { 
    activeTab, 
    setActiveTab, 
    sidebarExpanded, 
    setSidebarExpanded, 
    kpis 
  } = useAdmin();

  // Hovered item state for tooltip rendering when collapsed
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleLogout = () => {
    authStorage.clear();
    navigate('/');
  };

  // Navigation Items Definitions
  const mainNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      symbol: '▣'
    },
    {
      id: 'components',
      label: 'Components',
      icon: Cpu,
      symbol: '◈'
    },
    {
      id: 'faculty',
      label: 'Faculty Network',
      icon: Users,
      symbol: '♙'
    },
    {
      id: 'requests',
      label: 'Requests',
      icon: Inbox,
      symbol: '◉',
      badge: kpis.pendingRequests > 0 ? kpis.pendingRequests : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-black'
    },
    {
      id: 'loans',
      label: 'Active Loans',
      icon: ArrowLeftRight,
      symbol: '↔',
      badge: kpis.activeSessions > 0 ? kpis.activeSessions : null,
      badgeColor: 'bg-blue-600 text-white font-bold'
    },
    {
      id: 'activity',
      label: 'Activity Log',
      icon: History,
      symbol: '◷'
    }
  ];

  const adminNavItems = [
    {
      id: 'utilities',
      label: 'Utilities & Exports',
      icon: FileSpreadsheet,
      symbol: '📄'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      symbol: '⚙'
    }
  ];

  return (
    <aside 
      className={`fixed top-[58px] bottom-0 left-0 z-30 bg-[#0b2545] border-r-2 border-slate-700/80 text-white flex flex-col justify-between transition-all duration-300 ease-in-out select-none ${
        sidebarExpanded ? 'w-64' : 'w-16'
      }`}
    >
      {/* Top Section: Navigation Links */}
      <div className="flex-grow overflow-y-auto py-4 px-2 space-y-6">
        
        {/* Section: MAIN */}
        <div>
          {sidebarExpanded ? (
            <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>MAIN</span>
              <span className="text-tcet-gold font-mono">PORTAL</span>
            </div>
          ) : (
            <div className="h-4 border-b border-slate-800 mx-2 mb-2"></div>
          )}

          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <div key={item.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-amber-500/20 text-tcet-gold border-l-4 border-tcet-gold font-extrabold shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-850 border-l-4 border-transparent'
                    } ${!sidebarExpanded ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-tcet-gold scale-110' : 'text-slate-400 group-hover:text-white'}`} />
                    
                    {sidebarExpanded && (
                      <div className="flex-grow flex items-center justify-between truncate">
                        <span className="tracking-wide truncate">{item.label}</span>
                        {item.badge !== null && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-xs ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>

                  {/* Tooltip on Collapsed Hover */}
                  {!sidebarExpanded && hoveredItem === item.id && (
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 z-50 ml-2 px-3 py-1.5 bg-slate-900 border border-tcet-gold text-white text-xs font-bold whitespace-nowrap shadow-xl flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.badge !== null && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Section: ADMINISTRATION */}
        <div>
          {sidebarExpanded ? (
            <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 border-t border-slate-800 pt-4">
              <span>ADMINISTRATION</span>
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            </div>
          ) : (
            <div className="h-4 border-b border-slate-800 mx-2 mb-2"></div>
          )}

          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <div key={item.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-amber-500/20 text-tcet-gold border-l-4 border-tcet-gold font-extrabold shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-850 border-l-4 border-transparent'
                    } ${!sidebarExpanded ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-tcet-gold scale-110' : 'text-slate-400 group-hover:text-white'}`} />
                    
                    {sidebarExpanded && (
                      <span className="tracking-wide truncate">{item.label}</span>
                    )}
                  </button>

                  {/* Tooltip on Collapsed Hover */}
                  {!sidebarExpanded && hoveredItem === item.id && (
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 z-50 ml-2 px-3 py-1.5 bg-slate-900 border border-tcet-gold text-white text-xs font-bold whitespace-nowrap shadow-xl">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Logout Sidebar Item */}
            <div className="relative group pt-1">
              <button
                type="button"
                onClick={handleLogout}
                onMouseEnter={() => setHoveredItem('logout')}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 border-l-4 border-transparent hover:border-red-500 transition-all ${
                  !sidebarExpanded ? 'justify-center px-0' : ''
                }`}
              >
                <LogOut className="w-4 h-4 shrink-0 text-red-400" />
                {sidebarExpanded && (
                  <span className="tracking-wide font-extrabold uppercase">Logout</span>
                )}
              </button>

              {!sidebarExpanded && hoveredItem === 'logout' && (
                <div className="absolute left-16 top-1/2 -translate-y-1/2 z-50 ml-2 px-3 py-1.5 bg-red-950 border border-red-500 text-white text-xs font-bold whitespace-nowrap shadow-xl">
                  Logout
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Bottom Section: Sidebar Collapse Toggle */}
      <div className="p-3 border-t border-slate-800 bg-[#081b33]">
        <button
          type="button"
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="w-full flex items-center justify-center gap-2 py-2 px-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-bold"
          title={sidebarExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {sidebarExpanded ? (
            <>
              <ChevronLeft className="w-4 h-4 text-tcet-gold" />
              <span className="text-[11px] uppercase tracking-wider">Collapse Menu</span>
            </>
          ) : (
            <ChevronRight className="w-4 h-4 text-tcet-gold" />
          )}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
