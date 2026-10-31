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
        verify_title: 'Verify your account',
        verify_subtitle: 'Verify your email before payment. WhatsApp verification is temporarily not required.',
        email_verification: 'Email verification',
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
        verify_email: 'Verify email',
        verify_whatsapp: 'Verify WhatsApp',
        resend_code: 'Resend code',
        enter_six_digit_code: 'Enter the 6-digit code sent to your email.',
        verification_summary_note: 'Verify your email and choose whether to keep or change your phone number.',
        item_count: '{count} item(s)',
        send_codes: 'Send email code',
        resend_codes: 'Resend email code',
        resend_in: 'Resend in {seconds}s',
        email_code: 'Email code',
        whatsapp_code: 'WhatsApp code',
        code_placeholder: '6-digit code',
        verify_continue: 'Verify and continue',
        verify_notice: 'Choose whether to keep or change your number. We will send a verification code by email only.',
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
        verify_title: 'Vérifiez votre compte',
        verify_subtitle: 'Vérifiez votre e-mail avant le paiement. La vérification WhatsApp n’est pas requise pour le moment.',
        email_verification: 'Vérification de l’e-mail',
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
        verify_email: 'Vérifier l’e-mail',
        verify_whatsapp: 'Vérifier WhatsApp',
        resend_code: 'Renvoyer le code',
        enter_six_digit_code: 'Saisissez le code à 6 chiffres envoyé par e-mail.',
        verification_summary_note: 'Vérifiez votre e-mail et choisissez de garder ou changer votre numéro.',
        item_count: '{count} article(s)',
        send_codes: 'Envoyer le code e-mail',
        resend_codes: 'Renvoyer le code e-mail',
        resend_in: 'Renvoyer dans {seconds}s',
        email_code: 'Code e-mail',
        whatsapp_code: 'Code WhatsApp',
        code_placeholder: 'Code à 6 chiffres',
        verify_continue: 'Vérifier et continuer',
        verify_notice: 'Choisissez de garder ou changer votre numéro. Nous enverrons le code de vérification par e-mail uniquement.',
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
    const continueVerifyButton = document.getElementById('continue-verify-btn');
    const backButton = document.getElementById('back-to-summary-btn');
    const backToAccountButton = document.getElementById('back-to-account-btn');
    const backToVerifyButton = document.getElementById('back-to-verify-btn');
    const steps = [...document.querySelectorAll('.checkout-step')];

    const showStep = (activeStep) => {
        cartStep.hidden = activeStep !== 1;
        accountStep.hidden = activeStep !== 2;
        verifyStep.hidden = activeStep !== 3;
        paymentStep.hidden = activeStep !== 4;
        verificationSummary.hidden = activeStep !== 3;
        checkoutGrid.classList.toggle('is-verifying', activeStep === 3);
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
        renderVerificationSummary();
    });
    document.getElementById('verify-email-code-btn').addEventListener('click', () => verifyCheckoutChannel('email'));
    document.getElementById('verify-whatsapp-code-btn').addEventListener('click', () => verifyCheckoutChannel('whatsapp'));
    document.getElementById('continue-after-verification').addEventListener('click', () => {
        if (!checkoutVerificationToken) return;
        renderPaymentSummary();
        showStep(4);
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
let checkoutNoticeKey = 'verify_notice';
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
    const sendButton = document.getElementById('send-checkout-codes-btn');
    const phoneInput = document.getElementById('verify-phone');
    const countrySelect = document.getElementById('verify-country-code');
    const keepButton = document.getElementById('keep-phone-btn');
    const changeButton = document.getElementById('change-phone-btn');
    const confirmButton = document.getElementById('confirm-phone-btn');
    sendButton.addEventListener('click', requestCheckoutCodes);
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
        requestCheckoutCodes();
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
        requestCheckoutCodes();
    });
    bindCheckoutOtpInputs();
    const resetPhoneVerification = () => {
        const allowRetry = checkoutCanResend;
        checkoutPhoneChoiceConfirmed = false;
        document.getElementById('verify-phone-value').textContent = formatInternationalPhone();
        checkoutCodesSent = false;
        checkoutCanResend = allowRetry;
        checkoutEmailSent = false;
        checkoutWhatsAppSent = false;
        checkoutEmailVerified = false;
        checkoutWhatsAppVerified = false;
        checkoutVerificationToken = null;
        checkoutNoticeKey = 'verify_notice';
        if (checkoutResendTimer) clearInterval(checkoutResendTimer);
        document.getElementById('email-code-panel').hidden = true;
        document.getElementById('whatsapp-code-panel').hidden = true;
        clearCheckoutOtp('email');
        clearCheckoutOtp('whatsapp');
        document.getElementById('verify-email-status').textContent = ctr('email_waiting');
        document.getElementById('verify-whatsapp-status').textContent = ctr('phone_order_note');
        document.getElementById('continue-after-verification').disabled = true;
        document.getElementById('verify-email-card').classList.remove('is-verified');
        document.getElementById('verify-whatsapp-card').classList.remove('is-verified');
        document.querySelector('#verify-email-card .checkout-verify-icon').textContent = '2';
        document.querySelector('#verify-whatsapp-card .checkout-verify-icon').textContent = '1';
        document.getElementById('verify-email-required').textContent = ctr('required_state');
        document.getElementById('verify-whatsapp-required').textContent = ctr('required_state');
        document.getElementById('verify-whatsapp-status').textContent = ctr('phone_order_note');
        document.getElementById('verify-notice').textContent = ctr('verify_notice');
        updateCheckoutVerificationActions();
        updatePhoneChoiceActions();
        if (checkoutResendUntil > Date.now()) startCheckoutResendTimer();
    };
    phoneInput.addEventListener('input', resetPhoneVerification);
    countrySelect.addEventListener('change', resetPhoneVerification);
}

