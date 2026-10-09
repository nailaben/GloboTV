/* =============================================
   PLAYORA - Store JS
   ============================================= */

let allProducts = [];
let allCategories = [];
let activeCategory = 'all';
let searchQuery = '';
let heroStartIndex = 0;
let heroFanTimer = null;
let heroFanBusy = false;

document.addEventListener('DOMContentLoaded', async () => {
    initLang();
    const initialQuery = new URLSearchParams(location.search);
    searchQuery = initialQuery.get('search') || '';
    activeCategory = initialQuery.get('category') || 'all';
    applyTranslations();
    setupNavbar();
    updateCustomerNav();
    setupLangToggle();
    setupCart();
    setupProductCarousel();
    createHeroParticles();
    document.addEventListener('langChange', () => { applyTranslations(); renderProducts(); renderCart(); renderCategories(); });
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchQuery) {
        searchInput.value = searchQuery;
    }
    try {
        await loadCategories();
    } catch (error) {
        console.error('Load categories error:', error);
    }
    await loadProducts();
    if (searchQuery) {
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    }
});

function setupProductCarousel() {
    const carousel = document.getElementById('products-grid');
    if (!carousel) return;

    carousel.addEventListener('wheel', event => {
        if (carousel.scrollWidth <= carousel.clientWidth) return;
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
            event.preventDefault();
            carousel.scrollLeft += event.deltaY;
        }
    }, { passive: false });

    let startX = 0;
    let startScroll = 0;
    let dragging = false;
    let dragged = false;
    carousel.addEventListener('mousedown', event => {
        if (event.button !== 0 || event.target.closest('button')) return;
        startX = event.clientX;
        startScroll = carousel.scrollLeft;
        dragging = true;
        dragged = false;
        carousel.classList.add('is-dragging');
    });
    window.addEventListener('mousemove', event => {
        if (!dragging) return;
        const distance = event.clientX - startX;
        if (Math.abs(distance) > 4) dragged = true;
        if (dragged) carousel.scrollLeft = startScroll - distance;
    });
    window.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        carousel.classList.remove('is-dragging');
    });
    carousel.addEventListener('click', event => {
        if (!dragged) return;
        event.preventDefault();
        event.stopPropagation();
        dragged = false;
    }, true);
}

// ---- Translations ----
const i18n = {
    en: {
        hero_badge: ' Your Fastest Digital Cards Destination',
        hero_title_1: 'Discover the World of',
        hero_title_2: 'IPTV Subscriptions',
        shop_now: 'Shop Now',
        explore_cats: 'Explore Categories',
        all_products: 'All Products',
        new_arrivals: 'Products',
        out_of_stock: 'Out of Stock',
        add_to_cart: 'Add to Cart',
        cart_title: 'Shopping Cart',
        cart_empty: 'Your cart is empty',
        checkout: 'Checkout',
        subtotal: 'Subtotal',
        total: 'Total',
        products_label: 'Products',
        orders_label: 'Completed Orders',
        customers_label: 'Happy Customers',
        loading: 'Loading...',
        no_products: 'No products found',
        view_all_results: 'View all results',
        search_placeholder: 'Search products...',
        store_link: 'Shop',
        sign_in: 'Sign in',
        my_account: 'My account',
        cart_added: ' Added to cart',
        connection_error: 'Could not connect to the server',
        like_product: 'Add to favorites',
        unlike_product: 'Remove from favorites',
        liked_product: 'Added to favorites',
        unliked_product: 'Removed from favorites',
        footer_desc: 'Your fast and trusted destination for digital cards at great prices',
        quick_links: 'Quick Links', home: 'Home', support: 'Support', contact: 'Contact us',
        privacy: 'Privacy Policy', terms: 'Terms of Use', copyright: '© 2024 GloboTV. All rights reserved.',
    },
    fr: {
        hero_badge: ' Votre destination pour les cartes numériques',
        hero_title_1: 'Découvrez le monde des',
        hero_title_2: 'Abonnements IPTV',
        shop_now: 'Acheter',
        explore_cats: 'Explorer les catégories',
        all_products: 'Tous les produits',
        new_arrivals: 'Produits',
        out_of_stock: 'Épuisé',
        add_to_cart: 'Ajouter au panier',
        cart_title: 'Panier',
        cart_empty: 'Votre panier est vide',
        checkout: 'Commander',
        subtotal: 'Sous-total',
        total: 'Total',
        products_label: 'Produits',
        orders_label: 'Commandes terminées',
        customers_label: 'Clients satisfaits',
        loading: 'Chargement…',
        no_products: 'Aucun produit trouvé',
        view_all_results: 'Voir tous les résultats',
        search_placeholder: 'Rechercher un produit…',
        store_link: 'Boutique',
        sign_in: 'Se connecter',
        my_account: 'Mon compte',
        cart_added: ' Ajouté au panier',
        connection_error: 'Connexion au serveur impossible',
        like_product: 'Ajouter aux favoris',
        unlike_product: 'Retirer des favoris',
        liked_product: 'Ajouté aux favoris',
        unliked_product: 'Retiré des favoris',
        footer_desc: 'Votre destination rapide et fiable pour des cartes numériques au meilleur prix',
        quick_links: 'Liens rapides', home: 'Accueil', support: 'Assistance', contact: 'Nous contacter',
        privacy: 'Politique de confidentialité', terms: 'Conditions d’utilisation', copyright: '© 2024 GloboTV. Tous droits réservés.',
    }
};

