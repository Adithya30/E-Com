import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Package, CheckCircle, Clock, Upload, RefreshCw, Image as ImageIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ui/ConfirmationModal';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const ADMIN_EMAIL = "admin@greennest.com";

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { }
  });

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email !== ADMIN_EMAIL) {
        navigate('/');
      }
    };
    checkAdmin();
  }, []);

  const [form, setForm] = useState({
    name: '',
    category: 'Indoor',
    price: '',
    description: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [categories, setCategories] = useState(['Indoor', 'Outdoor', 'Pots', 'Manure', 'Seeds', 'Tools']); // Default fallback
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Variants State
  const [variants, setVariants] = useState([]);
  const [variantInput, setVariantInput] = useState({ name: '', price: '' });

  useEffect(() => {
    fetchOrders();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('category');

    if (data) {
      const uniqueCats = [...new Set(data.map(item => item.category))];
      // Merge with defaults to ensure basics are always there
      const mergedCats = [...new Set([...categories, ...uniqueCats])];
      setCategories(mergedCats);
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'Pending Payment') // HIDE Unpaid/Abandoned checkouts
      .not('payment_id', 'is', null); // HIDE anything without a payment ID (strict check)

    if (data) {
      // Sort: Pending (Oldest) -> Shipped (New) -> Delivered (New)
      const priority = { 'Pending': 1, 'Shipped': 2, 'Delivered': 3 };

      const sorted = data.sort((a, b) => {
        const pA = priority[a.status] || 4;
        const pB = priority[b.status] || 4;

        if (pA !== pB) return pA - pB;

        // If status same, Pending = Oldest First, Others = Newest First
        if (a.status === 'Pending') {
          return new Date(a.created_at) - new Date(b.created_at);
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setOrders(sorted);
    }
    if (error) console.error("Error fetching orders:", error);
  };

  // Product Management State
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setProducts(data);
    if (error) console.error("Error fetching products:", error);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      fetchOrders();
    }
  };

  const updateTrackingId = async (orderId, trackingId) => {
    const { error } = await supabase
      .from('orders')
      .update({ tracking_id: trackingId })
      .eq('id', orderId);

    if (!error) {
      addToast("Tracking ID updated successfully!", "success");
      fetchOrders();
    } else {
      addToast("Failed to update Tracking ID.", "error");
    }
  };

  const sendWhatsAppUpdate = (order) => {
    const itemsList = order.items.map(i => `   • ${i.name} (x${i.qty})`).join('\n');
    const trackingSection = order.tracking_id ? `\n\n\uD83D\uDE9A *Tracking Info:*\n   ID: ${order.tracking_id}` : '';

    // Format message using Unicode escapes to ensure emoji support across all platforms/encodings
    // \uD83C\uDF3F = Herb
    // \uD83D\uDC4B = Waving Hand
    // \uD83D\uDE9A = Truck
    // \uD83D\uDCA8 = Dash
    // \uD83D\uDCE6 = Package
    // \uD83D\uDCB0 = Money Bag
    // \uD83C\uDFE1 = House with Garden
    // \uD83D\uDC9A = Green Heart
    // \uD83C\uDF3B = Sunflower

    const message = `\uD83C\uDF3F *Kerala Kissan Kendra Order Update* \uD83C\uDF3F\n\nHi *${order.customer_name}*! \uD83D\uDC4B\n\nExciting news! Your order is packed with care and is now on its way to you. \uD83D\uDE9A\uD83D\uDCA8\n\n\uD83D\uDCE6 *Order Details:*\n${itemsList}\n\n\uD83D\uDCB0 *Total:* ₹${order.total_amount}${trackingSection}\n\nThank you for bringing a piece of nature home! \uD83C\uDFE1\uD83D\uDC9A\n\nHappy Planting! \uD83C\uDF3B\n*Team Kerala Kissan Kendra*`;

    // Use api.whatsapp.com for better cross-platform support
    const url = `https://api.whatsapp.com/send?phone=${order.customer_phone}&text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  // Product Actions
  const handleDeleteProduct = (id) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Product?",
      message: "Are you sure you want to delete this product? This action cannot be undone.",
      onConfirm: async () => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) addToast("Error deleting product", "error");
        else {
          fetchProducts();
          addToast("Product deleted successfully!", "info");
        }
      }
    });
  };

  const toggleStock = async (product) => {
    const { error } = await supabase
      .from('products')
      .update({ in_stock: !product.in_stock })
      .eq('id', product.id);

    if (error) addToast("Error updating stock status", "error");
    else fetchProducts();
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description || ''
    });
    setVariants(product.variants || []);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast(`Editing ${product.name}`, "info");
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setForm({ name: '', category: 'Indoor', price: '', description: '' });
    setVariants([]);
    setImageFile(null);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleImageChange = (e) => setImageFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return addToast("Please fill all required fields!", "error");
    setLoading(true);

    try {
      let publicUrl = editingProduct ? editingProduct.image_url : null;

      // Upload new image if selected
      if (imageFile) {
        const fileName = `${Date.now()}_${imageFile.name}`;
        await supabase.storage.from('product-images').upload(fileName, imageFile);
        const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      const productData = {
        name: form.name,
        category: form.category,
        price: form.price,
        description: form.description,
        image_url: publicUrl,
        variants: variants
      };

      if (editingProduct) {
        // UPDATE Existing Product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        addToast("Product updated successfully! ✨", "success");
      } else {
        // CREATE New Product
        if (!imageFile) return addToast("Please upload a product image!", "error");
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
        addToast("Product added to inventory! 🌿", "success");
      }

      // Reset Form
      setEditingProduct(null);
      setForm({ name: '', category: 'Indoor', price: '', description: '' });
      setVariants([]);
      setImageFile(null);
      fetchProducts(); // Refresh list
    } catch (error) {
      addToast("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const clearDeliveredOrders = async () => {
    // Note: Confirmation is handled by the Modal now, so we just execution deletion here

    // Attempt to delete 'Delivered' AND 'delivered' just in case
    const { error, data } = await supabase
      .from('orders')
      .delete()
      .in('status', ['Delivered', 'delivered', 'DELIVERED']) // Handle common cases
      .select();

    if (error) {
      addToast("Failed to clear orders: " + error.message, "error");
    } else {
      const count = data ? data.length : 0;
      if (count === 0) {
        addToast("No 'Delivered' orders found to clear.", "info");
      } else {
        addToast(`Cleared ${count} delivered orders! 🧹`, "success");
        fetchOrders();
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-bg pt-28 pb-12">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold font-heading mb-8 text-primary-900">Admin Dashboard</h1>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* LEFT COLUMN: Add Product */}
          <div className="glass-panel p-8 rounded-2xl animate-slide-up">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Upload size={24} className="text-primary-600" />
                {editingProduct ? `Edit ${editingProduct.name}` : 'Add New Product'}
              </span>
              {editingProduct && (
                <button onClick={cancelEdit} className="text-sm text-red-500 font-bold hover:underline">
                  Cancel Edit
                </button>
              )}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Product Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary-200 outline-none transition" placeholder="e.g. Fiddle Leaf Fig" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-gray-700">Category</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(!isAddingCategory)}
                      className="text-xs text-primary-600 hover:text-primary-800 font-bold"
                    >
                      {isAddingCategory ? "Cancel" : "+ Add New"}
                    </button>
                  </div>

                  {isAddingCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New Category"
                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary-200 outline-none transition"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault(); // Stop form submission
                            if (newCategoryName.trim()) {
                              const newCat = newCategoryName.trim();
                              setCategories(prev => [...new Set([...prev, newCat])]);
                              setForm(prev => ({ ...prev, category: newCat }));
                              setNewCategoryName("");
                              setIsAddingCategory(false);
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            const newCat = newCategoryName.trim();
                            setCategories(prev => [...new Set([...prev, newCat])]);
                            setForm(prev => ({ ...prev, category: newCat }));
                            setNewCategoryName("");
                            setIsAddingCategory(false);
                          }
                        }}
                        className="bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 transition"
                      >
                        <CheckCircle size={18} />
                      </button>
                    </div>
                  ) : (
                    <select name="category" value={form.category} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary-200 outline-none transition">
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label>
                  <input type="number" name="price" value={form.price} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary-200 outline-none transition" placeholder="0.00" />
                </div>
              </div>

              {/* Variants Section */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="block text-sm font-bold text-gray-700 mb-2">Product Variants (Optional)</label>

                <div className="flex gap-2 mb-2">
                  <input
                    placeholder="Size/Weight (e.g. Small, 1kg)"
                    value={variantInput.name}
                    onChange={(e) => setVariantInput({ ...variantInput, name: e.target.value })}
                    className="flex-1 border p-2 rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={variantInput.price}
                    onChange={(e) => setVariantInput({ ...variantInput, price: e.target.value })}
                    className="w-24 border p-2 rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (variantInput.name && variantInput.price) {
                        // Parse price as float to ensure correct sorting
                        const newVariant = { ...variantInput, price: parseFloat(variantInput.price) };
                        setVariants([...variants, newVariant]);
                        setVariantInput({ name: '', price: '' });
                        // If it's the first variant, set main price to match (optional UX help)
                        if (variants.length === 0) setForm(prev => ({ ...prev, price: variantInput.price }));
                      }
                    }}
                    className="bg-secondary text-white px-3 rounded hover:bg-secondary-dark"
                  >
                    +
                  </button>
                </div>

                {variants.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {variants.map((v, i) => (
                      <div key={i} className="flex justify-between items-center bg-white p-2 rounded border text-sm">
                        <span>{v.name} - <b>₹{v.price}</b></span>
                        <button
                          type="button"
                          onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                          className="text-red-500 hover:text-red-700"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary-200 outline-none transition h-24" placeholder="Product details..." />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Product Image</label>

                <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-all p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />

                  {imageFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 mb-2 rounded-lg overflow-hidden border">
                        <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm text-green-600 font-bold truncate max-w-[200px]">{imageFile.name}</span>
                      <span className="text-xs text-gray-400 mt-1">Click to change</span>
                    </div>
                  ) : editingProduct && editingProduct.image_url ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 mb-2 rounded-lg overflow-hidden border">
                        <img src={editingProduct.image_url} alt="Current" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm text-gray-600 font-bold">Current Image</span>
                      <span className="text-xs text-gray-400 mt-1">Click to replace</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 group-hover:text-primary-600 transition-colors">
                      <div className="p-3 bg-gray-100 rounded-full mb-3 group-hover:bg-primary-50 transition-colors">
                        <ImageIcon size={24} />
                      </div>
                      <span className="font-bold text-sm">Click to upload image</span>
                      <span className="text-xs mt-1">SVG, PNG, JPG (Max 5MB)</span>
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full justify-center mt-2">
                {loading ? 'Processing...' : (editingProduct ? 'Update Product' : 'Add Product')}
              </Button>
            </form>
          </div>

          {/* RIGHT COLUMN: Incoming Orders */}
          <div className="glass-panel p-8 rounded-2xl animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Package size={24} className="text-primary-600" /> Incoming Orders
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setModalConfig({
                      isOpen: true,
                      title: "Clear Delivered Orders?",
                      message: "Are you sure you want to remove all delivered orders? This action cannot be undone.",
                      onConfirm: clearDeliveredOrders
                    });
                  }}
                  className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  title="Clear all Delivered orders"
                >
                  <X size={16} /> Clear Delivered
                </button>
                <button onClick={fetchOrders} className="text-primary-600 hover:text-primary-800 transition p-2 rounded-full hover:bg-primary-50">
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {orders.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <Package size={48} className="mx-auto mb-2 opacity-30" />
                  <p>No orders yet.</p>
                </div>
              )}

              {orders.map((order) => (
                <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">

                  {/* Header: Name & Status */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-primary-900">{order.customer_name}</h3>
                      <p className="text-sm text-gray-500">{order.customer_phone}</p>
                    </div>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`text-xs font-bold px-3 py-1 rounded-full border cursor-pointer ${order.status === 'Pending' ? 'text-orange-600 bg-orange-50 border-orange-200' :
                        order.status === 'Shipped' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-green-600 bg-green-50 border-green-200'
                        }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>

                  {/* Address */}
                  <div className="text-sm text-gray-600 mb-4 bg-neutral-bg p-3 rounded-lg flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">📍</span> {order.address}
                  </div>

                  {/* Items List */}
                  <div className="mb-4 space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm py-1 border-b border-dashed border-gray-100 last:border-0">
                        <span className="font-medium text-gray-700">{item.name} <span className="text-gray-400 font-normal">x{item.qty}</span></span>
                        <span className="font-bold text-gray-900">₹{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center font-bold pt-3 border-t border-gray-100">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="text-xl text-primary-700">₹{order.total_amount}</span>
                  </div>

                  {/* WhatsApp & Tracking */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Tracking ID / Courier</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue={order.tracking_id || ''}
                        onBlur={(e) => {
                          if (e.target.value !== order.tracking_id) {
                            updateTrackingId(order.id, e.target.value);
                          }
                        }}
                        placeholder="Enter Tracking ID..."
                        className="flex-1 text-sm border p-2 rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-primary-300 outline-none transition"
                      />
                      <button
                        onClick={() => sendWhatsAppUpdate(order)}
                        className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition flex items-center gap-1 text-sm font-bold"
                        title="Send WhatsApp Update"
                      >
                        WhatsApp
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>

        {/* PRODUCT INVENTORY SECTION */}
        <div className="mt-12 glass-panel p-8 rounded-2xl animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <Package size={24} className="text-primary-600" /> Product Inventory
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-sm">
                  <th className="py-3 font-bold">Image</th>
                  <th className="py-3 font-bold">Name</th>
                  <th className="py-3 font-bold">Category</th>
                  <th className="py-3 font-bold">Price</th>
                  <th className="py-3 font-bold">Stock</th>
                  <th className="py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3">
                      <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded object-cover border border-gray-100" />
                    </td>
                    <td className="py-3 font-bold text-gray-800">{product.name}</td>
                    <td className="py-3 text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{product.category}</span>
                    </td>
                    <td className="py-3 font-bold text-gray-700">₹{product.price}</td>
                    <td className="py-3">
                      <button
                        onClick={() => toggleStock(product)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${product.in_stock
                          ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                          }`}
                      >
                        {product.in_stock !== false ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-blue-600 hover:text-blue-800 font-bold text-sm px-3 py-1 hover:bg-blue-50 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-500 hover:text-red-700 font-bold text-sm px-3 py-1 hover:bg-red-50 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">No products found. Add one above!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
      />
    </div>
  );
}