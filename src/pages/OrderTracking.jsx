import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Package } from 'lucide-react';

export default function OrderTracking() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phone) return;
    
    setLoading(true);
    setSearched(true);
    
    // Fetch orders matching phone number
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl min-h-[60vh]">
      <h1 className="text-3xl font-bold text-center mb-8 text-green-primary">Track Your Order 🚚</h1>

      {/* Search Box */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="tel"
          placeholder="Enter your Phone Number (e.g., 9876543210)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1 border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-green-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-green-800"
        >
          {loading ? 'Searching...' : <Search />}
        </button>
      </form>

      {/* Results */}
      <div className="space-y-4">
        {searched && orders.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-10">
            <p>No orders found for this number.</p>
          </div>
        )}

        {orders.map((order) => (
          <div key={order.id} className="bg-white border rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4 border-b pb-3">
              <div>
                <p className="text-xs text-gray-500">Order ID: #{order.id}</p>
                <p className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                ${order.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 
                  order.status === 'Shipped' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                }`}>
                {order.status}
              </span>
            </div>

            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.name} <span className="text-gray-400">x{item.qty}</span></span>
                  <span className="font-medium">₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t flex justify-between font-bold">
              <span>Total Paid</span>
              <span className="text-green-700">₹{order.total_amount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}