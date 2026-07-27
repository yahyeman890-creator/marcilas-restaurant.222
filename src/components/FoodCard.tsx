import { Plus, Check } from 'lucide-react';
import { useState } from 'react';
import type { Food } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { formatETB } from '@/lib/utils';
import { StarRating } from '@/components/StarRating';
import { FoodDetailsModal } from '@/components/FoodDetailsModal';

interface FoodCardProps {
  food: Food;
  categoryName?: string;
}

export function FoodCard({ food, categoryName }: FoodCardProps) {
  const { addToCart, items } = useCart();
  const [added, setAdded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const inCart = items.find((i) => i.food.id === food.id);

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    addToCart(food, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <>
      <div
        onClick={() => setDetailsOpen(true)}
        className="card overflow-hidden group hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={food.image_url}
            alt={food.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {!food.is_available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">Out of Stock</span>
            </div>
          )}
          <div className="absolute top-2 right-2 bg-white/95 backdrop-blur rounded-full px-2 py-0.5 shadow-sm">
            <StarRating rating={food.rating} size={11} showValue={true} />
          </div>
        </div>

        <div className="p-3.5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm text-gray-900 leading-tight">{food.name}</h3>
          </div>
          {categoryName && (
            <span className="text-xs text-brand-600 font-medium mb-1.5">{categoryName}</span>
          )}
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{food.description}</p>

          <div className="flex items-center justify-between mt-auto">
            <span className="font-bold text-base text-gray-900">{formatETB(food.price)}</span>
            <button
              onClick={handleAdd}
              disabled={!food.is_available}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {added ? (
                <>
                  <Check size={14} /> Added
                </>
              ) : inCart ? (
                <>
                  <Plus size={14} /> Add ({inCart.quantity})
                </>
              ) : (
                <>
                  <Plus size={14} /> Add
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <FoodDetailsModal food={food} open={detailsOpen} onClose={() => setDetailsOpen(false)} />
    </>
  );
}
