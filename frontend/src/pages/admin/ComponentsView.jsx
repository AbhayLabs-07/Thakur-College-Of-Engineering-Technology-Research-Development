import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Cpu, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ArrowUpDown, 
  FileSpreadsheet,
  Package,
  Wrench
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { adminService } from '../../services/api';

const CATEGORIES = [
  'All Categories',
  'Microcontroller',
  'Development Board',
  'Sensors',
  'Communication Modules',
  'Motors',
  'Motor Drivers',
  'Power Modules',
  'Displays',
  'Robotics Components',
  'Electronic Components',
  'Other'
];

const ComponentsView = ({ onOpenAddComponent, onEditComponent }) => {
  const { components, deleteComponent, restoreDamagedComponent } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all', 'available', 'low_stock', 'depleted', 'damaged'
  const [sortBy, setSortBy] = useState('name_asc'); // 'name_asc', 'name_desc', 'stock_desc', 'avail_asc'
  const [repairModalComp, setRepairModalComp] = useState(null);
  const [repairQty, setRepairQty] = useState(1);
  const [repairRemarks, setRepairRemarks] = useState('');

  // Filter & Sort Logic
  const filteredComponents = useMemo(() => {
    return components
      .filter((comp) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = !term || (
          comp.name.toLowerCase().includes(term) ||
          comp.category.toLowerCase().includes(term) ||
          (comp.storageLocation && comp.storageLocation.toLowerCase().includes(term)) ||
          (comp.keywords && comp.keywords.some((k) => k.toLowerCase().includes(term)))
        );

        const matchesCategory = selectedCategory === 'All Categories' || comp.category === selectedCategory;

        let matchesAvailability = true;
        if (availabilityFilter === 'available') {
          matchesAvailability = comp.quantityAvailable > 0;
        } else if (availabilityFilter === 'low_stock') {
          matchesAvailability = comp.quantityAvailable > 0 && comp.quantityAvailable <= 3;
        } else if (availabilityFilter === 'depleted') {
          matchesAvailability = comp.quantityAvailable === 0;
        } else if (availabilityFilter === 'damaged') {
          matchesAvailability = (comp.quantityDamaged || 0) > 0;
        }

        return matchesSearch && matchesCategory && matchesAvailability;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        if (sortBy === 'stock_desc') return b.quantityTotal - a.quantityTotal;
        if (sortBy === 'avail_asc') return a.quantityAvailable - b.quantityAvailable;
        return 0;
      });
  }, [components, searchTerm, selectedCategory, availabilityFilter, sortBy]);

  const handleExportCSV = async () => {
    try {
      await adminService.downloadExport('/admin/export/inventory', 'tcet_inventory_log.csv');
    } catch {
      window.open(adminService.getExportInventoryUrl(), '_blank');
    }
  };

  const handleOpenRepair = (comp) => {
    setRepairModalComp(comp);
    setRepairQty(comp.quantityDamaged || 1);
    setRepairRemarks('Inspection passed, tested pins and logic, restored to usable stock.');
  };

  const handleConfirmRepair = () => {
    if (!repairModalComp) return;
    restoreDamagedComponent(repairModalComp._id, repairQty, repairRemarks);
    setRepairModalComp(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner & Main Actions */}
      <div className="bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-tcet-navy text-tcet-gold px-2 py-0.5 border border-tcet-gold">
              Hardware Laboratory Inventory
            </span>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 font-bold">
              Audit Clearance Active (Mon-Wed)
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-tcet-navy uppercase tracking-tight">
            Components Management
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Catalogued microcontrollers, sensors, actuators, edge compute boards, and instrumentation hardware.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase border border-slate-300 transition-colors shadow-xs"
            title="Download CSV report"
          >
            <FileSpreadsheet className="w-4 h-4 text-tcet-gold" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddComponent}
            className="flex items-center gap-2 px-5 py-2.5 bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs uppercase border border-tcet-navy transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-tcet-gold" />
            <span>+ Add Component</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border-2 border-slate-300 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          
          {/* Search Box */}
          <div className="lg:col-span-5 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search by component name, specs, keywords or rack location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs h-10 font-medium"
            />
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs bg-white h-10 font-semibold text-slate-800"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="lg:col-span-2">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs bg-white h-10 font-medium text-slate-800"
            >
              <option value="all">All Stocks</option>
              <option value="available">In Stock (Avail &gt; 0)</option>
              <option value="low_stock">Low Stock (≤ 3 left)</option>
              <option value="depleted">Loaned Out (0 Avail)</option>
              <option value="damaged">Damaged Quarantine</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-xs bg-white h-10 font-medium text-slate-800"
            >
              <option value="name_asc">Name: A &rarr; Z</option>
              <option value="name_desc">Name: Z &rarr; A</option>
              <option value="stock_desc">Highest Total Stock</option>
              <option value="avail_asc">Lowest Available</option>
            </select>
          </div>

        </div>
      </div>

      {/* Component Listing: Professional Thumbnail/Card/Table Hybrid */}
      <div className="bg-white border-2 border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-tcet-navy text-white uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="p-3 w-16 text-center">Image</th>
                <th className="p-3">Component Details</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-center">Total</th>
                <th className="p-3 text-center">Available</th>
                <th className="p-3 text-center">Loaned</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {components.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 bg-amber-50 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto">
                        <Package className="w-6 h-6 text-amber-700" />
                      </div>
                      <div>
                        <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 mb-1.5">
                          Audit Cycle Active • Upcoming Mon / Tue / Wed
                        </span>
                        <h4 className="font-extrabold text-sm text-tcet-navy uppercase">
                          Hardware Inventory Cleared for Physical Audit
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          All laboratory hardware components have been removed ahead of the upcoming physical stocktaking audit. Urgently required components will be catalogued immediately following audit sign-off.
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={onOpenAddComponent}
                          className="px-4 py-2 bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs uppercase border border-tcet-navy shadow-xs transition-colors"
                        >
                          + Add Urgent Component
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredComponents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-400">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-xs text-slate-600">No components match your search filters.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add Component" to add new hardware.</p>
                  </td>
                </tr>
              ) : (
                filteredComponents.map((comp) => {
                  const isAvailable = comp.quantityAvailable > 0;
                  const isLow = comp.quantityAvailable > 0 && comp.quantityAvailable <= 3;
                  const isDepleted = comp.quantityAvailable === 0;
                  const hasDamaged = (comp.quantityDamaged || 0) > 0;

                  return (
                    <tr key={comp._id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Component Image Thumbnail */}
                      <td className="p-3 text-center">
                        <div className="w-12 h-12 bg-slate-50 border border-slate-200 p-1 flex items-center justify-center mx-auto shrink-0 shadow-2xs">
                          <img
                            src={comp.imageUrl || '/Photos/Arduino Uno.png'}
                            alt={comp.name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => { e.target.src = '/Photos/Arduino Uno.png'; }}
                          />
                        </div>
                      </td>

                      {/* Component Name & Meta */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-xs text-tcet-navy">
                            {comp.name}
                          </h4>
                          {comp.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 max-w-md">
                              {comp.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span className="bg-slate-100 px-1.5 py-0.2 border border-slate-200 text-slate-600">
                              {comp.storageLocation || 'Lab Storage'}
                            </span>
                            {hasDamaged && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 font-bold">
                                {comp.quantityDamaged} Damaged In Quarantine
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3 font-semibold text-slate-700">
                        {comp.category}
                      </td>

                      {/* Total Stock */}
                      <td className="p-3 text-center font-mono font-bold text-slate-800">
                        {comp.quantityTotal}
                      </td>

                      {/* Available Stock */}
                      <td className="p-3 text-center">
                        <span className={`font-mono font-black text-xs px-2 py-0.5 border ${
                          isDepleted ? 'bg-red-50 text-red-700 border-red-200' :
                          isLow ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}>
                          {comp.quantityAvailable}
                        </span>
                      </td>

                      {/* Currently Loaned */}
                      <td className="p-3 text-center font-mono font-bold text-blue-900">
                        {comp.quantityLoaned || 0}
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 border ${
                          isDepleted ? 'bg-red-600 text-white border-red-700' :
                          isLow ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold' :
                          'bg-emerald-600 text-white border-emerald-700'
                        }`}>
                          {isDepleted ? 'Loaned Out' : isLow ? 'Low Stock' : 'Available'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {hasDamaged && (
                            <button
                              type="button"
                              onClick={() => handleOpenRepair(comp)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors"
                              title="Inspect & Restore Damaged Stock"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditComponent(comp)}
                            className="p-1.5 bg-white hover:bg-slate-100 text-tcet-navy border border-slate-300 transition-colors"
                            title="Edit Component Parameters"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteComponent(comp._id)}
                            className="p-1.5 bg-white hover:bg-red-50 text-red-600 border border-slate-300 hover:border-red-300 transition-colors"
                            title="Remove from Catalog"
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
          <span>Showing {filteredComponents.length} of {components.length} components</span>
          <span>Single Source of Truth Reconciled</span>
        </div>
      </div>

      {/* Inspection & Repair Damaged Stock Modal */}
      {repairModalComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border-2 border-tcet-navy w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h4 className="font-extrabold text-sm uppercase text-tcet-navy">
                  Repair & Restore To Inventory
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setRepairModalComp(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-700">
              <strong>Component:</strong> {repairModalComp.name}<br />
              <strong>Currently Damaged in Quarantine:</strong> {repairModalComp.quantityDamaged} unit(s)
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Quantity Repaired & Restoring to Available Stock:
              </label>
              <input
                type="number"
                min="1"
                max={repairModalComp.quantityDamaged}
                value={repairQty}
                onChange={(e) => setRepairQty(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Inspection / Bench Test Remarks:
              </label>
              <input
                type="text"
                value={repairRemarks}
                onChange={(e) => setRepairRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRepairModalComp(null)}
                className="px-4 py-2 text-xs font-bold uppercase border border-slate-300 bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRepair}
                className="px-5 py-2 text-xs font-bold uppercase bg-tcet-navy text-white hover:bg-slate-800"
              >
                Restore to Stock
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComponentsView;
