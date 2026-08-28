import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Search, Filter, ShoppingCart, 
  HelpCircle, RefreshCw, Layers, History, Award, CheckCircle2, Copy, ArrowLeft
} from 'lucide-react';
import Header from '../components/Header';
import ComponentCard from '../components/ComponentCard';
import CartDrawer from '../components/CartDrawer';
import TokenModal from '../components/TokenModal';
import { componentService, studentService } from '../services/api';

const StudentDashboard = () => {
  // Page Tabs
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' or 'history'
  
  // Wizard Checkout Flow Step
  const [wizardStep, setWizardStep] = useState(1); // 1: project setup, 2: hardware selection
  
  // Project & Team Forms
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDomain, setProjectDomain] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [facultyMentorId, setFacultyMentorId] = useState('');
  const [mentors, setMentors] = useState([]);
  
  // Team members list
  const [teamMembers, setTeamMembers] = useState([]);
  const [newMember, setNewMember] = useState({
    name: '', branch: 'Information Technology', year: 'Third Year', division: 'A', role: 'Developer', contact: ''
  });

  // Components inventory & filters
  const [components, setComponents] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  // Recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  // Cart
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Request History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Token Modal
  const [activeTokenRecord, setActiveTokenRecord] = useState(null);
  const [isTokenOpen, setIsTokenOpen] = useState(false);

  // Notification message
  const [notifyMsg, setNotifyMsg] = useState({ type: '', text: '' });

  // Fetch initial data
  useEffect(() => {
    fetchComponents();
    fetchMentors();
    fetchHistory();
  }, []);

  // Show notification helpers
  const showNotify = (text, type = 'success') => {
    setNotifyMsg({ type, text });
    setTimeout(() => setNotifyMsg({ type: '', text: '' }), 5000);
  };

  const fetchComponents = async (searchVal = '', catVal = '') => {
    setLoading(true);
    try {
      const data = await componentService.getAll(searchVal, catVal);
      setComponents(data);
    } catch (err) {
      console.error(err);
      showNotify('Failed to fetch hardware components list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMentors = async () => {
    try {
      const data = await studentService.getMentors();
      setMentors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await studentService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Get recommendations on demand when project details are provided
  const handleGetRecommendations = async () => {
    if (!projectTitle || !projectDescription) {
      return;
    }
    setRecLoading(true);
    try {
      const data = await componentService.getRecommendations(projectTitle, projectDomain, projectDescription);
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRecLoading(false);
    }
  };

  const handleProceedToCatalog = async () => {
    if (!projectTitle || !projectDomain || !projectDescription || !facultyMentorId) {
      showNotify('Please complete the project title, domain, description, and select a faculty mentor to proceed.', 'error');
      return;
    }
    setWizardStep(2);
    // Fetch smart recommendations immediately based on the details
    handleGetRecommendations();
    showNotify('Project profile saved. Loading CoE hardware catalogue...');
  };

  // Filter Trigger
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    fetchComponents(e.target.value, category);
  };

  const handleCategoryFilter = (cat) => {
    setCategory(cat);
    fetchComponents(search, cat);
  };

  // Team Builders
  const handleAddMember = () => {
    if (!newMember.name || !newMember.contact) {
      showNotify('Please fill in the name and contact details for the team member.', 'error');
      return;
    }
    setTeamMembers([...teamMembers, newMember]);
    setNewMember({
      name: '', branch: 'Information Technology', year: 'Third Year', division: 'A', role: 'Developer', contact: ''
    });
    showNotify('Team member added to request template.');
  };

  const handleRemoveMember = (idx) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== idx));
  };

  // Cart Management
  const handleAddToCart = (component) => {
    const existing = cart.find(item => item.component._id === component._id);
    if (existing) {
      showNotify(`${component.name} is already in the cart. Adjust quantities in the cart panel.`, 'info');
      return;
    }
    
    setCart([...cart, { component, quantity: 1 }]);
    showNotify(`${component.name} added to cart.`);
  };

  const handleUpdateQuantity = (compId, quantity) => {
    const component = cart.find(item => item.component._id === compId)?.component;
    if (!component) return;

    if (quantity < 1) {
      handleRemoveFromCart(compId);
      return;
    }

    if (quantity > component.quantityAvailable) {
      showNotify(`Cannot request more than available stock (${component.quantityAvailable}).`, 'error');
      return;
    }

    setCart(cart.map(item => item.component._id === compId ? { ...item, quantity } : item));
  };

  const handleRemoveFromCart = (compId) => {
    setCart(cart.filter(item => item.component._id !== compId));
    showNotify('Item removed from cart.', 'info');
  };

  // Submission Checkout
  const handleCheckoutSubmit = async () => {
    if (!facultyMentorId) {
      showNotify('Please select a faculty mentor to review your request.', 'error');
      return;
    }
    if (!projectTitle || !projectDomain || !projectDescription) {
      showNotify('Please complete the project title, domain, and description.', 'error');
      return;
    }

    const payload = {
      teamMembers,
      facultyMentorId,
      projectTitle,
      projectDomain,
      projectDescription,
      cartItems: cart.map(item => ({
        component: item.component._id,
        quantity: item.quantity
      }))
    };

    try {
      const record = await studentService.checkout(payload);
      setCart([]);
      setIsCartOpen(false);
      
      // Trigger update of inventory levels and request history
      fetchComponents();
      fetchHistory();
      
      // Open verification token
      setActiveTokenRecord(record);
      setIsTokenOpen(true);
      showNotify('Checkout request submitted successfully! Token generated.');
      
      // Clear forms and reset wizard
      setProjectTitle('');
      setProjectDomain('');
      setProjectDescription('');
      setFacultyMentorId('');
      setTeamMembers([]);
      setWizardStep(1);
    } catch (err) {
      console.error(err);
      showNotify(err.response?.data?.message || 'Failed to submit checkout request.', 'error');
    }
  };

  // Open modal helper for past items
  const handleShowPastToken = (record) => {
    setActiveTokenRecord(record);
    setIsTokenOpen(true);
  };

  const categories = ['Microcontroller', 'Development Board', 'Sensor', 'Actuator', 'Power Supply', 'Communication Module', 'Display', 'Passive Components'];

  return (
    <div className="min-h-screen flex flex-col bg-tcet-lightBg">
      <Header />

      {/* Floating Notifications */}
      {notifyMsg.text && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 shadow-lg border-l-4 font-semibold text-xs flex items-center gap-2 ${
          notifyMsg.type === 'error' ? 'bg-red-50 border-red-600 text-red-800' :
          notifyMsg.type === 'info' ? 'bg-blue-50 border-blue-600 text-blue-800' :
          'bg-green-50 border-green-600 text-green-800'
        }`}>
          <CheckCircle2 className={`w-4 h-4 ${notifyMsg.type === 'error' ? 'text-red-600' : notifyMsg.type === 'info' ? 'text-blue-600' : 'text-green-600'}`} />
          <span>{notifyMsg.text}</span>
        </div>
      )}

      {/* Dashboard Sub Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setActiveTab('browse');
                setWizardStep(1); // Return to step 1 when clicking browse
              }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase border-b-2 tracking-wide transition-all ${
                activeTab === 'browse' 
                  ? 'border-tcet-navy text-tcet-navy' 
                  : 'border-transparent text-tcet-mutedText hover:text-tcet-navy'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Checkout Wizard</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase border-b-2 tracking-wide transition-all ${
                activeTab === 'history' 
                  ? 'border-tcet-navy text-tcet-navy' 
                  : 'border-transparent text-tcet-mutedText hover:text-tcet-navy'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Request History</span>
            </button>
          </div>

          {/* Cart Summary Header Widget */}
          {activeTab === 'browse' && wizardStep === 2 && cart.length > 0 && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-tcet-gold hover:bg-tcet-darkGold text-tcet-navy px-4 py-2 font-bold text-xs uppercase transition-all shadow-md"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>CART ({cart.reduce((a,c) => a + c.quantity, 0)})</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'browse' ? (
        wizardStep === 1 ? (
          /* ================= STEP 1: PROJECT & TEAM DETAILS ================= */
          <div className="max-w-3xl mx-auto px-4 py-10 flex-grow w-full space-y-8">
            <div className="bg-white border-2 border-slate-300 p-8 shadow-sm">
              <div className="border-b border-slate-200 pb-3 mb-6">
                <span className="text-tcet-gold text-[10px] font-black uppercase tracking-wider">Step 1 of 2</span>
                <h3 className="font-extrabold text-lg uppercase text-tcet-navy mt-1 tracking-wider">
                  Project Definition & Mentor Assignment
                </h3>
                <p className="text-xs text-tcet-mutedText mt-1">Specify your project details and select an assigned faculty mentor for validation review.</p>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-tcet-navy uppercase tracking-wider mb-1.5">Project Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Real-Time Drone Object Detection Gateway"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-tcet-navy uppercase tracking-wider mb-1.5">Project Domain</label>
                    <input
                      type="text"
                      placeholder="e.g. Embedded AI / Internet of Things"
                      value={projectDomain}
                      onChange={(e) => setProjectDomain(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-tcet-navy uppercase tracking-wider mb-1.5">Faculty Mentor Reviewer</label>
                    <select
                      value={facultyMentorId}
                      onChange={(e) => setFacultyMentorId(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs bg-white"
                    >
                      <option value="">-- Choose Assigned Reviewer --</option>
                      {mentors.map(mentor => (
                        <option key={mentor._id} value={mentor._id}>
                          {mentor.name} ({mentor.designation} - {mentor.department})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-tcet-navy uppercase tracking-wider mb-1.5">Project Abstract & Intended Hardware Usage</label>
                  <textarea
                    rows="4"
                    placeholder="Describe your project, why you need hardware components, and what technology nodes you intend to test..."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Team Builder Grid */}
            <div className="bg-white border-2 border-slate-300 p-8 shadow-sm">
              <div className="border-b border-slate-200 pb-3 mb-6">
                <h3 className="font-extrabold text-sm uppercase text-tcet-navy tracking-wider">
                  Project Teammates & Co-workers (Optional)
                </h3>
                <p className="text-xs text-tcet-mutedText mt-1">Add other students who will be working alongside you on this hardware checklist.</p>
              </div>

              {/* Members List */}
              {teamMembers.length > 0 && (
                <div className="mb-6 border border-slate-200 divide-y divide-slate-200">
                  {teamMembers.map((m, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-tcet-navy">{m.name} <span className="font-normal text-[10px] text-tcet-mutedText">({m.role})</span></p>
                        <p className="text-[10px] text-slate-500">{m.branch} • Div {m.division} • Contact: {m.contact}</p>
                      </div>
                      <button 
                        onClick={() => handleRemoveMember(idx)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Form to Add Member */}
              <div className="space-y-4 p-4 bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-black text-tcet-navy uppercase tracking-wider border-b border-slate-200 pb-1">Register Teammate</p>
                
                <div>
                  <input
                    type="text"
                    placeholder="Teammate Full Name"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 text-xs bg-white focus:outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <select
                      value={newMember.branch}
                      onChange={(e) => setNewMember({ ...newMember, branch: e.target.value })}
                      className="w-full px-2 py-2 border border-slate-300 text-xs bg-white focus:outline-none"
                    >
                      <option value="Information Technology">IT</option>
                      <option value="Computer Engineering">CMPN</option>
                      <option value="Electronics & Telecommunication">EXTC</option>
                      <option value="Artificial Intelligence & Data Science">AIDS</option>
                      <option value="Artificial Intelligence & Machine Learning">AIML</option>
                      <option value="Mechanical Engineering">MECH</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Division (e.g. A)"
                      value={newMember.division}
                      onChange={(e) => setNewMember({ ...newMember, division: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 text-xs bg-white focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Project Role (e.g. Hardware Lead)"
                      value={newMember.role}
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 text-xs bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Contact No"
                      value={newMember.contact}
                      onChange={(e) => setNewMember({ ...newMember, contact: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 text-xs bg-white focus:outline-none"
                    />
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="w-full bg-tcet-navy text-white font-bold text-[10px] py-2.5 flex items-center justify-center gap-1 hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD MEMBER</span>
                </button>
              </div>
            </div>

            {/* Advance to Catalog Button */}
            <div>
              <button
                type="button"
                onClick={handleProceedToCatalog}
                className="w-full bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs py-4 border-2 border-tcet-navy uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>PROCEED TO HARDWARE SELECTION</span>
                <span>→</span>
              </button>
            </div>
          </div>
        ) : (
          /* ================= STEP 2: HARDWARE SELECTION CATALOGUE ================= */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full space-y-6">
            
            {/* Active Project configuration bar */}
            <div className="bg-tcet-navy text-white p-5 border-l-4 border-tcet-gold flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
              <div className="text-xs">
                <span className="text-tcet-gold font-bold uppercase tracking-wider block mb-0.5">Project Scope Profile</span>
                <span className="font-extrabold text-sm">{projectTitle}</span>
                <span className="text-slate-400"> | Domain: </span><span className="font-medium text-slate-200">{projectDomain}</span>
                <span className="text-slate-400"> | Mentor: </span><span className="font-medium text-slate-200">
                  {mentors.find(m => m._id === facultyMentorId)?.name || 'N/A'}
                </span>
                {teamMembers.length > 0 && (
                  <span className="text-slate-400"> | Teammates: </span>
                )}
                {teamMembers.length > 0 && (
                  <span className="font-medium text-slate-200">
                    {teamMembers.map(m => m.name).join(', ')}
                  </span>
                )}
              </div>
              
              <button
                onClick={() => setWizardStep(1)}
                className="flex items-center gap-1 bg-white hover:bg-slate-50 text-tcet-navy text-xs font-bold px-4 py-2 border border-white transition-all shadow-sm flex-shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>EDIT PROJECT DEFINITION</span>
              </button>
            </div>

            {/* Selection panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Quick selection summary */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Cart Preview Card */}
                <div className="bg-white border-2 border-slate-300 p-6 shadow-sm">
                  <h3 className="font-extrabold text-sm uppercase text-tcet-navy border-b border-slate-200 pb-2 mb-4 tracking-wider flex justify-between items-center">
                    <span>Selection Bag</span>
                    <ShoppingCart className="w-4 h-4 text-tcet-gold" />
                  </h3>
                  
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-xs text-tcet-mutedText">
                      <p>No hardware selected yet.</p>
                      <p className="text-[10px] mt-1">Browse components in the catalogue grid on the right and add them to your selection.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="border border-slate-200 divide-y divide-slate-200">
                        {cart.map(item => (
                          <div key={item.component._id} className="p-3 bg-slate-50 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-slate-800">{item.component.name}</p>
                              <p className="text-[9px] text-slate-400 uppercase">{item.component.category}</p>
                            </div>
                            <span className="bg-tcet-navy text-white px-2 py-0.5 font-bold">Qty: {item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setIsCartOpen(true)}
                        className="w-full bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs py-3 border border-tcet-navy uppercase transition-all tracking-wider"
                      >
                        REVIEW SELECTION & CHECKOUT
                      </button>
                    </div>
                  )}
                </div>

                {/* Instructions Box */}
                <div className="bg-white border-2 border-slate-300 p-6 shadow-sm text-xs leading-relaxed text-slate-600">
                  <h4 className="font-bold text-tcet-navy uppercase mb-2">Instructions</h4>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li>Add components in desired quantities from the catalogue list.</li>
                    <li>Open the Cart panel to adjust or delete individual items.</li>
                    <li>Upon clicking Checkout, a **verification QR token** is generated. Save/print this token and bring it to the cell in-charge to retrieve items in person.</li>
                  </ul>
                </div>
              </div>

              {/* Right Columns (2/3 width): Recommendations and Catalog */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Glowing Recommendations Carousel */}
                {recommendations.length > 0 && (
                  <div className="bg-white border-2 border-tcet-gold p-6 shadow-sm relative">
                    <div className="absolute -top-3 left-4 bg-tcet-gold text-tcet-navy px-3 py-0.5 text-xs font-black uppercase border border-tcet-navy tracking-wider">
                      Matched Hardware Suggestions
                    </div>
                    
                    <p className="text-xs text-tcet-mutedText mb-4 mt-2">
                      dynamic hardware recommendations matching your project description:
                    </p>

                    <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-thin">
                      {recommendations.map(component => (
                        <div key={component._id} className="w-72 flex-shrink-0">
                          <ComponentCard
                            component={component}
                            onAddToCart={handleAddToCart}
                            isGlowing={true}
                            quantityInCart={cart.find(item => item.component._id === component._id)?.quantity || 0}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Catalog Grid */}
                <div className="bg-white border-2 border-slate-300 p-6 shadow-sm">
                  <h3 className="font-extrabold text-sm uppercase text-tcet-navy border-b border-slate-200 pb-3 mb-6 tracking-wider flex items-center justify-between">
                    <span>Catalogue Inventory</span>
                    <span className="text-xs font-mono font-normal text-tcet-mutedText">
                      {components.length} components available
                    </span>
                  </h3>

                  {/* Search and Filters */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-slate-400" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search components by name, specs or keywords..."
                        value={search}
                        onChange={handleSearchChange}
                        className="w-full pl-9 pr-4 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs"><Filter className="w-4 h-4" /></span>
                      <select
                        value={category}
                        onChange={(e) => handleCategoryFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-300 focus:border-tcet-navy focus:outline-none text-xs bg-white"
                      >
                        <option value="">All Categories</option>
                        {categories.map((cat, i) => (
                          <option key={i} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Grid */}
                  {loading ? (
                    <div className="text-center py-20">
                      <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-tcet-navy" role="status"></div>
                      <p className="text-xs text-tcet-mutedText mt-2">Connecting to laboratory server...</p>
                    </div>
                  ) : components.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-300">
                      <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 font-semibold text-xs">No matching components found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {components.map(comp => (
                        <ComponentCard
                          key={comp._id}
                          component={comp}
                          onAddToCart={handleAddToCart}
                          quantityInCart={cart.find(item => item.component._id === comp._id)?.quantity || 0}
                        />
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )
      ) : (
        /* ================= HISTORY LOGS TAB ================= */
        <div className="max-w-4xl mx-auto px-4 py-8 flex-grow w-full">
          <div className="bg-white border-2 border-slate-300 p-6 shadow-sm">
            <h3 className="font-extrabold text-sm uppercase text-tcet-navy border-b border-slate-200 pb-3 mb-6 tracking-wider">
              Student Request & Checkout History
            </h3>

            {historyLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-tcet-navy" role="status"></div>
                <p className="text-xs text-tcet-mutedText mt-2">Fetching history records...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-300">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-semibold text-xs">No borrowing logs found</p>
                <p className="text-[10px] text-slate-400 mt-1">Submit your first hardware request from the inventory catalogue.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {history.map((record) => (
                  <div key={record._id} className="border-2 border-slate-200 hover:border-slate-300 p-5 bg-slate-50 flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 font-bold uppercase">
                          {record.qrToken}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${
                          record.status === 'pending_faculty' ? 'bg-yellow-50 border-yellow-300 text-yellow-800' :
                          record.status === 'pending_admin' ? 'bg-blue-50 border-blue-300 text-blue-800' :
                          record.status === 'handed_out' ? 'bg-green-50 border-green-300 text-green-800' :
                          record.status === 'returned' ? 'bg-slate-100 border-slate-300 text-slate-800' :
                          'bg-red-50 border-red-300 text-red-800'
                        }`}>
                          {record.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <h4 className="font-extrabold text-base text-tcet-navy">{record.projectTitle}</h4>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                        <p><strong>Domain:</strong> {record.projectDomain}</p>
                        <p><strong>Mentor:</strong> {record.facultyMentor?.name}</p>
                        <p><strong>Requested on:</strong> {new Date(record.requestedAt).toLocaleDateString()}</p>
                        <p><strong>Return Due:</strong> <span className="font-semibold text-red-600">{new Date(record.dueDate).toLocaleDateString()}</span></p>
                      </div>

                      {/* Decison Remark */}
                      {record.facultyDecision && record.facultyDecision.remarks && (
                        <div className="bg-white p-2.5 border-l-2 border-slate-400 text-[10px] text-slate-600 mt-2">
                          <strong>Mentor Remarks:</strong> {record.facultyDecision.remarks}
                        </div>
                      )}

                      {/* Admin Notes */}
                      {record.adminNotes && (
                        <div className="bg-white p-2.5 border-l-2 border-tcet-navy text-[10px] text-slate-600 mt-1">
                          <strong>Admin Notes:</strong> {record.adminNotes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between items-end md:w-48 shrink-0 gap-3">
                      <div className="text-right text-xs">
                        <p className="font-bold text-slate-700 uppercase">Hardware requested:</p>
                        {record.cartItems.map((item, i) => (
                          <p key={i} className="text-[11px] text-slate-600">
                            {item.component?.name} (x{item.quantity})
                          </p>
                        ))}
                      </div>

                      {/* Action QR Modal show */}
                      {record.status !== 'rejected' && (
                        <button
                          onClick={() => handleShowPastToken(record)}
                          className="flex items-center gap-1 bg-white hover:bg-slate-100 text-tcet-navy border border-tcet-navy text-xs font-bold px-3 py-1.5 w-full justify-center transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>VIEW QR TOKEN</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={() => setCart([])}
        onProceedToCheckout={handleCheckoutSubmit}
      />

      {/* Token Modal overlay */}
      <TokenModal
        isOpen={isTokenOpen}
        onClose={() => setIsTokenOpen(false)}
        record={activeTokenRecord}
      />

      {/* Footer */}
      <footer className="bg-tcet-navy text-slate-400 py-6 px-4 text-center text-xs mt-12 border-t-2 border-tcet-gold">
        <p>© {new Date().getFullYear()} TCET R&D Cell • Student Incubation Portal</p>
      </footer>
    </div>
  );
};

export default StudentDashboard;
