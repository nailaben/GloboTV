/* =============================================
   PLAYORA - Dashboard JS
   ============================================= */

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    initLang();
    applyDashboardTranslations();
    setupSidebar();
    setupLangToggle();
    loadSellerInfo();
    document.addEventListener('langChange', async () => {
        applyDashboardTranslations();
        await showTab(currentTab);
    });
    await loadStats();
    await showTab('products');
});

// ---- Auth ----
function checkAuth() {
    if (!getToken()) window.location.href = '/seller/login.html';
}

function loadSellerInfo() {
    const seller = getSeller();
    if (!seller) return;
    const initials = seller.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('seller-avatar').textContent = initials;
    document.getElementById('seller-name').textContent = seller.name;
    document.getElementById('seller-email').textContent = seller.email;
    document.getElementById('topbar-seller').textContent = seller.name;
}

document.getElementById('logout-btn')?.addEventListener('click', () => {
    removeToken();
    window.location.href = '/seller/login.html';
});

// ---- Sidebar ----
function setupSidebar() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    const closeSidebar = () => {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('show');
        mobileBtn?.setAttribute('aria-expanded', 'false');
    };

    mobileBtn?.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('open');
        overlay.classList.toggle('show', isOpen);
        mobileBtn.setAttribute('aria-expanded', String(isOpen));
    });

    overlay?.addEventListener('click', closeSidebar);
    sidebar?.querySelectorAll('[data-tab]').forEach(link => link.addEventListener('click', closeSidebar));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeSidebar(); });
}

function setupLangToggle() {
    document.querySelectorAll('.language-select').forEach(select => select.addEventListener('change', () => setLang(select.value)));
}

// ---- Stats ----
async function loadStats() {
    try {
        const res = await api.getStats();
        if (res.success) {
            const { totalProducts, totalOrders, totalRevenue, pendingOrders } = res.stats;
            animateCount('stat-products', totalProducts);
            animateCount('stat-orders', totalOrders);
            document.getElementById('stat-revenue').textContent = new Intl.NumberFormat(currentLang === 'fr' ? 'fr-FR' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(Number(totalRevenue));
            animateCount('stat-pending', pendingOrders);
        } else {
            showStatsUnavailable();
        }
    } catch (e) {
        console.error('Stats error:', e);
        showStatsUnavailable();
    }
}

function showStatsUnavailable() {
    ['stat-products', 'stat-orders', 'stat-pending'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = '—';
    });
    const revenue = document.getElementById('stat-revenue');
    if (revenue) revenue.textContent = '—';
}

function animateCount(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const step = Math.ceil(target / 30);
    const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
    }, 40);
}

// ---- Tabs ----
let currentTab = 'products';

async function showTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

    document.getElementById('topbar-title').textContent =
        tab === 'products' ? t('Products Management', 'Gestion des produits') :
        tab === 'orders'   ? t('Orders', 'Commandes') : 'PLAYORA';

    if (tab === 'products') await loadProductsTable();
    if (tab === 'orders') await loadOrdersTable();
}

window.showTab = showTab;

// ---- Products Tab ----
let products = [];
let editingProductId = null;

async function loadProductsTable(search = '') {
    const tbody = document.getElementById('products-tbody');
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

    let res;
    try {
        res = await api.getSellerProducts();
    } catch (error) {
        console.error('Load seller products error:', error);
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>${t('Could not load products. Refresh and try again.', 'Impossible de charger les produits. Actualisez la page.')}</p></div></td></tr>`;
        return;
    }
    if (!res.success) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>${res.message || t('Could not load products.', 'Impossible de charger les produits.')}</p></div></td></tr>`;
        return;
    }

    products = res.products;

    let filtered = products;
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p =>
            (p.name_fr || p.name_en).toLowerCase().includes(q) || p.name_en.toLowerCase().includes(q)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">📦</div><p>${t('No products found', 'Aucun produit trouvé')}</p></div></td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:0.75rem">
                    ${p.image_url
                        ? `<img src="${p.image_url}" alt="${p.name_fr || p.name_en}" class="product-thumb" onerror="this.src='/images/placeholder.png'">`
                        : `<div class="product-thumb-placeholder"><span class="material-symbols-outlined">image</span></div>`}
                </div>
            </td>
            <td>
                    <div style="font-weight:600;font-size:0.875rem">${p.name_fr || p.name_en}</div>
                <div style="color:var(--text-muted);font-size:0.78rem">${p.name_en}</div>
            </td>
            <td>${currentLang === 'fr' ? (p.category_name_fr || p.category_name_en || '—') : (p.category_name_en || '—')}</td>
            <td><span style="font-weight:700;color:var(--primary-light)">${p.offers?.length ? new Intl.NumberFormat(currentLang === 'fr' ? 'fr-FR' : 'en-IE',{style:'currency',currency:'EUR'}).format(Math.min(...p.offers.map(o=>Number(o.price_eur)))) : '—'}</span></td>
            <td>
                <span class="${p.stock_quantity > 0 ? 'badge badge-success' : 'badge badge-danger'}">
                    ${p.stock_quantity}
                </span>
            </td>
            <td>
                <span class="badge ${p.is_active ? 'badge-success' : 'badge-danger'}">
                    ${p.is_active
                        ? t('Active', 'Actif')
                        : t('Hidden', 'Masqué')}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditProduct(${p.id})" title="${t('Edit', 'Modifier')}">
                        <span class="material-symbols-outlined" style="font-size:1rem">edit</span>
                    </button>
                    <button class="btn btn-danger btn-sm btn-icon" onclick="confirmDeleteProduct(${p.id}, '${(p.name_fr || p.name_en).replace(/'/g, "\\'")}')" title="${t('Delete', 'Supprimer')}">
                        <span class="material-symbols-outlined" style="font-size:1rem">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Product search