function tr(key) { return (i18n[currentLang] || i18n.en)[key] || key; }

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = tr(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = tr(el.getAttribute('data-i18n-placeholder'));
    });
}

// ---- Customer session ----
async function updateCustomerNav() {
    const accountLink = document.querySelector('.account-link');
    const customerToken = localStorage.getItem('playora_customer_token');
    if (!accountLink || !customerToken) return;

    try {
        const result = await api.getCustomer();
        if (!result.success || !result.customer) throw new Error('Customer session is invalid');

        localStorage.setItem('playora_customer', JSON.stringify(result.customer));
        accountLink.href = '/account.html';
        accountLink.dataset.i18n = 'my_account';
        accountLink.setAttribute('aria-label', tr('my_account'));
        accountLink.textContent = tr('my_account');
    } catch {
        localStorage.removeItem('playora_customer_token');
        localStorage.removeItem('playora_customer');
    }
}

// ---- Navbar & Search Autocomplete ----
function setupNavbar() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    const searchInput = document.getElementById('search-input');
    const searchDropdown = document.getElementById('search-dropdown');
    let searchDebounce;

    function renderSearchDropdown(query) {
        if (!searchDropdown) return;
        const q = (query || '').trim().toLowerCase();
        if (!q) {
            searchDropdown.classList.remove('is-open');
            searchDropdown.innerHTML = '';
            return;
        }

        const matches = allProducts.filter(p =>
            (p.name_en && p.name_en.toLowerCase().includes(q)) ||
            (p.name_fr && p.name_fr.toLowerCase().includes(q)) ||
            (p.description_en && p.description_en.toLowerCase().includes(q)) ||
            (p.description_fr && p.description_fr.toLowerCase().includes(q))
        );

        if (matches.length === 0) {
            searchDropdown.innerHTML = `
                <div class="search-dropdown-empty">
                    <span class="material-symbols-outlined">search_off</span>
                    <div>${tr('no_products')}</div>
                </div>`;
            searchDropdown.classList.add('is-open');
            return;
        }

        const topMatches = matches.slice(0, 6);
        const itemsHtml = topMatches.map(p => {
            const name = currentLang === 'fr' ? (p.name_fr || p.name_en) : p.name_en;
            const catName = currentLang === 'fr' ? (p.category_name_fr || p.category_name_en) : p.category_name_en;
            const price = p.starting_price_eur != null 
                ? new Intl.NumberFormat(currentLang === 'fr' ? 'fr-FR' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(Number(p.starting_price_eur))
                : '';
            return `
                <a href="/product.html?id=${p.id}" class="search-dropdown-item">
                    <img class="search-dropdown-img" src="${p.image_url || '/images/placeholder.png'}" alt="${name}" onerror="this.src='/images/placeholder.png'">
                    <div class="search-dropdown-info">
                        <div class="search-dropdown-name">${name}</div>
                        <div class="search-dropdown-meta">
                            ${catName ? `<span>${catName}</span>` : ''}
                        </div>
                    </div>
                    ${price ? `<span class="search-dropdown-price">${price}</span>` : ''}
                </a>`;
        }).join('');

        const footerHtml = `
            <div class="search-dropdown-footer" onclick="scrollToProductsAndFilter()">
                <span>${tr('view_all_results')} (${matches.length})</span>
            </div>`;

        searchDropdown.innerHTML = itemsHtml + footerHtml;
        searchDropdown.classList.add('is-open');
    }

    window.scrollToProductsAndFilter = function() {
        if (searchDropdown) searchDropdown.classList.remove('is-open');
        renderProducts();
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchDebounce);
            searchQuery = e.target.value;
            renderSearchDropdown(searchQuery);
            searchDebounce = setTimeout(() => {
                renderProducts();
            }, 250);
        });

        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim()) {
                renderSearchDropdown(searchInput.value);
            }
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                scrollToProductsAndFilter();
            } else if (e.key === 'Escape') {
                searchDropdown?.classList.remove('is-open');
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#product-nav-search')) {
            searchDropdown?.classList.remove('is-open');
        }
    });
}

