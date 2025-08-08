// Import Braze service worker
importScripts('https://js.appboycdn.com/web-sdk/4.8/service-worker.js');

// Handle push events with Braze
self.addEventListener('push', function(event) {
  // Let Braze handle the push event first
  if (event.data && event.data.text().includes('ab_')) {
    // This is a Braze push notification
    return;
  }
  
  // Handle custom push notifications if needed
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      data: data.data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Handle Braze notification clicks
  if (event.notification.data && event.notification.data.ab) {
    // Let Braze handle the click
    return;
  }
  
  // Handle custom notification clicks
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});