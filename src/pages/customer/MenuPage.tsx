import { useState, useEffect, useMemo } from 'react';
import { Search, UtensilsCrossed, Flame, Pizza, Sandwich, Soup, Drumstick, GlassWater, IceCream, Wheat } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Food, Category } from '@/types';
import { FoodCard } from '@/components/FoodCard';
import { CustomerHeader } from '@/components/Headers';

const ICON_MAP: Record<string, typeof Flame> = {
  Flame, Pizza, Sandwich, Soup, Wheat, Drumstick, GlassWater, IceCream, UtensilsCrossed,
};

export function MenuPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      const [foodsRes, categoriesRes] = await Promise.all([
        supabase.from('foods').select('*, category:categories(*)').order('name'),
        supabase.from('categories').select('*').order('sort_order'),
      ]);
      setFoods(foodsRes.data ?? []);
      setCategories(categoriesRes.data ?? []);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredFoods = useMemo(() => {
    let result = foods;
    if (activeCategory !== 'all') {
      result = result.filter((f) => f.category?.slug === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [foods, activeCategory, searchQuery]);

  const popularFoods = useMemo(() => {
    if (activeCategory === 'all' && !searchQuery) {
      return foods.filter((f) => f.category?.slug === 'popular');
    }
    return [];
  }, [foods, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />

      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-2xl">
            <h1 className="font-display font-bold text-2xl sm:text-3xl mb-2">
              Order from Marcilas Restaurant
            </h1>
            <p className="text-brand-100 text-sm sm:text-base">
              Fresh, delicious meals delivered to your door in Dire Dawa.
            </p>
          </div>

          {/* Search */}
          <div className="relative mt-6 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for food..."
              className="w-full rounded-xl border-0 bg-white pl-11 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-3">
            <button
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCategory === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <UtensilsCrossed size={15} /> All
            </button>
            {categories
              .filter((c) => c.slug !== 'popular')
              .map((cat) => {
                const Icon = ICON_MAP[cat.icon] ?? UtensilsCrossed;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.slug)}
                    className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                      activeCategory === cat.slug
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon size={15} /> {cat.name}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gray-200"></div>
                <div className="p-3.5 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mt-3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {popularFoods.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Flame size={20} className="text-brand-600" />
                  <h2 className="font-display font-bold text-lg text-gray-900">Popular Foods</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {popularFoods.map((food) => (
                    <FoodCard key={food.id} food={food} categoryName="Popular" />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="font-display font-bold text-lg text-gray-900 mb-4">
                {activeCategory === 'all'
                  ? 'All Menu Items'
                  : categories.find((c) => c.slug === activeCategory)?.name ?? 'Menu'}
              </h2>

              {filteredFoods.length === 0 ? (
                <div className="text-center py-16">
                  <UtensilsCrossed size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">No food items found. Try a different search or category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filteredFoods
                    .filter((f) => f.category?.slug !== 'popular')
                    .map((food) => (
                      <FoodCard key={food.id} food={food} categoryName={food.category?.name} />
                    ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