document.getElementById('product-search')?.addEventListener('input', (e) => {
    clearTimeout(window._productSearchTimer);
    window._productSearchTimer = setTimeout(() => loadProductsTable(e.target.value), 300);
});

// ---- Product Modal ----
let productCategories = [];

async function openAddProduct() {
    editingProductId = null;
    await loadCategoriesForForm();
    clearProductForm();
    addOfferRow();
    document.getElementById('product-modal-title').textContent = t('Add New Product', 'Ajouter un produit');
    document.getElementById('product-modal').style.display = 'flex';
}

window.openAddProduct = openAddProduct;

async function openEditProduct(id) {
    editingProductId = id;
    await loadCategoriesForForm();
    clearProductForm();
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('product-modal-title').textContent = t('Edit Product', 'Modifier le produit');
    document.getElementById('prod-name-fr').value = product.name_fr || product.name_en;
    document.getElementById('prod-name-en').value = product.name_en;
    document.getElementById('prod-desc-fr').value = product.description_fr || '';
    document.getElementById('prod-desc-en').value = product.description_en || '';
    document.getElementById('prod-price').value = product.price;
    document.getElementById('prod-stock').value = product.stock_quantity;
    document.getElementById('prod-category').value = product.category_id || '';
    document.getElementById('prod-active').checked = product.is_active;
    const offerEditor = document.getElementById('product-offers-editor');
    offerEditor.innerHTML = '';
    (product.offers || []).forEach(addOfferRow);
    if (!product.offers?.length) addOfferRow();

    if (product.image_url) {
        const preview = document.getElementById('image-preview');
        preview.src = product.image_url;
        preview.style.display = 'block';
    }

    document.getElementById('product-modal').style.display = 'flex';
}

window.openEditProduct = openEditProduct;

async function loadCategoriesForForm() {
    if (productCategories.length === 0) {
        const res = await api.getCategories();
        if (res.success) productCategories = res.categories;
    }

    const select = document.getElementById('prod-category');
    select.innerHTML = `<option value="">${t('Select Category', 'Choisir une catégorie')}</option>` +
        productCategories.map(c => `<option value="${c.id}">${currentLang === 'fr' ? (c.name_fr || c.name_en) : c.name_en}</option>`).join('');
}

function clearProductForm() {
    document.getElementById('product-form').reset();
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('product-offers-editor').innerHTML = '';
}

function addOfferRow(offer = {}) {
    const row = document.createElement('div');
    row.className = 'product-offer-row';
    row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 140px auto;gap:.5rem;margin:.5rem 0';
    row.innerHTML = `<input class="form-input offer-label-en" placeholder="Offer name (English)" value="${escapeHtml(offer.label_en || '')}" required><input class="form-input offer-label-fr" placeholder="Nom de l’offre (français)" value="${escapeHtml(offer.label_fr || '')}" required><input class="form-input offer-price-eur" type="number" min="0" step="0.01" placeholder="Price €" value="${offer.price_eur ?? ''}" required><button type="button" class="btn btn-danger remove-offer" aria-label="Remove offer">×</button>`;
    row.querySelector('.remove-offer').addEventListener('click', () => { if (document.querySelectorAll('.product-offer-row').length > 1) row.remove(); });
    document.getElementById('product-offers-editor').appendChild(row);
}
document.getElementById('add-product-offer')?.addEventListener('click', () => addOfferRow());

function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

document.getElementById('close-product-modal')?.addEventListener('click', () => {
    document.getElementById('product-modal').style.display = 'none';
});

document.getElementById('product-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
});

// Image preview
document.getElementById('prod-image')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const preview = document.getElementById('image-preview');
            preview.src = ev.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Submit product form
