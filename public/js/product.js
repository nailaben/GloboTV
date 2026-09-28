initLang();
setupLangToggle();

const productCopy = {
    en: {
        home: 'Home', shop: 'Shop', signin: 'Sign in', search: 'Search a product or brand…',
        instant: 'INSTANT DELIVERY', select: 'Choose an offer', item: 'Item', plan: 'Plan',
        cart: 'Add to cart', added: 'Added to cart', stock: 'In stock — ready to send', out: 'Out of stock',
        noOffers: 'Offers are not available yet. Please contact the seller.', failed: 'Could not load this product.',
        secure: 'Secure payment', support: '24/7 support', instantTrust: 'Instant delivery', available: 'Available instantly', help: 'Always here to help',
        descriptionTab: 'Description', deliveryTab: 'Delivery info', reviewsTab: 'Reviews', descriptionTitle: 'Product details',
        deliveryTitle: 'Delivery information', deliveryText: 'Your selected digital offer will be prepared for delivery after your order is confirmed.',
        reviewsTitle: 'Customer reviews', reviewsText: 'There are no reviews for this product yet.',
        like: 'Add to favorites', unlike: 'Remove from favorites',
    },
    fr: {
        home: 'Accueil', shop: 'Boutique', signin: 'Se connecter', search: 'Rechercher un produit ou une marque…',
        instant: 'LIVRAISON INSTANTANÉE', select: 'Choisir une offre', item: 'Article', plan: 'Formule',
        cart: 'Ajouter au panier', added: 'Ajouté au panier', stock: 'En stock — prêt à être envoyé', out: 'Rupture de stock',
        noOffers: 'Les offres ne sont pas encore disponibles. Contactez le vendeur.', failed: 'Impossible de charger ce produit.',
        secure: 'Paiement sécurisé', support: 'Assistance 24 h/24', instantTrust: 'Livraison instantanée', available: 'Disponible immédiatement', help: 'Toujours là pour vous',
        descriptionTab: 'Description', deliveryTab: 'Livraison', reviewsTab: 'Avis', descriptionTitle: 'Détails du produit',
        deliveryTitle: 'Informations de livraison', deliveryText: 'Votre offre numérique sera préparée après la confirmation de votre commande.',
        reviewsTitle: 'Avis clients', reviewsText: 'Ce produit n’a pas encore d’avis.',
        like: 'Ajouter aux favoris', unlike: 'Retirer des favoris',
    }
};

const tx = key => (productCopy[currentLang] || productCopy.en)[key];
let product = null;
let selectedOffer = null;
let quantity = 1;
let activeTab = 'description';
let liked = false;
const root = document.getElementById('product-detail');

function translateHeader() {
    document.querySelector('[data-product="shop"]').textContent = tx('shop');
    document.querySelector('[data-product="signin"]').textContent = tx('signin');
    document.getElementById('product-search').placeholder = tx('search');
}

