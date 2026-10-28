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
  
  // If you have a renderProductsGrid function on your index.html, it will run here
  if (typeof renderProductsGrid === 'function') {
    renderProductsGrid(products);
  }
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
    const authLink = document.getElementById('authLinkText');
    if (authLink) authLink.textContent = currentUser.name;
    
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
  const authLink = document.getElementById('authLinkText');
  if (authLink) authLink.textContent = name;
  
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
  const authLink = document.getElementById('authLinkText');
  if (authLink) authLink.textContent = 'Sign In';
  const dropdownMenu = document.getElementById('userDropdownMenu');
  if (dropdownMenu) dropdownMenu.style.display = 'none';
  alert('Your session has been signed out.');
}

// Buy Now Button Handler (Opens Kilimall-style product detail view with Space-Separated Dynamic Colors & Quantity Multiplier)
window.buyNowEvent = function(index) {
  if (!currentUser) { 
    if (typeof openAuthModal === 'function') openAuthModal(); 
    return; 
  }
  const prod = products[index];
  if (prod) {
    const product = {
      name: prod.name,
      price: prod.price || prod.retailPrice || 0,
      image: prod.image || 'https://via.placeholder.com/300x300/fbe8eb/a87e8a?text=Product+Image',
      category: prod.category || 'General',
      // Split colors by space instead of comma
      colors: prod.colors ? prod.colors.split(' ').filter(c => c.trim() !== '') : ['Pink', 'Black', 'White']
    };

    // Generate color radio buttons dynamically from space-separated admin settings
    let colorOptionsHTML = '';
    product.colors.forEach((col, idx) => {
      const isChecked = idx === 0 ? 'checked' : '';
      colorOptionsHTML += `
        <label style="cursor:pointer; font-size:0.85rem; color:#5c444e;">
          <input type="radio" name="productColor" value="${col}" ${isChecked}> ${col}
        </label>
      `;
    });

    const modalHTML = `
      <div id="buyNowModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(82,52,63,0.5); backdrop-filter:blur(4px); display:flex; justify-content:center; align-items:center; z-index:5000;">
        <div style="background:white; padding:30px; border-radius:20px; max-width:480px; width:90%; position:relative; box-shadow:0 15px 40px rgba(82,52,63,0.2);">
          <span onclick="closeBuyNowModal()" style="position:absolute; top:15px; right:20px; font-size:24px; cursor:pointer; color:#724e5b;">&times;</span>
          
          <h3 style="color:#52343f; margin-top:0; font-family:'Playfair Display', serif; font-size:1.3rem;">Order Details</h3>
          <hr style="border:0; border-top:1px solid #fbe8eb; margin:15px 0;">

          <div style="display:flex; gap:20px; align-items:center; margin-bottom:20px;">
            <img src="${product.image}" style="width:110px; height:110px; object-fit:cover; border-radius:12px; background:#fbe8eb;">
            <div>
              <h4 style="margin:0 0 6px; color:#52343f; font-size:1rem;">${product.name}</h4>
              <p style="color:#d47a8f; font-size:1.1rem; font-weight:bold; margin:0 0 6px;">KSh ${product.price.toLocaleString()}</p>
              <p style="font-size:0.8rem; color:#8c6875; margin:0;">Category: ${product.category} • In Stock</p>
            </div>
          </div>

          <!-- Dynamic Space-Separated Color Selection Option from Admin -->
          <div style="margin-bottom:15px;">
            <label style="font-size:0.85rem; color:#52343f; font-weight:600; display:block; margin-bottom:6px;">Select Color:</label>
            <div style="display:flex; flex-wrap:wrap; gap:15px;">
              ${colorOptionsHTML}
            </div>
          </div>

          <!-- Quantity Selection -->
          <div style="margin-bottom:15px;">
            <label style="font-size:0.85rem; color:#52343f; font-weight:600; display:block; margin-bottom:6px;">Quantity:</label>
            <input type="number" id="quickBuyQty" value="1" min="1" oninput="updateModalTotal(${product.price})" style="width:90px; padding:10px; border:1px solid #f2c4ce; border-radius:10px; font-size:0.9rem; outline:none;">
          </div>

          <!-- Live Calculated Total Display -->
          <div style="background:#fbe8eb; padding:12px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; font-weight:bold; color:#52343f;">
            <span>Total Price:</span>
            <span id="modalTotalPriceDisplay" style="color:#d47a8f; font-size:1.1rem;">KSh ${product.price.toLocaleString()}</span>
          </div>

          <button onclick="checkoutDirectly(${product.price})" style="width:100%; background:#d47a8f; color:white; border:none; padding:12px; border-radius:25px; font-weight:600; cursor:pointer; font-size:0.95rem; box-shadow:0 4px 15px rgba(212,122,143,0.3);">Proceed to Secure Checkout</button>
        </div>
      </div>
    `;

    let existingModal = document.getElementById('buyNowModal');
    if (existingModal) existingModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
};

// Live Multiplier for Quantity Changes
window.updateModalTotal = function(unitPrice) {
  const qtyInput = document.getElementById('quickBuyQty');
  const totalDisplay = document.getElementById('modalTotalPriceDisplay');
  
  let qty = parseInt(qtyInput.value) || 1;
  if (qty < 1) qty = 1;
  
  const total = unitPrice * qty;
  totalDisplay.textContent = 'KSh ' + total.toLocaleString();
};

function closeBuyNowModal() {
  const modal = document.getElementById('buyNowModal');
  if (modal) modal.remove();
}

function checkoutDirectly(unitPrice) {
  const qty = parseInt(document.getElementById('quickBuyQty').value) || 1;
  const colorRadio = document.querySelector('input[name="productColor"]:checked');
  const selectedColor = colorRadio ? colorRadio.value : 'Standard';
  const total = unitPrice * qty;
  
  alert(`Proceeding to secure checkout!\nColor: ${selectedColor}\nQuantity: ${qty}\nTotal: KSh ${total.toLocaleString()}`);
  closeBuyNowModal();
}
