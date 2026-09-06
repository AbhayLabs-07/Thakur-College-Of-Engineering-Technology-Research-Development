import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Cpu, 
  GraduationCap, 
  Inbox, 
  ArrowLeftRight, 
  X, 
  ArrowRight,
  Command
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const GlobalSearchModal = () => {
  const { 
    isSearchOpen, 
    setIsSearchOpen, 
    components, 
    faculties, 
    requests, 
    activeLoans, 
    setActiveTab 
  } = useAdmin();

  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  // Focus input on modal open
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  // Keyboard shortcut: Ctrl + K / Cmd + K to open, Esc to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  // Search Results aggregation
  const results = [];

  if (cleanQuery.length >= 1) {
    // 1. Components Search
    components.forEach((c) => {
      if (
        c.name.toLowerCase().includes(cleanQuery) ||
        c.category.toLowerCase().includes(cleanQuery) ||
        (c.keywords && c.keywords.some((k) => k.toLowerCase().includes(cleanQuery)))
      ) {
        results.push({
          id: c._id,
          type: 'Component',
          title: c.name,
          subtitle: `${c.category} • Total: ${c.quantityTotal} (Avail: ${c.quantityAvailable})`,
          icon: Cpu,
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          tab: 'components',
          payload: c
        });
      }
    });

    // 2. Faculty Network Search
    faculties.forEach((f) => {
      if (
        (f.name && f.name.toLowerCase().includes(cleanQuery)) ||
        (f.department && f.department.toLowerCase().includes(cleanQuery)) ||
        (f.designation && f.designation.toLowerCase().includes(cleanQuery)) ||
        (f.email && f.email.toLowerCase().includes(cleanQuery))
      ) {
        results.push({
          id: f._id || f.name,
          type: 'Faculty',
          title: f.name,
          subtitle: `${f.designation || 'Faculty'} • ${f.department}`,
          icon: GraduationCap,
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
          tab: 'faculty',
          payload: f
        });
      }
    });

    // 3. Requests Search
    requests.forEach((r) => {
      if (
        r.requestId?.toLowerCase().includes(cleanQuery) ||
        r.student?.name?.toLowerCase().includes(cleanQuery) ||
        r.student?.erpId?.includes(cleanQuery) ||
        r.projectTitle?.toLowerCase().includes(cleanQuery) ||
        r.cartItems?.some((ci) => ci.componentName?.toLowerCase().includes(cleanQuery))
      ) {
        results.push({
          id: r._id,
          type: 'Request',
          title: `${r.requestId || 'REQ'} - ${r.student?.name}`,
          subtitle: `${r.projectTitle} • Mentor: ${r.facultyMentor?.name}`,
          icon: Inbox,
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
          tab: 'requests',
          payload: r
        });
      }
    });

    // 4. Active Loans & Students Search
    activeLoans.forEach((l) => {
      if (
        l._id?.toLowerCase().includes(cleanQuery) ||
        l.qrToken?.toLowerCase().includes(cleanQuery) ||
        l.student?.name?.toLowerCase().includes(cleanQuery) ||
        l.student?.erpId?.includes(cleanQuery) ||
        l.projectTitle?.toLowerCase().includes(cleanQuery)
      ) {
        results.push({
          id: l._id,
          type: 'Active Loan',
          title: `${l.student?.name} (${l.qrToken || l._id})`,
          subtitle: `Due: ${new Date(l.dueDate).toLocaleDateString()} • Status: ${l.status.replace('_', ' ')}`,
          icon: ArrowLeftRight,
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
          tab: 'loans',
          payload: l
        });
      }
    });
  }

  const handleSelectResult = (item) => {
    setActiveTab(item.tab);
    setIsSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white border-2 border-tcet-navy w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Input Bar */}
        <div className="p-3.5 bg-slate-50 border-b-2 border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-tcet-navy shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search students, components, faculty, requests, loan IDs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-200 text-slate-500 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-mono font-bold"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="flex-grow overflow-y-auto divide-y divide-slate-100 p-2">
          {cleanQuery.length === 0 ? (
            <div className="py-12 px-6 text-center text-slate-500 space-y-3">
              <Command className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold">
                Type a keyword to universally search the TCET R&D database
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
                <span className="bg-slate-100 px-2 py-0.5 border border-slate-200">"Raspberry Pi"</span>
                <span className="bg-slate-100 px-2 py-0.5 border border-slate-200">"Abhay"</span>
                <span className="bg-slate-100 px-2 py-0.5 border border-slate-200">"Dr. Prachi"</span>
                <span className="bg-slate-100 px-2 py-0.5 border border-slate-200">"REQ-"</span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="text-xs font-semibold">No records matched your search query "{query}"</p>
              <p className="text-[11px] text-slate-400 mt-1">Try searching by student name, hardware component, faculty or token.</p>
            </div>
          ) : (
            results.slice(0, 25).map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={`${item.type}-${item.id}-${idx}`}
                  onClick={() => handleSelectResult(item)}
                  className="p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-slate-100 group-hover:bg-amber-100 border border-slate-200 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-4 h-4 text-tcet-navy" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-tcet-navy truncate">
                          {item.title}
                        </h4>
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 border ${item.badgeColor}`}>
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-tcet-navy text-xs font-bold shrink-0">
                    <span className="hidden sm:inline text-[10px] uppercase font-mono">Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Total matches: {results.length}</span>
          <span>Press ESC to close</span>
        </div>

      </div>
    </div>
  );
};

export default GlobalSearchModal;