document.getElementById('product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('save-product-btn');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="width:18px;height:18px;border-width:2px"></span>`;

    const formData = new FormData();
    formData.append('name_fr', document.getElementById('prod-name-fr').value.trim());
    formData.append('name_en', document.getElementById('prod-name-en').value.trim());
    formData.append('description_fr', document.getElementById('prod-desc-fr').value.trim());
    formData.append('description_en', document.getElementById('prod-desc-en').value.trim());
    formData.append('price', document.getElementById('prod-price').value);
    const offers = [...document.querySelectorAll('.product-offer-row')].map(row => ({
        label_en: row.querySelector('.offer-label-en').value.trim(),
        label_fr: row.querySelector('.offer-label-fr').value.trim(),
        price_eur: Number(row.querySelector('.offer-price-eur').value)
    }));
    if (!offers.length || offers.some(o => !o.label_en || !o.label_fr || !Number.isFinite(o.price_eur) || o.price_eur < 0)) {
        showToast(t('Add at least one complete offer with a EUR price.', 'Ajoutez au moins une offre complète avec un prix en EUR.'), 'error');
        btn.disabled = false;
        btn.textContent = t('Save', 'Enregistrer');
        return;
    }
    formData.append('offers_json', JSON.stringify(offers));
    formData.append('stock_quantity', document.getElementById('prod-stock').value);
    formData.append('category_id', document.getElementById('prod-category').value);
    formData.append('is_active', document.getElementById('prod-active').checked);

    const imageFile = document.getElementById('prod-image').files[0];
    if (imageFile) formData.append('image', imageFile);

    const imageUrl = document.getElementById('prod-image-url').value.trim();
    if (imageUrl && !imageFile) formData.append('image_url', imageUrl);

    try {
        const res = editingProductId
            ? await api.updateProduct(editingProductId, formData)
            : await api.addProduct(formData);

        if (res.success) {
            showToast(
                editingProductId
                    ? t('✓ Product updated', '✓ Produit modifié')
                    : t('✓ Product added', '✓ Produit ajouté'),
                'success'
            );
            document.getElementById('product-modal').style.display = 'none';
            await loadProductsTable();
            await loadStats();
        } else {
            showToast(res.message || t('An error occurred', 'Une erreur est survenue'), 'error');
        }
    } catch (err) {
        showToast(t('Could not connect to the server.', 'Connexion au serveur impossible.'), 'error');
    }

    btn.disabled = false;
    btn.textContent = t('Save', 'Enregistrer');
});

// Delete product
window.confirmDeleteProduct = async function(id, name) {
    const confirm = window.confirm(
        t(`Delete "${name}"?`, `Supprimer « ${name} » ?`)
    );
    if (!confirm) return;

    const res = await api.deleteProduct(id);
    if (res.success) {
        showToast(t('✓ Product deleted', '✓ Produit supprimé'), 'success');
        await loadProductsTable();
        await loadStats();
    } else {
        showToast(res.message || t('An error occurred', 'Une erreur est survenue'), 'error');
    }
};

// ---- Orders Tab ----
let currentOrderFilter = 'all';

