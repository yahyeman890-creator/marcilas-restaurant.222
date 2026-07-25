import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, User, Loader2, CheckCircle2, ShoppingBag, Crosshair, AlertCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatETB } from '@/lib/utils';
import { useGeolocation } from '@/hooks/useGeolocation';
import { DeliveryMap } from '@/components/DeliveryMap';
import { CustomerHeader } from '@/components/Headers';

export function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [name, setName] = useState(user?.full_name ?? '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const gps = useGeolocation();

  const deliveryFee = 50;
  const grandTotal = totalPrice + deliveryFee;

  async function handleGetLocation() {
    try {
      await gps.getLocation();
    } catch {
      // error state is set in the hook
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!gps.lat || !gps.lng) {
      alert('Please capture your GPS location first by tapping "Use My Location".');
      return;
    }

    setLoading(true);

    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          customer_id: user?.id ?? null,
          customer_name: name,
          customer_phone: phone,
          delivery_address: `GPS: ${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`,
          delivery_lat: gps.lat,
          delivery_lng: gps.lng,
          status: 'pending',
          payment_status: 'unpaid',
          total: grandTotal,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        food_id: item.food.id,
        food_name: item.food.name,
        price: item.food.price,
        quantity: item.quantity,
        subtotal: item.food.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      setSuccess(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your order has been received with your GPS location. We'll start preparing it right away. You can track it in your orders.
          </p>
          <div className="flex flex-col gap-3 items-center">
            <button onClick={() => navigate('/orders')} className="btn-primary w-full max-w-xs">
              Track My Order
            </button>
            <Link to="/menu" className="btn-ghost">Back to Menu</Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm mb-4">Your cart is empty.</p>
          <Link to="/menu" className="btn-primary">Browse Menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/cart" className="p-2 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft size={20} className="text-gray-700" />
          </Link>
          <h1 className="font-display font-bold text-xl text-gray-900">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-6">
          {/* Delivery info */}
          <div className="lg:col-span-3 space-y-4">
            <div className="card p-5">
              <h2 className="font-semibold text-sm text-gray-900 mb-4">Delivery Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input pl-11"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input pl-11"
                      required
                    />
                  </div>
                </div>

                {/* GPS Location capture */}
                <div>
                  <label className="label">Delivery Location (GPS)</label>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={gps.loading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-50 text-brand-700 font-semibold text-sm border border-brand-200 hover:bg-brand-100 transition disabled:opacity-60"
                    >
                      {gps.loading ? (
                        <><Loader2 size={18} className="animate-spin" /> Capturing location...</>
                      ) : gps.lat ? (
                        <><Crosshair size={18} className="text-green-600" /> Location captured — tap to re-capture</>
                      ) : (
                        <><Crosshair size={18} /> Use My Location</>
                      )}
                    </button>

                    {gps.error && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-600">{gps.error}</p>
                      </div>
                    )}

                    {gps.lat && gps.lng && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-100">
                          <MapPin size={16} className="text-green-600 shrink-0" />
                          <p className="text-xs text-green-700 font-medium">
                            {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
                          </p>
                        </div>
                        <div className="h-56 rounded-xl overflow-hidden border border-gray-200">
                          <DeliveryMap
                            customerMarker={{ lat: gps.lat, lng: gps.lng, label: 'Delivery', color: 'red' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label">Order Notes (optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Extra spicy, no onions"
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-sm text-gray-900 mb-3">Payment Method</h2>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                  <span className="text-brand-700 font-bold text-sm">ETB</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">Pay with cash when your order arrives</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="card p-5 sticky top-20">
              <h2 className="font-semibold text-sm text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.food.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex-1 truncate pr-2">
                      {item.food.name} × {item.quantity}
                    </span>
                    <span className="font-medium text-gray-900 shrink-0">
                      {formatETB(item.food.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatETB(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">{formatETB(deliveryFee)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-lg text-brand-600">{formatETB(grandTotal)}</span>
                </div>
              </div>
              <button type="submit" disabled={loading || !gps.lat} className="btn-primary w-full py-3 mt-5 disabled:opacity-50">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Place Order'}
              </button>
              {!gps.lat && (
                <p className="text-xs text-gray-400 text-center mt-2">Capture your location to place the order</p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
