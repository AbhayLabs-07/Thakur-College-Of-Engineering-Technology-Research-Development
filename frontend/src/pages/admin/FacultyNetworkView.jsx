import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Award, 
  RefreshCw, 
  Trash2, 
  GraduationCap, 
  Building2, 
  Mail, 
  Phone,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const HIERARCHY_TIERS = [
  { tier: 'all', label: 'All Academic Tiers' },
  { tier: '1', label: 'Tier 1: Principal' },
  { tier: '2', label: 'Tier 2: Vice Principal' },
  { tier: '3', label: 'Tier 3: Dean' },
  { tier: '4', label: 'Tier 4: Associate Dean' },
  { tier: '5', label: 'Tier 5: Head of Department (HOD)' },
  { tier: '6', label: 'Tier 6: Deputy HOD / Lead' },
  { tier: '7', label: 'Tier 7: Professor' },
  { tier: '8', label: 'Tier 8: Associate Professor' },
  { tier: '9', label: 'Tier 9: Assistant Professor' },
  { tier: '10', label: 'Tier 10: Lecturer / Trainer' },
  { tier: '11', label: 'Tier 11: Academic Staff' }
];

const FacultyNetworkView = ({ onOpenAddFaculty, onSelectFaculty }) => {
  const { 
    faculties, 
    facultyCount, 
    facultyLoading, 
    deleteFaculty, 
    syncWithBackend 
  } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  // Academic hierarchy sorter strictly by Tier -> DOJ seniority (Not alphabetical)
  const sortedFaculties = useMemo(() => {
    const list = [...faculties];

    const getDojTime = (f) => {
      if (f.dojDate) {
        const t = new Date(f.dojDate).getTime();
        if (!isNaN(t)) return t;
      }
      if (f.doj && typeof f.doj === 'string') {
        const parts = f.doj.trim().split(/[\.\-\/]/);
        if (parts.length === 3) {
          let d = parseInt(parts[0], 10);
          let m = parseInt(parts[1], 10);
          let y = parseInt(parts[2], 10);
          if (y < 100) y = y < 50 ? 2000 + y : 1900 + y;
          const dt = new Date(y, m - 1, d).getTime();
          if (!isNaN(dt)) return dt;
        }
      }
      return 9999999999999;
    };

    return list
      .filter((fac) => {
        const term = searchQuery.toLowerCase();
        const matchesSearch = !term || (
          (fac.name && fac.name.toLowerCase().includes(term)) ||
          (fac.department && fac.department.toLowerCase().includes(term)) ||
          (fac.designation && fac.designation.toLowerCase().includes(term)) ||
          (fac.position && fac.position.toLowerCase().includes(term)) ||
          (fac.email && fac.email.toLowerCase().includes(term)) ||
          (fac.contactNumber && fac.contactNumber.toLowerCase().includes(term))
        );

        const matchesDept = deptFilter === 'all' || fac.department === deptFilter;
        const matchesTier = tierFilter === 'all' || String(fac.hierarchyTier) === String(tierFilter);

        return matchesSearch && matchesDept && matchesTier;
      })
      .sort((a, b) => {
        // 1. Position / Hierarchy Tier ASC (Tier 1: Principal -> Tier 11)
        const tierA = Number(a.hierarchyTier) || 99;
        const tierB = Number(b.hierarchyTier) || 99;
        if (tierA !== tierB) {
          return tierA - tierB;
        }

        // 2. Date of Joining: earlier date first (highest seniority)
        const timeA = getDojTime(a);
        const timeB = getDojTime(b);
        if (timeA !== timeB) {
          return timeA - timeB;
        }

        // 3. Fallback: seniorityOrder
        return (a.seniorityOrder || 99999) - (b.seniorityOrder || 99999);
      });
  }, [faculties, searchQuery, deptFilter, tierFilter]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set(faculties.map((f) => f.department).filter(Boolean));
    return Array.from(set).sort();
  }, [faculties]);

  const handleDelete = (e, fac) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove ${fac.name} from the faculty network?`)) {
      deleteFaculty(fac._id, fac.name);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-tcet-navy text-tcet-gold px-2 py-0.5 border border-tcet-gold">
              Academic Hierarchy & R&D Mentorship Network
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              Total: {facultyCount} Enrolled
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-tcet-navy uppercase tracking-tight">
            Faculty Network
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Official institutional academic hierarchy, mentorship mapping, and research guidance roster.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={syncWithBackend}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 text-tcet-navy font-bold text-xs uppercase border border-slate-300 transition-colors shadow-xs"
            title="Refresh Roster from Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${facultyLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddFaculty}
            className="flex items-center gap-2 px-5 py-2.5 bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs uppercase border border-tcet-navy transition-all shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-tcet-gold" />
            <span>+ Add Faculty</span>
          </button>
        </div>
      </div>

      {/* Official Hierarchy Order Notice Banner */}
      <div className="bg-amber-50 border-2 border-amber-300 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="font-semibold">
            <strong>Official Hierarchy Rule:</strong> Sorted strictly by <strong>Academic Tier (Principal &rarr; Vice Principal &rarr; Dean &rarr; Professor &rarr; Associate &rarr; Assistant)</strong>, then by <strong>Date of Joining (DOJ Seniority)</strong>. <em>(Not alphabetical)</em>
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2 py-1 border border-amber-400 whitespace-nowrap self-start sm:self-auto">
          Tier 1 to Tier 11 Active
        </span>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border-2 border-slate-300 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          
          {/* Search Box */}
          <div className="lg:col-span-6 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search faculty by name, designation, department, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs h-10 font-medium"
            />
          </div>

          {/* Department Filter */}
          <div className="lg:col-span-3">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs bg-white h-10 font-medium text-slate-800"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Hierarchy Tier Filter */}
          <div className="lg:col-span-3">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs bg-white h-10 font-semibold text-slate-800"
            >
              {HIERARCHY_TIERS.map((t) => (
                <option key={t.tier} value={t.tier}>{t.label}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Faculty Table with Click-to-Profile */}
      <div className="bg-white border-2 border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-tcet-navy text-white uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="p-3 w-16 text-center">Seniority</th>
                <th className="p-3">Faculty Name & Credentials</th>
                <th className="p-3">Designation / Tier</th>
                <th className="p-3">Department</th>
                <th className="p-3">Official Email</th>
                <th className="p-3 text-center">Date of Joining</th>
                <th className="p-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {facultyLoading ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="animate-spin inline-block w-7 h-7 border-3 border-current border-t-transparent text-tcet-navy"></div>
                    <p className="text-xs text-slate-500 mt-2 font-medium">Loading faculty roster from database...</p>
                  </td>
                </tr>
              ) : sortedFaculties.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-xs text-slate-600">No faculty members match your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                sortedFaculties.map((fac, idx) => {
                  const tier = fac.hierarchyTier || (fac.position === 'Principal' ? 1 : fac.position === 'Vice Principal' ? 2 : 9);
                  return (
                    <tr 
                      key={fac._id || idx}
                      onClick={() => onSelectFaculty(fac)}
                      className="hover:bg-amber-50/40 cursor-pointer transition-colors group"
                    >
                      {/* Seniority Rank */}
                      <td className="p-3 text-center font-mono font-black text-tcet-navy">
                        <span className="bg-slate-100 group-hover:bg-amber-100 border border-slate-200 px-2 py-1 text-xs">
                          #{fac.seniorityOrder || idx + 1}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 group-hover:text-tcet-navy">
                            {fac.name}
                          </span>
                          {fac.email && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active login credentials"></span>
                          )}
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700">
                            {fac.designation || fac.position || 'Faculty'}
                          </span>
                          <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-600 px-1 py-0.2 border border-slate-200">
                            T{tier}
                          </span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="p-3 text-slate-600 font-medium">
                        {fac.department}
                      </td>

                      {/* Email */}
                      <td className="p-3 font-mono text-[11px] text-slate-600">
                        {fac.email || <span className="text-slate-300 italic">—</span>}
                      </td>

                      {/* Date of Joining */}
                      <td className="p-3 text-center font-mono text-[11px] text-slate-700 font-semibold">
                        {fac.doj || '12.06.2006'}
                      </td>

                      {/* Action */}
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectFaculty(fac)}
                            className="p-1 text-tcet-navy hover:bg-slate-100 border border-slate-300 transition-colors"
                            title="Open Detailed Profile"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, fac)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                            title="Remove Faculty"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono">
          <span>Showing {sortedFaculties.length} of {faculties.length} faculty members</span>
          <span>Click any row to inspect mentored students & R&D projects</span>
        </div>
      </div>

    </div>
  );
};

export default FacultyNetworkView;
