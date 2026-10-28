// Maison de Cess - Core Frontend Script
const API_URL = 'https://maison-de-cess-1.onrender.com/api/products';
const USERS_API_URL = 'https://maison-de-cess-1.onrender.com/api/users';
const defaultCategories = ["Clothing", "Home Accessories", "Loungewear", "Decor"];
let categories = JSON.parse(localStorage.getItem('mdc_categories')) || defaultCategories;
let products = [];
let likedProducts = JSON.parse(localStorage.getItem('mdc_likes')) || {};
let currentUser = JSON.parse(localStorage.getItem('mdc_user')) || null;
let currentRegion = localStorage.getItem('mdc_region') || 'Kenya';
let currentFlag = localStorage.getItem('mdc_flag') || '🇰🇪';

// Global Event Listeners & Initializers
document.addEventListener('DOMContentLoaded', () => {
  const locText = document.getElementById('selectedLocationText');
  const flagText = document.getElementById('selectedFlag');
  if (locText) locText.textContent = currentRegion;
  if (flagText) flagText.textContent = currentFlag;
  
  if (currentUser) {
    const authLink = document.getElementById('authLinkText');
    if (authLink) authLink.textContent = currentUser.name || currentUser.email.split('@')[0];
  }

  fetchStoreProducts();
});

// Fetch Store Products from Backend
async function fetchStoreProducts() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to connect to backend');
    products = await response.json();
  } catch (err) {
    console.error('Error fetching products:', err);
    products = [];
  }
  renderProductsGrid(products);
}

// Database Sync for Registered Users
async function syncUserToDatabase(userData) {
  try {
    await fetch(USERS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
  } catch (err) {
    console.error('Error syncing user to database:', err);
  }
}

// Real Google JWT Token Decoder
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

async function handleGoogleCredentialResponse(response) {
  const payload = parseJwt(response.credential);
  if (payload) {
    currentUser = {
      name: payload.name,
      email: payload.email,
      provider: 'Google',
      signedUpAt: new Date()
    };
    localStorage.setItem('mdc_user', JSON.stringify(currentUser));
    document.getElementById('authLinkText').textContent = currentUser.name;
    
    await syncUserToDatabase(currentUser);
    closeAuthModal();
    alert(`Welcome, ${currentUser.name}! Signed in successfully with Google.`);
  }
}

// Email Sign In Handler
async function handleSignIn(e) {
  e.preventDefault();
  const name = document.getElementById('authName').value.trim();
  const email = document.getElementById('authEmail').value.trim();
  
  if (!name || !email) return;

  currentUser = { name, email, provider: 'Email', signedUpAt: new Date() };
  localStorage.setItem('mdc_user', JSON.stringify(currentUser));
  document.getElementById('authLinkText').textContent = name;
  
  await syncUserToDatabase(currentUser);
  
  document.getElementById('authName').value = '';
  document.getElementById('authEmail').value = '';
  document.getElementById('authPassword').value = '';

  closeAuthModal();
  alert('Successfully signed in and registered!');
}

function handleSignOut() {
  localStorage.removeItem('mdc_user');
  currentUser = null;
  document.getElementById('authLinkText').textContent = 'Sign In';
  document.getElementById('userDropdownMenu').style.display = 'none';
  alert('Your session has been signed out.');
}
