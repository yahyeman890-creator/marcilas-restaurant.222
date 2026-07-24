import { useState } from 'react';
import { UserPlus, Trash2, Edit3, Search, Phone, Shield, Loader2, AlertCircle, X } from 'lucide-react';
import { supabase, AUTH_FUNCTION_URL } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, UserRole } from '@/types';
import { Modal } from '@/components/Modal';
import { formatDate } from '@/lib/utils';

interface Props {
  profiles: Profile[];
  onRefresh: () => void;
}

export function AdminUsersTab({ profiles, onRefresh }: Props) {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);

  const filtered = profiles.filter((p) => {
    if (roleFilter !== 'all' && p.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.full_name.toLowerCase().includes(q) || p.phone.includes(q);
    }
    return true;
  });

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-brand-100 text-brand-700',
    cashier: 'bg-blue-100 text-blue-700',
    driver: 'bg-green-100 text-green-700',
    customer: 'bg-amber-100 text-amber-700',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="input pl-11"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input sm:w-40">
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="cashier">Cashiers</option>
          <option value="driver">Drivers</option>
          <option value="admin">Admins</option>
        </select>
        <button onClick={() => setShowCreate(true)} className="btn-primary shrink-0">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* User list */}
      <div className="space-y-2">
        {filtered.map((profile) => (
          <div key={profile.id} className="card p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-semibold shrink-0">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-sm text-gray-900 truncate">{profile.full_name}</p>
                {profile.id === currentUser?.id && <span className="text-xs text-gray-400">(You)</span>}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Phone size={11} /> {profile.phone}</span>
                <span className="hidden sm:flex items-center gap-1"><Shield size={11} /> {formatDate(profile.created_at)}</span>
              </div>
            </div>
            <span className={`badge ${roleColors[profile.role]} capitalize shrink-0`}>{profile.role}</span>
            <span className={`badge ${profile.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'} shrink-0`}>
              {profile.is_active ? 'Active' : 'Disabled'}
            </span>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setEditing(profile)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <Edit3 size={16} />
              </button>
              {profile.id !== currentUser?.id && (
                <button onClick={() => setDeleteTarget(profile)} className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No users found.</p>}
      </div>

      {showCreate && (
        <UserFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); onRefresh(); }}
        />
      )}

      {editing && (
        <UserFormModal
          profile={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onRefresh(); }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          profile={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

function UserFormModal({ profile, onClose, onSaved }: { profile?: Profile; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(profile?.role ?? 'customer');
  const [isActive, setIsActive] = useState(profile?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const body: Record<string, unknown> = { full_name: fullName, role, is_active: isActive };
      if (!profile) body.phone = phone;
      else body.phone = phone;
      if (password) body.password = password;

      const action = profile ? 'update-user' : 'create-user';
      if (!profile) body.full_name = fullName;

      const res = await fetch(`${AUTH_FUNCTION_URL}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile ? { ...body, id: profile.id } : body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save user');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={profile ? 'Edit User' : 'Add New User'}>
      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" required />
        </div>
        <div>
          <label className="label">Phone Number</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2519XXXXXXXX" className="input" required />
        </div>
        <div>
          <label className="label">Password {profile && '(leave blank to keep current)'}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={profile ? 'New password' : 'At least 6 characters'} className="input" {...(profile ? {} : { required: true })} />
        </div>
        <div>
          <label className="label">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="input">
            <option value="customer">Customer</option>
            <option value="cashier">Cashier</option>
            <option value="driver">Driver</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {profile && (
          <div>
            <label className="label">Account Status</label>
            <select value={isActive ? 'active' : 'disabled'} onChange={(e) => setIsActive(e.target.value === 'active')} className="input">
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? <Loader2 size={16} className="animate-spin" /> : profile ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteConfirmModal({ profile, onClose, onDeleted }: { profile: Profile; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`${AUTH_FUNCTION_URL}?action=delete-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: profile.id }),
    });
    onDeleted();
  }

  return (
    <Modal open onClose={onClose} title="Delete User" size="sm">
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-600" />
        </div>
        <p className="text-gray-700 mb-1">Are you sure you want to delete</p>
        <p className="font-bold text-gray-900 mb-4">{profile.full_name}?</p>
        <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDelete} disabled={loading} className="btn-danger flex-1">
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
