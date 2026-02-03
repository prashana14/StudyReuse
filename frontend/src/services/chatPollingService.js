// frontend/src/services/chatPollingService.js
class ChatPollingService {
  constructor() {
    this.pollingIntervals = new Map(); // Map of chatId -> interval
    this.callbacks = new Map(); // Map of chatId -> callback functions
    this.pollingRate = 3000; // Default: 3 seconds
  }

  // Start polling for a specific chat
  startPolling(chatId, fetchMessagesCallback, interval = null) {
    // Stop existing polling for this chat
    this.stopPolling(chatId);
    
    const pollInterval = interval || this.pollingRate;
    console.log(`🔄 Starting polling for chat ${chatId} every ${pollInterval}ms`);
    
    // Store the callback
    this.callbacks.set(chatId, fetchMessagesCallback);
    
    // Initial fetch
    if (fetchMessagesCallback) {
      fetchMessagesCallback();
    }
    
    // Set up interval
    const intervalId = setInterval(() => {
      if (fetchMessagesCallback) {
        fetchMessagesCallback();
      }
    }, pollInterval);
    
    this.pollingIntervals.set(chatId, intervalId);
    
    return intervalId;
  }

  // Stop polling for a specific chat
  stopPolling(chatId) {
    const intervalId = this.pollingIntervals.get(chatId);
    if (intervalId) {
      console.log(`🛑 Stopping polling for chat ${chatId}`);
      clearInterval(intervalId);
      this.pollingIntervals.delete(chatId);
    }
    this.callbacks.delete(chatId);
  }

  // Update polling interval for a chat
  updatePollingInterval(chatId, newInterval) {
    const callback = this.callbacks.get(chatId);
    if (callback) {
      this.startPolling(chatId, callback, newInterval);
    }
  }

  // Update global polling rate
  setPollingRate(rate) {
    this.pollingRate = rate;
    console.log(`📊 Global polling rate set to ${rate}ms`);
  }

  // Stop all polling
  stopAllPolling() {
    console.log('🛑 Stopping all chat polling');
    this.pollingIntervals.forEach((intervalId, chatId) => {
      clearInterval(intervalId);
    });
    this.pollingIntervals.clear();
    this.callbacks.clear();
  }

  // Check if polling is active for a chat
  isPolling(chatId) {
    return this.pollingIntervals.has(chatId);
  }

  // Get list of active polling chats
  getActiveChats() {
    return Array.from(this.pollingIntervals.keys());
  }

  // Force refresh a specific chat
  forceRefresh(chatId) {
    const callback = this.callbacks.get(chatId);
    if (callback) {
      console.log(`🔃 Force refreshing chat ${chatId}`);
      callback();
    }
  }

  // Clean up all resources
  cleanup() {
    this.stopAllPolling();
    this.pollingIntervals.clear();
    this.callbacks.clear();
  }
}

// Create singleton instance
const chatPollingService = new ChatPollingService();

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    chatPollingService.cleanup();
  });
}

export default chatPollingService;