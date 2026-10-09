/* =============================================
   PLAYORA - Checkout JS
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    initLang();
    applyCheckoutTranslations();
    setupLangToggle();
    renderOrderSummary();
    renderCheckoutAccount();
    setupCheckoutSteps();
    setupContactConfirmation();
    setupForm();
    document.addEventListener('langChange', () => {
        applyCheckoutTranslations();
        renderOrderSummary();
        renderPaymentSummary();
        renderCheckoutAccount();
        if (emailContactConfirmed) document.getElementById('confirm-email-btn').textContent = ctr('confirmed');
        if (whatsappContactConfirmed) document.getElementById('confirm-whatsapp-btn').textContent = ctr('confirmed');
    });
});

const checkoutI18n = {
    en: {
        step_cart: 'Cart',
        step_account: 'Account',
        step_verify: 'Verify',
        step_payment: 'Payment',
        continue_to_verify: 'Continue to verification',
        verify_title: 'Verify your account',
        verify_subtitle: 'Confirm the contact details where your codes will be delivered.',
        email_verification: 'Email verification',
        whatsapp_verification: 'WhatsApp verification',
        confirm_email: 'I can access this email',
        confirm_whatsapp: 'I can access this WhatsApp',
        confirmed: 'Confirmed',
        verify_notice: 'Please confirm you can access both destinations. This checkout does not send verification codes.',
        verify_contact_error: 'Enter your phone number and delivery address, then confirm both contact methods.',
        account_required: 'Sign in or create an account before continuing.',
        continue_to_payment: 'Continue to payment',
        back_to_verify: 'Back to Verify',
        payment_method_title: 'Payment method',
        payment_method_subtitle: 'Choose how you would like to pay securely.',
        oneclick_method: 'CIB / Edahabia',
        oneclick_method_note: 'Secure payment through OneClick',
        items_label: 'Items',
        payment_subtotal: 'Subtotal',
        payment_fees: 'Payment fees',
        provider_fees: 'Calculated by provider',
        payment_redirect_note: 'You will be redirected to the secure payment page. Any provider fees are shown there before payment.',
        pay_now: 'Pay now',
        continue_to_account: 'Continue to account',
        back_to_summary: 'Back to Order Summary',
        back_to_account: 'Back to Account',
        checkout_title: 'Checkout',
        order_summary: 'Order Summary',
        customer_info: 'Customer Information',
        full_name: 'Full Name',
        phone: 'Phone Number',
        email: 'Email Address',
        address: 'Delivery Address',
        notes: 'Notes (Optional)',
        place_order: 'Continue to payment',
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
        step_cart: 'Panier',
        step_account: 'Compte',
        step_verify: 'Vérification',
        step_payment: 'Paiement',
        continue_to_verify: 'Continuer vers la vérification',
        verify_title: 'Vérifiez votre compte',
        verify_subtitle: 'Confirmez les coordonnées où vos codes seront envoyés.',
        email_verification: 'Vérification de l’e-mail',
        whatsapp_verification: 'Vérification WhatsApp',
        confirm_email: 'Je peux accéder à cet e-mail',
        confirm_whatsapp: 'Je peux accéder à ce WhatsApp',
        confirmed: 'Confirmé',
        verify_notice: 'Confirmez que vous pouvez accéder aux deux moyens de contact. Aucun code de vérification ne sera envoyé par cette page.',
        verify_contact_error: 'Saisissez votre téléphone et votre adresse, puis confirmez les deux moyens de contact.',
        account_required: 'Connectez-vous ou créez un compte pour continuer.',
        continue_to_payment: 'Continuer vers le paiement',
        back_to_verify: 'Retour à la vérification',
        payment_method_title: 'Mode de paiement',
        payment_method_subtitle: 'Choisissez un moyen de paiement sécurisé.',
        oneclick_method: 'CIB / Edahabia',
        oneclick_method_note: 'Paiement sécurisé via OneClick',
        items_label: 'Articles',
        payment_subtotal: 'Sous-total',
        payment_fees: 'Frais de paiement',
        provider_fees: 'Calculés par le prestataire',
        payment_redirect_note: 'Vous serez redirigé vers la page de paiement sécurisée. Les frais éventuels y seront indiqués avant le paiement.',
        pay_now: 'Payer',
        continue_to_account: 'Continuer vers le compte',
        back_to_summary: 'Retour au récapitulatif',
        back_to_account: 'Retour au compte',
        checkout_title: 'Finaliser la commande',
        order_summary: 'Récapitulatif',
        customer_info: 'Informations client',
        full_name: 'Nom complet',
        phone: 'Téléphone',
        email: 'Adresse e-mail',
        address: 'Adresse de livraison',
        notes: 'Remarques (facultatif)',
        place_order: 'Continuer vers le paiement',
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

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

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

function setupCheckoutSteps() {
    const cartStep = document.getElementById('cart-step-content');
    const accountStep = document.getElementById('account-step-card');
    const verifyStep = document.getElementById('verify-step-card');
    const paymentStep = document.getElementById('payment-step-card');
    const continueButton = document.getElementById('continue-account-btn');
    const continueVerifyButton = document.getElementById('continue-verify-btn');
    const backButton = document.getElementById('back-to-summary-btn');
    const backToAccountButton = document.getElementById('back-to-account-btn');
    const backToVerifyButton = document.getElementById('back-to-verify-btn');
    const continuePaymentButton = document.getElementById('continue-payment-btn');
    const steps = [...document.querySelectorAll('.checkout-step')];

    const showStep = (activeStep) => {
        cartStep.hidden = activeStep !== 1;
        accountStep.hidden = activeStep !== 2;
        verifyStep.hidden = activeStep !== 3;
        paymentStep.hidden = activeStep !== 4;
        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            const number = step.querySelector('.checkout-step-number');
            const complete = stepNumber < activeStep;
            step.classList.toggle('is-active', stepNumber === activeStep);
            step.classList.toggle('is-complete', complete);
            if (stepNumber === activeStep) step.setAttribute('aria-current', 'step');
            else step.removeAttribute('aria-current');
            if (number) {
                number.classList.toggle('material-symbols-outlined', complete);
                number.textContent = complete ? 'check' : String(stepNumber);
            }
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    continueButton.addEventListener('click', () => showStep(2));
    backButton.addEventListener('click', () => showStep(1));
    backToAccountButton.addEventListener('click', () => showStep(2));
    backToVerifyButton.addEventListener('click', () => showStep(3));
    continueVerifyButton.addEventListener('click', () => {
        const customer = JSON.parse(localStorage.getItem('playora_customer') || 'null');
        if (!localStorage.getItem('playora_customer_token') || !customer?.email) {
            showToast(ctr('account_required'), 'error');
            return;
        }
        renderVerificationPanel();
        showStep(3);
    });
    continuePaymentButton.addEventListener('click', () => {
        const customer = JSON.parse(localStorage.getItem('playora_customer') || 'null') || {};
        const phone = formatInternationalPhone().replace(/\s/g, '');
        const address = document.getElementById('verify-address').value.trim();
        const phoneDigits = phone.replace(/\D/g, '').length;
        if (!customer.email || !customer.name || phoneDigits < 7 || phoneDigits > 15 || address.length < 5 || !emailContactConfirmed || !whatsappContactConfirmed) {
            showToast(ctr('verify_contact_error'), 'error');
            return;
        }
        customer.phone = phone;
        customer.address = address;
        localStorage.setItem('playora_customer', JSON.stringify(customer));
        renderPaymentSummary();
        showStep(4);
    });
    window.checkoutGoToStep = showStep;
    showStep(1);
}

let emailContactConfirmed = false;
let whatsappContactConfirmed = false;

function renderVerificationPanel() {
    const customer = JSON.parse(localStorage.getItem('playora_customer') || 'null') || {};
    const phoneInput = document.getElementById('verify-phone');
    const countrySelect = document.getElementById('verify-country-code');
    if (!phoneInput.value && customer.phone) {
        const savedPhone = String(customer.phone).replace(/[\s()-]/g, '');
        const matchingCountry = [...countrySelect.options]
            .filter(option => savedPhone.startsWith(option.value))
            .sort((a, b) => b.value.length - a.value.length)[0];
        if (savedPhone.startsWith('+') && matchingCountry) {
            countrySelect.value = matchingCountry.value;
            phoneInput.value = savedPhone.slice(matchingCountry.value.length);
        } else {
            phoneInput.value = savedPhone;
        }
    }
    const addressInput = document.getElementById('verify-address');
    if (!addressInput.value) addressInput.value = customer.address || '';
    document.getElementById('verify-email-value').textContent = customer.email || '—';
    document.getElementById('verify-phone-value').textContent = formatInternationalPhone();
}

function formatInternationalPhone() {
    const countryCode = document.getElementById('verify-country-code').value;
    let nationalNumber = document.getElementById('verify-phone').value.replace(/\D/g, '');
    if (nationalNumber.startsWith('0')) nationalNumber = nationalNumber.slice(1);
    return `${countryCode} ${nationalNumber}`.trim();
}

function setupContactConfirmation() {
    const emailButton = document.getElementById('confirm-email-btn');
    const whatsappButton = document.getElementById('confirm-whatsapp-btn');
    const phoneInput = document.getElementById('verify-phone');
    const countrySelect = document.getElementById('verify-country-code');

    const setConfirmed = (cardId, button, confirmed) => {
        document.getElementById(cardId).classList.toggle('is-verified', confirmed);
        button.textContent = confirmed ? ctr('confirmed') : ctr(cardId === 'verify-email-card' ? 'confirm_email' : 'confirm_whatsapp');
        const icon = document.querySelector(`#${cardId} .checkout-verify-icon`);
        icon.textContent = confirmed ? 'check_circle' : (cardId === 'verify-email-card' ? 'mail' : 'chat');
    };

    emailButton.addEventListener('click', () => {
        const email = JSON.parse(localStorage.getItem('playora_customer') || 'null')?.email;
        if (!email) return;
        emailContactConfirmed = !emailContactConfirmed;
        setConfirmed('verify-email-card', emailButton, emailContactConfirmed);
    });
    whatsappButton.addEventListener('click', () => {
        if (!phoneInput.value.replace(/\D/g, '')) {
            phoneInput.focus();
            return;
        }
        whatsappContactConfirmed = !whatsappContactConfirmed;
        setConfirmed('verify-whatsapp-card', whatsappButton, whatsappContactConfirmed);
    });
    const updatePhoneConfirmation = () => {
        document.getElementById('verify-phone-value').textContent = formatInternationalPhone();
        if (whatsappContactConfirmed) {
            whatsappContactConfirmed = false;
            setConfirmed('verify-whatsapp-card', whatsappButton, false);
        }
    };
    phoneInput.addEventListener('input', updatePhoneConfirmation);
    countrySelect.addEventListener('change', updatePhoneConfirmation);
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

function renderPaymentSummary() {
    const cart = getCart();
    const total = getCartTotal();
    const currency = cart[0]?.currency || 'EUR';
    const formattedTotal = new Intl.NumberFormat(currentLang === 'fr' ? 'fr-FR' : 'en-IE', { style: 'currency', currency }).format(total);
    document.getElementById('payment-items-count').textContent = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    document.getElementById('payment-subtotal').textContent = formattedTotal;
    document.getElementById('payment-total').textContent = formattedTotal;
}

function renderCheckoutAccount() {
    const panel = document.getElementById('account-step-content');
    if (!panel) return;

    const customerToken = localStorage.getItem('playora_customer_token');
    if (customerToken) {
        const customer = JSON.parse(localStorage.getItem('playora_customer') || 'null');
        if (customer && customer.name) {
            panel.innerHTML = `
                <div class="checkout-account-panel">
                    <div class="checkout-account-header">
                        <h1 class="checkout-account-title">Account</h1>
                    </div>
                    <div class="checkout-account-card">
                        <div class="checkout-account-info">
                            <div class="checkout-account-row"><span class="checkout-account-label">Full name</span><span class="checkout-account-value">${escapeHtml(customer.name || '—')}</span></div>
                            <div class="checkout-account-row"><span class="checkout-account-label">Email</span><span class="checkout-account-value">${escapeHtml(customer.email || '—')}</span></div>
                            <div class="checkout-account-row"><span class="checkout-account-label">Phone</span><span class="checkout-account-value">${escapeHtml(customer.phone || '—')}</span></div>
                            <div class="checkout-account-row"><span class="checkout-account-label">Address</span><span class="checkout-account-value">${escapeHtml(customer.address || '—')}</span></div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        api.getCustomer().then((result) => {
            if (result.success && result.customer) {
                localStorage.setItem('playora_customer', JSON.stringify(result.customer));
                renderCheckoutAccount();
                return;
            }
            localStorage.removeItem('playora_customer_token');
            localStorage.removeItem('playora_customer');
            renderCheckoutAccount();
        }).catch(() => {
            localStorage.removeItem('playora_customer_token');
            localStorage.removeItem('playora_customer');
            renderCheckoutAccount();
        });
        panel.innerHTML = '<div class="checkout-account-panel"><div class="checkout-account-header"><h1 class="checkout-account-title">Account</h1></div><p class="checkout-account-subtitle">Loading your account…</p></div>';
        return;
    }

    let authMode = 'login';
    panel.innerHTML = `
        <div class="checkout-account-panel">
            <div class="checkout-account-header">
                <h1 class="checkout-account-title">Account</h1>
                <p class="checkout-account-subtitle">Sign in or create an account so we can deliver your codes to it.</p>
            </div>
            <div class="checkout-account-toggle" role="tablist" aria-label="Authentication mode">
                <button type="button" class="active" data-auth-mode="login">Sign in</button>
                <button type="button" data-auth-mode="register">Sign up</button>
            </div>
            <a href="/api/customer/google" class="checkout-google-button"><span class="checkout-google-mark">G</span> Continue with Google</a>
            <div class="checkout-divider">OR</div>
            <form id="checkout-auth-form" class="checkout-auth-form" novalidate>
                <div class="checkout-field" id="checkout-name-field" hidden>
                    <label for="checkout-name">Full name</label>
                    <input id="checkout-name" class="checkout-input" placeholder="Full name" autocomplete="name">
                </div>
                <div class="checkout-field">
                    <label for="checkout-email">Email address</label>
                    <input id="checkout-email" class="checkout-input" type="email" placeholder="you@example.com" autocomplete="email" required>
                </div>
                <div class="checkout-field">
                    <label for="checkout-password">Password</label>
                    <div class="checkout-password-wrap">
                        <input id="checkout-password" class="checkout-input" type="password" placeholder="At least 8 characters" autocomplete="current-password" required>
                        <button type="button" class="checkout-password-toggle" aria-label="Show password" data-toggle-password>👁</button>
                    </div>
                </div>
                <div id="checkout-auth-error" class="auth-error" hidden></div>
                <button type="submit" class="btn btn-primary btn-lg checkout-auth-submit">Log in</button>
            </form>
        </div>
    `;

    const toggleButtons = panel.querySelectorAll('[data-auth-mode]');
    const nameField = panel.querySelector('#checkout-name-field');
    const submitButton = panel.querySelector('[type="submit"]');
    const form = panel.querySelector('#checkout-auth-form');

    const syncAuthMode = (mode) => {
        authMode = mode;
        toggleButtons.forEach(button => button.classList.toggle('active', button.dataset.authMode === mode));
        nameField.hidden = mode !== 'register';
        submitButton.textContent = mode === 'register' ? 'Create account' : 'Log in';
        const nameInput = panel.querySelector('#checkout-name');
        if (nameInput) nameInput.required = mode === 'register';
    };

    toggleButtons.forEach(button => {
        button.addEventListener('click', () => syncAuthMode(button.dataset.authMode));
    });

    panel.querySelector('[data-toggle-password]').addEventListener('click', () => {
        const passwordInput = panel.querySelector('#checkout-password');
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = panel.querySelector('#checkout-email').value.trim();
        const password = panel.querySelector('#checkout-password').value;
        const name = panel.querySelector('#checkout-name')?.value.trim() || '';
        const errorBox = panel.querySelector('#checkout-auth-error');
        const submit = panel.querySelector('[type="submit"]');

        if (!email || !password || (authMode === 'register' && name.length < 2)) {
            errorBox.textContent = 'Please fill in all required fields.';
            errorBox.hidden = false;
            return;
        }

        submit.disabled = true;
        submit.textContent = 'Please wait...';
        errorBox.hidden = true;

        try {
            const result = authMode === 'register'
                ? await api.customerRegister({ name, email, password })
                : await api.customerLogin({ email, password });

            if (!result.success) {
                throw new Error(result.message || 'Could not sign in.');
            }

            localStorage.setItem('playora_customer_token', result.token);
            localStorage.setItem('playora_customer', JSON.stringify(result.customer));
            renderCheckoutAccount();
        } catch (error) {
            errorBox.textContent = error.message || 'Could not sign in.';
            errorBox.hidden = false;
            submit.disabled = false;
            submit.textContent = authMode === 'register' ? 'Create account' : 'Log in';
        }
    });

    syncAuthMode(authMode);
}

function setupForm() {
    const btn = document.getElementById('pay-now-btn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const cart = getCart();
        if (!cart.length) {
            window.location.href = '/';
            return;
        }

        const customer = JSON.parse(localStorage.getItem('playora_customer') || 'null') || {};
        const phone = formatInternationalPhone().replace(/\s/g, '');
        const address = document.getElementById('verify-address').value.trim();
        const orderData = {
            customer_name: customer.name || '',
            customer_phone: phone,
            customer_email: customer.email || '',
            customer_address: address,
            notes: '',
            payment_provider: document.querySelector('[name="checkout-payment-method"]:checked')?.value || 'oneclick',
            items: cart.map(item => ({ product_id: item.product_id, offer_id: item.offer_id, quantity: item.quantity }))
        };

        if (!orderData.customer_name || !orderData.customer_phone || !orderData.customer_email || !orderData.customer_address) {
            renderCheckoutAccount();
            return;
        }

        btn.disabled = true;
        btn.innerHTML = `<span class="spinner" style="width:20px;height:20px;border-width:2px"></span> ${ctr('processing')}`;
        try {
            const res = await api.createOrder(orderData);
            if (res.success) {
                sessionStorage.setItem('last_order', JSON.stringify(res.order));
                if (res.order.payment_url) {
                    window.location.assign(res.order.payment_url);
                } else {
                    showToast(ctr('generic_error'), 'error');
                    btn.disabled = false;
                    btn.innerHTML = `<span class="material-symbols-outlined">lock</span> <span>${ctr('pay_now')}</span>`;
                }
            } else {
                showToast(res.message || ctr('generic_error'), 'error');
                btn.disabled = false;
                btn.innerHTML = `<span class="material-symbols-outlined">lock</span> <span>${ctr('pay_now')}</span>`;
            }
        } catch (err) {
            showToast(ctr('connection_error'), 'error');
            btn.disabled = false;
            btn.innerHTML = `<span class="material-symbols-outlined">lock</span> <span>${ctr('pay_now')}</span>`;
        }
    });
}

function validateForm() {
    return true;
}
