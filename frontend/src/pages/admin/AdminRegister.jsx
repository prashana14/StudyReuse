import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [limitInfo, setLimitInfo] = useState(null);
  const { registerAdmin, checkAdminLimit, error } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkLimit = async () => {
      const info = await checkAdminLimit();
      setLimitInfo(info);
      setRegistrationOpen(info.allowed);
    };
    
    checkLimit();
  }, [checkAdminLimit]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (!formData.email.endsWith('@ria.edu.np')) {
      alert('Only RIA email addresses are allowed for admin registration');
      return;
    }
    
    setIsLoading(true);
    
    const result = await registerAdmin(
      formData.name,
      formData.email,
      formData.password
    );
    
    if (result.success) {
      navigate('/admin');
    }
    
    setIsLoading(false);
  };

  if (!registrationOpen && limitInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Admin Registration Closed</h2>
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-yellow-800 text-4xl mb-3">⚠️</div>
              <p className="font-semibold text-yellow-800">Maximum admin limit reached</p>
              <p className="text-yellow-700 mt-2">
                Current Admins: <span className="font-bold">{limitInfo.currentCount}/{limitInfo.maxAllowed}</span>
              </p>
              <p className="text-yellow-600 text-sm mt-3 italic">
                Only 2 administrators are allowed for security reasons.
              </p>
            </div>
          </div>
          <div className="space-y-4 text-center">
            <Link 
              to="/admin/login" 
              className="inline-block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Go to Admin Login
            </Link>
            <Link 
              to="/" 
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back to main site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Admin Registration</h2>
          <p className="text-gray-600 mt-2">Register as a StudyReuse administrator</p>
          {limitInfo && (
            <div className="mt-4 inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              Admin slots available: {limitInfo.maxAllowed - limitInfo.currentCount}/{limitInfo.maxAllowed}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 flex items-center">
            <span className="mr-2">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              RIA Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="admin@ria.edu.np"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
            <p className="text-gray-500 text-xs mt-1 italic">
              Only @ria.edu.np emails allowed
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
              minLength="6"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                required 
                className="mt-1"
              />
              <span className="text-gray-700 text-sm">
                I understand that as an admin, I have full access to user data and system controls
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !registrationOpen}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registering...
              </>
            ) : (
              'Register as Admin'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center space-y-4">
          <p className="text-gray-600">
            Already have an admin account?{' '}
            <Link to="/admin/login" className="text-blue-600 font-semibold hover:text-blue-800">
              Login here
            </Link>
          </p>
          <p>
            <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm">
              ← Back to main site
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;