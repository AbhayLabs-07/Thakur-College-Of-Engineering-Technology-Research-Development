import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, Award, ClipboardCheck, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import Header from '../components/Header';
import { facultyService } from '../services/api';

const FacultyDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState({});
  const [notifyMsg, setNotifyMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const showNotify = (text, type = 'success') => {
    setNotifyMsg({ type, text });
    setTimeout(() => setNotifyMsg({ type: '', text: '' }), 5000);
  };

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const data = await facultyService.getPending();
      setPendingRequests(data);
    } catch (err) {
      console.error(err);
      showNotify('Failed to fetch pending mentor requests.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id, approved) => {
    const decisionRemarks = remarks[id] || '';
    
    try {
      await facultyService.decide(id, approved, decisionRemarks);
      showNotify(approved ? 'Request approved and forwarded to Lab Admin.' : 'Request rejected and closed.');
      
      // Update local state list
      setPendingRequests(pendingRequests.filter(req => req._id !== id));
      
      // Clear remark input
      const updatedRemarks = { ...remarks };
      delete updatedRemarks[id];
      setRemarks(updatedRemarks);
    } catch (err) {
      console.error(err);
      showNotify(err.response?.data?.message || 'Failed to process checkout decision.', 'error');
    }
  };

  const handleRemarkChange = (id, text) => {
    setRemarks({
      ...remarks,
      [id]: text
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-tcet-lightBg">
      <Header />

      {/* Faculty Profile Bar */}
      <div className="bg-slate-100 border-b border-slate-300 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-y-2 gap-x-6 text-[11px] text-slate-700 items-center">
          <div className="flex items-center gap-1">
            <span className="font-bold text-tcet-navy">Faculty:</span>
            <span className="bg-white border border-slate-300 px-2 py-0.5 font-semibold">{localStorage.getItem('name')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-tcet-navy">Rank:</span>
            <span className="bg-white border border-slate-300 px-2 py-0.5 font-semibold">{localStorage.getItem('designation')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-tcet-navy">Department:</span>
            <span className="bg-white border border-slate-300 px-2 py-0.5 font-semibold">{localStorage.getItem('department')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-tcet-navy">Faculty Gmail ID:</span>
            <span className="bg-white border border-slate-300 px-2 py-0.5 font-mono">{localStorage.getItem('email')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-tcet-navy">Faculty Number:</span>
            <span className="bg-white border border-slate-300 px-2 py-0.5 font-mono">{localStorage.getItem('contactNumber') || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Floating Notifications */}
      {notifyMsg.text && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 shadow-lg border-l-4 font-semibold text-xs flex items-center gap-2 ${
          notifyMsg.type === 'error' ? 'bg-red-50 border-red-600 text-red-800' : 'bg-green-50 border-green-600 text-green-800'
        }`}>
          <CheckCircle2 className={`w-4 h-4 ${notifyMsg.type === 'error' ? 'text-red-600' : 'text-green-600'}`} />
          <span>{notifyMsg.text}</span>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8 flex-grow w-full">
        <div className="bg-white border-2 border-tcet-gold p-6 shadow-sm mb-8">
          <h2 className="text-xl font-black text-tcet-navy uppercase border-b border-slate-200 pb-3 mb-2 tracking-wider flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-tcet-gold animate-bounce" />
            <span>Faculty Mentor Approval Console</span>
          </h2>
          <p className="text-xs text-tcet-mutedText">
            Review and approve hardware allocations. Sequential workflow enforces that the Admin cannot dispense components until a mentor registers approval here.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-tcet-navy" role="status"></div>
            <p className="text-xs text-tcet-mutedText mt-2">Loading pending project proposals...</p>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-slate-300 shadow-sm">
            <ThumbsUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-extrabold text-sm uppercase">No pending review requests</p>
            <p className="text-xs text-slate-400 mt-1">Excellent! You are all caught up on your mentor reviews.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {pendingRequests.map((record) => (
              <div key={record._id} className="bg-white border-2 border-slate-300 shadow-sm flex flex-col justify-between">
                
                {/* Header: Student Identity & Date */}
                <div className="bg-slate-100 border-b border-slate-300 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <span className="text-[10px] bg-tcet-navy text-white px-2 py-0.5 font-bold uppercase tracking-wider">
                      Student Lead
                    </span>
                    <h4 className="font-extrabold text-base text-tcet-navy mt-1">
                      {record.student?.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      ERP ID: {record.student?.erpId} • {record.student?.branch} • Division {record.student?.division}
                    </p>
                  </div>
                  
                  <div className="text-right text-xs">
                    <p className="text-tcet-mutedText font-semibold">Submitted on</p>
                    <p className="font-mono font-bold text-slate-800">
                      {new Date(record.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Body: Project definition & Requested components */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-200">
                  {/* Left Column: Project details */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-tcet-mutedText uppercase tracking-wider block">Project Title</span>
                      <span className="font-extrabold text-base text-slate-800">{record.projectTitle}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-tcet-mutedText uppercase tracking-wider block">Domain</span>
                        <span className="font-semibold text-slate-700 text-xs">{record.projectDomain}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-tcet-mutedText uppercase tracking-wider block">Borrow Period</span>
                        <span className="font-semibold text-slate-700 text-xs">14 Days</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-tcet-mutedText uppercase tracking-wider block">Project Proposal Description</span>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 border border-slate-200 mt-1 whitespace-pre-line">
                        {record.projectDescription}
                      </p>
                    </div>

                    {/* Team Members List */}
                    {record.teamMembers && record.teamMembers.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-tcet-mutedText uppercase tracking-wider block mb-2">Team Co-workers</span>
                        <div className="border border-slate-200 divide-y divide-slate-200">
                          {record.teamMembers.map((m, idx) => (
                            <div key={idx} className="p-2 bg-slate-50 flex justify-between text-[11px]">
                              <div>
                                <span className="font-bold text-slate-700">{m.name}</span> <span className="text-slate-400">({m.role})</span>
                              </div>
                              <div className="text-slate-500">
                                {m.branch} • Div {m.division}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Component items list */}
                  <div>
                    <span className="text-[10px] font-bold text-tcet-mutedText uppercase tracking-wider block mb-2">
                      Requested Hardware Components
                    </span>
                    
                    <div className="border border-slate-200 divide-y divide-slate-200 text-xs">
                      {record.cartItems.map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 border border-slate-200 flex-shrink-0">
                              {item.component?.imageUrl ? (
                                <img 
                                  src={item.component.imageUrl} 
                                  alt={item.component.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400 font-mono">No Pic</div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{item.component?.name}</p>
                              <p className="text-[10px] text-slate-500">{item.component?.category}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="bg-tcet-navy text-white px-2.5 py-1 font-bold">
                              Qty: {item.quantity}
                            </span>
                            <p className="text-[9px] text-slate-400 mt-1">Available in Lab: {item.component?.quantityAvailable}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer: Remarks & Decisions */}
                <div className="bg-slate-50 p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 w-full relative">
                    <span className="absolute top-3.5 left-3 text-slate-400">
                      <MessageSquare className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Add reviewer notes/remarks (e.g. Approved for COE Incubation)..."
                      value={remarks[record._id] || ''}
                      onChange={(e) => handleRemarkChange(record._id, e.target.value)}
                      className="w-full pl-9 pr-4 py-3 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs"
                    />
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                    <button
                      onClick={() => handleDecision(record._id, false)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-white hover:bg-red-50 text-red-700 border-2 border-red-700 font-bold text-xs px-5 py-3 transition-colors uppercase"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>REJECT REQUEST</span>
                    </button>
                    <button
                      onClick={() => handleDecision(record._id, true)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-tcet-navy hover:bg-slate-800 text-white border-2 border-tcet-navy font-bold text-xs px-5 py-3 transition-colors uppercase"
                    >
                      <ThumbsUp className="w-4 h-4 text-tcet-gold" />
                      <span>APPROVE REQUEST</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-tcet-navy text-slate-400 py-6 text-center text-xs mt-auto border-t-2 border-tcet-gold">
        <p>© {new Date().getFullYear()} TCET R&D Cell • Mentor Board</p>
      </footer>
    </div>
  );
};

export default FacultyDashboard;
