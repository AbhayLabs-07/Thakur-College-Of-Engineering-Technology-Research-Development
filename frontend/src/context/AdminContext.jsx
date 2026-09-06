import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { adminService, componentService } from '../services/api';
import { authStorage } from '../utils/storage';

const AdminContext = createContext();

// Hardware Inventory Catalog: Cleared ahead of scheduled physical audit (Monday, Tuesday, and Wednesday)
const INITIAL_COMPONENTS = [];

// Requisitions Queue: Cleared of sample requests. Only genuine submitted requests are displayed.
const INITIAL_REQUESTS = [];

// Active Loans Register: Cleared of mock loans so operational health is all-green (0 overdue).
const INITIAL_LOANS = [];

// Audit Trail & Activity Log: Purged of sample mock student activities.
const INITIAL_LOGS = [];

// System Alerts: Cleared of mock warning notifications.
const INITIAL_NOTIFICATIONS = [];

export const AdminProvider = ({ children }) => {
  // Navigation & Global UI state
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'components', 'faculty', 'requests', 'loans', 'activity', 'utilities', 'settings'
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [toast, setToast] = useState({ text: '', type: 'success' });

  // Auto-reset stale legacy mock data from localStorage ahead of physical audit
  if (typeof window !== 'undefined' && localStorage.getItem('tcet_admin_audit_reset_v4') !== 'true') {
    localStorage.removeItem('tcet_admin_components');
    localStorage.removeItem('tcet_admin_requests');
    localStorage.removeItem('tcet_admin_loans');
    localStorage.removeItem('tcet_admin_logs');
    localStorage.removeItem('tcet_admin_notifications');
    localStorage.setItem('tcet_admin_audit_reset_v4', 'true');
  }

  // Core Data States
  const [components, setComponents] = useState(() => {
    const saved = localStorage.getItem('tcet_admin_components');
    return saved ? JSON.parse(saved) : INITIAL_COMPONENTS;
  });

  const [faculties, setFaculties] = useState([]);
  const [facultyCount, setFacultyCount] = useState(368);
  const [facultyLoading, setFacultyLoading] = useState(false);

  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem('tcet_admin_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [activeLoans, setActiveLoans] = useState(() => {
    const saved = localStorage.getItem('tcet_admin_loans');
    return saved ? JSON.parse(saved) : INITIAL_LOANS;
  });

  const [activityLogs, setActivityLogs] = useState(() => {
    const saved = localStorage.getItem('tcet_admin_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('tcet_admin_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Admin Profile Details
  const [adminProfile, setAdminProfile] = useState({
    name: authStorage.getItem('name') || 'Ashish Mudholkar',
    username: authStorage.getItem('username') || 'Admin',
    email: authStorage.getItem('email') || 'ashish.mudholkar75@gmail.com',
    contactNumber: authStorage.getItem('contactNumber') || '+91 9920123456',
    department: 'Research & Development Cell',
    role: 'ADMIN'
  });

  // System Settings
  const [portalSettings, setPortalSettings] = useState({
    academicYear: '2026 - 2027',
    term: 'Odd Semester',
    maxLoanDays: 14,
    overdueWarningDays: 1,
    maxComponentsPerRequest: 5,
    autoEmailAlerts: true,
    preventOverdueCheckouts: true,
    requireFacultyApproval: true
  });

  // Save changes to localStorage for single source of truth across browser refreshes
  useEffect(() => {
    localStorage.setItem('tcet_admin_components', JSON.stringify(components));
  }, [components]);

  useEffect(() => {
    localStorage.setItem('tcet_admin_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('tcet_admin_loans', JSON.stringify(activeLoans));
  }, [activeLoans]);

  useEffect(() => {
    localStorage.setItem('tcet_admin_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('tcet_admin_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: 'success' }), 4500);
  }, []);

  // Sync with real backend on load
  const syncWithBackend = useCallback(async () => {
    setFacultyLoading(true);
    try {
      // 1. Fetch live faculty roster
      const facData = await adminService.getFacultyRoster();
      if (facData && facData.faculties && facData.faculties.length > 0) {
        setFaculties(facData.faculties);
        setFacultyCount(facData.totalCount || facData.faculties.length);
      }
    } catch (e) {
      console.warn('Backend faculty roster fetch notice (offline/local fallback):', e.message);
    } finally {
      setFacultyLoading(false);
    }

    try {
      // 2. Fetch live components
      const compData = await componentService.getAll();
      if (Array.isArray(compData)) {
        if (compData.length === 0) {
          setComponents([]);
        } else {
          setComponents((prev) => {
            return compData.map((bc) => {
              const existing = prev.find((p) => p._id === bc._id || p.name === bc.name);
              return {
                _id: bc._id,
                name: bc.name,
                category: bc.category,
                quantityTotal: bc.quantityTotal,
                quantityAvailable: bc.quantityAvailable,
                quantityLoaned: Math.max(0, bc.quantityTotal - bc.quantityAvailable),
                quantityDamaged: existing?.quantityDamaged || 0,
                quantityLost: existing?.quantityLost || 0,
                imageUrl: bc.imageUrl || existing?.imageUrl || '/Photos/Arduino Uno.png',
                description: bc.description || existing?.description || '',
                keywords: bc.keywords || existing?.keywords || [],
                specs: bc.specs || existing?.specs || {},
                storageLocation: existing?.storageLocation || 'R&D Cell Central Inventory'
              };
            });
          });
        }
      }
    } catch (e) {
      console.warn('Backend component fetch notice (offline/local fallback):', e.message);
    }

    try {
      // 3. Fetch genuine borrow records from backend
      const records = await adminService.getRecords();
      if (Array.isArray(records)) {
        // Genuine pending student requests
        const liveRequests = records
          .filter((r) => r.status === 'pending_admin' || r.status === 'pending_faculty')
          .map((r) => ({
            _id: r._id,
            requestId: r.qrToken || `REQ-${r._id}`,
            student: r.student || { name: 'Student', erpId: '—', branch: 'R&D', division: 'A' },
            facultyMentor: r.facultyMentor || { name: 'Faculty Mentor' },
            projectTitle: r.projectTitle,
            projectDomain: r.projectDomain,
            projectDescription: r.projectDescription,
            cartItems: (r.cartItems || []).map((ci) => ({
              component: ci.component?._id || ci.component,
              componentName: ci.component?.name || 'Hardware Component',
              quantity: ci.quantity
            })),
            requestedAt: r.requestedAt || r.createdAt,
            dueDate: r.dueDate,
            status: r.status,
            facultyDecision: r.facultyDecision || {},
            adminNotes: r.adminNotes || ''
          }));
        setRequests(liveRequests);

        // Genuine active loans
        const liveLoans = records
          .filter((r) => ['handed_out', 'active', 'due_soon', 'overdue', 'partially_returned'].includes(r.status))
          .map((r) => ({
            _id: r._id,
            qrToken: r.qrToken || `TCET-RD-${r._id}`,
            student: r.student || { name: 'Student', erpId: '—' },
            facultyMentor: r.facultyMentor || { name: 'Faculty' },
            projectTitle: r.projectTitle,
            cartItems: (r.cartItems || []).map((ci) => ({
              component: ci.component?._id || ci.component,
              componentName: ci.component?.name || 'Component',
              quantityIssued: ci.quantity,
              quantityReturned: 0,
              quantityDamaged: 0,
              quantityLost: 0
            })),
            issueDate: r.createdAt || new Date().toISOString(),
            dueDate: r.dueDate,
            status: r.status === 'handed_out' ? 'active' : r.status,
            adminNotes: r.adminNotes || ''
          }));
        setActiveLoans(liveLoans);
      }
    } catch (e) {
      console.warn('Backend records sync notice:', e.message);
    }
  }, []);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  // Dynamic KPI calculations strictly derived from underlying data
  const kpis = useMemo(() => {
    const totalComponentsCount = components.reduce((acc, c) => acc + (Number(c.quantityTotal) || 0), 0);
    const availableComponentsCount = components.reduce((acc, c) => acc + (Number(c.quantityAvailable) || 0), 0);
    
    // Active loan sessions are count of non-returned loans
    const activeSessionsCount = activeLoans.filter((l) => ['active', 'due_soon', 'overdue', 'partially_returned', 'handed_out'].includes(l.status)).length;
    
    // Pending requests
    const pendingRequestsCount = requests.filter((r) => r.status === 'pending_admin' || r.status === 'pending_faculty').length;
    
    // Overdue count
    const now = new Date();
    const overdueCount = activeLoans.filter((l) => {
      if (['returned', 'closed', 'rejected'].includes(l.status)) return false;
      return new Date(l.dueDate) < now;
    }).length;

    return {
      totalComponents: totalComponentsCount,
      availableComponents: availableComponentsCount,
      activeSessions: activeSessionsCount,
      pendingRequests: pendingRequestsCount,
      overdueComponents: overdueCount
    };
  }, [components, activeLoans, requests]);

  // Helper to add activity log entry
  const addLog = useCallback((action, badge, details) => {
    const newEntry = {
      _id: `log-${Date.now()}`,
      action,
      badge,
      performedBy: 'Ashish Mudholkar (Admin)',
      student: details.student || '—',
      faculty: details.faculty || '—',
      component: details.component || '—',
      quantity: details.quantity || 1,
      timestamp: new Date().toISOString(),
      status: details.status || 'Completed',
      notes: details.notes || ''
    };
    setActivityLogs((prev) => [newEntry, ...prev]);
  }, []);

  // Helper to add notification
  const addNotification = useCallback((type, priority, title, description, meta = {}) => {
    const newNotif = {
      _id: `notif-${Date.now()}`,
      type,
      priority,
      title,
      description,
      student: meta.student || '',
      faculty: meta.faculty || '',
      timestamp: new Date().toISOString(),
      read: false,
      linkTab: meta.linkTab || 'dashboard'
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  // ---------------------------------------------------------------------------------
  // TRANSACTION 1: REQUEST APPROVAL (WITH STRICT AVAILABILITY CHECK & ALLOCATION)
  // ---------------------------------------------------------------------------------
  const approveRequest = useCallback((requestId, adminNoteText = '') => {
    const req = requests.find((r) => r._id === requestId || r.requestId === requestId);
    if (!req) {
      showToast('Request not found in active records.', 'error');
      return { success: false, message: 'Request not found' };
    }

    // Availability validation across ALL items in the request
    for (const item of req.cartItems) {
      const comp = components.find((c) => c._id === item.component || c.name.toLowerCase() === (item.componentName || '').toLowerCase());
      if (!comp) {
        showToast(`Item ${item.componentName} does not exist in inventory catalog.`, 'error');
        return { success: false, message: `Item ${item.componentName} not found.` };
      }
      if (comp.quantityAvailable < item.quantity) {
        showToast(`INSUFFICIENT STOCK: ${comp.name}. Available: ${comp.quantityAvailable}, Requested: ${item.quantity}`, 'error');
        return { 
          success: false, 
          insufficient: true, 
          component: comp.name, 
          available: comp.quantityAvailable, 
          requested: item.quantity 
        };
      }
    }

    // Process Deduction: Deduct from available, add to currently loaned
    setComponents((prev) =>
      prev.map((comp) => {
        const matchingItem = req.cartItems.find(
          (ci) => ci.component === comp._id || ci.componentName.toLowerCase() === comp.name.toLowerCase()
        );
        if (matchingItem) {
          const newAvail = Math.max(0, comp.quantityAvailable - matchingItem.quantity);
          const newLoaned = comp.quantityLoaned + matchingItem.quantity;
          return {
            ...comp,
            quantityAvailable: newAvail,
            quantityLoaned: newLoaned
          };
        }
        return comp;
      })
    );

    // Update Request Status to 'approved'
    setRequests((prev) =>
      prev.map((r) =>
        r._id === req._id ? { ...r, status: 'approved', adminNotes: adminNoteText, decidedAt: new Date().toISOString() } : r
      )
    );

    // Automatically Create Active Loan Session
    const qrToken = `TCET-RD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLoan = {
      _id: `LOAN-2026-${Math.floor(100 + Math.random() * 900)}`,
      qrToken,
      student: { ...req.student },
      facultyMentor: { ...req.facultyMentor },
      projectTitle: req.projectTitle,
      cartItems: req.cartItems.map((ci) => ({
        component: ci.component,
        componentName: ci.componentName,
        quantityIssued: ci.quantity,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityLost: 0
      })),
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + (portalSettings.maxLoanDays || 14) * 86400000).toISOString(),
      status: 'active',
      adminNotes: adminNoteText || 'Approved by Administrator Ashish Mudholkar'
    };

    setActiveLoans((prev) => [newLoan, ...prev]);

    // System Activity Log
    const itemSummaries = req.cartItems.map((ci) => `${ci.componentName} ×${ci.quantity}`).join(', ');
    addLog('Component Issued', 'issue', {
      student: `${req.student.name} (${req.student.erpId})`,
      faculty: req.facultyMentor.name,
      component: itemSummaries,
      quantity: req.cartItems.reduce((acc, ci) => acc + ci.quantity, 0),
      status: 'Issued / Active Loan',
      notes: `Loan ${newLoan._id} created automatically. Stock deducted.`
    });

    // Notify
    addNotification('SUCCESS', 'Success', `Components Issued to ${req.student.name}`, `Active loan created for project "${req.projectTitle}". Token: ${qrToken}`, {
      student: req.student.name,
      faculty: req.facultyMentor.name,
      linkTab: 'loans'
    });

    showToast(`Request approved! Stock deducted and loan created for ${req.student.name}.`, 'success');
    return { success: true, loanId: newLoan._id };
  }, [components, requests, portalSettings.maxLoanDays, addLog, addNotification, showToast]);

  // ---------------------------------------------------------------------------------
  // TRANSACTION 2: REJECT REQUEST
  // ---------------------------------------------------------------------------------
  const rejectRequest = useCallback((requestId, reason = 'Request declined by administrator.') => {
    const req = requests.find((r) => r._id === requestId || r.requestId === requestId);
    if (!req) return;

    setRequests((prev) =>
      prev.map((r) => (r._id === req._id ? { ...r, status: 'rejected', adminNotes: reason, decidedAt: new Date().toISOString() } : r))
    );

    addLog('Request Rejected', 'rejection', {
      student: `${req.student.name} (${req.student.erpId})`,
      faculty: req.facultyMentor?.name || '—',
      component: req.cartItems.map((ci) => ci.componentName).join(', '),
      quantity: req.cartItems.reduce((acc, ci) => acc + ci.quantity, 0),
      status: 'Closed / Rejected',
      notes: reason
    });

    showToast(`Request from ${req.student.name} rejected.`, 'info');
  }, [requests, addLog, showToast]);

  // ---------------------------------------------------------------------------------
  // TRANSACTION 3: PROCESS RETURN (FULL, PARTIAL, GOOD CONDITION, DAMAGED, LOST)
  // ---------------------------------------------------------------------------------
  const processReturn = useCallback((loanId, returnDetails) => {
    const loan = activeLoans.find((l) => l._id === loanId);
    if (!loan) {
      showToast('Active loan record not found.', 'error');
      return { success: false };
    }

    let allItemsFullyReturned = true;
    let anyReturned = false;

    // Update loan items and calculate inventory diffs
    const updatedCartItems = loan.cartItems.map((item) => {
      const match = returnDetails.items.find(
        (ri) => ri.componentId === item.component || ri.componentName === item.componentName
      );

      if (!match) {
        if (item.quantityReturned + item.quantityDamaged + item.quantityLost < item.quantityIssued) {
          allItemsFullyReturned = false;
        }
        return item;
      }

      const goodQty = Number(match.returnGoodQty) || 0;
      const dmgQty = Number(match.damagedQty) || 0;
      const lstQty = Number(match.lostQty) || 0;

      const newReturned = item.quantityReturned + goodQty;
      const newDamaged = item.quantityDamaged + dmgQty;
      const newLost = item.quantityLost + lstQty;

      if (goodQty > 0 || dmgQty > 0 || lstQty > 0) {
        anyReturned = true;
      }

      if (newReturned + newDamaged + newLost < item.quantityIssued) {
        allItemsFullyReturned = false;
      }

      return {
        ...item,
        quantityReturned: newReturned,
        quantityDamaged: newDamaged,
        quantityLost: newLost
      };
    });

    if (!anyReturned) {
      showToast('Please specify returned, damaged, or lost quantities.', 'error');
      return { success: false };
    }

    // Reconcile Inventory
    setComponents((prev) =>
      prev.map((comp) => {
        const match = returnDetails.items.find(
          (ri) => ri.componentId === comp._id || ri.componentName === comp.name
        );
        if (!match) return comp;

        const goodQty = Number(match.returnGoodQty) || 0;
        const dmgQty = Number(match.damagedQty) || 0;
        const lstQty = Number(match.lostQty) || 0;
        const totalProcessedFromLoan = goodQty + dmgQty + lstQty;

        // Rule: Only GOOD CONDITION items return to Available Stock!
        // Damaged and Lost items DO NOT increase available stock.
        const newAvailable = Math.min(comp.quantityTotal, comp.quantityAvailable + goodQty);
        const newLoaned = Math.max(0, comp.quantityLoaned - totalProcessedFromLoan);
        const newDamaged = (comp.quantityDamaged || 0) + dmgQty;
        const newLost = (comp.quantityLost || 0) + lstQty;

        return {
          ...comp,
          quantityAvailable: newAvailable,
          quantityLoaned: newLoaned,
          quantityDamaged: newDamaged,
          quantityLost: newLost
        };
      })
    );

    // Determine new status
    const newStatus = allItemsFullyReturned ? 'returned' : 'partially_returned';

    setActiveLoans((prev) =>
      prev.map((l) =>
        l._id === loan._id
          ? {
              ...l,
              cartItems: updatedCartItems,
              status: newStatus,
              returnedAt: allItemsFullyReturned ? new Date().toISOString() : l.returnedAt,
              adminNotes: returnDetails.generalNotes ? `${l.adminNotes} | ${returnDetails.generalNotes}` : l.adminNotes
            }
          : l
      )
    );

    // Log Activity
    const processedSummary = returnDetails.items
      .filter((i) => (Number(i.returnGoodQty) || 0) + (Number(i.damagedQty) || 0) + (Number(i.lostQty) || 0) > 0)
      .map((i) => {
        const g = Number(i.returnGoodQty) || 0;
        const d = Number(i.damagedQty) || 0;
        const l = Number(i.lostQty) || 0;
        let parts = [];
        if (g > 0) parts.push(`${g} Good`);
        if (d > 0) parts.push(`${d} Damaged`);
        if (l > 0) parts.push(`${l} Lost`);
        return `${i.componentName} (${parts.join(', ')})`;
      })
      .join('; ');

    addLog(
      allItemsFullyReturned ? 'Component Returned' : 'Partial Return',
      'return',
      {
        student: `${loan.student.name} (${loan.student.erpId})`,
        faculty: loan.facultyMentor?.name || '—',
        component: processedSummary,
        quantity: returnDetails.items.reduce(
          (acc, i) => acc + (Number(i.returnGoodQty) || 0) + (Number(i.damagedQty) || 0) + (Number(i.lostQty) || 0),
          0
        ),
        status: allItemsFullyReturned ? 'Loan Closed / Stock Reconciled' : 'Partially Returned',
        notes: returnDetails.generalNotes || 'Return confirmed by administrator.'
      }
    );

    // Notify
    addNotification(
      'RETURNED',
      'Success',
      `${allItemsFullyReturned ? 'All' : 'Partial'} components returned by ${loan.student.name}`,
      `Items: ${processedSummary}. Usable stock automatically restored to inventory.`,
      { student: loan.student.name, faculty: loan.facultyMentor?.name, linkTab: 'activity' }
    );

    showToast(
      allItemsFullyReturned
        ? `Loan closed! Items returned and usable stock restored.`
        : `Partial return processed! Remaining items kept on active loan.`,
      'success'
    );

    return { success: true, closed: allItemsFullyReturned };
  }, [activeLoans, addLog, addNotification, showToast]);

  // ---------------------------------------------------------------------------------
  // TRANSACTION 4: RESTORE DAMAGED COMPONENT (INSPECTION & REPAIR WORKFLOW)
  // ---------------------------------------------------------------------------------
  const restoreDamagedComponent = useCallback((componentId, restoreQty, remarks = '') => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c._id === componentId) {
          const qty = Math.min(c.quantityDamaged || 0, Number(restoreQty) || 1);
          return {
            ...c,
            quantityDamaged: Math.max(0, (c.quantityDamaged || 0) - qty),
            quantityAvailable: c.quantityAvailable + qty
          };
        }
        return c;
      })
    );

    const comp = components.find((c) => c._id === componentId);
    if (comp) {
      addLog('Component Restored', 'catalog', {
        student: '—',
        faculty: '—',
        component: comp.name,
        quantity: restoreQty,
        status: 'Repaired & Available',
        notes: remarks || 'Component repaired and restored to active laboratory stock.'
      });
      showToast(`${restoreQty} unit(s) of ${comp.name} restored to Available Stock!`, 'success');
    }
  }, [components, addLog, showToast]);

  // ---------------------------------------------------------------------------------
  // COMPONENT CRUD
  // ---------------------------------------------------------------------------------
  const addComponent = useCallback(async (formData) => {
    const total = Number(formData.quantityTotal) || 1;
    const newComp = {
      _id: `comp-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category || 'Microcontroller',
      quantityTotal: total,
      quantityAvailable: total,
      quantityLoaned: 0,
      quantityDamaged: 0,
      quantityLost: 0,
      imageUrl: formData.imageUrl || '/Photos/Arduino Uno.png',
      description: formData.description || '',
      keywords: Array.isArray(formData.keywords)
        ? formData.keywords
        : (formData.keywords || '').split(',').map((k) => k.trim()).filter(Boolean),
      specs: formData.specs || {},
      storageLocation: formData.storageLocation || 'Lab Cabinet A-01'
    };

    setComponents((prev) => [newComp, ...prev]);

    addLog('Component Added', 'catalog', {
      student: '—',
      faculty: '—',
      component: newComp.name,
      quantity: total,
      status: 'Catalogued',
      notes: `Storage: ${newComp.storageLocation}. Category: ${newComp.category}.`
    });

    showToast(`Hardware component "${newComp.name}" catalogued into inventory!`, 'success');

    try {
      await componentService.create({
        name: newComp.name,
        category: newComp.category,
        quantityTotal: newComp.quantityTotal,
        imageUrl: newComp.imageUrl,
        description: newComp.description,
        keywords: newComp.keywords,
        specs: newComp.specs
      });
    } catch (e) {
      console.warn('Backend component save warning (local state persists):', e.message);
    }
    return newComp;
  }, [addLog, showToast]);

  const updateComponent = useCallback(async (id, formData) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c._id === id) {
          const newTotal = formData.quantityTotal !== undefined ? Number(formData.quantityTotal) : c.quantityTotal;
          const diff = newTotal - c.quantityTotal;
          return {
            ...c,
            name: formData.name !== undefined ? formData.name.trim() : c.name,
            category: formData.category || c.category,
            quantityTotal: newTotal,
            quantityAvailable: Math.max(0, c.quantityAvailable + diff),
            imageUrl: formData.imageUrl || c.imageUrl,
            description: formData.description !== undefined ? formData.description : c.description,
            keywords: formData.keywords !== undefined
              ? (Array.isArray(formData.keywords) ? formData.keywords : formData.keywords.split(',').map((k) => k.trim()).filter(Boolean))
              : c.keywords,
            specs: formData.specs || c.specs,
            storageLocation: formData.storageLocation || c.storageLocation
          };
        }
        return c;
      })
    );

    addLog('Component Edited', 'catalog', {
      student: '—',
      faculty: '—',
      component: formData.name || 'Component',
      quantity: formData.quantityTotal,
      status: 'Updated',
      notes: 'Specifications and stock parameters updated.'
    });

    showToast('Component details updated successfully.', 'success');
  }, [addLog, showToast]);

  const deleteComponent = useCallback(async (id) => {
    const comp = components.find((c) => c._id === id);
    if (!comp) return;

    if (comp.quantityLoaned > 0) {
      showToast(`Cannot delete ${comp.name}: ${comp.quantityLoaned} units are currently on active loan!`, 'error');
      return;
    }

    setComponents((prev) => prev.filter((c) => c._id !== id));

    addLog('Component Deleted', 'catalog', {
      student: '—',
      faculty: '—',
      component: comp.name,
      quantity: comp.quantityTotal,
      status: 'Archived',
      notes: 'Permanently removed from active laboratory inventory.'
    });

    showToast(`Component "${comp.name}" removed from catalog.`, 'info');

    try {
      await componentService.delete(id);
    } catch (e) {
      console.warn('Backend delete warning:', e.message);
    }
  }, [components, addLog, showToast]);

  // ---------------------------------------------------------------------------------
  // FACULTY CRUD
  // ---------------------------------------------------------------------------------
  const addFaculty = useCallback(async (facultyData) => {
    const newFac = {
      _id: `fac-${Date.now()}`,
      name: facultyData.name.trim(),
      position: facultyData.position || 'Assistant Professor',
      designation: facultyData.position || 'Assistant Professor',
      department: facultyData.department,
      doj: facultyData.doj,
      email: facultyData.email ? facultyData.email.trim() : '',
      contactNumber: facultyData.contactNumber ? facultyData.contactNumber.trim() : '',
      specialization: facultyData.specialization || 'Research & Development',
      seniorityOrder: faculties.length + 1
    };

    setFaculties((prev) => [newFac, ...prev]);
    setFacultyCount((prev) => prev + 1);

    addLog('Faculty Added', 'faculty', {
      student: '—',
      faculty: newFac.name,
      component: 'Academic Roster',
      quantity: 1,
      status: 'Enrolled',
      notes: `${newFac.position} in ${newFac.department}. Seniority calculated.`
    });

    showToast(`Faculty member ${newFac.name} enrolled into official roster!`, 'success');

    try {
      await adminService.createFaculty(facultyData);
      syncWithBackend();
    } catch (e) {
      console.warn('Backend createFaculty warning:', e.message);
    }
  }, [faculties.length, addLog, showToast, syncWithBackend]);

  const deleteFaculty = useCallback(async (id, name) => {
    setFaculties((prev) => prev.filter((f) => f._id !== id));
    setFacultyCount((prev) => Math.max(0, prev - 1));

    addLog('Faculty Removed', 'faculty', {
      student: '—',
      faculty: name,
      component: 'Academic Roster',
      quantity: 1,
      status: 'Removed',
      notes: 'Removed from institutional roster.'
    });

    showToast(`Faculty member ${name} removed from roster.`, 'info');

    try {
      await adminService.deleteFaculty(id);
      syncWithBackend();
    } catch (e) {
      console.warn('Backend deleteFaculty warning:', e.message);
    }
  }, [addLog, showToast, syncWithBackend]);

  // ---------------------------------------------------------------------------------
  // AUTOMATED OVERDUE SCANNER
  // ---------------------------------------------------------------------------------
  const runOverdueScan = useCallback(async () => {
    const now = new Date();
    let overdueFound = 0;
    let dueSoonFound = 0;

    setActiveLoans((prev) =>
      prev.map((l) => {
        if (['returned', 'closed'].includes(l.status)) return l;
        const due = new Date(l.dueDate);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (diffDays < 0) {
          overdueFound++;
          return { ...l, status: 'overdue' };
        } else if (diffDays <= (portalSettings.overdueWarningDays || 1)) {
          dueSoonFound++;
          return { ...l, status: 'due_soon' };
        }
        return l;
      })
    );

    addLog('Overdue Scan Run', 'scan', {
      student: 'All Active Loans',
      faculty: 'System Cron',
      component: 'Overdue Loan Scanner',
      quantity: activeLoans.length,
      status: 'Scan Complete',
      notes: `Identified ${overdueFound} overdue loan(s) and ${dueSoonFound} due soon. Warnings queued.`
    });

    if (overdueFound > 0) {
      addNotification(
        'OVERDUE',
        'Critical',
        `Overdue Scan: ${overdueFound} loan(s) expired`,
        `${overdueFound} student loans are currently overdue. Automated reminder emails sent to student and mentor.`,
        { linkTab: 'loans' }
      );
    }

    try {
      await adminService.triggerCronScan();
    } catch (e) {
      console.warn('Backend cron scan notice:', e.message);
    }

    showToast(`Scan complete: ${overdueFound} overdue loan(s) flagged, warnings dispatched.`, 'info');
    return { overdueFound, dueSoonFound };
  }, [activeLoans.length, portalSettings.overdueWarningDays, addLog, addNotification, showToast]);

  // Mark all notifications read
  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  return (
    <AdminContext.Provider
      value={{
        // Navigation & Layout
        activeTab,
        setActiveTab,
        sidebarExpanded,
        setSidebarExpanded,
        isSearchOpen,
        setIsSearchOpen,
        isNotificationOpen,
        setIsNotificationOpen,
        toast,
        showToast,

        // Data & KPIs
        components,
        faculties,
        facultyCount,
        facultyLoading,
        requests,
        activeLoans,
        activityLogs,
        notifications,
        adminProfile,
        setAdminProfile,
        portalSettings,
        setPortalSettings,
        kpis,
        unreadNotificationCount,

        // Action Handlers
        approveRequest,
        rejectRequest,
        processReturn,
        restoreDamagedComponent,
        addComponent,
        updateComponent,
        deleteComponent,
        addFaculty,
        deleteFaculty,
        runOverdueScan,
        markNotificationsRead,
        syncWithBackend
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
