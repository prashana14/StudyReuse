import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import apiService from '../services/api';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState('');
  
  // Shipping address form state
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nepal',
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!shippingAddress.fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!shippingAddress.phone.trim() || shippingAddress.phone.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }
    if (!shippingAddress.street.trim()) {
      setError('Please enter your street address');
      return false;
    }
    if (!shippingAddress.city.trim()) {
      setError('Please enter your city');
      return false;
    }
    if (!shippingAddress.state.trim()) {
      setError('Please enter your state');
      return false;
    }
    if (!shippingAddress.zipCode.trim()) {
      setError('Please enter your zip code');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);
    setError('');

    try {
      // Prepare order data
      const orderData = {
        items: cartItems.map(item => ({
          item: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: cartTotal * 1.08, // Including 8% tax
        shippingAddress,
        paymentMethod: 'Cash on Delivery',
        paymentStatus: 'Pending'
      };

      // Create order via API
      const response = await apiService.orders.create(orderData);
      
      // Success
      setOrderSuccess(true);
      setOrderId(response.data.data._id);
      clearCart();
      
      // Redirect to success page after 3 seconds
      setTimeout(() => {
        navigate(`/orders/${response.data.data._id}`);
      }, 3000);

    } catch (err) {
      console.error('Order placement error:', err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0 && !orderSuccess) {
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
          Cart is Empty
        </h1>
        <p style={{ 
          color: '#6c757d', 
          marginBottom: '30px', 
          fontSize: '18px'
        }}>
          Add items to your cart before checkout
        </p>
        <button 
          onClick={() => navigate('/items')}
          style={{ 
            padding: '16px 32px', 
            fontSize: '16px',
            background: 'linear-gradient(135deg, #4361ee, #7209b7)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            transition: 'all 0.3s',
            cursor: 'pointer'
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
        </button>
      </div>
    );
  }

  if (orderSuccess) {
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
        <div style={{ 
          fontSize: '80px', 
          marginBottom: '20px', 
          color: '#28a745'
        }}>
          ✅
        </div>
        <h1 style={{ 
          marginBottom: '16px', 
          color: '#212529',
          fontSize: '32px'
        }}>
          Order Placed Successfully!
        </h1>
        <p style={{ 
          color: '#6c757d', 
          marginBottom: '20px', 
          fontSize: '18px'
        }}>
          Your order has been received. Order ID: <strong>{orderId}</strong>
        </p>
        <p style={{ 
          color: '#6c757d', 
          marginBottom: '30px',
          fontSize: '16px'
        }}>
          Cash on Delivery selected. Pay when you receive your items.
        </p>
        <div style={{ 
          background: '#e8f5e9', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <p style={{ margin: '0', color: '#2e7d32' }}>
            Redirecting to order details in 3 seconds...
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate(`/orders/${orderId}`)}
            style={{ 
              padding: '14px 28px', 
              fontSize: '16px',
              background: '#28a745',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '600',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }}
          >
            View Order Details
          </button>
          <button 
            onClick={() => navigate('/items')}
            style={{ 
              padding: '14px 28px', 
              fontSize: '16px',
              background: 'transparent',
              border: '2px solid #4361ee',
              borderRadius: '8px',
              color: '#4361ee',
              fontWeight: '600',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const tax = cartTotal * 0.08;
  const finalTotal = cartTotal + tax;

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
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
          Checkout
        </h1>
        <p style={{ color: '#6c757d', fontSize: '1.125rem' }}>
          Complete your order
        </p>
      </div>

      {error && (
        <div style={{ 
          background: '#fff5f5', 
          border: '1px solid #ffcccc',
          color: '#d32f2f',
          padding: '15px 20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
        {/* Left Column - Shipping Details */}
        <div style={{ 
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            marginBottom: '25px', 
            color: '#212529',
            fontWeight: '600'
          }}>
            Shipping Address
          </h2>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#495057' 
                }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={shippingAddress.fullName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4361ee';
                    e.target.style.boxShadow = '0 0 0 3px rgba(67, 97, 238, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#495057' 
                }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={shippingAddress.phone}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4361ee';
                    e.target.style.boxShadow = '0 0 0 3px rgba(67, 97, 238, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#495057' 
              }}>
                Street Address *
              </label>
              <input
                type="text"
                name="street"
                value={shippingAddress.street}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4361ee';
                  e.target.style.boxShadow = '0 0 0 3px rgba(67, 97, 238, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#495057' 
                }}>
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={shippingAddress.city}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4361ee';
                    e.target.style.boxShadow = '0 0 0 3px rgba(67, 97, 238, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#495057' 
                }}>
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={shippingAddress.state}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4361ee';
                    e.target.style.boxShadow = '0 0 0 3px rgba(67, 97, 238, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#495057' 
                }}>
                  Zip Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={shippingAddress.zipCode}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4361ee';
                    e.target.style.boxShadow = '0 0 0 3px rgba(67, 97, 238, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#495057' 
                }}>
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={shippingAddress.country}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4361ee';
                    e.target.style.boxShadow = '0 0 0 3px rgba(67, 97, 238, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#495057' 
              }}>
                Delivery Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={shippingAddress.notes}
                onChange={handleInputChange}
                rows="4"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.3s',
                  outline: 'none',
                  resize: 'vertical'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4361ee';
                  e.target.style.boxShadow = '0 0 0 3px rgba(67, 97, 238, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Any special delivery instructions..."
              />
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary & Payment */}
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
          
          {/* Order Items */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              marginBottom: '15px', 
              color: '#495057',
              fontWeight: '600'
            }}>
              Items ({cartItems.length})
            </h3>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
              {cartItems.map((item) => (
                <div 
                  key={item._id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '10px 0',
                    borderBottom: '1px solid #f8f9fa'
                  }}
                >
                  <div style={{ 
                    width: '40px', 
                    height: '40px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.imageURL ? (
                      <img 
                        src={item.imageURL} 
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ color: '#adb5bd', fontSize: '14px' }}>📚</div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: '#212529',
                      marginBottom: '2px'
                    }}>
                      {item.title.length > 30 ? item.title.substring(0, 30) + '...' : item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      Qty: {item.quantity} × ₹{parseFloat(item.price).toFixed(2)}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#4361ee' }}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Order Totals */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '12px'
            }}>
              <span style={{ color: '#6c757d', fontSize: '14px' }}>Subtotal</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                ₹{cartTotal.toFixed(2)}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '12px'
            }}>
              <span style={{ color: '#6c757d', fontSize: '14px' }}>Shipping</span>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#4caf50' }}>
                Free
              </span>
            </div>
            
            {/* <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '20px',
              paddingBottom: '20px',
              borderBottom: '2px solid #f8f9fa'
            }}>
              <span style={{ color: '#6c757d', fontSize: '14px' }}>Tax (8%)</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                ₹{tax.toFixed(2)}
              </span>
            </div> */}
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '30px'
            }}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#212529' }}>
                Total
              </span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#4361ee' }}>
                ₹{cartTotal.toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Payment Method */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              marginBottom: '15px', 
              color: '#495057',
              fontWeight: '600'
            }}>
              Payment Method
            </h3>
            
            <div style={{ 
              background: '#eef2ff', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '30px', 
                  height: '30px',
                  background: '#4361ee',
                  color: 'white',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px'
                }}>
                  💵
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#212529' }}>
                    Cash on Delivery
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    Pay when you receive your items
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Place Order Button */}
          <button 
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            style={{ 
              width: '100%',
              padding: '18px',
              fontSize: '16px',
              background: isProcessing ? '#adb5bd' : 'linear-gradient(135deg, #4361ee, #7209b7)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600',
              transition: 'all 0.3s',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(67, 97, 238, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {isProcessing ? (
              <>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTop: '3px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Processing Order...
              </>
            ) : (
              'Place Order (Cash on Delivery)'
            )}
          </button>
          
          <div style={{ 
            marginTop: '20px', 
            fontSize: '12px', 
            color: '#6c757d',
            textAlign: 'center'
          }}>
            <p>By placing your order, you agree to our Terms of Service</p>
          </div>
        </div>
      </div>

      {/* Back to Cart Link */}
      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <button 
          onClick={() => navigate('/cart')}
          style={{ 
            padding: '12px 24px', 
            fontSize: '14px',
            border: '2px solid #dee2e6',
            background: 'transparent',
            borderRadius: '8px',
            color: '#6c757d',
            fontWeight: '500',
            transition: 'all 0.3s',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#f8f9fa';
            e.target.style.color = '#4361ee';
            e.target.style.borderColor = '#4361ee';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#6c757d';
            e.target.style.borderColor = '#dee2e6';
          }}
        >
          ← Back to Cart
        </button>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 900px) {
          .checkout-container {
            grid-template-columns: 1fr !important;
          }
          
          .order-summary {
            position: static !important;
          }
        }
        
        @media (max-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Checkout;