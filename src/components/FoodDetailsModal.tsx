import { useState } from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import type { Food } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { formatETB } from '@/lib/utils';
import { StarRating } from '@/components/StarRating';
import { Modal } from '@/components/Modal';

interface FoodDetailsModalProps {
  food: Food | null;
  open: boolean;
  onClose: () => void;
}

export function FoodDetailsModal({ food, open, onClose }: FoodDetailsModalProps) {
  const { addToCart, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!food) return null;

  const inCart = items.find((i) => i.food.id === food.id);

  function handleAdd() {
    if (!food) return;
    addToCart(food, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1000);
  }

  return (
    <Modal open={open} onClose={onClose} title={food.name} size="lg">
      <div className="-mx-5 -mt-5">
        {/* Large food image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          <img
            src={food.image_url}
            alt={food.name}
            className="w-full h-full object-cover"
          />
          {!food.is_available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-base">Out of Stock</span>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur rounded-full px-3 py-1 shadow-sm">
            <StarRating rating={food.rating} size={13} showValue={true} />
          </div>
        </div>

        <div className="p-5">
          {/* Name + price */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-display font-bold text-xl text-gray-900 leading-tight">{food.name}</h3>
            <span className="font-bold text-2xl text-brand-600 whitespace-nowrap">{formatETB(food.price)}</span>
          </div>

          {/* Full description */}
          <p className="text-sm text-gray-600 leading-relaxed mb-6">{food.description}</p>

          {/* Quantity selector + Add to Cart */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={!food.is_available}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center font-semibold text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                disabled={!food.is_available}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={!food.is_available}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {added ? (
                <>
                  <Check size={18} /> Added to Cart
                </>
              ) : (
                <>
                  <Plus size={18} /> Add to Cart · {formatETB(food.price * quantity)}
                </>
              )}
            </button>
          </div>

          {inCart && !added && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              {inCart.quantity} already in your cart
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
