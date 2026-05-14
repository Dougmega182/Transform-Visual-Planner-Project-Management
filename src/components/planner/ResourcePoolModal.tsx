'use client';
import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Shield, Users, Briefcase } from 'lucide-react';

interface PoolEntry {
  id?: number;
  trade: string;
  source: 'in-house' | 'subcontractor';
  company_name?: string;
  total_capacity: number;
  effective_from: string;
  effective_until?: string;
  daily_cost: number;
}

interface ResourcePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PoolEntry[];
}

export const ResourcePoolModal: React.FC<ResourcePoolModalProps> = ({ isOpen, onClose, initialData = [] }) => {
  const [pools, setPools] = useState<PoolEntry[]>(initialData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData.length > 0) setPools(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    const newPool: PoolEntry = {
      trade: 'New Trade',
      source: 'in-house',
      total_capacity: 10,
      effective_from: new Date().toISOString().split('T')[0],
      daily_cost: 0
    };
    setPools([...pools, newPool]);
  };

  const handleUpdate = (index: number, field: keyof PoolEntry, value: any) => {
    const updated = [...pools];
    updated[index] = { ...updated[index], [field]: value };
    setPools(updated);
  };

  const handleRemove = (index: number) => {
    setPools(pools.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would be a POST to /api/resource-pool
      // For now, we'll assume it's handled by the store or a direct fetch
      const res = await fetch('/api/data/resource-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pools })
      });
      if (res.ok) {
        alert('Resource pool updated successfully');
        onClose();
        window.location.reload();
      }
    } catch (err) {
      alert('Failed to save resource pool');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-secondary)] w-full max-w-4xl rounded-2xl border border-[var(--border-color)] shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Shield className="text-blue-500" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Global Resource Pool</h2>
              <p className="text-xs text-[var(--text-muted)]">Define your total staffing capacity by trade and source</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-all">
            <X size={20} className="text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-4 text-[10px] uppercase font-bold text-[var(--text-muted)] px-2">
              <div className="col-span-1">Trade</div>
              <div className="col-span-1">Source</div>
              <div className="col-span-1">Company</div>
              <div className="col-span-1">Capacity</div>
              <div className="col-span-1">From</div>
              <div className="col-span-1">Cost/Day</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {pools.map((pool, idx) => (
              <div key={idx} className="grid grid-cols-7 gap-4 items-center bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-color)] group hover:border-blue-500/30 transition-all">
                <input 
                  value={pool.trade}
                  onChange={(e) => handleUpdate(idx, 'trade', e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-[var(--text-primary)] focus:ring-0"
                  placeholder="Trade Name"
                />
                <select 
                  value={pool.source}
                  onChange={(e) => handleUpdate(idx, 'source', e.target.value)}
                  className="bg-transparent border-none text-xs text-[var(--text-secondary)] focus:ring-0 cursor-pointer"
                >
                  <option value="in-house">In-House</option>
                  <option value="subcontractor">Sub</option>
                </select>
                <input 
                  value={pool.company_name || ''}
                  onChange={(e) => handleUpdate(idx, 'company_name', e.target.value)}
                  disabled={pool.source === 'in-house'}
                  className="bg-transparent border-none text-xs text-[var(--text-secondary)] focus:ring-0 disabled:opacity-30"
                  placeholder="—"
                />
                <input 
                  type="number"
                  value={pool.total_capacity}
                  onChange={(e) => handleUpdate(idx, 'total_capacity', parseInt(e.target.value))}
                  className="bg-transparent border-none text-xs font-mono text-blue-500 font-bold focus:ring-0"
                />
                <input 
                  type="date"
                  value={pool.effective_from}
                  onChange={(e) => handleUpdate(idx, 'effective_from', e.target.value)}
                  className="bg-transparent border-none text-[10px] text-[var(--text-muted)] focus:ring-0"
                />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[var(--text-muted)]">$</span>
                  <input 
                    type="number"
                    value={pool.daily_cost}
                    onChange={(e) => handleUpdate(idx, 'daily_cost', parseFloat(e.target.value))}
                    className="bg-transparent border-none text-xs text-[var(--text-secondary)] focus:ring-0 w-16"
                  />
                </div>
                <div className="text-right">
                  <button 
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            <button 
              onClick={handleAddRow}
              className="w-full py-3 border-2 border-dashed border-[var(--border-color)] rounded-xl flex items-center justify-center gap-2 text-[var(--text-muted)] hover:text-blue-500 hover:border-blue-500/50 transition-all text-xs font-bold"
            >
              <Plus size={16} />
              Add Resource to Pool
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/30 flex items-center justify-between">
          <p className="text-[10px] text-[var(--text-muted)] italic">
            * Changes to the pool affect all future scheduling recommendations.
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Pool Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
