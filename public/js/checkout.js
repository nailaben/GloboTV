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
    showPaymentReturnNotice();
    document.addEventListener('langChange', () => {
        applyCheckoutTranslations();
        renderOrderSummary();
        renderPaymentSummary();
        renderVerificationSummary();
        renderCheckoutAccount();
        updatePhoneChoiceActions();
        updateCheckoutVerificationStatus();
        updateCheckoutVerificationActions();
    });
});

const checkoutI18n = {
    en: {
        step_cart: 'Cart',
        step_account: 'Account',
        step_verify: 'Verify',
        step_payment: 'Payment',
        continue_to_verify: 'Continue to verification',
        verify_title: 'Confirm your details',
        verify_subtitle: '',
        email_verification: 'Email verification',
        email_choice_note: 'Your email is verified when you create your account.',
        whatsapp_verification: 'Phone for this order',
        email_waiting: 'A verification code will be sent to your email.',
        email_code_sent: 'Code sent to {email}. Check your inbox and Spam/Junk folder.',
        email_verified_status: 'Email code verified successfully.',
        email_not_sent: 'Email code could not be sent. Check your email settings.',
        whatsapp_waiting: 'Verify your email first',
        whatsapp_code_sent: 'Code sent on WhatsApp to {phone}',
        whatsapp_verified_status: 'WhatsApp code verified successfully.',
        whatsapp_not_sent: 'WhatsApp verification is temporarily not required.',
        phone_order_note: 'Choose or confirm the phone number for this order.',
        required_state: 'Required',
        optional_state: 'Not required',
        verified_state: 'Verified',
        selected_state: 'Selected',
        verify_email: 'Verify email',
        verify_whatsapp: 'Verify WhatsApp',
        resend_code: 'Resend code',
        enter_six_digit_code: 'Enter the 6-digit code sent to your email.',
        verification_summary_note: 'Your email is verified when you create your account. Choose the phone number for this order.',
        item_count: '{count} item(s)',
        send_codes: 'Send email code',
        resend_codes: 'Resend email code',
        resend_in: 'Resend in {seconds}s',
        email_code: 'Email code',
        whatsapp_code: 'WhatsApp code',
        code_placeholder: '6-digit code',
        verify_continue: 'Verify and continue',
        verify_notice: '',
        codes_sent_notice: 'Email verification code sent. It expires in 15 minutes.',
        email_only_sent_notice: 'Email code sent. Check your inbox and Spam/Junk folder, then enter it below. WhatsApp verification is temporarily not required.',
        whatsapp_only_sent_notice: 'WhatsApp code sent. Enter it below. Email delivery is not configured yet, so payment will remain locked until email is verified.',
        email_verified_waiting_whatsapp: 'Email verified. You can continue to payment.',
        whatsapp_verified_waiting_email: 'WhatsApp verified. Email verification is still required before payment.',
        contacts_verified_notice: 'Your email is verified. WhatsApp verification is not required for now.',
        verify_contact_error: 'Enter a valid phone number for this order.',
        keep_phone: 'Keep this number',
        change_phone: 'Change number',
        use_phone: 'Use this number',
        phone_choice_note: 'Choose the number to use for this order.',
        phone_edit_note: 'Enter the new phone number, then choose “Use this number”.',
        phone_selected_note: 'This number will be used for your order.',
        account_required: 'Sign in or create an account before continuing.',
        continue_to_payment: 'Continue to payment',
        back_to_verify: 'Back to Verify',
        payment_method_title: 'Payment method',
        payment_method_subtitle: 'Choose how you would like to pay securely.',
        paypal_method: 'PayPal',
        paypal_method_note: 'Secure payment through PayPal',
        items_label: 'Items',
        payment_subtotal: 'Subtotal',
        payment_fees: 'Payment fees',
        provider_fees: 'Calculated by provider',
        payment_redirect_note: 'You will be redirected to PayPal to review and securely pay the exact order total.',
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
        verify_title: 'Confirmez vos coordonnées',
        verify_subtitle: '',
        email_verification: 'Vérification de l’e-mail',
        email_choice_note: 'Votre e-mail est vérifié lors de la création du compte.',
        whatsapp_verification: 'Téléphone pour cette commande',
        email_waiting: 'Un code de vérification sera envoyé à votre adresse e-mail.',
        email_code_sent: 'Code envoyé à {email}. Vérifiez aussi le dossier spam/indésirables.',
        email_verified_status: 'Code e-mail vérifié.',
        email_not_sent: 'Le code e-mail n’a pas pu être envoyé. Vérifiez vos paramètres e-mail.',
        whatsapp_waiting: 'Vérifiez d’abord votre e-mail',
        whatsapp_code_sent: 'Code WhatsApp envoyé au {phone}',
        whatsapp_verified_status: 'Code WhatsApp vérifié.',
        whatsapp_not_sent: 'La vérification WhatsApp n’est pas requise pour le moment.',
        phone_order_note: 'Choisissez ou confirmez le numéro de téléphone pour cette commande.',
        required_state: 'Requis',
        optional_state: 'Non requis',
        verified_state: 'Vérifié',
        selected_state: 'Choisi',
        verify_email: 'Vérifier l’e-mail',
        verify_whatsapp: 'Vérifier WhatsApp',
        resend_code: 'Renvoyer le code',
        enter_six_digit_code: 'Saisissez le code à 6 chiffres envoyé par e-mail.',
        verification_summary_note: 'Votre e-mail est vérifié lors de la création du compte. Choisissez le numéro de téléphone pour cette commande.',
        item_count: '{count} article(s)',
        send_codes: 'Envoyer le code e-mail',
        resend_codes: 'Renvoyer le code e-mail',
        resend_in: 'Renvoyer dans {seconds}s',
        email_code: 'Code e-mail',
        whatsapp_code: 'Code WhatsApp',
        code_placeholder: 'Code à 6 chiffres',
        verify_continue: 'Vérifier et continuer',
        verify_notice: '',
        codes_sent_notice: 'Code de vérification envoyé par e-mail. Il expire dans 15 minutes.',
        email_only_sent_notice: 'Code e-mail envoyé. Vérifiez votre boîte de réception et le dossier spam/indésirables, puis saisissez-le ci-dessous.',
        whatsapp_only_sent_notice: 'Code WhatsApp envoyé. Saisissez-le ci-dessous. L’e-mail n’est pas configuré ; le paiement restera bloqué jusqu’à la vérification de l’e-mail.',
        email_verified_waiting_whatsapp: 'E-mail vérifié. Vous pouvez continuer vers le paiement.',
        whatsapp_verified_waiting_email: 'WhatsApp vérifié. La vérification de l’e-mail reste nécessaire avant le paiement.',
        contacts_verified_notice: 'Votre e-mail est vérifié. WhatsApp n’est pas requis pour le moment.',
        verify_contact_error: 'Saisissez un numéro valide pour cette commande.',
        keep_phone: 'Garder ce numéro',
        change_phone: 'Changer de numéro',
        use_phone: 'Utiliser ce numéro',
        phone_choice_note: 'Choisissez le numéro à utiliser pour cette commande.',
        phone_edit_note: 'Saisissez le nouveau numéro, puis cliquez sur « Utiliser ce numéro ».',
        phone_selected_note: 'Ce numéro sera utilisé pour votre commande.',
        account_required: 'Connectez-vous ou créez un compte pour continuer.',
        continue_to_payment: 'Continuer vers le paiement',
        back_to_verify: 'Retour à la vérification',
        payment_method_title: 'Mode de paiement',
        payment_method_subtitle: 'Choisissez un moyen de paiement sécurisé.',
        paypal_method: 'PayPal',
        paypal_method_note: 'Paiement sécurisé via PayPal',
        items_label: 'Articles',
        payment_subtotal: 'Sous-total',
        payment_fees: 'Frais de paiement',
        provider_fees: 'Calculés par le prestataire',
        payment_redirect_note: 'Vous serez redirigé vers PayPal pour vérifier et payer en toute sécurité le montant exact de la commande.',
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

function showPaymentReturnNotice() {
    const result = new URLSearchParams(window.location.search).get('payment');
    if (!result || result === 'paypal') return;

    const messages = {
        en: {
            cancelled: 'Payment was cancelled or not completed. Your order is still pending.',
            'not-approved': 'PayPal did not confirm the payment. Your order is still pending.',
            'verification-error': 'We could not match PayPal’s payment to this order. Check your PayPal activity and contact support before trying again.',
            'capture-error': 'We could not finish updating your order after PayPal. Do not pay again. Verify the payment below.',
            error: 'We could not confirm the PayPal payment. Do not pay again. Verify the payment below.',
            verify_payment: 'Verify payment',
            verifying_payment: 'Checking PayPal…',
            auto_verifying_payment: 'Checking your payment automatically…',
            verify_failed: 'PayPal has not confirmed the completed payment yet. Do not pay again; try checking the payment status again shortly.'
        },
        fr: {
            cancelled: 'Le paiement a été annulé ou n’a pas été terminé. La commande est toujours en attente.',
            'not-approved': 'PayPal n’a pas confirmé le paiement. La commande est toujours en attente.',
            'verification-error': 'Nous n’avons pas pu associer le paiement PayPal à cette commande. Vérifiez votre activité PayPal et contactez le support avant de réessayer.',
            'capture-error': 'Nous n’avons pas pu terminer la mise à jour de votre commande après PayPal. Ne payez pas une deuxième fois. Vérifiez le paiement ci-dessous.',
            error: 'Nous n’avons pas pu confirmer le paiement PayPal. Ne payez pas une deuxième fois. Vérifiez le paiement ci-dessous.',
            verify_payment: 'Vérifier le paiement',
            verifying_payment: 'Vérification auprès de PayPal…',
            auto_verifying_payment: 'Vérification automatique du paiement…',
            verify_failed: 'PayPal n’a pas encore confirmé le paiement. Ne payez pas une deuxième fois ; réessayez de vérifier le statut dans quelques instants.'
        }
    };
    const message = (messages[currentLang] || messages.en)[result];
    if (!message) return;

    const notice = document.createElement('div');
    notice.className = 'checkout-payment-return-notice';
    notice.setAttribute('role', 'alert');
    notice.textContent = message;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'checkout-payment-return-close';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    close.addEventListener('click', () => notice.remove());
    const paypalOrderId = new URLSearchParams(window.location.search).get('paypal_order_id');
    if (paypalOrderId && ['capture-error', 'error'].includes(result)) {
        const verifyButton = document.createElement('button');
        verifyButton.type = 'button';
        verifyButton.className = 'checkout-payment-reconcile';
        const localized = () => messages[currentLang] || messages.en;
        let verificationInProgress = false;
        const runVerification = async automatic => {
            if (verificationInProgress) return;
            verificationInProgress = true;
            verifyButton.disabled = true;
            verifyButton.textContent = automatic ? localized().auto_verifying_payment : localized().verifying_payment;
            const attempts = automatic ? 3 : 1;
            for (let attempt = 0; attempt < attempts; attempt++) {
                try {
                    const verification = await api.reconcilePaypalPayment(paypalOrderId);
                    if (verification.success && verification.payment_status === 'paid') {
                        clearCart();
                        updateCartBadges();
                        window.location.assign('/order-success.html?payment=paypal');
                        return;
                    }
                    notice.firstChild.textContent = verification.message || localized().verify_failed;
                } catch (error) {
                    notice.firstChild.textContent = error.message || localized().verify_failed;
                }
                if (attempt + 1 < attempts) await new Promise(resolve => setTimeout(resolve, 2000));
            }
            verifyButton.disabled = false;
            verifyButton.textContent = localized().verify_payment;
            verificationInProgress = false;
        };
        verifyButton.textContent = localized().auto_verifying_payment;
        verifyButton.addEventListener('click', () => runVerification(false));
        notice.append(verifyButton);
        runVerification(true);
    }
    notice.append(close);
    document.querySelector('.checkout-steps')?.insertAdjacentElement('afterend', notice);
}

function setupLangToggle() {
    document.querySelectorAll('.language-select').forEach(select => select.addEventListener('change', () => setLang(select.value)));
}

function setupCheckoutSteps() {
    const cartStep = document.getElementById('cart-step-content');
    const accountStep = document.getElementById('account-step-card');
    const verifyStep = document.getElementById('verify-step-card');
    const verificationSummary = document.getElementById('verification-summary');
    const checkoutGrid = document.querySelector('.checkout-grid');
    const paymentStep = document.getElementById('payment-step-card');
    const continueButton = document.getElementById('continue-account-btn');
    const backToVerifyButton = document.getElementById('back-to-verify-btn');
    const steps = [...document.querySelectorAll('.checkout-step')];

    const showStep = (activeStep) => {
        const customer = JSON.parse(localStorage.getItem('playora_customer') || 'null');
        cartStep.hidden = activeStep !== 1;
        accountStep.hidden = activeStep !== 2 || Boolean(customer?.name);
        verifyStep.hidden = activeStep !== 2;
        paymentStep.hidden = activeStep !== 3;
        verificationSummary.hidden = activeStep !== 2;
        checkoutGrid.classList.toggle('is-verifying', activeStep === 2);
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
    backToVerifyButton.addEventListener('click', () => showStep(2));
    document.getElementById('continue-after-verification').addEventListener('click', () => {
        const customer = JSON.parse(localStorage.getItem('playora_customer') || 'null');
        const phone = formatInternationalPhone().replace(/\s/g, '');
        if (!customer?.email) {
            showToast(ctr('account_required'), 'error');
            return;
        }
        if (!checkoutPhoneChoiceConfirmed || !/^\+[1-9]\d{7,14}$/.test(phone)) {
            showToast(ctr('verify_contact_error'), 'error');
            return;
        }
        renderPaymentSummary();
        showStep(3);
    });
    window.checkoutGoToStep = showStep;
    showStep(1);
}

let checkoutCodesSent = false;
let checkoutEmailSent = false;
let checkoutWhatsAppSent = false;
let checkoutEmailVerified = false;
let checkoutWhatsAppVerified = false;
let checkoutVerificationToken = null;
let checkoutSessionResolved = false;
let checkoutNoticeKey = 'verify_notice';

function setCheckoutNotice(key) {
    const notice = document.getElementById('verify-notice');
    if (!notice) return;
    notice.textContent = ctr(key);
    notice.hidden = !notice.textContent.trim();
}
let checkoutCanResend = false;
let checkoutResendUntil = 0;
let checkoutResendTimer = null;
let checkoutPhoneSnapshot = null;
let checkoutPhoneEditing = false;
let checkoutPhoneChoiceConfirmed = false;

function updateCheckoutVerificationActions() {
    const sendButton = document.getElementById('send-checkout-codes-btn');
    if (!sendButton) return;
    if (!checkoutCodesSent) {
        sendButton.hidden = !checkoutCanResend;
        const seconds = Math.max(0, Math.ceil((checkoutResendUntil - Date.now()) / 1000));
        sendButton.textContent = seconds
            ? ctr('resend_in').replace('{seconds}', String(seconds))
            : ctr('send_codes');
        sendButton.disabled = seconds > 0;
        return;
    }
    sendButton.hidden = checkoutEmailVerified;
    const seconds = Math.max(0, Math.ceil((checkoutResendUntil - Date.now()) / 1000));
    sendButton.textContent = seconds
        ? ctr('resend_in').replace('{seconds}', String(seconds))
        : ctr('resend_code');
    sendButton.disabled = seconds > 0;
}

function renderVerificationPanel() {
    const customer = JSON.parse(localStorage.getItem('playora_customer') || 'null') || {};
    const phoneInput = document.getElementById('verify-phone');
    const countrySelect = document.getElementById('verify-country-code');
    if (!phoneInput.dataset.initialized && customer.phone) {
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
    if (!phoneInput.dataset.initialized) {
        checkoutPhoneSnapshot = phoneInput.value ? { country: countrySelect.value, number: phoneInput.value } : null;
        checkoutPhoneEditing = !phoneInput.value;
        checkoutPhoneChoiceConfirmed = false;
        phoneInput.readOnly = !checkoutPhoneEditing;
        countrySelect.disabled = !checkoutPhoneEditing;
        phoneInput.dataset.initialized = 'true';
        updatePhoneChoiceActions();
    }
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
    const phoneInput = document.getElementById('verify-phone');
    const countrySelect = document.getElementById('verify-country-code');
    const keepButton = document.getElementById('keep-phone-btn');
    const changeButton = document.getElementById('change-phone-btn');
    const confirmButton = document.getElementById('confirm-phone-btn');
    keepButton.addEventListener('click', () => {
        if (checkoutPhoneEditing && checkoutPhoneSnapshot) {
            countrySelect.value = checkoutPhoneSnapshot.country;
            phoneInput.value = checkoutPhoneSnapshot.number;
        }
        checkoutPhoneEditing = false;
        checkoutPhoneChoiceConfirmed = true;
        phoneInput.readOnly = true;
        countrySelect.disabled = true;
        document.getElementById('verify-phone-value').textContent = formatInternationalPhone();
        updatePhoneChoiceActions();
        updateCheckoutVerificationStatus();
    });
    changeButton.addEventListener('click', () => {
        checkoutPhoneEditing = true;
        checkoutPhoneChoiceConfirmed = false;
        phoneInput.readOnly = false;
        countrySelect.disabled = false;
        updatePhoneChoiceActions();
        phoneInput.focus();
    });
    confirmButton.addEventListener('click', () => {
        const phone = formatInternationalPhone().replace(/\s/g, '');
        if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
            showToast(ctr('verify_contact_error'), 'error');
            phoneInput.focus();
            return;
        }
        checkoutPhoneSnapshot = { country: countrySelect.value, number: phoneInput.value };
        checkoutPhoneEditing = false;
        checkoutPhoneChoiceConfirmed = true;
        phoneInput.readOnly = true;
        countrySelect.disabled = true;
        document.getElementById('verify-phone-value').textContent = formatInternationalPhone();
        updatePhoneChoiceActions();
        updateCheckoutVerificationStatus();
    });
    const resetPhoneChoice = () => {
        checkoutPhoneChoiceConfirmed = false;
        document.getElementById('verify-phone-value').textContent = formatInternationalPhone();
        updateCheckoutVerificationActions();
        updatePhoneChoiceActions();
        updateCheckoutVerificationStatus();
    };
    phoneInput.addEventListener('input', resetPhoneChoice);
    countrySelect.addEventListener('change', resetPhoneChoice);
}

function updatePhoneChoiceActions() {
    const keepButton = document.getElementById('keep-phone-btn');
    const changeButton = document.getElementById('change-phone-btn');
    const confirmButton = document.getElementById('confirm-phone-btn');
    const status = document.getElementById('phone-choice-status');
    if (!keepButton || !changeButton || !confirmButton || !status) return;

    keepButton.hidden = !checkoutPhoneSnapshot || checkoutPhoneEditing || checkoutPhoneChoiceConfirmed;
    changeButton.hidden = !checkoutPhoneSnapshot || checkoutPhoneEditing;
    confirmButton.hidden = !checkoutPhoneEditing;
    status.textContent = ctr(checkoutPhoneChoiceConfirmed
        ? 'phone_selected_note'
        : checkoutPhoneEditing ? 'phone_edit_note' : 'phone_choice_note');
}

async function requestCheckoutCodes() {
    const sendButton = document.getElementById('send-checkout-codes-btn');
    const phoneInput = document.getElementById('verify-phone');
    if (!checkoutPhoneChoiceConfirmed) {
        showToast(ctr('verify_contact_error'), 'error');
        return;
    }
    const phone = formatInternationalPhone().replace(/\s/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
        showToast(ctr('verify_contact_error'), 'error');
        phoneInput.focus();
        return;
    }
    sendButton.disabled = true;
    try {
        const result = await api.sendCheckoutVerificationCodes(phone);
        if (!result.success) throw new Error(result.message || ctr('generic_error'));
        checkoutCodesSent = true;
        checkoutCanResend = true;
        checkoutEmailSent = Boolean(result.emailSent);
        checkoutWhatsAppSent = false;
        checkoutEmailVerified = false;
        checkoutWhatsAppVerified = false;
        checkoutVerificationToken = null;
        checkoutResendUntil = Date.now() + 60_000;
        clearCheckoutOtp('email');
        clearCheckoutOtp('whatsapp');
        document.getElementById('email-code-panel').hidden = !checkoutEmailSent;
        document.getElementById('whatsapp-code-panel').hidden = true;
        document.getElementById('verify-email-status').textContent = checkoutEmailSent
            ? ctr('email_code_sent').replace('{email}', document.getElementById('verify-email-value').textContent)
            : ctr('email_not_sent');
        document.getElementById('verify-whatsapp-status').textContent = ctr('phone_order_note');
        document.getElementById('verify-email-required').textContent = ctr('required_state');
        document.getElementById('verify-whatsapp-required').textContent = ctr('required_state');
        const noticeKey = checkoutEmailSent ? 'email_only_sent_notice' : 'email_not_sent';
        checkoutNoticeKey = noticeKey;
        setCheckoutNotice(noticeKey);
        showToast(ctr(noticeKey), checkoutEmailSent ? 'success' : 'error');
        if (checkoutEmailSent) {
            document.querySelector('#email-code-panel input')?.focus();
            updatePhoneChoiceActions();
        }
        startCheckoutResendTimer();
    } catch (error) {
        checkoutCanResend = true;
        showToast(error.message || ctr('generic_error'), 'error');
    } finally {
        updateCheckoutVerificationActions();
    }
}

function startCheckoutResendTimer() {
    if (checkoutResendTimer) clearInterval(checkoutResendTimer);
    checkoutResendTimer = setInterval(() => {
        updateCheckoutVerificationActions();
        if (Date.now() >= checkoutResendUntil) {
            clearInterval(checkoutResendTimer);
            checkoutResendTimer = null;
        }
    }, 1000);
}

function bindCheckoutOtpInputs() {
    document.querySelectorAll('.checkout-otp-inputs').forEach(group => {
        const inputs = [...group.querySelectorAll('input')];
        inputs.forEach((input, index) => {
            input.addEventListener('input', () => {
                const digits = input.value.replace(/\D/g, '');
                input.value = digits.slice(-1);
                if (digits.length > 1) {
                    const values = digits.slice(0, inputs.length).split('');
                    values.forEach((digit, offset) => { if (inputs[offset]) inputs[offset].value = digit; });
                    inputs[Math.min(values.length, inputs.length) - 1]?.focus();
                } else if (input.value && inputs[index + 1]) {
                    inputs[index + 1].focus();
                }
            });
            input.addEventListener('keydown', event => {
                if (event.key === 'Backspace' && !input.value && inputs[index - 1]) inputs[index - 1].focus();
                if (event.key === 'ArrowLeft' && inputs[index - 1]) inputs[index - 1].focus();
                if (event.key === 'ArrowRight' && inputs[index + 1]) inputs[index + 1].focus();
            });
            input.addEventListener('paste', event => {
                const pasted = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, inputs.length);
                if (!pasted) return;
                event.preventDefault();
                pasted.split('').forEach((digit, offset) => { inputs[offset].value = digit; });
                inputs[Math.min(pasted.length, inputs.length) - 1]?.focus();
            });
        });
    });
}

function getCheckoutOtp(channel) {
    return [...document.querySelectorAll(`[data-otp-group="${channel}"] input`)].map(input => input.value).join('');
}

function clearCheckoutOtp(channel) {
    document.querySelectorAll(`[data-otp-group="${channel}"] input`).forEach(input => { input.value = ''; });
}

async function verifyCheckoutChannel(channel) {
    const emailChannel = channel === 'email';
    const code = getCheckoutOtp(channel);
    const sent = emailChannel ? checkoutEmailSent : checkoutWhatsAppSent;
    if (!sent || !/^\d{6}$/.test(code)) {
        showToast(ctr('enter_six_digit_code'), 'error');
        return;
    }
    const phone = formatInternationalPhone().replace(/\s/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
        showToast(ctr('verify_contact_error'), 'error');
        return;
    }
    const button = document.getElementById(emailChannel ? 'verify-email-code-btn' : 'verify-whatsapp-code-btn');
    button.disabled = true;
    try {
        const result = await api.verifyCheckoutCodes(phone, emailChannel ? code : '', emailChannel ? '' : code);
        if (!result.success) throw new Error(result.message || ctr('generic_error'));
        checkoutEmailVerified = Boolean(result.emailVerified);
        checkoutWhatsAppVerified = Boolean(result.whatsappVerified);
        updateCheckoutVerifiedIndicators();
        clearCheckoutOtp(channel);
        if (checkoutEmailVerified) {
            document.getElementById('verify-email-status').textContent = ctr('email_verified_status');
            document.getElementById('verify-email-required').textContent = ctr('verified_state');
            document.getElementById('email-code-panel').hidden = true;
        }
        document.getElementById('verify-whatsapp-status').textContent = ctr('phone_order_note');
        document.getElementById('verify-whatsapp-required').textContent = ctr('required_state');
        document.getElementById('whatsapp-code-panel').hidden = true;
        if (result.token) {
            checkoutVerificationToken = result.token;
            checkoutNoticeKey = 'contacts_verified_notice';
            setCheckoutNotice('contacts_verified_notice');
            document.getElementById('continue-after-verification').disabled = false;
            updateCheckoutVerificationActions();
            showToast(ctr('contacts_verified_notice'), 'success');
            return;
        }
        const noticeKey = 'email_verified_waiting_whatsapp';
        checkoutNoticeKey = noticeKey;
        setCheckoutNotice(noticeKey);
        showToast(ctr(noticeKey), 'success');
        updateCheckoutVerificationActions();
    } catch (error) {
        showToast(error.message || ctr('generic_error'), 'error');
    } finally {
        button.disabled = false;
    }
}

function renderVerificationSummary() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const currency = cart[0]?.currency || 'EUR';
    const total = new Intl.NumberFormat(currentLang === 'fr' ? 'fr-FR' : 'en-IE', { style: 'currency', currency }).format(getCartTotal());
    document.getElementById('verification-item-count').textContent = ctr('item_count').replace('{count}', String(count));
    document.getElementById('verification-subtotal').textContent = total;
    document.getElementById('verification-total').textContent = total;
}

function updateCheckoutVerifiedIndicators() {
    const emailCard = document.getElementById('verify-email-card');
    const whatsappCard = document.getElementById('verify-whatsapp-card');
    emailCard.classList.toggle('is-verified', checkoutEmailVerified);
    whatsappCard.classList.toggle('is-verified', checkoutWhatsAppVerified);
    document.querySelector('#verify-email-card .checkout-verify-icon').textContent = checkoutEmailVerified ? '✓' : '2';
    document.querySelector('#verify-whatsapp-card .checkout-verify-icon').textContent = checkoutWhatsAppVerified ? '✓' : '1';
}

function updateCheckoutVerificationStatus() {
    document.getElementById('verify-email-status').textContent = ctr('email_verified_status');
    document.getElementById('verify-whatsapp-status').textContent = ctr('phone_order_note');
    document.getElementById('verify-email-required').textContent = ctr('verified_state');
    document.getElementById('verify-whatsapp-required').textContent = ctr(checkoutPhoneChoiceConfirmed ? 'selected_state' : 'required_state');
    document.getElementById('email-code-panel').hidden = true;
    document.getElementById('whatsapp-code-panel').hidden = true;
    setCheckoutNotice('verify_notice');
    const customer = JSON.parse(localStorage.getItem('playora_customer') || 'null');
    document.getElementById('continue-after-verification').disabled = !customer?.email || !checkoutPhoneChoiceConfirmed;
    updateCheckoutVerifiedIndicators();
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

    container.innerHTML = cart.map(item => {
        const itemName = currentLang === 'fr' ? (item.name_fr || item.name_en) : item.name_en;
        const offerName = currentLang === 'fr' ? item.offer_label_fr : item.offer_label_en;
        let imageUrl = '/images/placeholder.png';
        try {
            const parsed = new URL(String(item.image_url || imageUrl), window.location.origin);
            if (['http:', 'https:'].includes(parsed.protocol)) imageUrl = parsed.href;
        } catch { /* Use the placeholder for malformed or unsupported URLs. */ }
        return `
        <div class="checkout-item">
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(itemName)}"
                 onerror="this.src='/images/placeholder.png'">
            <div class="checkout-item-info">
                <div class="checkout-item-name">${escapeHtml(itemName)}</div>
                <div class="checkout-item-qty">${escapeHtml(offerName)}</div>
                <div class="checkout-item-qty">${ctr('qty_label')}: ${escapeHtml(item.quantity)}</div>
            </div>
            <div class="checkout-item-price">${formatCartPrice(item, item.price * item.quantity)}</div>
        </div>
    `;
    }).join('');

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

    if (!checkoutSessionResolved) {
        panel.innerHTML = '<div class="checkout-account-panel"><div class="checkout-account-header"><h1 class="checkout-account-title">Account</h1></div><p class="checkout-account-subtitle">Loading your account…</p></div>';
        api.getCustomer().then(result => {
            checkoutSessionResolved = true;
            if (result.success && result.customer) localStorage.setItem('playora_customer', JSON.stringify(result.customer));
            else {
                localStorage.removeItem('playora_customer_token');
                localStorage.removeItem('playora_customer');
            }
            renderCheckoutAccount();
        }).catch(() => {
            checkoutSessionResolved = true;
            localStorage.removeItem('playora_customer_token');
            localStorage.removeItem('playora_customer');
            renderCheckoutAccount();
        });
        return;
    }

    const customer = JSON.parse(localStorage.getItem('playora_customer') || 'null');
    if (customer?.name) {
        document.getElementById('account-step-card').hidden = true;
        panel.innerHTML = `
                <div class="checkout-account-panel">
                    <div class="checkout-account-header">
                        <h1 class="checkout-account-title">Account</h1>
                    </div>
                </div>
            `;
        renderVerificationPanel();
        updateCheckoutVerificationStatus();
        renderVerificationSummary();
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
                <div class="checkout-field" id="checkout-verification-field" hidden>
                    <label for="checkout-verification-code">Email verification code</label>
                    <input id="checkout-verification-code" class="checkout-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="6-digit code">
                    <button type="button" id="checkout-resend-verification" class="checkout-verify-action">Resend code</button>
                </div>
                <div id="checkout-auth-error" class="auth-error" hidden></div>
                <button type="submit" class="btn btn-primary btn-lg checkout-auth-submit">Log in</button>
            </form>
        </div>
    `;

    const toggleButtons = panel.querySelectorAll('[data-auth-mode]');
    const nameField = panel.querySelector('#checkout-name-field');
    const verificationField = panel.querySelector('#checkout-verification-field');
    const submitButton = panel.querySelector('[type="submit"]');
    const form = panel.querySelector('#checkout-auth-form');
    let pendingVerificationEmail = '';

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

    panel.querySelector('#checkout-resend-verification').addEventListener('click', async () => {
        const errorBox = panel.querySelector('#checkout-auth-error');
        try {
            const result = await api.resendCustomerVerification(pendingVerificationEmail);
            if (!result.success) throw new Error(result.message || 'Could not resend the code.');
            errorBox.textContent = currentLang === 'fr'
                ? `Code envoyé à ${pendingVerificationEmail}. Vérifiez aussi le dossier Spam.`
                : `Code sent to ${pendingVerificationEmail}. Check your Spam folder too.`;
            errorBox.hidden = false;
        } catch (error) {
            errorBox.textContent = error.message || 'Could not resend the code.';
            errorBox.hidden = false;
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = panel.querySelector('#checkout-email').value.trim();
        const password = panel.querySelector('#checkout-password').value;
        const name = panel.querySelector('#checkout-name')?.value.trim() || '';
        const codeInput = panel.querySelector('#checkout-verification-code');
        const errorBox = panel.querySelector('#checkout-auth-error');
        const submit = panel.querySelector('[type="submit"]');

        if (!pendingVerificationEmail && (!email || !password || (authMode === 'register' && name.length < 2))) {
            errorBox.textContent = 'Please fill in all required fields.';
            errorBox.hidden = false;
            return;
        }

        submit.disabled = true;
        submit.textContent = 'Please wait...';
        errorBox.hidden = true;

        try {
            const result = pendingVerificationEmail
                ? await api.verifyCustomerEmail(pendingVerificationEmail, codeInput.value.trim())
                : (authMode === 'register'
                    ? await api.customerRegister({ name, email, password })
                    : await api.customerLogin({ email, password }));

            if (!result.success) {
                throw new Error(result.message || 'Could not sign in.');
            }

            if (result.verificationRequired) {
                pendingVerificationEmail = result.email;
                panel.querySelector('#checkout-email').value = result.email;
                panel.querySelector('#checkout-email').readOnly = true;
                panel.querySelector('#checkout-password').closest('.checkout-field').hidden = true;
                nameField.hidden = true;
                verificationField.hidden = false;
                toggleButtons.forEach(button => { button.hidden = true; });
                panel.querySelector('.checkout-google-button').hidden = true;
                panel.querySelector('.checkout-divider').hidden = true;
                codeInput.required = true;
                submit.textContent = 'Verify and create account';
                errorBox.textContent = currentLang === 'fr'
                    ? `Code envoyé à ${result.email}. Vérifiez aussi le dossier Spam.`
                    : `Code sent to ${result.email}. Check your Spam folder too.`;
                errorBox.hidden = false;
                submit.disabled = false;
                return;
            }

            pendingVerificationEmail = '';
            checkoutSessionResolved = true;
            localStorage.removeItem('playora_customer_token');
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
        const orderData = {
            customer_name: customer.name || '',
            customer_phone: phone,
            customer_email: customer.email || '',
            notes: '',
            payment_provider: 'paypal',
            items: cart.map(item => ({ product_id: item.product_id, offer_id: item.offer_id, offer_label_en: item.offer_label_en, offer_label_fr: item.offer_label_fr, quantity: item.quantity }))
        };

        if (!orderData.customer_name || !orderData.customer_phone || !orderData.customer_email) {
            renderCheckoutAccount();
            return;
        }

        btn.disabled = true;
        btn.innerHTML = `<span class="spinner" style="width:20px;height:20px;border-width:2px"></span> ${ctr('processing')}`;
        try {
            const res = await api.createOrder(orderData);
            if (res.success) {
                checkoutVerificationToken = null;
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
