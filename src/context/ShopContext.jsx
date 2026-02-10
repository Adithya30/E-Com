import { createContext, useState, useContext } from 'react';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Add Item
  const addToCart = (product, variant = null) => {
    setCartItems((prev) => {
      // Create a unique ID for the cart item based on product ID and variant
      const cartItemId = variant ? `${product.id}-${variant.name}` : product.id;

      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === cartItemId ? { ...item, qty: item.qty + 1 } : item
        );
      }

      return [...prev, {
        ...product,
        cartItemId, // Unique ID for cart operations
        variant,    // Store variant details { name, price }
        price: variant ? variant.price : product.price, // Override price if variant exists
        qty: 1
      }];
    });
  };

  // Remove Item
  const removeFromCart = (cartItemId) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  // Decrease Quantity
  const decreaseQty = (cartItemId) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        if (existing.qty === 1) {
          return prev.filter((item) => item.cartItemId !== cartItemId);
        }
        return prev.map((item) =>
          item.cartItemId === cartItemId ? { ...item, qty: item.qty - 1 } : item
        );
      }
      return prev;
    });
  };

  // NEW: Clear Cart (Call this after purchase)
  const clearCart = () => {
    setCartItems([]);
  };

  // Calculate Total
  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  return (
    <ShopContext.Provider value={{ cartItems, addToCart, removeFromCart, decreaseQty, clearCart, cartTotal }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);