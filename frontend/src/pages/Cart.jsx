import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartProvider';
import api from '../services/api';

const Cart = () => {
  const navigate = useNavigate();
  const { 
    cartItems, 
    cartTotal, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    checkCartAvailability,
    removeUnavailableItems,
    incrementQuantity,
    decrementQuantity,
    getItemQuantity
  } = useCart();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResults, setAvailabilityResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check availability when cart loads
  useEffect(() => {
    if (cartItems.length > 0) {
      checkItemAvailability();
    }
  }, []);

  const checkItemAvailability = async () => {
    try {
      setCheckingAvailability(true);
      setError('');
      const result = await checkCartAvailability();
      
      // Check if result is valid
      if (!result || typeof result !== 'object') {
        console.error('Invalid result from checkCartAvailability:', result);
        setError('Failed to check availability. Please try again.');
        return;
      }
      
      // Check if result has allAvailable property
      if (result.allAvailable === undefined) {
        console.error('Missing allAvailable in result:', result);
        // Still set the results for debugging
        setAvailabilityResults(result);
        return;
      }
      
      // Now we can safely use result.allAvailable
      if (!result.allAvailable && result.unavailableItems && result.unavailableItems.length > 0) {
        // Remove unavailable items
        removeUnavailableItems(result.unavailableItems);
        
        setAvailabilityResults(result);
        
        // Show error message
        setTimeout(() => {
          setError(`Some items are no longer available. ${result.unavailableItems.length} item(s) have been removed from your cart.`);
          setTimeout(() => setError(''), 5000);
        }, 100);
      } else {
        setAvailabilityResults(result);
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      setError('Error checking item availability. Please try again.');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true);
      setError('');
      
      // Check availability before proceeding
      const availability = await checkCartAvailability();
      
      // Validate availability response
      if (!availability || typeof availability !== 'object') {
        setIsCheckingOut(false);
        setError('Unable to verify cart items. Please try again.');
        return;
      }
      
      // Check if allAvailable property exists
      if (availability.allAvailable === undefined) {
        console.warn('Missing allAvailable in availability check:', availability);
        // Continue anyway for now
      } else if (!availability.allAvailable) {
        setIsCheckingOut(false);
        setError('Some items in your cart are no longer available. Please review your cart.');
        return;
      }
      
      // Additional safety checks
      const hasOutOfStock = cartItems.some(item => {
        const availableQty = item.availableQuantity || item.quantity || 0;
        return availableQty <= 0;
      });
      
      if (hasOutOfStock) {
        setIsCheckingOut(false);
        setError('Some items are out of stock. Please remove them before checkout.');
        return;
      }
      
      const hasQuantityIssues = cartItems.some(item => {
        const availableQty = item.availableQuantity || item.quantity || 0;
        return item.quantity > availableQty;
      });
      
      if (hasQuantityIssues) {
        setIsCheckingOut(false);
        setError('Some items exceed available stock. Please adjust quantities.');
        return;
      }
      
      // Proceed to checkout
      navigate('/checkout');
    } catch (err) {
      console.error('Error during checkout:', err);
      setError('Error processing checkout. Please try again.');
      setIsCheckingOut(false);
    }
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    const item = cartItems.find(item => item._id === itemId);
    if (!item) return;
    
    const availableQuantity = item.availableQuantity || item.quantity || 0;
    
    if (newQuantity > availableQuantity) {
      setError(`Cannot set quantity to ${newQuantity}. Only ${availableQuantity} available.`);
      return;
    }
    
    updateQuantity(itemId, newQuantity);
  };

  const handleIncrementQuantity = (itemId) => {
    const item = cartItems.find(item => item._id === itemId);
    if (!item) return;
    
    const availableQuantity = item.availableQuantity || item.quantity || 0;
    const currentInCart = getItemQuantity(itemId);
    
    if (currentInCart >= availableQuantity) {
      setError(`Cannot add more. Only ${availableQuantity} available.`);
      return;
    }
    
    incrementQuantity(itemId);
  };

  const handleDecrementQuantity = (itemId) => {
    decrementQuantity(itemId);
  };

  // Debug: Log cart items structure
  useEffect(() => {
    if (cartItems.length > 0) {
      console.log('Cart items structure:', cartItems.map(item => ({
        _id: item._id,
        title: item.title,
        quantity: item.quantity,
        availableQuantity: item.availableQuantity,
        price: item.price
      })));
    }
  }, [cartItems]);

  if (cartItems.length === 0) {
    return (
      <div style={{ 
        maxWidth: '800px', 
        margin: '80px auto', 
        padding: '40px 20px',
        textAlign: 'center',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 20px rgba(0,0,0,0.08)'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px', color: '#4361ee', opacity: 0.7 }}>
          🛒
        </div>
        <h1 style={{ 
          marginBottom: '16px', 
          color: '#212529',
          fontSize: '32px',
          background: 'linear-gradient(135deg, #4361ee, #7209b7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Your Cart is Empty
        </h1>
        <p style={{ 
          color: '#6c757d', 
          marginBottom: '30px', 
          maxWidth: '500px', 
          margin: '0 auto 30px',
          fontSize: '18px',
          lineHeight: '1.6'
        }}>
          Looks like you haven't added any items to your cart yet. Browse our marketplace to find study materials!
        </p>
        <Link 
          to="/items" 
          style={{ 
            padding: '16px 32px', 
            fontSize: '16px',
            background: 'linear-gradient(135deg, #4361ee, #7209b7)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'all 0.3s',
            display: 'inline-block'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(67, 97, 238, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Browse Items
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
      {/* Error Message */}
      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #ff6b6b, #e63946)',
          color: 'white',
          padding: '16px 20px',
          borderRadius: '10px',
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <span style={{ flex: 1 }}>{error}</span>
          <button 
            onClick={() => setError('')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div style={{
          background: 'linear-gradient(135deg, #38b000, #2d9100)',
          color: 'white',
          padding: '16px 20px',
          borderRadius: '10px',
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <span style={{ flex: 1 }}>{success}</span>
        </div>
      )}

      {/* Debug Info - Only show in development */}
      {process.env.NODE_ENV === 'development' && availabilityResults && (
        <div style={{
          background: '#e3f2fd',
          color: '#1565c0',
          padding: '10px 15px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div><strong>Debug Info:</strong> Availability Results</div>
          <div>All Available: {String(availabilityResults.allAvailable)}</div>
          <div>Has Results: {availabilityResults.results ? 'Yes' : 'No'}</div>
          <div>Unavailable Items: {availabilityResults.unavailableItems?.length || 0}</div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #4361ee, #7209b7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: '700'
        }}>
          Shopping Cart
        </h1>
        <p style={{ color: '#6c757d', fontSize: '1.125rem' }}>
          Review your items before checkout
        </p>
      </div>

      {/* Availability Check Banner */}
      {availabilityResults && availabilityResults.allAvailable === false && (
        <div style={{
          background: 'linear-gradient(135deg, #fff3cd, #ffc107)',
          color: '#856404',
          padding: '15px 20px',
          borderRadius: '10px',
          marginBottom: '30px',
          border: '1px solid #ffeaa7',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <span style={{ flex: 1 }}>
            Some items in your cart may be unavailable. Click "Check Availability" to verify.
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
        {/* Cart Items */}
        <div style={{ 
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '30px',
            paddingBottom: '20px',
            borderBottom: '2px solid #f8f9fa'
          }}>
            <h2 style={{ fontSize: '20px', color: '#212529', fontWeight: '600' }}>
              Cart Items ({cartItems.length})
            </h2>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={checkItemAvailability}
                disabled={checkingAvailability}
                style={{ 
                  padding: '10px 20px', 
                  fontSize: '14px',
                  border: '2px solid #4361ee',
                  background: 'transparent',
                  borderRadius: '8px',
                  color: '#4361ee',
                  fontWeight: '500',
                  transition: 'all 0.3s',
                  cursor: checkingAvailability ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: checkingAvailability ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!checkingAvailability) {
                    e.target.style.background = '#eef2ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!checkingAvailability) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                {checkingAvailability ? (
                  <>
                    <div style={{ 
                      width: '14px', 
                      height: '14px', 
                      border: '2px solid rgba(67, 97, 238, 0.3)',
                      borderTop: '2px solid #4361ee',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Checking...
                  </>
                ) : (
                  '🔄 Check Availability'
                )}
              </button>
              
              <button 
                onClick={clearCart}
                style={{ 
                  padding: '10px 20px', 
                  fontSize: '14px',
                  border: '2px solid #e63946',
                  background: 'transparent',
                  borderRadius: '8px',
                  color: '#e63946',
                  fontWeight: '500',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#ffe6e6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}
              >
                🗑️ Clear Cart
              </button>
            </div>
          </div>

          {cartItems.map((item) => {
            const availableQuantity = item.availableQuantity || item.quantity || 0;
            const isLowStock = availableQuantity <= 3 && availableQuantity > 0;
            const isOutOfStock = availableQuantity <= 0;
            
            return (
              <div 
                key={item._id} 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '100px 1fr auto', 
                  gap: '20px',
                  padding: '20px 0',
                  borderBottom: '1px solid #f8f9fa',
                  alignItems: 'center',
                  position: 'relative',
                  opacity: isOutOfStock ? 0.6 : 1
                }}
              >
                {/* Stock Status Badge */}
                {isLowStock && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: '#fff3cd',
                    color: '#856404',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    zIndex: 1,
                    border: '1px solid #ffeaa7'
                  }}>
                  </div>
                )}
                
                {isOutOfStock && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: '#f8d7da',
                    color: '#721c24',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    zIndex: 1,
                    border: '1px solid #f5c6cb'
                  }}>
                    ❌ OUT OF STOCK
                  </div>
                )}

                {/* Item Image */}
                <div style={{ 
                  width: '100px', 
                  height: '100px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {item.imageURL ? (
                    <img 
                      src={item.imageURL} 
                      alt={item.title}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        filter: isOutOfStock ? 'grayscale(100%)' : 'none'
                      }}
                    />
                  ) : (
                    <div style={{ 
                      color: isOutOfStock ? '#adb5bd' : '#adb5bd', 
                      fontSize: '24px' 
                    }}>
                      📚
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div>
                  <h3 style={{ 
                    fontSize: '18px', 
                    marginBottom: '8px', 
                    color: isOutOfStock ? '#6c757d' : '#212529',
                    fontWeight: '600'
                  }}>
                    <Link 
                      to={`/item/${item._id}`} 
                      style={{ 
                        color: 'inherit', 
                        textDecoration: 'none',
                        transition: 'color 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isOutOfStock) {
                          e.currentTarget.style.color = '#4361ee';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isOutOfStock) {
                          e.currentTarget.style.color = isOutOfStock ? '#6c757d' : '#212529';
                        }
                      }}
                    >
                      {item.title}
                      {isOutOfStock && ' (Out of Stock)'}
                    </Link>
                  </h3>
                  
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#6c757d', 
                    marginBottom: '10px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.description}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      color: isOutOfStock ? '#6c757d' : '#4361ee'
                    }}>
                      Rs. {parseFloat(item.price).toFixed(2)}
                    </span>
                    
                    {item.category && (
                      <span style={{ 
                        fontSize: '12px', 
                        background: '#eef2ff',
                        color: '#4361ee',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontWeight: '500'
                      }}>
                        {item.category}
                      </span>
                    )}
                  </div>

                  {/* Stock Information */}
                  <div style={{ 
                    fontSize: '12px', 
                    color: isOutOfStock ? '#dc3545' : (isLowStock ? '#ffc107' : '#28a745'),
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>📦</span>
                    <span>
                      {isOutOfStock ? 'Out of stock' : 
                       isLowStock ? `Only ${availableQuantity} left` : 
                       `${availableQuantity} available`}
                    </span>
                    
                    {/* Cart vs Available Warning */}
                    {!isOutOfStock && item.quantity > availableQuantity && (
                      <span style={{ 
                        marginLeft: '10px', 
                        color: '#dc3545',
                        fontWeight: '600'
                      }}>
                        ⚠️ Exceeds available stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls & Remove */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-end', 
                  gap: '15px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button 
                      onClick={() => handleDecrementQuantity(item._id)}
                      disabled={item.quantity <= 1 || isOutOfStock}
                      style={{ 
                        width: '32px',
                        height: '32px',
                        background: item.quantity <= 1 || isOutOfStock ? '#e9ecef' : '#f8f9fa',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '18px',
                        color: item.quantity <= 1 || isOutOfStock ? '#adb5bd' : '#495057',
                        cursor: item.quantity <= 1 || isOutOfStock ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        if (!(item.quantity <= 1 || isOutOfStock)) {
                          e.target.style.background = '#e63946';
                          e.target.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!(item.quantity <= 1 || isOutOfStock)) {
                          e.target.style.background = '#f8f9fa';
                          e.target.style.color = '#495057';
                        }
                      }}
                    >
                      -
                    </button>
                    
                    <div style={{ 
                      width: '60px', 
                      padding: '8px',
                      border: `2px solid ${isOutOfStock ? '#e9ecef' : 
                              (item.quantity > availableQuantity ? '#dc3545' : '#e0e0e0')}`,
                      borderRadius: '6px',
                      fontSize: '16px',
                      textAlign: 'center',
                      background: isOutOfStock ? '#f8f9fa' : 'white',
                      color: isOutOfStock ? '#adb5bd' : '#212529'
                    }}>
                      {item.quantity}
                    </div>
                    
                    <button 
                      onClick={() => handleIncrementQuantity(item._id)}
                      disabled={isOutOfStock || item.quantity >= availableQuantity}
                      style={{ 
                        width: '32px',
                        height: '32px',
                        background: isOutOfStock || item.quantity >= availableQuantity ? '#e9ecef' : '#f8f9fa',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '18px',
                        color: isOutOfStock || item.quantity >= availableQuantity ? '#adb5bd' : '#495057',
                        cursor: isOutOfStock || item.quantity >= availableQuantity ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        if (!(isOutOfStock || item.quantity >= availableQuantity)) {
                          e.target.style.background = '#4caf50';
                          e.target.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!(isOutOfStock || item.quantity >= availableQuantity)) {
                          e.target.style.background = '#f8f9fa';
                          e.target.style.color = '#495057';
                        }
                      }}
                    >
                      +
                    </button>
                  </div>
                  
                  <div style={{ fontSize: '16px', fontWeight: '600', color: isOutOfStock ? '#6c757d' : '#212529' }}>
                    Rs. {(item.price * item.quantity).toFixed(2)}
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item._id)}
                    style={{ 
                      padding: '8px 16px', 
                      fontSize: '14px',
                      border: '2px solid #e0e0e0',
                      background: 'transparent',
                      borderRadius: '6px',
                      color: '#6c757d',
                      fontWeight: '500',
                      transition: 'all 0.3s',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#ffe6e6';
                      e.target.style.color = '#e63946';
                      e.target.style.borderColor = '#ffcccc';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#6c757d';
                      e.target.style.borderColor = '#e0e0e0';
                    }}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div style={{ 
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
          height: 'fit-content',
          position: 'sticky',
          top: '20px'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            marginBottom: '25px', 
            color: '#212529',
            fontWeight: '600',
            paddingBottom: '20px',
            borderBottom: '2px solid #f8f9fa'
          }}>
            Order Summary
          </h2>
          
          <div style={{ marginBottom: '25px' }}>
            {/* Item Count */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '12px'
            }}>
              <span style={{ color: '#6c757d', fontSize: '16px' }}>Items</span>
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            
            {/* Subtotal */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '12px'
            }}>
              <span style={{ color: '#6c757d', fontSize: '16px' }}>Subtotal</span>
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                Rs. {cartTotal.toFixed(2)}
              </span>
            </div>
            
            {/* Shipping */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '12px'
            }}>
              <span style={{ color: '#6c757d', fontSize: '16px' }}>Shipping</span>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#4caf50' }}>
                Free
              </span>
            </div>
            
            {/* Total */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '30px',
              paddingBottom: '20px',
              borderBottom: '2px solid #f8f9fa'
            }}>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#212529' }}>
                Total
              </span>
              <span style={{ fontSize: '24px', fontWeight: '700', color: '#4361ee' }}>
                Rs. {cartTotal.toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Checkout Button */}
          <button 
            onClick={handleCheckout}
            disabled={isCheckingOut || cartItems.some(item => 
              (item.availableQuantity || item.quantity || 0) <= 0 || 
              item.quantity > (item.availableQuantity || item.quantity || 0)
            )}
            style={{ 
              width: '100%',
              padding: '18px',
              fontSize: '16px',
              background: isCheckingOut || cartItems.some(item => 
                (item.availableQuantity || item.quantity || 0) <= 0 || 
                item.quantity > (item.availableQuantity || item.quantity || 0)
              ) ? '#adb5bd' : 'linear-gradient(135deg, #4361ee, #7209b7)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600',
              transition: 'all 0.3s',
              cursor: isCheckingOut || cartItems.some(item => 
                (item.availableQuantity || item.quantity || 0) <= 0 || 
                item.quantity > (item.availableQuantity || item.quantity || 0)
              ) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '15px'
            }}
            onMouseEnter={(e) => {
              if (!isCheckingOut && !cartItems.some(item => 
                (item.availableQuantity || item.quantity || 0) <= 0 || 
                item.quantity > (item.availableQuantity || item.quantity || 0)
              )) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(67, 97, 238, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCheckingOut && !cartItems.some(item => 
                (item.availableQuantity || item.quantity || 0) <= 0 || 
                item.quantity > (item.availableQuantity || item.quantity || 0)
              )) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {isCheckingOut ? (
              <>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTop: '3px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Processing...
              </>
            ) : cartItems.some(item => 
              (item.availableQuantity || item.quantity || 0) <= 0 || 
              item.quantity > (item.availableQuantity || item.quantity || 0)
            ) ? (
              '⚠️ Fix Cart Issues First'
            ) : (
              'Proceed to Checkout →'
            )}
          </button>
          
          {/* Cart Issues Warning */}
          {cartItems.some(item => 
            (item.availableQuantity || item.quantity || 0) <= 0 || 
            item.quantity > (item.availableQuantity || item.quantity || 0)
          ) && (
            <div style={{
              background: '#fff3cd',
              color: '#856404',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '15px',
              border: '1px solid #ffeaa7',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>Your cart contains items that need attention before checkout.</span>
            </div>
          )}
          
          <div style={{ 
            marginTop: '20px', 
            fontSize: '14px', 
            color: '#6c757d',
            textAlign: 'center'
          }}>
            <p>Free shipping on all orders</p>
            <p>Cash on Delivery available</p>
          </div>
        </div>
      </div>

      {/* Continue Shopping Link */}
      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <Link 
          to="/items" 
          style={{ 
            padding: '14px 32px', 
            fontSize: '16px',
            border: '2px solid #4361ee',
            background: 'transparent',
            borderRadius: '8px',
            color: '#4361ee',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'all 0.3s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(67, 97, 238, 0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ← Continue Shopping
        </Link>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 900px) {
          .cart-container {
            grid-template-columns: 1fr !important;
          }
          
          .order-summary {
            position: static !important;
          }
          
          .cart-item {
            grid-template-columns: 80px 1fr !important;
          }
        }
        
        @media (max-width: 600px) {
          .cart-item {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          
          .cart-item > div:last-child {
            align-items: center !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Cart;