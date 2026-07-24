import { useState } from 'react';
import { Plus, Trash2, Edit3, Search, Loader2, AlertCircle, UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Food, Category } from '@/types';
import { Modal } from '@/components/Modal';
import { StarRating } from '@/components/StarRating';
import { formatETB } from '@/lib/utils';

interface Props {
  foods: Food[];
  categories: Category[];
  onRefresh: () => void;
}

export function AdminFoodsTab({ foods, categories, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Food | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Food | null>(null);

  const filtered = foods.filter((f) => {
    if (categoryFilter !== 'all' && f.category?.slug !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search food..."
            className="input pl-11"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input sm:w-40">
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <button onClick={() => setShowForm(true)} className="btn-primary shrink-0">
          <Plus size={16} /> Add Food
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((food) => (
          <div key={food.id} className="card overflow-hidden">
            <div className="relative aspect-[4/3]">
              <img src={food.image_url} alt={food.name} className="w-full h-full object-cover" />
              {!food.is_available && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">Unavailable</span>
                </div>
              )}
            </div>
            <div className="p-3.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{food.name}</h3>
                <StarRating rating={food.rating} size={11} />
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{food.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-brand-600">{formatETB(food.price)}</span>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(food)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => setDeleteTarget(food)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12">
            <UtensilsCrossed size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">No food items found.</p>
          </div>
        )}
      </div>

      {(showForm || editing) && (
        <FoodFormModal
          food={editing}
          categories={categories}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); onRefresh(); }}
        />
      )}

      {deleteTarget && (
        <DeleteFoodModal
          food={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

function FoodFormModal({ food, categories, onClose, onSaved }: { food: Food | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(food?.name ?? '');
  const [description, setDescription] = useState(food?.description ?? '');
  const [price, setPrice] = useState(food?.price?.toString() ?? '');
  const [imageUrl, setImageUrl] = useState(food?.image_url ?? '');
  const [rating, setRating] = useState(food?.rating?.toString() ?? '4.5');
  const [categoryId, setCategoryId] = useState(food?.category_id ?? categories[0]?.id ?? '');
  const [isAvailable, setIsAvailable] = useState(food?.is_available ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      name,
      description,
      price: parseFloat(price),
      image_url: imageUrl,
      rating: parseFloat(rating),
      category_id: categoryId,
      is_available: isAvailable,
    };

    try {
      if (food) {
        const { error } = await supabase.from('foods').update(payload).eq('id', food.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('foods').insert(payload);
        if (error) throw error;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save food');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={food ? 'Edit Food' : 'Add New Food'}>
      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Food Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[70px] resize-none" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Price (ETB)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input" required min="0" />
          </div>
          <div>
            <label className="label">Rating</label>
            <input type="number" value={rating} onChange={(e) => setRating(e.target.value)} className="input" min="0" max="5" step="0.1" />
          </div>
        </div>
        <div>
          <label className="label">Image URL</label>
          <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="input" required />
        </div>
        <div>
          <label className="label">Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Availability</label>
          <select value={isAvailable ? 'available' : 'unavailable'} onChange={(e) => setIsAvailable(e.target.value === 'available')} className="input">
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? <Loader2 size={16} className="animate-spin" /> : food ? 'Save Changes' : 'Add Food'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteFoodModal({ food, onClose, onDeleted }: { food: Food; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await supabase.from('foods').delete().eq('id', food.id);
    onDeleted();
  }

  return (
    <Modal open onClose={onClose} title="Delete Food" size="sm">
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-600" />
        </div>
        <p className="text-gray-700 mb-1">Delete</p>
        <p className="font-bold text-gray-900 mb-4">{food.name}?</p>
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