function setupLangToggle() {
    document.querySelectorAll('.language-select').forEach(select => select.addEventListener('change', () => setLang(select.value)));
}

// ---- Cart ----
let cartOpen = false;

function setupCart() {
    document.getElementById('cart-btn')?.addEventListener('click', openCart);
    document.getElementById('cart-overlay')?.addEventListener('click', closeCart);
    document.getElementById('close-cart-btn')?.addEventListener('click', closeCart);
    document.getElementById('checkout-btn')?.addEventListener('click', () => {
        if (getCartCount() === 0) { showToast(tr('cart_empty'), 'error'); return; }
        window.location.href = '/checkout.html';
    });
    updateCartBadge();
}

function openCart() {
    document.getElementById('cart-overlay').style.display = 'block';
    document.getElementById('cart-sidebar').style.display = 'flex';
    cartOpen = true;
    renderCart();
}

function closeCart() {
    document.getElementById('cart-overlay').style.display = 'none';
    document.getElementById('cart-sidebar').style.display = 'none';
    cartOpen = false;
}

function updateCartBadge() {
    updateCartBadges();
}

function renderCart() {
    const cart = getCart();
    const body = document.getElementById('cart-body');
    const emptyMsg = document.getElementById('cart-empty');
    const footer = document.getElementById('cart-footer');
    const totalEl = document.getElementById('cart-total');
    if (!body) return;

    if (cart.length === 0) {
        body.innerHTML = '';
        emptyMsg.style.display = 'block';
        footer.style.display = 'none';
        return;
    }

    emptyMsg.style.display = 'none';
    footer.style.display = 'block';

    body.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img class="cart-item-img" src="${item.image_url || '/images/placeholder.png'}" 
                 alt="${currentLang === 'fr' ? (item.name_fr || item.name_en) : item.name_en}" onerror="this.src='/images/placeholder.png'">
            <div class="cart-item-info">
                <div class="cart-item-name">${currentLang === 'fr' ? (item.name_fr || item.name_en) : item.name_en}</div>
                <div class="cart-item-price">${formatCartPrice(item, item.price * item.quantity)}</div>
                <div class="qty-control">
                    <button class="qty-btn" onclick="changeQty('${item.product_id}', '${item.offer_id || ''}', -1)">−</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="changeQty('${item.product_id}', '${item.offer_id || ''}', 1)">+</button>
                </div>
            </div>
            <span class="cart-item-remove material-symbols-outlined" onclick="removeItem('${item.product_id}', '${item.offer_id || ''}')">close</span>
        </div>
    `).join('');

    totalEl.textContent = new Intl.NumberFormat(currentLang === 'fr' ? 'fr-FR' : 'en-IE', { style: 'currency', currency: cart[0]?.currency || 'EUR' }).format(getCartTotal());
}

window.changeQty = function(productId, offerId, delta) {
    const cart = getCart();
    const item = cart.find(i => String(i.product_id) === String(productId) && String(i.offer_id || '') === String(offerId || ''));
    if (item) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) { removeFromCart(productId, offerId); }
        else { updateCartQty(productId, newQty, offerId); }
    }
    updateCartBadge();
    renderCart();
};

window.removeItem = function(productId, offerId) {
    removeFromCart(productId, offerId);
    updateCartBadge();
    renderCart();
};

// ---- Categories ----
async function loadCategories() {
    const res = await api.getCategories();
    if (res.success) {
        allCategories = res.categories;
        renderCategories();
    }
}

function renderCategories() {
    const container = document.getElementById('categories-filter');
    if (!container) return;

    const allBtn = `
        <button class="cat-btn ${activeCategory === 'all' ? 'active' : ''}" onclick="filterByCategory('all')">
            <span class="material-symbols-outlined">apps</span>
            ${tr('all_products')}
        </button>`;

    const catBtns = allCategories.map(cat => `
        <button class="cat-btn ${activeCategory === String(cat.id) ? 'active' : ''}" onclick="filterByCategory('${cat.id}')">
            <span class="material-symbols-outlined">${cat.icon}</span>
            ${currentLang === 'fr' ? (cat.name_fr || cat.name_en) : cat.name_en}
        </button>
    `).join('');

    container.innerHTML = allBtn + catBtns;
}

window.filterByCategory = function(cat) {
    activeCategory = String(cat);
    renderCategories();
    renderProducts();
};

// ---- Products ----
function getLikedProductIds() {
    try {
        const ids = JSON.parse(localStorage.getItem('playora_liked_products') || '[]');
        return Array.isArray(ids) ? ids.map(String) : [];
    } catch {
        return [];
    }
}

window.toggleProductLike = function(productId) {
    const likedIds = getLikedProductIds();
    const id = String(productId);
    const isLiked = likedIds.includes(id);
    const nextIds = isLiked ? likedIds.filter(item => item !== id) : [...likedIds, id];
    localStorage.setItem('playora_liked_products', JSON.stringify(nextIds));
    renderProducts();
    showToast(tr(isLiked ? 'unliked_product' : 'liked_product'), 'success', 1800);
};

async function loadProducts() {
    showSkeletons();
    try {
        const res = await api.getProducts();
        if (res.success) {
            allProducts = res.products;
            renderProducts();
        } else {
            throw new Error(res.message || 'Could not load products');
        }
    } catch (e) {
        console.error('Load products error:', e);
        document.getElementById('products-grid').innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <div class="empty-state-icon">⚠️</div>
                <p>${tr('connection_error')}</p>
            </div>`;
    }
}

