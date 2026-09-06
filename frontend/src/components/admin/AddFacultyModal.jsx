import React, { useState } from 'react';
import { X, UserPlus, CheckCircle } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const POSITIONS = [
  'Principal',
  'Vice Principal',
  'Dean',
  'Associate Dean',
  'Head of Department (HOD)',
  'Deputy HOD / Lead',
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Academic Staff'
];

const DEPARTMENTS = [
  'Artificial Intelligence and Data Science',
  'Artificial Intelligence and Machine Learning',
  'Civil Engineering',
  'Computer Engineering',
  'Computer Science and Engineering (Cyber Security)',
  'Computer Science and Engineering (Data Science)',
  'Computer Science and Engineering (IoT)',
  'Electronics & Telecommunication Engineering',
  'Electronics and Computer Science',
  'Humanities & Sciences',
  'Information Technology',
  'Mechanical Engineering',
  'Mechanical & Mechatronics Engineering (Additive Manufacturing)',
  'Research and Development',
  'Training and Placement Cell'
];

const AddFacultyModal = ({ isOpen, onClose }) => {
  const { addFaculty } = useAdmin();

  const [formData, setFormData] = useState({
    name: '',
    position: 'Assistant Professor',
    department: 'Computer Engineering',
    doj: '',
    email: '',
    contactNumber: '',
    specialization: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.doj) return;

    await addFaculty(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border-2 border-slate-300 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-tcet-navy text-white px-6 py-3.5 flex items-center justify-between border-b-2 border-tcet-gold">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-tcet-gold" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider">
              Enroll Faculty Member into Academic Roster
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
          
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name (with Prefix) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Rajesh Kumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none font-semibold text-slate-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Designation / Position <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none font-semibold text-slate-900 bg-white"
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date of Joining (DOJ) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.doj}
                onChange={(e) => setFormData({ ...formData, doj: e.target.value })}
                className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none font-medium text-slate-900 bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Used to determine institutional seniority rank within the academic tier.
              </p>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Academic Department <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none font-semibold text-slate-900 bg-white"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official TCET Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. rajesh.kumar@tcetmumbai.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-slate-900 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Number
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 9820012345"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-slate-900 bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              R&D Domain / Research Specialization
            </label>
            <input
              type="text"
              placeholder="e.g. Wireless Sensor Networks, VLSI & Embedded Systems"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              className="w-full px-3 py-2 border-2 border-slate-300 focus:border-tcet-navy focus:outline-none text-slate-900 bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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
              <span>SAVE & ADD FACULTY</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default AddFacultyModal;
