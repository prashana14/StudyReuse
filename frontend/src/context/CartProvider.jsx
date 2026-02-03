// src/context/CartProvider.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

// 1. Create the context (NOT exported)
const CartContext = createContext();

// 2. Create the provider component
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('studyReuseCart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
        localStorage.removeItem('studyReuseCart');
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('studyReuseCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Add to cart with quantity validation
  const addToCart = (item) => {
    if (item.status !== 'Available') {
      alert(`Item is ${item.status}. Cannot add to cart.`);
      return;
    }

    const availableQuantity = item.quantity || 0;
    if (availableQuantity <= 0) {
      alert('Item is out of stock.');
      return;
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i._id === item._id);
      
      if (existingItem) {
        const currentInCart = existingItem.quantity || 1;
        if (currentInCart >= availableQuantity) {
          alert(`Cannot add more. Only ${availableQuantity} available.`);
          return prevItems;
        }
        
        return prevItems.map(i =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      
      return [...prevItems, { 
        ...item, 
        quantity: 1,
        availableQuantity: availableQuantity
      }];
    });
  };

  // Remove from cart
  const removeFromCart = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== itemId));
  };

  // Update quantity
  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item._id === itemId) {
          const availableQuantity = item.availableQuantity || item.quantity || 0;
          if (quantity > availableQuantity) {
            alert(`Cannot set quantity to ${quantity}. Only ${availableQuantity} available.`);
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  // Increment quantity
  const incrementQuantity = (itemId) => {
    updateQuantity(itemId, getItemQuantity(itemId) + 1);
  };

  // Decrement quantity
  const decrementQuantity = (itemId) => {
    const currentQty = getItemQuantity(itemId);
    if (currentQty > 1) {
      updateQuantity(itemId, currentQty - 1);
    } else {
      removeFromCart(itemId);
    }
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Get item quantity
  const getItemQuantity = (itemId) => {
    const item = cartItems.find(i => i._id === itemId);
    return item ? item.quantity : 0;
  };

  // Calculate totals
  const cartTotal = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = item.quantity || 1;
    return sum + (price * quantity);
  }, 0);

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Check availability - FIXED VERSION
  const checkCartAvailability = useCallback(async () => {
    console.log('🔄 checkCartAvailability called with items:', cartItems);
    
    // If cart is empty, return empty result
    if (!cartItems || cartItems.length === 0) {
      console.log('Cart is empty, returning empty result');
      return {
        success: true,
        allAvailable: true,
        results: [],
        unavailableItems: [],
        message: 'Cart is empty'
      };
    }

    try {
      setIsLoading(true);
      console.log('📤 Preparing cart items for API...');
      
      // Format items for API - IMPORTANT: Use productId instead of itemId
      const cartForCheck = cartItems.map(item => ({
        productId: item._id,  // Changed from itemId to productId
        quantity: item.quantity || 1
      }));
      
      console.log('📤 Sending to API:', cartForCheck);
      
      // Try the API call
      const response = await api.post('/orders/check-availability', {
        cartItems: cartForCheck
      });
      
      console.log('📥 API Response received:', response);
      
      // Check if response is valid
      if (!response) {
        console.error('❌ No response from API');
        throw new Error('No response from server');
      }
      
      // Get the data from response
      const result = response.data || response;
      
      // Validate the result structure
      if (!result || typeof result !== 'object') {
        console.error('❌ Invalid response structure:', result);
        throw new Error('Invalid response from server');
      }
      
      // Ensure required properties exist
      const validatedResult = {
        success: result.success !== undefined ? result.success : true,
        allAvailable: result.allAvailable !== undefined ? result.allAvailable : true,
        results: result.results || result.items || [],
        unavailableItems: result.unavailableItems || [],
        message: result.message || 'Availability checked'
      };
      
      console.log('✅ Validated result:', validatedResult);
      return validatedResult;
      
    } catch (error) {
      console.error('❌ Error checking availability:', error);
      
      // Return a safe fallback object with the correct structure
      const fallbackResult = {
        success: false,
        allAvailable: true, // Assume available to not block users
        results: cartItems.map(item => ({
          productId: item._id,
          title: item.title || 'Unknown Item',
          requestedQuantity: item.quantity || 1,
          availableQuantity: item.availableQuantity || item.quantity || 10,
          isAvailable: true,
          price: item.price || 0,
          status: 'Available'
        })),
        unavailableItems: [],
        message: 'Availability check failed, using fallback data'
      };
      
      console.log('🔄 Returning fallback result:', fallbackResult);
      return fallbackResult;
      
    } finally {
      setIsLoading(false);
    }
  }, [cartItems]);

  // Remove unavailable items
  const removeUnavailableItems = (unavailableItems) => {
    setCartItems(prevItems => {
      const unavailableIds = unavailableItems.map(item => 
        item.itemId || item.productId || item._id
      );
      return prevItems.filter(item => !unavailableIds.includes(item._id));
    });
  };

  const value = {
    cartItems,
    cartTotal,
    cartCount,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    getItemQuantity,
    checkCartAvailability,
    removeUnavailableItems
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// 3. Create the custom hook
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}