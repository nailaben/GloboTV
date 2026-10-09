/* =============================================
   PLAYORA - API Client
   ============================================= */

const API_BASE = '/api';

const api = {
    // ---- Products ----
    getProducts: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE}/products${query ? '?' + query : ''}`);
        return res.json();
    },

    getProduct: async (id) => {
        const res = await fetch(`${API_BASE}/products/${id}`);
        return res.json();
    },

    getCategories: async () => {
        const res = await fetch(`${API_BASE}/products/categories`);
        return res.json();
    },

    getSellerProducts: async () => {
        const res = await fetch(`${API_BASE}/products/seller/all`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        return res.json();
    },

    addProduct: async (formData) => {
        const res = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: formData
        });
        return res.json();
    },

    updateProduct: async (id, formData) => {
        const res = await fetch(`${API_BASE}/products/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: formData
        });
        return res.json();
    },

    deleteProduct: async (id) => {
        const res = await fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        return res.json();
    },

    // ---- Orders ----
    createOrder: async (orderData) => {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(localStorage.getItem('playora_customer_token') ? { 'Authorization': `Bearer ${localStorage.getItem('playora_customer_token')}` } : {})
            },
            body: JSON.stringify(orderData)
        });
        return res.json();
    },

    customerRegister: async (data) => {
        const res = await fetch(`${API_BASE}/customer/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return res.json();
    },

    customerLogin: async (data) => {
        const res = await fetch(`${API_BASE}/customer/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return res.json();
    },

    getCustomer: async () => {
        const res = await fetch(`${API_BASE}/customer/me`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('playora_customer_token') || ''}` } });
        return res.json();
    },

    updateCustomer: async (data) => {
        const res = await fetch(`${API_BASE}/customer/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('playora_customer_token') || ''}`
            },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    getCustomerOrders: async () => {
        const res = await fetch(`${API_BASE}/customer/orders`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('playora_customer_token') || ''}` } });
        return res.json();
    },

    getOrders: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE}/orders${query ? '?' + query : ''}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        return res.json();
    },

    getOrder: async (id) => {
        const res = await fetch(`${API_BASE}/orders/${id}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        return res.json();
    },

    updateOrderStatus: async (id, status) => {
        const res = await fetch(`${API_BASE}/orders/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ status })
        });
        return res.json();
    },

    // ---- Seller Auth ----
    login: async (username, password) => {
        const res = await fetch(`${API_BASE}/seller/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return res.json();
    },

    getStats: async () => {
        const res = await fetch(`${API_BASE}/seller/stats`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        return res.json();
    }
};

// ---- Token Management ----
function getToken() { return localStorage.getItem('playora_token'); }
function setToken(token) { localStorage.setItem('playora_token', token); }
function removeToken() { localStorage.removeItem('playora_token'); localStorage.removeItem('playora_seller'); }
function getSeller() { 
    const s = localStorage.getItem('playora_seller');
    return s ? JSON.parse(s) : null;
}
function setSeller(seller) { localStorage.setItem('playora_seller', JSON.stringify(seller)); }

// ---- Cart Management ----
function getCart() {
    const cart = localStorage.getItem('playora_cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('playora_cart', JSON.stringify(cart));
    updateCartBadges();
}

function updateCartBadges() {
    if (typeof getCartCount !== 'function') return;
    const count = getCartCount();
    document.querySelectorAll('[data-cart-count]').forEach(badge => {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.hidden = count === 0;
        const cartButton = badge.closest('[aria-label]');
        if (cartButton) {
            const label = currentLang === 'fr' ? 'Panier' : 'Shopping cart';
            cartButton.setAttribute('aria-label', count ? `${label}, ${count}` : label);
        }
    });
}

document.addEventListener('DOMContentLoaded', updateCartBadges);
window.addEventListener('pageshow', updateCartBadges);
window.addEventListener('storage', event => {
    if (event.key === 'playora_cart') updateCartBadges();
});

function addToCart(product, quantity = 1) {
    const cart = getCart();
    const offer = product.selectedOffer || null;
    const existing = cart.find(item => String(item.product_id) === String(product.id) && String(item.offer_id || '') === String(offer?.id || ''));
    if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, product.stock_quantity);
    } else {
        cart.push({
            product_id: product.id,
            name_ar: product.name_ar,
            name_en: product.name_en,
            name_fr: product.name_fr || product.name_en,
            offer_id: offer?.id || null,
            offer_label_en: offer?.label_en || '',
            offer_label_fr: offer?.label_fr || '',
            price: offer ? Number(offer.price_eur) : Number(product.price),
            currency: offer ? 'EUR' : 'USD',
            image_url: product.image_url,
            stock_quantity: product.stock_quantity,
            quantity
        });
    }
    saveCart(cart);
    return cart;
}

function removeFromCart(productId, offerId = null) {
    const cart = getCart().filter(item => !(String(item.product_id) === String(productId) && String(item.offer_id || '') === String(offerId || '')));
    saveCart(cart);
    return cart;
}

function updateCartQty(productId, qty, offerId = null) {
    const cart = getCart().map(item => {
        if (String(item.product_id) === String(productId) && String(item.offer_id || '') === String(offerId || '')) item.quantity = Math.max(1, Math.min(qty, item.stock_quantity));
        return item;
    });
    saveCart(cart);
    return cart;
}

function getCartTotal() {
    return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function clearCart() { localStorage.removeItem('playora_cart'); }

// ---- Language ----
const supportedLanguages = ['en', 'fr'];
const languageNames = { fr: 'Français', en: 'English' };
let currentLang = supportedLanguages.includes(localStorage.getItem('playora_lang'))
    ? localStorage.getItem('playora_lang')
    : 'en';

function setLang(lang) {
    if (!supportedLanguages.includes(lang)) return;
    currentLang = lang;
    localStorage.setItem('playora_lang', lang);
    document.documentElement.lang = lang;
    document.body.dir = 'ltr';
    document.querySelectorAll('.language-select').forEach(select => { select.value = lang; });
    document.dispatchEvent(new CustomEvent('langChange', { detail: lang }));
}

function nextLang() {
    const index = supportedLanguages.indexOf(currentLang);
    setLang(supportedLanguages[(index + 1) % supportedLanguages.length]);
}

function t(en, fr = en) { return currentLang === 'fr' ? fr : en; }

function initLang() {
    const savedLanguage = localStorage.getItem('playora_lang');
    const lang = supportedLanguages.includes(savedLanguage) ? savedLanguage : 'en';
    setLang(lang);
}

function setupLangToggle() {
    document.querySelectorAll('.language-select').forEach(select => {
        select.addEventListener('change', () => setLang(select.value));
    });
}

// ---- Toast Notifications ----
function showToast(message, type = 'info', duration = 3000) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ---- Format Currency ----
function formatPrice(price) {
    return `$${parseFloat(price).toFixed(2)}`;
}

function formatCartPrice(item, amount = item.price) {
    return new Intl.NumberFormat(currentLang === 'fr' ? 'fr-FR' : 'en-IE', { style: 'currency', currency: item.currency || 'USD' }).format(Number(amount));
}

// ---- Format Date ----
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ---- Image Fallback ----
function handleImgError(img) {
    img.onerror = null;
    img.src = '/images/placeholder.png';
}
