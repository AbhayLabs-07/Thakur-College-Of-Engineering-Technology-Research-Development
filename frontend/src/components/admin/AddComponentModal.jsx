import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, CheckCircle, Package } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const AVAILABLE_PHOTOS = [
  { name: 'Raspberry Pi 4 Model B', path: '/Photos/Raspberry Pi 4 Model B.png' },
  { name: 'Arduino Uno', path: '/Photos/Arduino Uno.png' },
  { name: 'Nvidia Jetson Nano', path: '/Photos/Nvidia Jetson Nano Developer Kit.png' },
  { name: 'ESP-WROOM-32', path: '/Photos/ESP-WROOM-32 .png' },
  { name: 'ESP32-CAM Module', path: '/Photos/esp32-cam module.png' },
  { name: 'TowerPro SG90 Servo', path: '/Photos/TowerPro SG90 Servo Motor (180° Rotation).png' },
  { name: 'Full Size Breadboard', path: '/Photos/Breadboard.png' },
  { name: 'Arduino USB Cable', path: '/Photos/Cable for Arduino UNO MEGA .png' },
  { name: 'Micro USB Upload Cable', path: '/Photos/Code Uploading Cable Micro USB.png' },
  { name: 'Dupont Male-Male Jumper', path: '/Photos/Male to Male Jumper Wires 40Pcs 20cm.png' },
  { name: 'Dupont Male-Female Jumper', path: '/Photos/Male to Female Jumper Wires 40Pcs 20cm.png' },
  { name: 'Dupont Female-Female Jumper', path: '/Photos/20CM DuPont Wire Color Jumper Cable 2.54mm 1P-1P Female to Female.png' }
];