function updatePhoneChoiceActions() {
    const keepButton = document.getElementById('keep-phone-btn');
    const changeButton = document.getElementById('change-phone-btn');
    const confirmButton = document.getElementById('confirm-phone-btn');
    const status = document.getElementById('phone-choice-status');
    if (!keepButton || !changeButton || !confirmButton || !status) return;

    const lockedAfterSend = checkoutEmailSent || checkoutPhoneChoiceConfirmed && checkoutCodesSent;
    keepButton.hidden = lockedAfterSend || !checkoutPhoneSnapshot;
    changeButton.hidden = lockedAfterSend || checkoutPhoneEditing || !checkoutPhoneSnapshot;
    confirmButton.hidden = lockedAfterSend || !checkoutPhoneEditing;
    status.textContent = ctr(lockedAfterSend || checkoutPhoneChoiceConfirmed
        ? 'phone_selected_note'
        : checkoutPhoneEditing ? 'phone_edit_note' : 'phone_choice_note');
}

async function requestCheckoutCodes() {
    const sendButton = document.getElementById('send-checkout-codes-btn');
    const phoneInput = document.getElementById('verify-phone');
    if (!localStorage.getItem('playora_customer_token')) {
        showToast(ctr('account_required'), 'error');
        return;
    }
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
        document.getElementById('verify-notice').textContent = ctr(noticeKey);
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
            document.getElementById('verify-notice').textContent = ctr('contacts_verified_notice');
            document.getElementById('continue-after-verification').disabled = false;
            updateCheckoutVerificationActions();
            showToast(ctr('contacts_verified_notice'), 'success');
            return;
        }
        const noticeKey = 'email_verified_waiting_whatsapp';
        checkoutNoticeKey = noticeKey;
        document.getElementById('verify-notice').textContent = ctr(noticeKey);
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
    const emailStatus = checkoutEmailVerified
        ? ctr('email_verified_status')
        : checkoutEmailSent
            ? ctr('email_code_sent').replace('{email}', document.getElementById('verify-email-value').textContent)
            : checkoutCodesSent ? ctr('email_not_sent') : ctr('email_waiting');
    const whatsappStatus = ctr('phone_order_note');
    document.getElementById('verify-email-status').textContent = emailStatus;
    document.getElementById('verify-whatsapp-status').textContent = whatsappStatus;
    document.getElementById('verify-email-required').textContent = ctr(checkoutEmailVerified ? 'verified_state' : 'required_state');
    document.getElementById('verify-whatsapp-required').textContent = ctr('required_state');
    document.getElementById('email-code-panel').hidden = !checkoutEmailSent || checkoutEmailVerified;
    document.getElementById('whatsapp-code-panel').hidden = true;
    document.getElementById('verify-notice').textContent = ctr(checkoutVerificationToken ? 'contacts_verified_notice' : checkoutNoticeKey);
    document.getElementById('continue-after-verification').disabled = !checkoutVerificationToken;
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
            errorBox.textContent = result.message;
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
                errorBox.textContent = 'A verification code was sent to your email address.';
                errorBox.hidden = false;
                submit.disabled = false;
                return;
            }

            pendingVerificationEmail = '';
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
        const orderData = {
            customer_name: customer.name || '',
            customer_phone: phone,
            customer_email: customer.email || '',
            checkoutVerificationToken: checkoutVerificationToken || '',
            notes: '',
            payment_provider: document.querySelector('[name="checkout-payment-method"]:checked')?.value || 'oneclick',
            items: cart.map(item => ({ product_id: item.product_id, offer_id: item.offer_id, quantity: item.quantity }))
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
