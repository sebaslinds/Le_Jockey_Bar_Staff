import React, { useState } from 'react';
import { Employee } from '../types';
import { Language, TRANSLATIONS } from '../constants';
import { X, Plus, Trash2, Edit2 } from 'lucide-react';

interface StaffManagementModalProps {
  staff: Employee[];
  language: Language;
  onClose: () => void;
  onAddStaff: (employee: Omit<Employee, 'id'>) => void;
  onUpdateStaff: (employee: Employee) => void;
  onRemoveStaff: (id: string) => void;
}

export function StaffManagementModal({
  staff,
  language,
  onClose,
  onAddStaff,
  onUpdateStaff,
  onRemoveStaff,
}: StaffManagementModalProps) {
  const t = TRANSLATIONS[language];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', role: '', avatarUrl: '' });

  const handleSave = () => {
    if (!formData.name || !formData.role) return;
    
    if (editingId) {
      onUpdateStaff({ id: editingId, ...formData });
    } else {
      onAddStaff({ ...formData, avatarUrl: formData.avatarUrl || `https://i.pravatar.cc/150?u=${Date.now()}` });
    }
    
    setEditingId(null);
    setFormData({ name: '', role: '', avatarUrl: '' });
  };

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setFormData({ name: employee.name, role: employee.role, avatarUrl: employee.avatarUrl || '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-border bg-brand-bg/50">
          <h2 className="text-3xl font-serif text-brand-text">{t.staffManagement}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-brand-border transition-colors text-neutral-400 hover:text-brand-text"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-8">
          
          {/* Add/Edit Form */}
          <div className="bg-brand-bg/50 border border-brand-border rounded-xl p-6">
            <h3 className="text-lg font-serif text-brand-accent mb-4">
              {editingId ? 'Edit Employee' : t.addEmployee}
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder={t.name}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="flex-1 bg-brand-surface border border-brand-border rounded-lg px-4 py-2 text-brand-text focus:outline-none focus:border-brand-accent transition-colors"
              />
              <input
                type="text"
                placeholder={t.role}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="flex-1 bg-brand-surface border border-brand-border rounded-lg px-4 py-2 text-brand-text focus:outline-none focus:border-brand-accent transition-colors"
              />
              <button
                onClick={handleSave}
                className="bg-brand-accent hover:bg-brand-accent-hover text-brand-bg font-semibold px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {editingId ? t.save : <><Plus className="w-4 h-4" /> {t.addEmployee}</>}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name: '', role: '', avatarUrl: '' });
                  }}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  {t.cancel}
                </button>
              )}
            </div>
          </div>

          {/* Staff List */}
          <div className="space-y-4">
            {staff.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between bg-brand-bg border border-brand-border rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <img src={employee.avatarUrl} alt={employee.name} className="w-12 h-12 rounded-full border border-brand-border" />
                  <div>
                    <h4 className="text-lg font-medium text-brand-text">{employee.name}</h4>
                    <span className="text-sm text-neutral-500 font-mono uppercase tracking-wider">{employee.role}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(employee)}
                    className="p-2 rounded-lg bg-brand-surface hover:bg-brand-border border border-brand-border transition-colors text-neutral-400 hover:text-brand-accent"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemoveStaff(employee.id)}
                    className="p-2 rounded-lg bg-brand-surface hover:bg-red-500/20 border border-brand-border hover:border-red-500/50 transition-colors text-neutral-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
