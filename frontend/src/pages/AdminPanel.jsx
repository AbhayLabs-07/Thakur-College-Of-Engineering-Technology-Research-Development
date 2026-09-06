import React, { useState } from 'react';
import { AdminProvider, useAdmin } from '../context/AdminContext';
import AdminHeader from '../components/admin/AdminHeader';
import AdminSidebar from '../components/admin/AdminSidebar';
import GlobalSearchModal from '../components/admin/GlobalSearchModal';

// Modals and Drawers
import AddComponentModal from '../components/admin/AddComponentModal';
import AddFacultyModal from '../components/admin/AddFacultyModal';
import FacultyProfileDrawer from '../components/admin/FacultyProfileDrawer';
import RequestDetailDrawer from '../components/admin/RequestDetailDrawer';
import LoanManagementModal from '../components/admin/LoanManagementModal';

// Views
import DashboardView from './admin/DashboardView';
import ComponentsView from './admin/ComponentsView';
import FacultyNetworkView from './admin/FacultyNetworkView';
import RequestsView from './admin/RequestsView';
import ActiveLoansView from './admin/ActiveLoansView';
import ActivityLogView from './admin/ActivityLogView';
import UtilitiesView from './admin/UtilitiesView';
import SettingsView from './admin/SettingsView';

import { CheckCircle2, AlertCircle } from 'lucide-react';

const AdminPanelContent = () => {
  const { activeTab, sidebarExpanded, toast } = useAdmin();

  // Modal and Drawer States
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);

  const [isAddFacultyOpen, setIsAddFacultyOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const handleOpenAddComponent = () => {
    setEditingComponent(null);
    setIsAddComponentOpen(true);
  };

  const handleEditComponent = (comp) => {
    setEditingComponent(comp);
    setIsAddComponentOpen(true);
  };

  const handleOpenAddFaculty = () => {
    setIsAddFacultyOpen(true);
  };

  const handleSelectFaculty = (fac) => {
    setSelectedFaculty(fac);
  };

  const handleSelectRequest = (req) => {
    setSelectedRequest(req);
  };

  const handleManageLoan = (loan) => {
    setSelectedLoan(loan);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800">
      
      {/* 1. Top Fixed Header */}
      <AdminHeader />

      <div className="flex flex-grow relative">
        {/* 2. Retractable Fixed Left Sidebar */}
        <AdminSidebar />

        {/* 3. Fluid Main Content Container */}
        <main 
          className={`flex-grow min-w-0 transition-all duration-300 ease-in-out p-4 sm:p-6 lg:p-8 ${
            sidebarExpanded ? 'ml-64' : 'ml-16'
          }`}
        >
          {activeTab === 'dashboard' && (
            <DashboardView 
              onOpenAddComponent={handleOpenAddComponent}
              onOpenAddFaculty={handleOpenAddFaculty}
            />
          )}

          {activeTab === 'components' && (
            <ComponentsView 
              onOpenAddComponent={handleOpenAddComponent}
              onEditComponent={handleEditComponent}
            />
          )}

          {activeTab === 'faculty' && (
            <FacultyNetworkView 
              onOpenAddFaculty={handleOpenAddFaculty}
              onSelectFaculty={handleSelectFaculty}
            />
          )}

          {activeTab === 'requests' && (
            <RequestsView 
              onSelectRequest={handleSelectRequest}
            />
          )}

          {activeTab === 'loans' && (
            <ActiveLoansView 
              onManageLoan={handleManageLoan}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityLogView />
          )}

          {activeTab === 'utilities' && (
            <UtilitiesView />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}

          {/* Institutional Footer */}
          <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} Thakur College of Engineering & Technology • R&D Cell</span>
            <span className="text-[11px] text-slate-400">Institutional Inventory Administration System • v2.4</span>
          </footer>
        </main>
      </div>

      {/* 4. Global Modals & Drawers */}
      <GlobalSearchModal />

      <AddComponentModal 
        isOpen={isAddComponentOpen}
        onClose={() => setIsAddComponentOpen(false)}
        editingComponent={editingComponent}
      />

      <AddFacultyModal 
        isOpen={isAddFacultyOpen}
        onClose={() => setIsAddFacultyOpen(false)}
      />

      <FacultyProfileDrawer 
        isOpen={!!selectedFaculty}
        onClose={() => setSelectedFaculty(null)}
        faculty={selectedFaculty}
      />

      <RequestDetailDrawer 
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
      />

      <LoanManagementModal 
        isOpen={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        loan={selectedLoan}
      />

      {/* 5. Floating Toast Notification */}
      {toast.text && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 shadow-2xl border-l-4 text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-150 ${
          toast.type === 'error'
            ? 'bg-red-50 border-red-600 text-red-900 shadow-red-900/10'
            : toast.type === 'info'
            ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-blue-900/10'
            : 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-emerald-900/10'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

    </div>
  );
};

const AdminPanel = () => {
  return (
    <AdminProvider>
      <AdminPanelContent />
    </AdminProvider>
  );
};

export default AdminPanel;
