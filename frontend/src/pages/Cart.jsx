import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      navigate('/checkout');
      setIsCheckingOut(false);
    }, 500);
  };

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
              Clear Cart
            </button>
          </div>

          {cartItems.map((item) => (
            <div 
              key={item._id} 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '100px 1fr auto', 
                gap: '20px',
                padding: '20px 0',
                borderBottom: '1px solid #f8f9fa',
                alignItems: 'center'
              }}
            >
              {/* Item Image */}
              <div style={{ 
                width: '100px', 
                height: '100px',
                borderRadius: '8px',
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
                  <div style={{ color: '#adb5bd', fontSize: '24px' }}>📚</div>
                )}
              </div>

              {/* Item Details */}
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  marginBottom: '8px', 
                  color: '#212529',
                  fontWeight: '600'
                }}>
                  <Link 
                    to={`/item/${item._id}`} 
                    style={{ 
                      color: 'inherit', 
                      textDecoration: 'none',
                      transition: 'color 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#4361ee'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#212529'}
                  >
                    {item.title}
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
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <span style={{ 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    color: '#4361ee'
                  }}>
                    ₹{parseFloat(item.price).toFixed(2)}
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
              </div>

              {/* Quantity Controls & Remove */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button 
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    style={{ 
                      width: '32px',
                      height: '32px',
                      background: '#f8f9fa',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '18px',
                      color: '#495057',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#e63946';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f8f9fa';
                      e.target.style.color = '#495057';
                    }}
                  >
                    -
                  </button>
                  
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item._id, parseInt(e.target.value) || 1)}
                    min="1"
                    style={{
                      width: '60px',
                      padding: '8px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '16px',
                      textAlign: 'center',
                      outline: 'none',
                      transition: 'all 0.3s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#4361ee';
                      e.target.style.boxShadow = '0 0 0 3px rgba(67, 97, 238, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  
                  <button 
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    style={{ 
                      width: '32px',
                      height: '32px',
                      background: '#f8f9fa',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '18px',
                      color: '#495057',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#4caf50';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f8f9fa';
                      e.target.style.color = '#495057';
                    }}
                  >
                    +
                  </button>
                </div>
                
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#212529' }}>
                  ₹{(item.price * item.quantity).toFixed(2)}
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
          ))}
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
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '12px'
            }}>
              <span style={{ color: '#6c757d', fontSize: '16px' }}>Subtotal</span>
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                ₹{cartTotal.toFixed(2)}
              </span>
            </div>
            
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
                ₹{cartTotal.toFixed(2)}
              </span>
            </div>
          </div>
          
          <button 
            onClick={handleCheckout}
            disabled={isCheckingOut}
            style={{ 
              width: '100%',
              padding: '18px',
              fontSize: '16px',
              background: isCheckingOut ? '#adb5bd' : 'linear-gradient(135deg, #4361ee, #7209b7)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600',
              transition: 'all 0.3s',
              cursor: isCheckingOut ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onMouseEnter={(e) => {
              if (!isCheckingOut) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(67, 97, 238, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCheckingOut) {
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
            ) : (
              'Proceed to Checkout →'
            )}
          </button>
          
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