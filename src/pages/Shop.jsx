import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import ProductCard from '../components/ProductCard';
import { Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [filter, setFilter] = useState(location.state?.category || 'All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  // Update filter if navigated from Home
  useEffect(() => {
    if (location.state?.category) {
      setFilter(location.state.category);
    }
  }, [location.state]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredProducts = products.filter(product => {
    const matchesCategory = filter === 'All' || product.category === filter;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const [categories, setCategories] = useState(['All', 'Indoor', 'Outdoor', 'Pots', 'Manure']);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('products').select('category');
      if (data) {
        const uniqueCats = [...new Set(data.map(item => item.category))];
        setCategories(['All', ...new Set([...categories.filter(c => c !== 'All'), ...uniqueCats])]);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-bg pt-28 pb-20">
      <div className="container mx-auto px-6">

        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-primary-900 mb-4">Explore Our Collection</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Find the perfect green companion for your space from our wide range of plants and accessories.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 glass-panel p-4 rounded-2xl mx-auto max-w-5xl">

          {/* Categories */}
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide py-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 border
                  ${filter === cat
                    ? 'bg-green-600 text-white border-green-600 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50 hover:border-green-300 hover:text-green-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search (Visual Only for now) */}
          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search plants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-50 border border-transparent focus:bg-white focus:border-green-300 focus:outline-none transition-all placeholder-gray-400 text-sm"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Product Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => (
              <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block p-6 rounded-full bg-gray-100 mb-4">
              <Search size={48} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">No products found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}