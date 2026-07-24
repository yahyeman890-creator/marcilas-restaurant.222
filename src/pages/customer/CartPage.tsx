import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatETB } from '@/lib/utils';
import { CustomerHeader } from '@/components/Headers';

export function CartPage() {
  const { items, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={36} className="text-gray-300" />
          </div>
          <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mb-6">Add some delicious food to get started!</p>
          <Link to="/menu" className="btn-primary">Browse Menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/menu" className="p-2 rounded-lg hover:bg-gray-100 transition">
              <ArrowLeft size={20} className="text-gray-700" />
            </Link>
            <h1 className="font-display font-bold text-xl text-gray-900">Your Cart</h1>
            <span className="text-sm text-gray-400">({items.length} item{items.length > 1 ? 's' : ''})</span>
          </div>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-sm text-gray-400 hover:text-red-500 transition"
          >
            Clear all
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <div key={item.food.id} className="card p-3 flex items-center gap-3">
              <img
                src={item.food.image_url}
                alt={item.food.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{item.food.name}</h3>
                <p className="text-sm text-brand-600 font-bold">{formatETB(item.food.price)}</p>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                <button
                  onClick={() => updateQuantity(item.food.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.food.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm text-gray-900">{formatETB(item.food.price * item.quantity)}</p>
                <button
                  onClick={() => removeFromCart(item.food.id)}
                  className="text-gray-400 hover:text-red-500 transition mt-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 text-sm">Subtotal</span>
            <span className="font-semibold text-gray-900">{formatETB(totalPrice)}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 text-sm">Delivery Fee</span>
            <span className="font-semibold text-gray-900">{formatETB(50)}</span>
          </div>
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between mb-5">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-xl text-brand-600">{formatETB(totalPrice + 50)}</span>
          </div>
          <button
            onClick={() => navigate(user ? '/checkout' : '/login?redirect=/checkout')}
            className="btn-primary w-full py-3"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowClearConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slide-up">
            <h3 className="font-display font-bold text-lg mb-2">Clear cart?</h3>
            <p className="text-gray-500 text-sm mb-5">This will remove all items from your cart.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => { clearCart(); setShowClearConfirm(false); }}
                className="btn-danger flex-1"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