const CATEGORIES = [
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

const AddComponentModal = ({ isOpen, onClose, editingComponent = null }) => {
  const { addComponent, updateComponent } = useAdmin();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Microcontroller',
    quantityTotal: 5,
    imageUrl: '/Photos/Arduino Uno.png',
    description: '',
    keywords: '',
    storageLocation: 'Lab Cabinet A-01',
    specs: {}
  });

  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);

  useEffect(() => {
    if (editingComponent) {
      setFormData({
        name: editingComponent.name || '',
        category: editingComponent.category || 'Microcontroller',
        quantityTotal: editingComponent.quantityTotal || 1,
        imageUrl: editingComponent.imageUrl || '/Photos/Arduino Uno.png',
        description: editingComponent.description || '',
        keywords: Array.isArray(editingComponent.keywords)
          ? editingComponent.keywords.join(', ')
          : editingComponent.keywords || '',
        storageLocation: editingComponent.storageLocation || 'Lab Cabinet A-01',
        specs: editingComponent.specs || {}
      });
    } else {
      setFormData({
        name: '',
        category: 'Microcontroller',
        quantityTotal: 5,
        imageUrl: '/Photos/Arduino Uno.png',
        description: '',
        keywords: '',
        storageLocation: 'Lab Cabinet A-01',
        specs: {}
      });
    }
  }, [editingComponent, isOpen]);

  if (!isOpen) return null;

  const handleAddSpec = () => {
    if (!specKey.trim() || !specVal.trim()) return;
    setFormData((prev) => ({
      ...prev,
      specs: {
        ...prev.specs,
        [specKey.trim()]: specVal.trim()
      }
    }));
    setSpecKey('');
    setSpecVal('');
  };

  const handleRemoveSpec = (key) => {
    setFormData((prev) => {
      const updated = { ...prev.specs };
      delete updated[key];
      return { ...prev, specs: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingComponent) {
      await updateComponent(editingComponent._id, formData);
    } else {
      await addComponent(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border-2 border-slate-300 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-tcet-navy text-white px-6 py-3.5 flex items-center justify-between border-b-2 border-tcet-gold">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-tcet-gold" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider">
              {editingComponent ? 'Edit Hardware Component' : 'Catalogue New R&D Hardware Component'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Component Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Component Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Raspberry Pi 4 Model B (4GB)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none font-semibold text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none font-semibold text-slate-900 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock & Storage Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Total Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantityTotal}
                onChange={(e) => setFormData({ ...formData, quantityTotal: e.target.value })}
                className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none font-mono font-bold text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Laboratory Storage Location
              </label>
              <input
                type="text"
                placeholder="e.g. Lab Cabinet A-02, Shelf 3"
                value={formData.storageLocation}
                onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Image Selection & Preview */}
          <div className="border-2 border-slate-200 p-3 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-700 uppercase tracking-wider">
                Component Image Identification
              </label>
              <button
                type="button"
                onClick={() => setIsPhotoPickerOpen(!isPhotoPickerOpen)}
                className="text-[11px] font-bold text-tcet-navy hover:underline flex items-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{isPhotoPickerOpen ? 'Hide Photo Library' : 'Choose From Lab Photos Library'}</span>
              </button>
            </div>

            {/* Quick Lab Photo Picker Grid */}
            {isPhotoPickerOpen && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-white p-2 border border-slate-300 max-h-40 overflow-y-auto">
                {AVAILABLE_PHOTOS.map((photo) => (
                  <div
                    key={photo.path}
                    onClick={() => {
                      setFormData({ ...formData, imageUrl: photo.path });
                      setIsPhotoPickerOpen(false);
                    }}
                    className={`p-1.5 border cursor-pointer hover:border-tcet-navy text-center transition-all ${
                      formData.imageUrl === photo.path ? 'border-tcet-navy bg-amber-50' : 'border-slate-200'
                    }`}
                  >
                    <img src={photo.path} alt={photo.name} className="h-12 w-full object-contain mx-auto" />
                    <p className="text-[9px] truncate font-medium mt-1 text-slate-700">{photo.name}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white border border-slate-300 p-1 shrink-0 flex items-center justify-center">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => { e.target.src = '/Photos/Arduino Uno.png'; }}
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Paste local path or image URL (/Photos/...)"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 focus:outline-none font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Preview shows the exact identification image visible in the Components table.
                </p>
              </div>
            </div>
          </div>

          {/* Keywords & Description */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Search Keywords (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. raspberry pi, embedded, linux, arm, python"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-slate-900 bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Component Description / Usage Guidelines
            </label>
            <textarea
              rows="2"
              placeholder="Provide technical details, operating voltages, pinouts, and laboratory usage instructions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-slate-900 bg-white"
            />
          </div>

          {/* Technical Specifications Map Builder */}
          <div className="border border-slate-200 p-3 bg-slate-50 space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider block">
              Technical Specifications (Key - Value Pairs)
            </span>

            {/* List of current specs */}
            {Object.keys(formData.specs).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                {Object.entries(formData.specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center bg-white p-1.5 border border-slate-200 text-[11px]">
                    <span className="text-slate-700 font-semibold truncate pr-2">
                      <strong>{k}:</strong> {v}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(k)}
                      className="text-red-600 hover:text-red-800 font-bold px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input to add new spec */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Parameter (e.g. Operating Voltage)"
                value={specKey}
                onChange={(e) => setSpecKey(e.target.value)}
                className="flex-1 px-2.5 py-1.5 border border-slate-300 text-xs bg-white"
              />
              <input
                type="text"
                placeholder="Value (e.g. 5V DC)"
                value={specVal}
                onChange={(e) => setSpecVal(e.target.value)}
                className="flex-1 px-2.5 py-1.5 border border-slate-300 text-xs bg-white"
              />
              <button
                type="button"
                onClick={handleAddSpec}
                className="bg-tcet-navy hover:bg-slate-800 text-white font-bold px-3 py-1.5 text-xs transition-colors"
              >
                Add Spec
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-bold uppercase text-slate-600 hover:text-slate-900 border border-slate-300 bg-white transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 font-bold uppercase text-white bg-tcet-navy hover:bg-slate-800 border border-tcet-navy shadow-xs transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-tcet-gold" />
              <span>{editingComponent ? 'SAVE CHANGES' : 'ADD COMPONENT'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default AddComponentModal;
