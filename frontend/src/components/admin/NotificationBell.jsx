import React, { useState, useEffect, useRef } from 'react';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New user registered', message: 'John Doe just signed up', time: '5 min ago', read: false },
    { id: 2, title: 'Item reported', message: 'Item "Math Book" was reported', time: '1 hour ago', read: false },
    { id: 3, title: 'Order completed', message: 'Order #1234 has been delivered', time: '2 hours ago', read: true },
    { id: 4, title: 'System update', message: 'Backup completed successfully', time: '1 day ago', read: true },
  ]);
  const panelRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id) => {
    setNotifications(notifs =>
      notifs.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifs =>
      notifs.map(notif => ({ ...notif, read: true }))
    );
  };

  return (
    <div className="relative" ref={panelRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 relative"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-2xl border z-50 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${!notif.read ? 'bg-blue-50' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">
                      {notif.title.includes('user') ? '👤' : 
                       notif.title.includes('item') ? '📦' : 
                       notif.title.includes('order') ? '📋' : '🔔'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{notif.title}</h4>
                      <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                      <span className="text-xs text-gray-400 mt-2 block">{notif.time}</span>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No notifications</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;