import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Settings, FileSpreadsheet, Plus, Trash2, Edit2, 
  Search, RefreshCw, Calendar, Package, ArrowRightLeft, CheckCircle2, Users, GraduationCap
} from 'lucide-react';
import Header from '../components/Header';
import { adminService, componentService, authService } from '../services/api';
import { authStorage } from '../utils/storage';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('tracking'); // 'tracking', 'inventory', 'faculty', 'utilities'
  
  // States
  const [records, setRecords] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState({ type: '', text: '' });

  // Faculty Directory states for Admin
  const [faculties, setFaculties] = useState([]);
  const [facultyCount, setFacultyCount] = useState(0);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [facultySearch, setFacultySearch] = useState('');

  // Inventory form state
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: 'Microcontroller',
    quantityTotal: 5,
    imageUrl: '',
    description: '',
    keywords: '',
    specs: {}
  });
  
  // Custom specifications input builders
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');

  // Status notes state
  const [adminNotes, setAdminNotes] = useState({});

  useEffect(() => {
    fetchRecords();
    fetchComponents();
    fetchFaculty();
    authService.getProfile().then(data => {
      if (data && (data.user || data.name)) {
        const u = data.user || data;
        if (data.role === 'admin' || !data.role) {
          if (u.name) authStorage.setItem('name', u.name);
          if (u.username) authStorage.setItem('username', u.username);
          if (u.email) authStorage.setItem('email', u.email);
          if (u.contactNumber) authStorage.setItem('contactNumber', u.contactNumber);
        }
      }
    }).catch(() => {});
  }, []);

  const showNotify = (text, type = 'success') => {
    setNotifyMsg({ type, text });
    setTimeout(() => setNotifyMsg({ type: '', text: '' }), 5000);
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await adminService.getRecords();
      setRecords(data);
    } catch (err) {
      console.error(err);
      showNotify('Failed to fetch checkout records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchComponents = async () => {
    try {
      const data = await componentService.getAll();
      setComponents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFaculty = async () => {
    setFacultyLoading(true);
    try {
      const data = await adminService.getFacultyRoster();
      setFaculties(data.faculties || []);
      setFacultyCount(data.count !== undefined ? data.count : (data.faculties?.length || 0));
    } catch (err) {
      console.error(err);
      showNotify('Failed to fetch faculty roster directory.', 'error');
    } finally {
      setFacultyLoading(false);
    }
  };

  // Status update dispatcher
  const handleUpdateStatus = async (id, status) => {
    const notes = adminNotes[id] || '';
    try {
      await adminService.updateStatus(id, status, notes);
      showNotify(`Request status updated to: ${status.replace('_', ' ').toUpperCase()}`);
      
      // Update local states
      fetchRecords();
      fetchComponents();
      
      // Clear notes input
      setAdminNotes({
        ...adminNotes,
        [id]: ''
      });
    } catch (err) {
      console.error(err);
      showNotify(err.response?.data?.message || 'Failed to update record status.', 'error');
    }
  };

  // Inventory Editor handlers
  const handleAddSpec = () => {
    if (!specKey || !specVal) return;
    setFormData({
      ...formData,
      specs: {
        ...formData.specs,
        [specKey.trim()]: specVal.trim()
      }
    });
    setSpecKey('');
    setSpecVal('');
  };

  const handleRemoveSpec = (key) => {
    const updatedSpecs = { ...formData.specs };
    delete updatedSpecs[key];
    setFormData({
      ...formData,
      specs: updatedSpecs
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      quantityTotal: Number(formData.quantityTotal)
    };

    try {
      if (isEditing) {
        await componentService.update(editId, payload);
        showNotify('Component catalogued updated successfully.');
      } else {
        await componentService.create(payload);
        showNotify('New hardware component added to inventory.');
      }
      
      // Clear forms
      setFormData({
        name: '',
        category: 'Microcontroller',
        quantityTotal: 5,
        imageUrl: '',
        description: '',
        keywords: '',
        specs: {}
      });
      setIsEditing(false);
      setEditId('');
      
      // Refresh list
      fetchComponents();
    } catch (err) {
      console.error(err);
      showNotify(err.response?.data?.message || 'Failed to save component.', 'error');
    }
  };

  const handleEditClick = (comp) => {
    // Convert specs Map/Object
    const specsObj = comp.specs instanceof Map ? Object.fromEntries(comp.specs) : comp.specs || {};
    
    setFormData({
      name: comp.name,
      category: comp.category,
      quantityTotal: comp.quantityTotal,
      imageUrl: comp.imageUrl || '',
      description: comp.description || '',
      keywords: comp.keywords ? comp.keywords.join(', ') : '',
      specs: specsObj
    });
    setIsEditing(true);
    setEditId(comp._id);
    setActiveTab('inventory'); // switch focus to form
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this component from inventory? This action is irreversible.')) {
      return;
    }
    try {
      await componentService.delete(id);
      showNotify('Component deleted successfully.', 'info');
      fetchComponents();
    } catch (err) {
      console.error(err);
      showNotify('Failed to delete component.', 'error');
    }
  };

  const handleTriggerManualCron = async () => {
    try {
      const data = await adminService.triggerCronScan();
      showNotify(data.message || 'Overdue scan executed manually successfully.');
    } catch (err) {
      console.error(err);
      showNotify('Failed to trigger manual cron job.', 'error');
    }
  };

  // Helper check for overdue
  const isOverdue = (record) => {
    return record.status === 'handed_out' && new Date(record.dueDate) < new Date();
  };

  const categories = ['Microcontroller', 'Development Board', 'Sensor', 'Actuator', 'Power Supply', 'Communication Module', 'Display', 'Passive Components', 'Others'];

  return (
    <div className="min-h-screen flex flex-col bg-tcet-lightBg">
      <Header />

      {/* Admin Profile Bar */}
      <div className="bg-slate-100 border-b border-slate-300 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-y-2 gap-x-6 text-[11px] text-slate-700 items-center">
          <div className="flex items-center gap-1">
            <span className="font-bold text-tcet-navy">Admin:</span>
            <span className="bg-white border border-slate-300 px-2 py-0.5 font-semibold text-slate-900">{authStorage.getItem('name') || 'Ashish Mudholkar'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-tcet-navy">Email:</span>
            <span className="bg-white border border-slate-300 px-2 py-0.5 font-mono text-tcet-navy font-semibold">{authStorage.getItem('email') || 'ashish.mudholkar75@gmail.com'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-tcet-navy">User ID / Username:</span>
            <span className="bg-white border border-slate-300 px-2 py-0.5 font-mono font-bold text-slate-900">{authStorage.getItem('username') || 'Admin'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-tcet-navy">Contact Number:</span>
            <span className="bg-white border border-slate-300 px-2 py-0.5 font-mono">{authStorage.getItem('contactNumber') || '+91 9920123456'}</span>
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

      {/* Admin Subheader Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase border-b-2 tracking-wide transition-all ${
                activeTab === 'tracking' 
                  ? 'border-tcet-navy text-tcet-navy' 
                  : 'border-transparent text-tcet-mutedText hover:text-tcet-navy'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Live Asset Tracking</span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase border-b-2 tracking-wide transition-all ${
                activeTab === 'inventory' 
                  ? 'border-tcet-navy text-tcet-navy' 
                  : 'border-transparent text-tcet-mutedText hover:text-tcet-navy'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('faculty')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase border-b-2 tracking-wide transition-all ${
                activeTab === 'faculty' 
                  ? 'border-tcet-navy text-tcet-navy' 
                  : 'border-transparent text-tcet-mutedText hover:text-tcet-navy'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Faculty Directory</span>
            </button>
            <button
              onClick={() => setActiveTab('utilities')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase border-b-2 tracking-wide transition-all ${
                activeTab === 'utilities' 
                  ? 'border-tcet-navy text-tcet-navy' 
                  : 'border-transparent text-tcet-mutedText hover:text-tcet-navy'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Utilities & Exports</span>
            </button>
          </div>

          {/* Quick Stats Display */}
          <div className="hidden md:flex gap-4 text-xs font-mono">
            <span className="bg-blue-50 text-blue-900 px-2.5 py-1 border border-blue-200">
              Total Faculties: <strong>{facultyCount}</strong>
            </span>
            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 border border-slate-200">
              Active Loans: <strong>{records.filter(r => r.status === 'handed_out').length}</strong>
            </span>
            <span className="bg-red-50 text-red-700 px-2.5 py-1 border border-red-200">
              Overdue Alert: <strong>{records.filter(isOverdue).length}</strong>
            </span>
          </div>
        </div>
      </div>

      {activeTab === 'tracking' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
          <div className="bg-white border-2 border-slate-300 p-6 shadow-sm mb-6">
            <h3 className="font-extrabold text-sm uppercase text-tcet-navy border-b border-slate-200 pb-2 mb-4 tracking-wider">
              Laboratory Active Allocations & Checkout Logs
            </h3>

            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-tcet-navy" role="status"></div>
                <p className="text-xs text-tcet-mutedText mt-2">Connecting to laboratory server...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-300">
                <ArrowRightLeft className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-semibold text-xs">No borrow records found in the database</p>
                <p className="text-[10px] text-slate-400 mt-1">Check back once students have submitted requests.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {records.map((record) => {
                  const recordOverdue = isOverdue(record);
                  return (
                    <div 
                      key={record._id} 
                      className={`border-2 p-5 bg-white flex flex-col lg:flex-row justify-between gap-6 transition-all ${
                        recordOverdue 
                          ? 'border-red-600 bg-red-50 shadow-md' 
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Left Block: Identity, Project details & Mentors */}
                      <div className="space-y-3 flex-grow">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 font-bold uppercase">
                            {record.qrToken}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${
                            recordOverdue ? 'bg-red-600 text-white border-red-700 animate-pulse' :
                            record.status === 'pending_faculty' ? 'bg-yellow-50 border-yellow-300 text-yellow-800' :
                            record.status === 'pending_admin' ? 'bg-blue-50 border-blue-300 text-blue-800' :
                            record.status === 'handed_out' ? 'bg-green-50 border-green-300 text-green-800' :
                            record.status === 'returned' ? 'bg-slate-100 border-slate-300 text-slate-800' :
                            'bg-red-50 border-red-300 text-red-800'
                          }`}>
                            {recordOverdue ? 'OVERDUE ALERT' : record.status.replace('_', ' ')}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-base text-tcet-navy">{record.projectTitle}</h4>

                        {/* Details grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 text-xs text-slate-700">
                          <p><strong>Student Lead:</strong> {record.student?.name} ({record.student?.erpId})</p>
                          <p><strong>Branch & Class:</strong> {record.student?.branch} • Div {record.student?.division}</p>
                          <p><strong>Contact No:</strong> {record.student?.contactNumber || 'N/A'}</p>
                          <p><strong>Faculty Mentor:</strong> {record.facultyMentor?.name}</p>
                          <p><strong>Requested:</strong> {new Date(record.requestedAt).toLocaleDateString()}</p>
                          <p><strong>Due Date:</strong> <span className={recordOverdue ? 'font-bold text-red-600' : 'font-medium'}>{new Date(record.dueDate).toLocaleDateString()}</span></p>
                        </div>

                        {/* Co-workers */}
                        {record.teamMembers && record.teamMembers.length > 0 && (
                          <div className="text-[11px] bg-slate-50 border border-slate-200 p-2.5">
                            <span className="font-bold text-tcet-navy block mb-1">Team Members:</span>
                            <div className="flex flex-wrap gap-2">
                              {record.teamMembers.map((m, i) => (
                                <span key={i} className="bg-white border border-slate-200 px-2 py-0.5 text-slate-600 font-medium">
                                  {m.name} ({m.role})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Review Remarks */}
                        {record.facultyDecision && record.facultyDecision.remarks && (
                          <div className="bg-slate-50 p-2.5 border-l-2 border-tcet-gold text-[10px] text-slate-600">
                            <strong>Reviewer Remarks:</strong> {record.facultyDecision.remarks}
                          </div>
                        )}
                      </div>

                      {/* Right Block: Requested list & Status manipulation */}
                      <div className="flex flex-col justify-between md:w-64 shrink-0 gap-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6">
                        {/* Hardware list */}
                        <div>
                          <p className="font-bold text-xs uppercase text-slate-700 tracking-wide mb-1">Requested Hardware:</p>
                          <div className="space-y-1">
                            {record.cartItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs p-1 bg-slate-50">
                                <span className="text-slate-800 truncate pr-2">{item.component?.name}</span>
                                <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 text-[10px] font-bold">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dispatch Note Input */}
                        <div className="space-y-2 pt-2">
                          <input
                            type="text"
                            placeholder="Add admin remarks/storage loc..."
                            value={adminNotes[record._id] || ''}
                            onChange={(e) => setAdminNotes({ ...adminNotes, [record._id]: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 text-xs focus:outline-none"
                          />

                          {/* Action Buttons depending on current state */}
                          <div className="flex gap-2">
                            {record.status === 'pending_admin' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(record._id, 'rejected')}
                                  className="flex-1 bg-white border border-red-600 hover:bg-red-50 text-red-600 text-xs font-bold py-2 uppercase"
                                >
                                  REJECT
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(record._id, 'handed_out')}
                                  className="flex-1 bg-tcet-navy hover:bg-slate-800 text-white text-xs font-bold py-2 uppercase"
                                >
                                  HAND OUT
                                </button>
                              </>
                            )}

                            {record.status === 'handed_out' && (
                              <button
                                onClick={() => handleUpdateStatus(record._id, 'returned')}
                                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 uppercase border border-green-700"
                              >
                                MARK RETURNED
                              </button>
                            )}

                            {record.status === 'returned' && (
                              <div className="w-full text-center text-xs text-green-700 font-bold bg-green-50 p-2 border border-green-200">
                                Returned on {new Date(record.returnedAt).toLocaleDateString()}
                              </div>
                            )}

                            {record.status === 'rejected' && (
                              <div className="w-full text-center text-xs text-red-700 font-bold bg-red-50 p-2 border border-red-200">
                                Request Closed
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      )}

      {activeTab === 'inventory' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Columns (2/3): Catalog list */}
          <div className="lg:col-span-2 bg-white border-2 border-slate-300 p-6 shadow-sm">
            <h3 className="font-extrabold text-sm uppercase text-tcet-navy border-b border-slate-200 pb-3 mb-6 tracking-wider">
              R&D Cell Catalogued Items
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-200 text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold uppercase text-slate-700">
                    <th className="p-3">Hardware Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">Total</th>
                    <th className="p-3 text-center">Available</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {components.map((comp) => (
                    <tr key={comp._id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-tcet-navy">{comp.name}</td>
                      <td className="p-3">{comp.category}</td>
                      <td className="p-3 text-center font-mono">{comp.quantityTotal}</td>
                      <td className="p-3 text-center font-mono font-bold text-green-700">{comp.quantityAvailable}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(comp)}
                            className="bg-white border border-tcet-navy text-tcet-navy hover:bg-slate-50 p-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(comp._id)}
                            className="bg-white border border-red-600 text-red-600 hover:bg-red-50 p-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Catalog form (Add/Edit) */}
          <div className="lg:col-span-1 bg-white border-2 border-slate-300 p-6 shadow-sm h-fit">
            <h3 className="font-extrabold text-sm uppercase text-tcet-navy border-b border-slate-200 pb-2 mb-4 tracking-wider">
              {isEditing ? 'Edit Hardware Item' : 'Add New Hardware Item'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Component Name</label>
                <input
                  type="text"
                  placeholder="e.g. Raspberry Pi 4 Model B"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-2 py-2 border border-slate-300 focus:outline-none"
                  >
                    {categories.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Total Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantityTotal}
                    onChange={(e) => setFormData({ ...formData, quantityTotal: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="Paste direct Unsplash/JPG link..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Keywords (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. raspberry pi, edge ai, computer, linux"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Item Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe technical specs, usage context..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none"
                />
              </div>

              {/* Technical Specifications Custom Map */}
              <div className="border border-slate-200 p-3 bg-slate-50">
                <span className="font-bold text-slate-700 uppercase block mb-2">Technical Specifications</span>
                
                {/* Current Specifications list */}
                {Object.keys(formData.specs).length > 0 && (
                  <div className="space-y-1 mb-3">
                    {Object.entries(formData.specs).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center bg-white p-1.5 border border-slate-200">
                        <span className="font-semibold text-[10px] text-slate-600">{key}: {val}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpec(key)}
                          className="text-red-600 font-bold"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Specs input fields */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Key (e.g. RAM)"
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-slate-300 text-[10px]"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 4GB)"
                    value={specVal}
                    onChange={(e) => setSpecVal(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-slate-300 text-[10px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="bg-tcet-navy hover:bg-slate-800 text-white font-bold text-[10px] px-3 border border-tcet-navy"
                  >
                    ADD
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: '', category: 'Microcontroller', quantityTotal: 5, imageUrl: '', description: '', keywords: '', specs: {}
                      });
                    }}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2.5 font-bold uppercase"
                  >
                    CANCEL
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 bg-tcet-navy hover:bg-slate-800 text-white font-bold py-2.5 uppercase border border-tcet-navy"
                >
                  {isEditing ? 'UPDATE ITEM' : 'CATALOGUE ITEM'}
                </button>
              </div>
            </form>
          </div>
        </main>
      )}

      {activeTab === 'faculty' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
          <div className="bg-white border-2 border-slate-300 p-6 shadow-sm">
            
            {/* Top Bar: Title & Live Count Badge */}
            <div className="border-b border-slate-200 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm uppercase text-tcet-navy tracking-wider flex items-center gap-2">
                  <Users className="w-5 h-5 text-tcet-gold" />
                  <span>TCET Faculty Directory & Academic Roster (Admin Exclusive)</span>
                </h3>
                <p className="text-xs text-tcet-mutedText mt-1">
                  Full overview of all registered faculties and departments. Restricted to Administrators.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-tcet-navy text-white px-4 py-2 text-xs font-mono font-bold border border-tcet-gold flex items-center gap-2 shadow-sm">
                  <span>Total Enrolled Faculties:</span>
                  <span className="text-tcet-gold text-sm font-black">{facultyCount}</span>
                </div>
                <button
                  onClick={fetchFaculty}
                  className="bg-white hover:bg-slate-50 text-tcet-navy border border-slate-300 p-2 text-xs font-bold transition-all shadow-sm"
                  title="Refresh Roster"
                >
                  <RefreshCw className={`w-4 h-4 ${facultyLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Faculty Search Filter */}
            <div className="relative mb-6">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search faculty by name, department, designation, specialization or email..."
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs"
              />
            </div>

            {/* Table or Loading / Empty states */}
            {facultyLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-tcet-navy" role="status"></div>
                <p className="text-xs text-tcet-mutedText mt-2">Loading faculty roster directory from server...</p>
              </div>
            ) : faculties.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-300">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-semibold text-xs">No faculty records found in database</p>
                <p className="text-[10px] text-slate-400 mt-1">Run the faculty import or seeder script to populate faculties.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-tcet-navy text-white uppercase text-[10px] tracking-wider">
                      <th className="p-3 border border-slate-200 font-black">#</th>
                      <th className="p-3 border border-slate-200 font-black">Faculty Name</th>
                      <th className="p-3 border border-slate-200 font-black">Rank / Designation</th>
                      <th className="p-3 border border-slate-200 font-black">Department</th>
                      <th className="p-3 border border-slate-200 font-black">Specialization</th>
                      <th className="p-3 border border-slate-200 font-black">Email Address</th>
                      <th className="p-3 border border-slate-200 font-black">Contact No</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {faculties
                      .filter(fac => {
                        const term = facultySearch.toLowerCase();
                        return (
                          (fac.name && fac.name.toLowerCase().includes(term)) ||
                          (fac.department && fac.department.toLowerCase().includes(term)) ||
                          (fac.designation && fac.designation.toLowerCase().includes(term)) ||
                          (fac.specialization && fac.specialization.toLowerCase().includes(term)) ||
                          (fac.email && fac.email.toLowerCase().includes(term))
                        );
                      })
                      .map((fac, idx) => (
                        <tr key={fac._id || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-slate-400 border border-slate-200">{idx + 1}</td>
                          <td className="p-3 font-extrabold text-slate-800 border border-slate-200">{fac.name}</td>
                          <td className="p-3 text-slate-700 font-semibold border border-slate-200">{fac.designation || 'Faculty'}</td>
                          <td className="p-3 text-slate-700 border border-slate-200 font-medium">{fac.department}</td>
                          <td className="p-3 text-slate-600 border border-slate-200">
                            {fac.specialization ? (
                              <span className="font-semibold text-tcet-navy bg-slate-100 px-2 py-0.5 border border-slate-200 rounded-sm">
                                {fac.specialization}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic">- Not Specified -</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-700 border border-slate-200 font-mono">
                            {fac.email || <span className="text-slate-300 italic">-</span>}
                          </td>
                          <td className="p-3 text-slate-700 border border-slate-200 font-mono">
                            {fac.contactNumber || <span className="text-slate-300 italic">-</span>}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      )}

      {activeTab === 'utilities' && (
        <main className="max-w-4xl mx-auto px-4 py-8 flex-grow w-full">
          <div className="bg-white border-2 border-slate-300 p-8 shadow-sm space-y-8">
            <h3 className="font-extrabold text-sm uppercase text-tcet-navy border-b border-slate-200 pb-3 mb-6 tracking-wider">
              Data Exporters & Administrative Utility Suite
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Credentials sheet exporter */}
              <div className="border border-slate-200 p-6 bg-slate-50 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-base text-tcet-navy mb-2 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-5 h-5 text-tcet-gold" />
                    <span>Credentials Distribution Sheet</span>
                  </h4>
                  <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                    Export the complete spreadsheet containing students generated User IDs and randomized initial passwords. distribute this sheet physically or via secure channels.
                  </p>
                </div>
                <a
                  href={adminService.getExportCredentialsUrl()}
                  download="tcet_student_credentials.csv"
                  className="w-full text-center bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs py-3 border border-tcet-navy uppercase transition-all tracking-wider inline-block"
                >
                  DOWNLOAD CREDENTIALS CSV
                </a>
              </div>

              {/* Inventory logs exporter */}
              <div className="border border-slate-200 p-6 bg-slate-50 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-base text-tcet-navy mb-2 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-5 h-5 text-tcet-gold" />
                    <span>Inventory Asset Log</span>
                  </h4>
                  <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                    Export logs of laboratory components, current stock configurations, categories, and keywords details in a standard Excel-compatible CSV layout.
                  </p>
                </div>
                <a
                  href={adminService.getExportInventoryUrl()}
                  download="tcet_inventory_log.csv"
                  className="w-full text-center bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs py-3 border border-tcet-navy uppercase transition-all tracking-wider inline-block"
                >
                  DOWNLOAD INVENTORY CSV
                </a>
              </div>

            </div>

            {/* Overdue Cron Alert Trigger Card */}
            <div className="border-t border-slate-200 pt-8 mt-4">
              <div className="bg-red-50 border-2 border-red-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="space-y-1.5 max-w-xl text-center md:text-left">
                  <h4 className="font-extrabold text-sm text-red-950 uppercase flex items-center gap-1.5 justify-center md:justify-start">
                    <ShieldAlert className="w-5 h-5 text-red-700 animate-pulse" />
                    <span>Automated Email Alert Scanner</span>
                  </h4>
                  <p className="text-xs text-red-800 leading-relaxed">
                    The background task naturally scans overdue loans once a day at midnight. Trigger it manually here to compile warning logs and dispatch alerts immediately via Nodemailer transporter.
                  </p>
                </div>

                <button
                  onClick={handleTriggerManualCron}
                  className="w-full md:w-auto shrink-0 bg-red-800 hover:bg-red-700 text-white border border-red-950 font-bold text-xs px-6 py-3 uppercase transition-all"
                >
                  RUN OVERDUE SCAN NOW
                </button>
              </div>
            </div>

          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="bg-tcet-navy text-slate-400 py-6 text-center text-xs mt-auto border-t-2 border-tcet-gold">
        <p>© {new Date().getFullYear()} TCET R&D Cell • Admin Board</p>
      </footer>
    </div>
  );
};

export default AdminPanel;
