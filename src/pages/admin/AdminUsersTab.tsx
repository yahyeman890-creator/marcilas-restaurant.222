import { useState } from 'react';
import { UserPlus, Trash2, Edit3, Search, Phone, Shield, Loader2, AlertCircle, Users, CheckSquare, Square } from 'lucide-react';
import { AUTH_FUNCTION_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, UserRole } from '@/types';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDelete, setBulkDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filtered = profiles.filter((p) => {
    if (roleFilter !== 'all' && p.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.full_name.toLowerCase().includes(q) || p.phone.includes(q);
    }
    return true;
  });

  const deletable = filtered.filter((p) => p.id !== currentUser?.id);
  const allDeletableSelected = deletable.length > 0 && deletable.every((p) => selected.has(p.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allDeletableSelected) {
        const next = new Set(prev);
        deletable.forEach((p) => next.delete(p.id));
        return next;
      }
      const next = new Set(prev);
      deletable.forEach((p) => next.add(p.id));
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function deleteProfile(id: string) {
    await fetch(`${AUTH_FUNCTION_URL}?action=delete-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY, 'x-admin-auth': currentUser?.id ?? '' },
      body: JSON.stringify({ id }),
    });
  }

  async function handleBulkDelete() {
    setDeleting(true);
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => deleteProfile(id)));
    setDeleting(false);
    setBulkDelete(false);
    clearSelection();
    onRefresh();
  }

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

      {/* Bulk action bar */}
      {deletable.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-3 p-2.5 rounded-xl bg-white border border-gray-100">
          <button onClick={toggleAll} className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-brand-600 transition">
            {allDeletableSelected ? <CheckSquare size={18} className="text-brand-600" /> : <Square size={18} className="text-gray-400" />}
            {allDeletableSelected ? 'Deselect all' : 'Select all'}
          </button>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <span className="text-sm text-gray-500">{selected.size} selected</span>
            )}
            {selected.size > 0 && (
              <button
                onClick={() => setBulkDelete(true)}
                className="btn-secondary text-red-600 hover:bg-red-50 border-red-200 py-1.5 px-3 text-xs"
              >
                <Trash2 size={14} /> Delete Selected
              </button>
            )}
          </div>
        </div>
      )}

      {/* User list */}
      <div className="space-y-2">
        {filtered.map((profile) => {
          const isSelected = selected.has(profile.id);
          const isSelf = profile.id === currentUser?.id;
          return (
            <div key={profile.id} className={`card p-3.5 flex items-center gap-3 transition ${isSelected ? 'ring-2 ring-brand-400' : ''}`}>
              {!isSelf ? (
                <button onClick={() => toggleOne(profile.id)} className="shrink-0 p-0.5">
                  {isSelected ? <CheckSquare size={18} className="text-brand-600" /> : <Square size={18} className="text-gray-400" />}
                </button>
              ) : (
                <div className="w-[18px] shrink-0" />
              )}
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-semibold shrink-0">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm text-gray-900 truncate">{profile.full_name}</p>
                  {isSelf && <span className="text-xs text-gray-400">(You)</span>}
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
                {!isSelf && (
                  <button onClick={() => setDeleteTarget(profile)} className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Users size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">No users found.</p>
          </div>
        )}
      </div>

      {showCreate && (
        <UserFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); onRefresh(); }}
          adminId={currentUser?.id}
        />
      )}

      {editing && (
        <UserFormModal
          profile={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onRefresh(); }}
          adminId={currentUser?.id}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete User"
          destructive
          confirmLabel="Delete"
          message={
            <>
              Delete <strong>{deleteTarget.full_name}</strong>?
              <br />
              This action cannot be undone.
            </>
          }
          onConfirm={async () => {
            setDeleting(true);
            await deleteProfile(deleteTarget.id);
            setDeleting(false);
            setDeleteTarget(null);
            onRefresh();
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <ConfirmDialog
        open={bulkDelete}
        title="Delete Selected Users"
        destructive
        confirmLabel={`Delete ${selected.size} users`}
        message={
          <>
            Delete <strong>{selected.size} selected user{selected.size > 1 ? 's' : ''}</strong>?
            <br />
            This action cannot be undone.
          </>
        }
        onConfirm={handleBulkDelete}
        onClose={() => setBulkDelete(false)}
      />

      {deleting && (
        <div className="fixed inset-0 z-40 bg-black/20 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-white" />
        </div>
      )}
    </div>
  );
}

function UserFormModal({ profile, onClose, onSaved, adminId }: { profile?: Profile; onClose: () => void; onSaved: () => void; adminId?: string }) {
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
      body.phone = phone;
      if (password) body.password = password;

      const action = profile ? 'update-user' : 'create-user';

      const res = await fetch(`${AUTH_FUNCTION_URL}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY, 'x-admin-auth': adminId ?? '' },
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
