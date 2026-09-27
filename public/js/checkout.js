/* =============================================
   PLAYORA - Checkout JS
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    initLang();
    applyCheckoutTranslations();
    setupLangToggle();
    renderOrderSummary();
    setupForm();
    document.addEventListener('langChange', () => { applyCheckoutTranslations(); renderOrderSummary(); });
});

const checkoutI18n = {
    en: {
        checkout_title: 'Checkout',
        order_summary: 'Order Summary',
        customer_info: 'Customer Information',
        full_name: 'Full Name',
        phone: 'Phone Number',
        email: 'Email Address',
        address: 'Delivery Address',
        notes: 'Notes (Optional)',
        place_order: 'Place Order',
        subtotal: 'Subtotal',
        total: 'Total',
        required: 'This field is required',
        invalid_phone: 'Invalid phone number',
        invalid_email: 'Invalid email address',
        empty_cart: 'Your cart is empty',
        processing: 'Processing order...',
        back_to_store: 'Back to Store',
        store_link: 'Store',
        name_placeholder: 'Enter your full name',
        phone_placeholder: 'e.g. 0555123456',
        email_placeholder: 'example@email.com',
        address_placeholder: 'City, District, Street, Building',
        notes_placeholder: 'Any additional notes for your order',
        qty_label: 'Qty',
        generic_error: 'An error occurred. Please try again.',
        connection_error: 'Could not connect to the server.',
    },
    fr: {
        checkout_title: 'Finaliser la commande',
        order_summary: 'Récapitulatif',
        customer_info: 'Informations client',
        full_name: 'Nom complet',
        phone: 'Téléphone',
        email: 'Adresse e-mail',
        address: 'Adresse de livraison',
        notes: 'Remarques (facultatif)',
        place_order: 'Confirmer la commande',
        subtotal: 'Sous-total',
        total: 'Total',
        required: 'Ce champ est obligatoire',
        invalid_phone: 'Numéro de téléphone invalide',
        invalid_email: 'Adresse e-mail invalide',
        empty_cart: 'Votre panier est vide',
        processing: 'Traitement de la commande…',
        back_to_store: 'Retour à la boutique',
        store_link: 'Boutique',
        name_placeholder: 'Saisissez votre nom complet',
        phone_placeholder: 'Ex. : 0555123456',
        email_placeholder: 'exemple@email.com',
        address_placeholder: 'Ville, quartier, rue, numéro',
        notes_placeholder: 'Remarques supplémentaires',
        qty_label: 'Qté',
        generic_error: 'Une erreur est survenue. Réessayez.',
        connection_error: 'Connexion au serveur impossible.',
    }
};

function ctr(key) { return (checkoutI18n[currentLang] || checkoutI18n.en)[key] || key; }

function applyCheckoutTranslations() {
    document.querySelectorAll('[data-co-i18n]').forEach(el => {
        el.textContent = ctr(el.getAttribute('data-co-i18n'));
    });
    document.querySelectorAll('[data-co-placeholder]').forEach(el => {
        el.placeholder = ctr(el.getAttribute('data-co-placeholder'));
    });
}

function setupLangToggle() {
    document.querySelectorAll('.language-select').forEach(select => select.addEventListener('change', () => setLang(select.value)));
}

function renderOrderSummary() {
    const cart = getCart();
    const container = document.getElementById('order-items');
    const totalEl = document.getElementById('order-total');
    const subtotalEl = document.getElementById('order-subtotal');

    if (cart.length === 0) {
        window.location.href = '/';
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <img src="${item.image_url || '/images/placeholder.png'}" alt="${currentLang === 'fr' ? (item.name_fr || item.name_en) : item.name_en}"
                 onerror="this.src='/images/placeholder.png'">
            <div class="checkout-item-info">
                <div class="checkout-item-name">${currentLang === 'fr' ? (item.name_fr || item.name_en) : item.name_en}</div>
                <div class="checkout-item-qty">${currentLang === 'fr' ? item.offer_label_fr : item.offer_label_en}</div>
                <div class="checkout-item-qty">${ctr('qty_label')}: ${item.quantity}</div>
            </div>
            <div class="checkout-item-price">${formatCartPrice(item, item.price * item.quantity)}</div>
        </div>
    `).join('');

    const total = getCartTotal();
    const currency = cart[0]?.currency || 'EUR';
    const formattedTotal = new Intl.NumberFormat(currentLang === 'fr' ? 'fr-FR' : 'en-IE', { style: 'currency', currency }).format(total);
    subtotalEl.textContent = formattedTotal;
    totalEl.textContent = formattedTotal;
}

function setupForm() {
    const form = document.getElementById('checkout-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner" style="width:20px;height:20px;border-width:2px"></span> ${ctr('processing')}`;

        const cart = getCart();
        const orderData = {
            customer_name: document.getElementById('customer-name').value.trim(),
            customer_phone: document.getElementById('customer-phone').value.trim(),
            customer_email: document.getElementById('customer-email').value.trim(),
            customer_address: document.getElementById('customer-address').value.trim(),
            notes: document.getElementById('customer-notes').value.trim(),
            items: cart.map(item => ({ product_id: item.product_id, offer_id: item.offer_id, quantity: item.quantity }))
        };

        try {
            const res = await api.createOrder(orderData);
            if (res.success) {
                clearCart();
                sessionStorage.setItem('last_order', JSON.stringify(res.order));
                window.location.href = '/order-success.html';
            } else {
                showToast(res.message || ctr('generic_error'), 'error');
                btn.disabled = false;
                btn.textContent = ctr('place_order');
            }
        } catch (err) {
            showToast(ctr('connection_error'), 'error');
            btn.disabled = false;
            btn.textContent = ctr('place_order');
        }
    });
}

function validateForm() {
    let valid = true;

    const fields = [
        { id: 'customer-name', key: 'required', check: v => v.length >= 2 },
        { id: 'customer-phone', key: 'invalid_phone', check: v => /^[\d\+\-\s]{7,15}$/.test(v) },
        { id: 'customer-email', key: 'invalid_email', check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
        { id: 'customer-address', key: 'required', check: v => v.length >= 5 },
    ];

    fields.forEach(({ id, key, check }) => {
        const input = document.getElementById(id);
        const error = document.getElementById(`${id}-error`);
        const val = input.value.trim();

        if (!check(val)) {
            input.style.borderColor = 'var(--danger)';
            error.textContent = ctr(key);
            valid = false;
        } else {
            input.style.borderColor = '';
            error.textContent = '';
        }
    });

    return valid;
}