async function loadOrdersTable() {
    const tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

    const res = await api.getOrders({ status: currentOrderFilter });
    if (!res.success) return;

    const orders = res.orders;

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">📋</div><p>${t('No orders found', 'Aucune commande trouvée')}</p></div></td></tr>`;
        return;
    }

    const statusLabels = {
        en: { pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', completed: 'Completed', cancelled: 'Cancelled' },
        fr: { pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', completed: 'Terminée', cancelled: 'Annulée' }
    };

    tbody.innerHTML = orders.map(o => `
        <tr>
            <td><span style="font-weight:700;font-size:0.8rem;color:var(--primary-light)">${o.order_number}</span></td>
            <td>
                <div style="font-weight:600;font-size:0.875rem">${o.customer_name}</div>
                <div style="color:var(--text-muted);font-size:0.78rem">${o.customer_phone}</div>
            </td>
            <td style="font-size:0.8rem;color:var(--text-muted)">${o.customer_email}</td>
            <td>${o.items_count || '—'}</td>
            <td><span style="font-weight:700;color:var(--accent)">${new Intl.NumberFormat(currentLang === 'fr' ? 'fr-FR' : 'en-IE',{style:'currency',currency:o.currency||'USD'}).format(Number(o.total_amount))}</span></td>
            <td>
                <select class="status-select status-${o.status}" onchange="updateStatus(${o.id}, this.value, this)">
                    ${['pending','confirmed','shipped','completed','cancelled'].map(s => `
                        <option value="${s}" ${o.status === s ? 'selected' : ''}>${statusLabels[currentLang][s]}</option>
                    `).join('')}
                </select>
            </td>
            <td style="font-size:0.78rem;color:var(--text-muted)">${formatDate(o.created_at)}</td>
        </tr>
    `).join('');
}

window.updateStatus = async function(orderId, status, selectEl) {
    selectEl.className = `status-select status-${status}`;
    const res = await api.updateOrderStatus(orderId, status);
    if (res.success) {
        showToast(t('✓ Status updated', '✓ Statut mis à jour'), 'success', 2000);
        await loadStats();
    } else {
        showToast(t('An error occurred', 'Une erreur est survenue'), 'error');
    }
};

// Filter orders by status
document.querySelectorAll('[data-order-filter]').forEach(btn => {
    btn.addEventListener('click', async () => {
        document.querySelectorAll('[data-order-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentOrderFilter = btn.getAttribute('data-order-filter');
        await loadOrdersTable();
    });
});

// ---- Translations ----
function applyDashboardTranslations() {
    const translations = {
        en: {products_mgmt:'Products Management',orders_mgmt:'Orders',add_product:'Add Product',product_name_fr:'Product Name (French)',product_name_en:'Product Name (English)',desc_fr:'Description (French)',desc_en:'Description (English)',price:'Price (€)',offers:'Product offers (each with a EUR price)',add_offer:'Add offer',stock:'Stock Quantity',category:'Category',image:'Product Image',active:'Product is active and visible to customers',save:'Save',cancel:'Cancel',image_url:'Or image URL',total_products:'Total Products',total_orders:'Total Orders',total_revenue:'Total Revenue (€)',pending_orders:'Pending Orders',dashboard:'Dashboard',logout:'Log out',seller_dashboard:'Seller Dashboard',main_menu:'Main Menu',tools:'Tools',view_store:'View Store',image_col:'Image',name_col:'Product Name',category_col:'Category',price_col:'From (€)',stock_col:'Stock',status_col:'Status',actions_col:'Actions',filter_all:'All',filter_pending:'Pending',filter_confirmed:'Confirmed',filter_shipped:'Shipped',filter_completed:'Completed',filter_cancelled:'Cancelled',drop_image:'Drop an image here or click to choose (max 5 MB)',category_select:'Select a category',search:'Search...',name_example_fr:'e.g. Carte Google Play',name_example_en:'e.g. Google Play Card',description_example_fr:'Description du produit en français…',description_example_en:'Product description in English…'},
        fr: {products_mgmt:'Gestion des produits',orders_mgmt:'Commandes',add_product:'Ajouter un produit',product_name_fr:'Nom du produit (français)',product_name_en:'Nom du produit (anglais)',desc_fr:'Description (français)',desc_en:'Description (anglais)',price:'Prix (€)',offers:'Offres du produit (prix en EUR pour chaque offre)',add_offer:'Ajouter une offre',stock:'Quantité en stock',category:'Catégorie',image:'Image du produit',active:'Produit actif et visible par les clients',save:'Enregistrer',cancel:'Annuler',image_url:'Ou URL de l’image',total_products:'Total des produits',total_orders:'Total des commandes',total_revenue:'Chiffre d’affaires (€)',pending_orders:'Commandes en attente',dashboard:'Tableau de bord',logout:'Déconnexion',seller_dashboard:'Espace vendeur',main_menu:'Menu principal',tools:'Outils',view_store:'Voir la boutique',image_col:'Image',name_col:'Nom du produit',category_col:'Catégorie',price_col:'À partir de (€)',stock_col:'Stock',status_col:'Statut',actions_col:'Actions',filter_all:'Toutes',filter_pending:'En attente',filter_confirmed:'Confirmées',filter_shipped:'Expédiées',filter_completed:'Terminées',filter_cancelled:'Annulées',drop_image:'Déposez une image ici ou cliquez pour choisir (max. 5 Mo)',category_select:'Choisir une catégorie',search:'Rechercher…',name_example_fr:'Ex. : Carte Google Play',name_example_en:'Ex. : Google Play Card',description_example_fr:'Description du produit en français…',description_example_en:'Description du produit en anglais…'}
    };
    Object.assign(translations.en, { order_number:'Order Number', customer:'Customer', email_col:'Email', products_col:'Products', total_col:'Total', date_col:'Date' });
    Object.assign(translations.fr, { order_number:'N° de commande', customer:'Client', email_col:'E-mail', products_col:'Produits', total_col:'Total', date_col:'Date' });
    document.querySelectorAll('[data-dash-i18n]').forEach(el => { const key=el.getAttribute('data-dash-i18n'); el.textContent=translations[currentLang][key]||key; });
    document.querySelectorAll('[data-dash-placeholder]').forEach(el => { const key=el.getAttribute('data-dash-placeholder'); el.placeholder=translations[currentLang][key]||key; });
    document.querySelectorAll('[data-dash-text]').forEach(el => { const key=el.getAttribute('data-dash-text'); el.textContent=translations[currentLang][key]||key; });
}
