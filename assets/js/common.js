// Braze initialization and authentication
braze.initialize('7ad461d4-5c54-45a1-a0f2-c018596c87ca', {
  baseUrl: 'sondheim.braze.com',
  enableLogging: true,
  serviceWorkerLocation: '/sw.js',
  manageServiceWorkerExternally: false,
  enableHtmlInAppMessages: true,
  allowUserSuppliedJavascript: false
});

braze.automaticallyShowInAppMessages();
braze.openSession();
braze.changeUser("pjy");

// Google OAuth Integration
function initiateGoogleLogin() {
  google.accounts.id.prompt();
}

function handleGoogleSignIn(response) {
  const userInfo = parseJwt(response.credential);
  console.log('Google Sign-In successful:', userInfo);
  updateBrazeUserFromGoogle(userInfo);
}

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

function updateBrazeUserFromGoogle(userInfo) {
  const user = braze.getUser();
  
  if (userInfo.email) {
    user.setEmail(userInfo.email);
    console.log('Email set in Braze:', userInfo.email);
  }
  
  if (userInfo.given_name) {
    user.setFirstName(userInfo.given_name);
    console.log('First name set in Braze:', userInfo.given_name);
  }
  
  if (userInfo.family_name) {
    user.setLastName(userInfo.family_name);
    console.log('Last name set in Braze:', userInfo.family_name);
  }
  
  braze.logCustomEvent('google_oauth_login', {
    email: userInfo.email
  });
  
  updateNavbarAuth(userInfo);
}

function updateNavbarAuth(userInfo) {
  const loginBtn = document.getElementById('loginBtn');
  const userProfile = document.getElementById('userProfile');
  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  
  if (loginBtn) loginBtn.style.display = 'none';
  if (userProfile) userProfile.style.display = 'flex';
  
  if (userAvatar) userAvatar.src = userInfo.picture || '';
  if (userName) userName.textContent = userInfo.given_name || userInfo.email.split('@')[0];
  
  // Store user info in localStorage for persistence
  localStorage.setItem('userProfile', JSON.stringify(userInfo));
}

function signOut() {
  google.accounts.id.disableAutoSelect();
  braze.logCustomEvent('google_oauth_logout');
  
  const loginBtn = document.getElementById('loginBtn');
  const userProfile = document.getElementById('userProfile');
  
  if (loginBtn) loginBtn.style.display = 'block';
  if (userProfile) userProfile.style.display = 'none';
  
  // Clear stored user data
  localStorage.removeItem('userProfile');
  
  // Clear user avatar
  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  if (userAvatar) userAvatar.src = '';
  if (userName) userName.textContent = '';
  
  console.log('User signed out');
}

// Push notifications
function initializePushNotifications() {
  if (!braze.isPushSupported()) {
    console.log('Push messaging is not supported by Braze');
    return;
  }

  console.log('Push permission granted:', braze.isPushPermissionGranted());
  console.log('Push blocked:', braze.isPushBlocked());

  if (!braze.isPushPermissionGranted() && !braze.isPushBlocked()) {
    setTimeout(showPushPrompt, 30000);
  } else if (braze.isPushPermissionGranted()) {
    console.log('Push notifications already enabled via Braze');
  } else if (braze.isPushBlocked()) {
    console.log('Push notifications blocked by user');
  }
}

function showPushPrompt() {
  const pushPrompt = document.getElementById('pushPrompt');
  const enableBtn = document.getElementById('enablePush');
  const dismissBtn = document.getElementById('dismissPush');
  
  if (!pushPrompt) return;
  if (localStorage.getItem('pushPromptDismissed')) return;
  
  pushPrompt.style.display = 'block';
  braze.logCustomEvent('braze_push_prompt_shown');
  
  if (enableBtn) {
    enableBtn.addEventListener('click', () => {
      requestPushPermission();
      pushPrompt.style.display = 'none';
    });
  }
  
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      pushPrompt.style.display = 'none';
      localStorage.setItem('pushPromptDismissed', 'true');
      braze.logCustomEvent('braze_push_prompt_dismissed');
    });
  }
}

function requestPushPermission() {
  if (braze.isPushPermissionGranted()) {
    console.log('Push permission already granted');
    showPushSuccessMessage();
    return;
  }

  braze.requestPushPermission(
    function() {
      console.log('Push permission granted via Braze!');
      showPushSuccessMessage();
      braze.logCustomEvent('braze_push_permission_granted');
    },
    function() {
      console.log('Push permission denied');
      braze.logCustomEvent('braze_push_permission_denied');
    }
  );
}

function showPushSuccessMessage() {
  const pushPrompt = document.getElementById('pushPrompt');
  if (pushPrompt) {
    pushPrompt.innerHTML = `
      <div class="push-content">
        <h3>✅ Notifications Enabled!</h3>
        <p>You'll now receive updates about great books and personalized recommendations via Braze.</p>
      </div>
    `;
    
    setTimeout(() => {
      pushPrompt.style.display = 'none';
    }, 3000);
  }
}

// Navigation active state management
function setActiveNavLink(currentPage) {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href === currentPage || 
        (currentPage === '/' && href === 'index.html') ||
        (currentPage === '/index.html' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializePushNotifications();
  
  // Set active nav link based on current page
  const currentPage = window.location.pathname;
  setActiveNavLink(currentPage);
  
  // Check for existing login
  const savedProfile = localStorage.getItem('userProfile');
  if (savedProfile) {
    try {
      const user = JSON.parse(savedProfile);
      updateNavbarAuth(user);
    } catch (error) {
      console.error('Error loading saved profile:', error);
      localStorage.removeItem('userProfile');
    }
  }
});