function escapeProductText(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function productName() {
    return currentLang === 'fr' ? (product.name_fr || product.name_en) : product.name_en;
}

function productDescription() {
    return currentLang === 'fr' ? (product.description_fr || product.description_en) : product.description_en;
}

function renderTabContent() {
    if (activeTab === 'delivery') return `<h3>${tx('deliveryTitle')}</h3><p>${tx('deliveryText')}</p>`;
    if (activeTab === 'reviews') return `<h3>${tx('reviewsTitle')}</h3><p>${tx('reviewsText')}</p>`;
    return `<h3>${escapeProductText(productName())}: ${tx('descriptionTitle')}</h3><p>${escapeProductText(productDescription() || '')}</p>`;
}

function renderProduct() {
    if (!product) return;
    const name = productName();
    const category = currentLang === 'fr'
        ? (product.category_name_fr || product.category_name_en || 'IP-TV')
        : (product.category_name_en || 'IP-TV');
    const offers = product.offers || [];
    if (!selectedOffer || !offers.some(offer => String(offer.id) === String(selectedOffer.id))) {
        selectedOffer = offers[0] || null;
    }
    const favoriteIds = JSON.parse(localStorage.getItem('playora_liked_products') || '[]').map(String);
    liked = favoriteIds.includes(String(product.id));
    document.title = `${escapeProductText(name)} | PLAYORA`;

    root.innerHTML = `
        <div class="product-breadcrumb"><a href="/">${tx('home')}</a><span>/</span><a href="/">${tx('shop')}</a><span>/</span><a href="/?category=${encodeURIComponent(product.category_id || '')}">${escapeProductText(category)}</a><span>/</span><strong>${escapeProductText(name)}</strong></div>
        <div class="product-layout">
            <div class="product-gallery">
                <div class="product-gallery-main"><img id="product-main-image" src="${escapeProductText(product.image_url || '/images/placeholder.png')}" alt="${escapeProductText(name)}" onerror="this.src='/images/placeholder.png'"></div>
                <div class="product-gallery-thumbs"><button class="product-thumb active" type="button" aria-label="View product image"><img src="${escapeProductText(product.image_url || '/images/placeholder.png')}" alt=""></button></div>
            </div>
            <section class="product-summary">
                <div class="product-badges"><span class="product-badge instant"><span class="material-symbols-outlined">bolt</span>${tx('instant')}</span><span class="product-badge">${escapeProductText(category)}</span></div>
                <div class="product-title-row"><h1>${escapeProductText(name)}</h1><button type="button" id="favorite-product" class="product-favorite ${liked ? 'liked' : ''}" aria-label="${liked ? tx('unlike') : tx('like')}" title="${liked ? tx('unlike') : tx('like')}"><span class="material-symbols-outlined">${liked ? 'favorite' : 'favorite_border'}</span></button></div>
                <p class="product-description">${escapeProductText(productDescription() || '')}</p>
                <section class="offer-panel">
                    <div class="product-detail-price">${selectedOffer ? formatCartPrice({ price: Number(selectedOffer.price_eur), currency: 'EUR' }) : `<span class="no-offers">${tx('noOffers')}</span>`}</div>
                    <div class="offer-group"><span class="offer-group-label">${tx('item')}</span><span class="product-item-chip">${escapeProductText(category)}</span></div>
                    <div class="offer-group"><span class="offer-group-label">${tx('plan')}</span><div class="offer-options">${offers.map(offer => `<button class="offer-choice ${String(offer.id) === String(selectedOffer?.id) ? 'selected' : ''}" data-offer="${escapeProductText(offer.id)}" type="button">${escapeProductText(currentLang === 'fr' ? offer.label_fr : offer.label_en)}</button>`).join('')}</div></div>
                    <div class="product-detail-actions"><div class="quantity-control"><button id="qty-minus" type="button" aria-label="Decrease quantity">−</button><output>${quantity}</output><button id="qty-plus" type="button" aria-label="Increase quantity">+</button></div><button id="add-product" class="btn btn-primary" ${!selectedOffer || Number(product.stock_quantity) <= 0 ? 'disabled' : ''}><span class="material-symbols-outlined">shopping_cart</span>${tx('cart')}</button></div>
                    <p class="stock-status ${Number(product.stock_quantity) > 0 ? '' : 'out'}">${Number(product.stock_quantity) > 0 ? tx('stock') : tx('out')}</p>
                </section>
                <div class="product-trust"><div><span class="material-symbols-outlined">bolt</span><strong>${tx('instantTrust')}</strong><small>${tx('available')}</small></div><div><span class="material-symbols-outlined">verified_user</span><strong>${tx('secure')}</strong><small>CIB &amp; Edahabia</small></div><div><span class="material-symbols-outlined">headphones</span><strong>${tx('support')}</strong><small>${tx('help')}</small></div></div>
            </section>
        </div>
        <section class="product-tabs"><div class="product-tab-list"><button class="product-tab ${activeTab === 'description' ? 'active' : ''}" data-tab="description" type="button">${tx('descriptionTab')}</button><button class="product-tab ${activeTab === 'delivery' ? 'active' : ''}" data-tab="delivery" type="button">${tx('deliveryTab')}</button><button class="product-tab ${activeTab === 'reviews' ? 'active' : ''}" data-tab="reviews" type="button">${tx('reviewsTab')}</button></div><div class="product-tab-content">${renderTabContent()}</div></section>`;

    root.querySelectorAll('[data-offer]').forEach(button => button.addEventListener('click', () => {
        selectedOffer = offers.find(offer => String(offer.id) === button.dataset.offer);
        renderProduct();
    }));
    root.querySelector('#qty-minus').addEventListener('click', () => { quantity = Math.max(1, quantity - 1); renderProduct(); });
    root.querySelector('#qty-plus').addEventListener('click', () => { quantity = Math.min(Number(product.stock_quantity) || 1, quantity + 1); renderProduct(); });
    root.querySelector('#add-product').addEventListener('click', () => {
        addToCart({ ...product, selectedOffer }, quantity);
        showToast(tx('added'), 'success');
    });
    root.querySelector('#favorite-product').addEventListener('click', () => {
        const current = JSON.parse(localStorage.getItem('playora_liked_products') || '[]').map(String);
        const next = current.includes(String(product.id)) ? current.filter(id => id !== String(product.id)) : [...current, String(product.id)];
        localStorage.setItem('playora_liked_products', JSON.stringify(next));
        renderProduct();
    });
    root.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
        activeTab = button.dataset.tab;
        renderProduct();
    }));
}

translateHeader();
document.addEventListener('langChange', () => { translateHeader(); renderProduct(); });
document.getElementById('product-search').addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.currentTarget.value.trim()) location.href = `/?search=${encodeURIComponent(event.currentTarget.value.trim())}`;
});

(async () => {
    try {
        const id = new URLSearchParams(location.search).get('id');
        const result = await api.getProduct(id);
        if (!result.success) throw new Error('Product unavailable');
        product = result.product;
        renderProduct();
    } catch {
        root.innerHTML = `<div class="product-unavailable">${tx('failed')}</div>`;
    }
})();
