import { useState, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';

export default function Checkout() {
  const { cartItems, removeFromCart, cartTotal, clearCart, addToCart, decreaseQty } = useShop();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null); // Define user state

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const hasChecked = useRef(false);

  // Check User & Auto-fill Data
  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        addToast("You must be logged in to purchase items!", "info");
        navigate('/login');
      } else {
        setUser(session.user);

        // AUTO-FILL FORM DATA FROM METADATA (if available)
        const { user_metadata } = session.user;
        if (user_metadata) {
          setFormData(prev => ({
            ...prev,
            name: user_metadata.full_name || '',
            phone: user_metadata.phone || ''
          }));
        }
      }
    };
    checkUser();
  }, [navigate, addToast]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      addToast("Your cart is empty!", "error");
      return;
    }

    setLoading(true);

    try {
      // 1. Prepare Order Data
      const orderData = {
        customer_name: formData.name,
        customer_phone: formData.phone,
        address: formData.address,
        total_amount: cartTotal,
        items: cartItems, // Saves the actual array of items
        status: 'Pending',
        // Optional: you can save user_id here if you added that column to your orders table
        // user_id: user?.id 
      };

      // 2. Insert into Supabase
      const { error } = await supabase.from('orders').insert([orderData]);

      if (error) throw error;

      // 3. Success!
      addToast("Order Placed Successfully! We will contact you shortly.", "success");
      clearCart(); // Empty the cart
      navigate('/'); // Go back to Home

    } catch (error) {
      console.error("Order Error:", error);
      addToast("Failed to place order. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold text-gray-700">Your Cart is Empty</h2>
        <p className="text-gray-500 mt-2">Go to the Shop to add some plants!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-bg pt-28 pb-10">
      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-8">

        {/* Left: Cart Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md h-fit">
          <h2 className="text-2xl font-bold mb-4 text-green-primary">Order Summary</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center gap-3">
                  <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded object-cover" />
                  <div>
                    <h4 className="font-bold">
                      {item.name}
                      {item.variant && <span className="text-xs font-normal text-gray-600 block">{item.variant.name}</span>}
                    </h4>
                    <p className="text-sm text-gray-500">₹{item.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Quantity Control */}
                  <div className="flex items-center bg-gray-100 rounded-full h-8 px-1">
                    <button
                      onClick={() => decreaseQty(item.cartItemId || item.id)}
                      className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-full transition-colors active:scale-90"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="font-bold text-gray-700 text-sm px-2 min-w-[20px] text-center">
                      {item.qty}
                    </span>

                    <button
                      onClick={() => addToCart(item, item.variant)}
                      className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-full transition-colors active:scale-90"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <span className="font-bold min-w-[60px] text-right">₹{item.price * item.qty}</span>

                  <button
                    onClick={() => removeFromCart(item.cartItemId || item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Remove Item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t flex justify-between items-center text-xl font-bold">
            <span>Total:</span>
            <span>₹{cartTotal}</span>
          </div>
        </div>

        {/* Right: Shipping Form */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Shipping Details</h2>
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div>
              <label className="block text-gray-700">Full Name</label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-gray-700">Phone Number</label>
              <input
                required
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="e.g., 9876543210"
              />
            </div>
            <div>
              <label className="block text-gray-700">Shipping Address</label>
              <textarea
                required
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                className="w-full border p-2 rounded"
                placeholder="House No, Street, City, Pin Code"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-primary text-white py-3 rounded text-lg font-bold hover:bg-green-800 disabled:opacity-50 mt-4"
            >
              {loading ? 'Processing...' : `Place Order (₹${cartTotal})`}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}