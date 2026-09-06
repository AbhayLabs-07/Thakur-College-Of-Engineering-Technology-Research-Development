import React from 'react';
import { 
  X, 
  GraduationCap, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  Award, 
  Users, 
  Inbox, 
  ArrowLeftRight, 
  Cpu, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const FacultyProfileDrawer = ({ isOpen, onClose, faculty }) => {
  const { requests, activeLoans, setActiveTab } = useAdmin();

  if (!isOpen || !faculty) return null;

  // Filter student requests associated with this faculty mentor
  const facultyRequests = requests.filter(
    (r) => r.facultyMentor?._id === faculty._id || 
           r.facultyMentor?.name?.toLowerCase() === (faculty.name || '').toLowerCase()
  );

  // Filter active loans associated with this faculty mentor
  const facultyLoans = activeLoans.filter(
    (l) => l.facultyMentor?._id === faculty._id || 
           l.facultyMentor?.name?.toLowerCase() === (faculty.name || '').toLowerCase()
  );

  // Derive unique students mentored from loans and requests
  const mentoredStudentsMap = new Map();
  facultyRequests.forEach((r) => {
    if (r.student?.erpId) {
      mentoredStudentsMap.set(r.student.erpId, {
        ...r.student,
        projectTitle: r.projectTitle,
        context: 'Pending / Processed Request'
      });
    }
  });
  facultyLoans.forEach((l) => {
    if (l.student?.erpId) {
      mentoredStudentsMap.set(l.student.erpId, {
        ...l.student,
        projectTitle: l.projectTitle,
        context: 'Active Hardware Loan'
      });
    }
  });

  const mentoredStudents = Array.from(mentoredStudentsMap.values());

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white border-l-2 border-slate-300 shadow-2xl flex flex-col">
          
          {/* Drawer Header */}
          <div className="bg-tcet-navy text-white px-6 py-4 flex items-center justify-between border-b-2 border-tcet-gold">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 border border-tcet-gold text-tcet-gold flex items-center justify-center font-bold text-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-wide uppercase">
                  {faculty.name}
                </h3>
                <p className="text-xs text-tcet-gold font-mono font-medium">
                  {faculty.designation || faculty.position || 'Faculty Member'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
            
            {/* Academic Information Card */}
            <div className="bg-slate-50 border-2 border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-extrabold uppercase text-tcet-navy text-xs tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-tcet-gold" />
                  <span>Academic Standing & Hierarchy</span>
                </span>
                <span className="bg-tcet-navy text-white font-mono text-[10px] font-bold px-2 py-0.5 border border-tcet-gold">
                  Tier {faculty.hierarchyTier || '—'} : {faculty.hierarchyLabel || faculty.position || 'Faculty'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Department</span>
                    <span className="font-semibold">{faculty.department || 'TCET Engineering'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Date of Joining</span>
                    <span className="font-mono font-semibold">{faculty.doj || '12.06.2006'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Official Email</span>
                    <span className="font-mono font-semibold truncate block text-tcet-navy">
                      {faculty.email || `${faculty.name?.toLowerCase().replace(/[^a-z]/g, '')}@tcetmumbai.in`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Contact Number</span>
                    <span className="font-mono font-semibold">{faculty.contactNumber || '+91 9820012345'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* R&D Relationship Map Flow */}
            <div className="bg-blue-50/60 border border-blue-200 p-3.5 text-center">
              <span className="text-[10px] font-mono uppercase font-black tracking-wider text-blue-900 block mb-2">
                R&D Institutional Governance Pipeline
              </span>
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-tcet-navy flex-wrap">
                <span className="bg-white border border-blue-300 px-2 py-0.5">Faculty Mentor</span>
                <span>&rarr;</span>
                <span className="bg-white border border-blue-300 px-2 py-0.5">Students ({mentoredStudents.length})</span>
                <span>&rarr;</span>
                <span className="bg-white border border-blue-300 px-2 py-0.5">Requests ({facultyRequests.length})</span>
                <span>&rarr;</span>
                <span className="bg-white border border-blue-300 px-2 py-0.5">Active Loans ({facultyLoans.length})</span>
              </div>
            </div>

            {/* Section 1: Students Under Guidance */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs uppercase text-tcet-navy tracking-wider flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-tcet-navy" />
                  <span>Students Under Guidance ({mentoredStudents.length})</span>
                </span>
              </h4>

              {mentoredStudents.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400">
                  No active student groups currently mapped under this mentor.
                </div>
              ) : (
                <div className="space-y-2">
                  {mentoredStudents.map((s, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{s.name}</span>
                          <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.2 border border-slate-200 text-slate-600">
                            {s.erpId}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {s.branch} • Div {s.division}
                        </p>
                        <p className="text-[11px] text-tcet-navy font-semibold mt-0.5">
                          Project: {s.projectTitle}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                        {s.context}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Active Loans Under Faculty Supervision */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs uppercase text-tcet-navy tracking-wider flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-blue-700" />
                  <span>Active Laboratory Loans ({facultyLoans.length})</span>
                </span>
              </h4>

              {facultyLoans.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400">
                  No active hardware checkout sessions supervised currently.
                </div>
              ) : (
                <div className="space-y-2">
                  {facultyLoans.map((loan) => (
                    <div key={loan._id} className="p-3 bg-white border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold bg-slate-100 px-2 py-0.5 text-slate-700 border border-slate-300">
                          {loan.qrToken || loan._id}
                        </span>
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 border ${
                          loan.status === 'overdue' ? 'bg-red-50 text-red-700 border-red-300' :
                          loan.status === 'due_soon' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          'bg-green-50 text-green-800 border-green-300'
                        }`}>
                          {loan.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div>
                        <span className="font-bold text-slate-900 block">{loan.projectTitle}</span>
                        <span className="text-[11px] text-slate-500">Student: {loan.student?.name}</span>
                      </div>

                      <div className="bg-slate-50 p-2 border border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                          Components Issued:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {loan.cartItems.map((ci, i) => (
                            <span key={i} className="bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700 font-semibold">
                              {ci.componentName} ×{ci.quantityIssued}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Issued: {new Date(loan.issueDate).toLocaleDateString()}</span>
                        <span className="font-bold text-tcet-navy">Due: {new Date(loan.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Pending Requisitions */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs uppercase text-tcet-navy tracking-wider flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Inbox className="w-4 h-4 text-amber-600" />
                  <span>Student Requests Queue ({facultyRequests.length})</span>
                </span>
              </h4>

              {facultyRequests.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400">
                  No pending student requests under this mentor.
                </div>
              ) : (
                <div className="space-y-2">
                  {facultyRequests.map((req) => (
                    <div key={req._id} className="p-3 bg-white border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{req.student?.name}</span>
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 border ${
                          req.status === 'approved' ? 'bg-green-50 text-green-800 border-green-200' :
                          req.status === 'rejected' ? 'bg-red-50 text-red-800 border-red-200' :
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {req.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">{req.projectTitle}</p>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Requested: {req.cartItems.map((ci) => `${ci.componentName} ×${ci.quantity}`).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500">
              TCET R&D Cell Faculty Registry
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs uppercase transition-colors"
            >
              CLOSE PROFILE
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FacultyProfileDrawer;