function showSkeletons() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = Array(8).fill(`
        <div class="skeleton-card">
            <div class="skeleton skeleton-img"></div>
            <div class="skeleton-body">
                <div class="skeleton skeleton-line" style="width:80%"></div>
                <div class="skeleton skeleton-line skeleton-line-short"></div>
                <div class="skeleton skeleton-line" style="width:40%;margin-top:1rem"></div>
            </div>
        </div>
    `).join('');
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    let filtered = allProducts;

    if (activeCategory !== 'all') {
        filtered = filtered.filter(p => String(p.category_id) === activeCategory);
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
            p.name_en.toLowerCase().includes(q) ||
            (p.name_fr || '').toLowerCase().includes(q) ||
            (p.description_en && p.description_en.toLowerCase().includes(q))
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <div class="empty-state-icon">🔍</div>
                <p>${tr('no_products')}</p>
            </div>`;
        return;
    }

    const likedProductIds = getLikedProductIds();
    grid.innerHTML = filtered.map(product => {
        const outOfStock = product.stock_quantity <= 0;
        const name = currentLang === 'fr' ? (product.name_fr || product.name_en) : product.name_en;
        const desc = currentLang === 'fr' ? (product.description_fr || product.description_en) : product.description_en;
        const catName = currentLang === 'fr' ? (product.category_name_fr || product.category_name_en) : product.category_name_en;
        const isLiked = likedProductIds.includes(String(product.id));

        return `
        <div class="product-card" onclick="goToProduct(${product.id})">
            <div class="product-card-img">
                <img src="${product.image_url || '/images/placeholder.png'}" alt="${name}" 
                     onerror="this.src='/images/placeholder.png'" loading="lazy">
                <button class="product-like-btn ${isLiked ? 'is-liked' : ''}"
                        onclick="event.stopPropagation(); toggleProductLike(${product.id})"
                        aria-label="${tr(isLiked ? 'unlike_product' : 'like_product')}"
                        title="${tr(isLiked ? 'unlike_product' : 'like_product')}" aria-pressed="${isLiked}">
                    <span class="material-symbols-outlined">${isLiked ? 'favorite' : 'favorite_border'}</span>
                </button>
                ${catName ? `<span class="product-card-badge">${catName}</span>` : ''}
                ${outOfStock ? `<div class="product-card-out">${tr('out_of_stock')}</div>` : ''}
            </div>
            <div class="product-card-body">
                <div class="product-card-name">${name}</div>
                <div class="product-card-desc">${desc || ''}</div>
                <div class="product-card-footer">
                    <span class="product-price">${product.starting_price_eur != null ? new Intl.NumberFormat(currentLang === 'fr' ? 'fr-FR' : 'en-IE',{style:'currency',currency:'EUR'}).format(Number(product.starting_price_eur)) : '—'}</span>
                    <button class="add-to-cart-btn" 
                            onclick="event.stopPropagation(); handleAddToCart(${product.id})"
                            ${outOfStock ? 'disabled' : ''}
                            title="${tr('add_to_cart')}">
                        <span class="material-symbols-outlined">add_shopping_cart</span>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

window.goToProduct = function(id) {
    window.location.href = `/product.html?id=${id}`;
};

window.handleAddToCart = function(productId) {
    window.goToProduct(productId);
};

// ---- Scroll to products ----
window.scrollToProducts = function() {
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
};

// ---- Hero Showcase ----
function populateHeroShowcase() {
    const fan = document.getElementById('hero-cards-fan');
    const strip = document.getElementById('hero-strip');
    if (!fan || !strip) return;

    // Rotate through the real catalog while keeping up to five cards in the fan.
    const fanProducts = allProducts.length > 0
        ? Array.from({ length: 5 }, (_, offset) => allProducts[(heroStartIndex + offset) % allProducts.length])
        : [];
    const stripProducts = allProducts.length > 0 ? [...allProducts, ...allProducts] : []; // duplicate for infinite feel

    // Render fan cards
    fan.innerHTML = fanProducts.map(p => {
        const name = currentLang === 'fr' ? (p.name_fr || p.name_en) : p.name_en;
        return `<div class="hero-fan-card" onclick="goToProduct(${p.id})" title="${name}">
            <img src="${p.image_url || '/images/placeholder.png'}" alt="${name}" onerror="this.src='/images/placeholder.png'" loading="lazy">
        </div>`;
    }).join('');

    // If no products, show placeholder cards
    if (fanProducts.length === 0) {
        fan.innerHTML = Array(5).fill('').map((_, i) => 
            `<div class="hero-fan-card" style="background: linear-gradient(155deg, rgba(70,44,125,0.6), rgba(41,26,48,0.9))"></div>`
        ).join('');
    }
    const hasMoreProducts = allProducts.length > 1;
    document.querySelectorAll('.hero-fan-arrow').forEach(button => {
        button.hidden = !hasMoreProducts;
    });

    // Render strip cards
    strip.innerHTML = stripProducts.map(p => {
        const name = currentLang === 'fr' ? (p.name_fr || p.name_en) : p.name_en;
        return `<div class="hero-strip-card" onclick="goToProduct(${p.id})" title="${name}">
            <img src="${p.image_url || '/images/placeholder.png'}" alt="${name}" onerror="this.src='/images/placeholder.png'" loading="lazy">
        </div>`;
    }).join('');
}

function setupHeroFanControls() {
    document.querySelector('.hero-fan-prev')?.addEventListener('click', () => {
        shiftHeroFan(-1);
    });
    document.querySelector('.hero-fan-next')?.addEventListener('click', () => {
        shiftHeroFan(1);
    });
    const showcase = document.getElementById('hero-showcase');
    showcase?.addEventListener('mouseenter', stopHeroFanRotation);
    showcase?.addEventListener('mouseleave', startHeroFanRotation);
    showcase?.addEventListener('focusin', stopHeroFanRotation);
    showcase?.addEventListener('focusout', startHeroFanRotation);

}

function shiftHeroFan(direction) {
    const fan = document.getElementById('hero-cards-fan');
    if (!fan || allProducts.length < 2 || heroFanBusy) return;
    heroFanBusy = true;
    fan.classList.remove('is-shifting-next', 'is-shifting-prev');
    fan.classList.add(direction > 0 ? 'is-shifting-next' : 'is-shifting-prev');

    window.setTimeout(() => {
        fan.classList.remove('is-shifting-next', 'is-shifting-prev');
        heroStartIndex = (heroStartIndex + direction + allProducts.length) % allProducts.length;
        populateHeroShowcase();
        heroFanBusy = false;
    }, 360);
}

function startHeroFanRotation() {
    stopHeroFanRotation();
    if (allProducts.length < 2) return;
    heroFanTimer = window.setInterval(() => shiftHeroFan(-1), 3400);
}

function stopHeroFanRotation() {
    if (heroFanTimer) window.clearInterval(heroFanTimer);
    heroFanTimer = null;
}

// ---- Floating Particles ----
function createHeroParticles() {
    const container = document.getElementById('hero-particles');
    if (!container) return;

    const colors = [
        'rgba(213, 82, 163, 0.6)',
        'rgba(131, 28, 145, 0.5)',
        'rgba(255, 112, 191, 0.5)',
        'rgba(70, 44, 125, 0.6)',
        'rgba(255, 255, 255, 0.3)'
    ];

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'hero-particle';
        const size = Math.random() * 4 + 2;
        const duration = Math.random() * 15 + 8;
        const delay = Math.random() * 15;
        const left = Math.random() * 100;
        const drift = (Math.random() - 0.5) * 80;
        const maxOpacity = Math.random() * 0.5 + 0.3;
        const color = colors[Math.floor(Math.random() * colors.length)];

        particle.style.cssText = `
            --size: ${size}px;
            --duration: ${duration}s;
            --drift: ${drift}px;
            --max-opacity: ${maxOpacity};
            --color: ${color};
            left: ${left}%;
            animation-delay: -${delay}s;
        `;
        container.appendChild(particle);
    }
}

// ---- Hero Strip Scroll ----
function setupHeroStrip() {
    const strip = document.getElementById('hero-strip');
    if (!strip) return;

    // Wheel scroll translates vertical movement into horizontal movement.
    strip.addEventListener('wheel', event => {
        if (strip.scrollWidth <= strip.clientWidth) return;
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
            event.preventDefault();
            strip.scrollLeft += event.deltaY;
        }
    }, { passive: false });

    // Mouse drag scroll
    let startX = 0, startScroll = 0, dragging = false, dragged = false;
    strip.addEventListener('mousedown', event => {
        if (event.button !== 0) return;
        startX = event.clientX;
        startScroll = strip.scrollLeft;
        dragging = true;
        dragged = false;
        strip.classList.add('is-dragging');
    });
    window.addEventListener('mousemove', event => {
        if (!dragging) return;
        const distance = event.clientX - startX;
        if (Math.abs(distance) > 4) dragged = true;
        if (dragged) strip.scrollLeft = startScroll - distance;
    });
    window.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        strip.classList.remove('is-dragging');
    });
    strip.addEventListener('click', event => {
        if (!dragged) return;
        event.preventDefault();
        event.stopPropagation();
        dragged = false;
    }, true);
}
