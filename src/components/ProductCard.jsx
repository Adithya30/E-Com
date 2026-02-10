import { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import Button from './ui/Button';

export default function ProductCard({ product }) {
  const { addToCart, decreaseQty, cartItems } = useShop();

  // Helper to safely get variants
  // This handles cases where variants might be stored as a JSON string in Supabase
  const getVariants = () => {
    let v = product.variants;
    if (typeof v === 'string') {
      try {
        v = JSON.parse(v);
      } catch (e) {
        console.error("Failed to parse variants for product:", product.name, e);
        return [];
      }
    }
    return Array.isArray(v) ? v : [];
  };

  const variantsData = getVariants();
  const hasVariants = variantsData.length > 0;

  // Sort variants by price ascending so cheapest/smallest is default
  const sortedVariants = hasVariants
    ? [...variantsData].sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0))
    : [];

  // Initialize selectedVariant
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    if (hasVariants && sortedVariants.length > 0) {
      setSelectedVariant(sortedVariants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [product]); // Re-run when product prop changes

  // Determine current price
  const currentPrice = selectedVariant && selectedVariant.price
    ? selectedVariant.price
    : product.price;

  // Find quantity in cart
  const cartItem = cartItems.find((item) => {
    if (selectedVariant) return item.id === product.id && item.variant?.name === selectedVariant.name;
    return item.id === product.id && !item.variant;
  });

  const quantity = cartItem ? cartItem.qty : 0;

  // Stock Status Logic
  const isOutOfStock = product.in_stock === false;

  return (
    <div className={`group bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-hover transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 flex flex-col h-full ${isOutOfStock ? 'opacity-75 grayscale-[0.5]' : ''}`}>
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden bg-gray-50 flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <span className="text-gray-400">No Image</span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm tracking-wider shadow-lg transform -rotate-12 border-2 border-white">
              OUT OF STOCK
            </span>
          </div>
        )}

        {/* Overlay Button - Hide if out of stock */}
        {!isOutOfStock && (
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              onClick={(e) => {
                e.preventDefault();
                addToCart(product, selectedVariant);
              }}
              variant="white"
              className="rounded-full !p-3 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
            >
              <Plus size={24} className="text-primary-600" />
            </Button>
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-2 py-1 rounded-md">
            {product.category}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-2 font-heading leading-tight group-hover:text-primary-700 transition-colors">
          {product.name}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-grow font-body">
          {product.description}
        </p>

        {/* Variant Selector */}
        {hasVariants && selectedVariant && (
          <div className="mb-3">
            <select
              value={selectedVariant.name || ''}
              onChange={(e) => {
                const v = sortedVariants.find(v => (v.name || JSON.stringify(v)) === e.target.value);
                setSelectedVariant(v);
              }}
              disabled={isOutOfStock}
              className="text-sm border border-gray-200 rounded-lg p-1 w-full text-gray-700 focus:ring-1 focus:ring-primary-300 outline-none disabled:bg-gray-100 disabled:text-gray-400"
            >
              {sortedVariants.map((v, i) => (
                <option key={i} value={v.name || JSON.stringify(v)}>
                  {v.name ? `${v.name} - ₹${v.price}` : `Variant ${i + 1} - ₹${v.price}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <span className="text-2xl font-bold text-gray-900 font-heading">₹{currentPrice}</span>

          {/* Cart Actions */}
          {isOutOfStock ? (
            <button
              disabled
              className="w-full max-w-[120px] py-2 rounded-full bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed"
            >
              Sold Out
            </button>
          ) : (
            quantity > 0 ? (
              <div className="flex items-center bg-green-600 rounded-full h-10 px-1 shadow-md group-hover:shadow-lg transition-all">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // Calculate specific ID for this variant
                    const targetId = selectedVariant ? `${product.id}-${selectedVariant.name}` : product.id;
                    decreaseQty(targetId);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-green-700 rounded-full transition-colors active:scale-90"
                >
                  <Minus size={16} strokeWidth={2.5} />
                </button>

                <span className="font-bold text-white text-sm px-2 min-w-[20px] text-center">
                  {quantity}
                </span>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    addToCart(product, selectedVariant);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-green-700 rounded-full transition-colors active:scale-90"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  addToCart(product, selectedVariant);
                }}
                className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 active:scale-95 transition-all shadow-md group-hover:shadow-lg"
                title="Add to Cart"
              >
                <Plus size={22} strokeWidth={2.5} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}