const accountCopy = {
    en: {
        saved: 'Your account information was saved.',
        saveFailed: 'Could not save your changes. Please try again.',
        save: 'Save changes'
    },
    fr: {
        saved: 'Vos informations ont été enregistrées.',
        saveFailed: 'Impossible d’enregistrer les modifications. Réessayez.',
        save: 'Enregistrer les modifications'
    }
};

const countryCodeSelect = document.getElementById('profile-country-code');

initLang();
window.populateCallingCodeSelect(countryCodeSelect, currentLang || 'en');
setupLangToggle();

function accountText() {
    return accountCopy[currentLang] || accountCopy.en;
}

function fillProfile(customer) {
    const nameParts = String(customer.name || '').trim().split(/\s+/).filter(Boolean);
    document.getElementById('profile-first-name').value = nameParts.shift() || '';
    document.getElementById('profile-last-name').value = nameParts.join(' ');
    document.getElementById('profile-email').value = customer.email || '';
    const savedPhone = String(customer.phone || '').replace(/[\s()-]/g, '');
    const matchingCountry = window.callingCountries.map(([, dialCode]) => `+${dialCode}`).sort((a, b) => b.length - a.length)
        .find(code => savedPhone.startsWith(code));
    countryCodeSelect.value = matchingCountry || '+213';
    document.getElementById('profile-phone').value = matchingCountry
        ? savedPhone.slice(matchingCountry.length).replace(/\D/g, '')
        : savedPhone.replace(/\D/g, '');
}

function showProfileMessage(message, isError = false) {
    const element = document.getElementById('profile-message');
    element.textContent = message;
    element.classList.toggle('is-error', isError);
    element.hidden = false;
}

document.addEventListener('langChange', () => {
    window.populateCallingCodeSelect(countryCodeSelect, currentLang || 'en');
    document.querySelectorAll('[data-en]').forEach(element => {
        element.textContent = element.dataset[currentLang] || element.dataset.en;
    });
    const phone = document.getElementById('profile-phone');
    phone.placeholder = currentLang === 'fr' ? phone.dataset.frPlaceholder : phone.dataset.enPlaceholder;
    countryCodeSelect.setAttribute('aria-label', currentLang === 'fr' ? 'Indicatif téléphonique du pays' : 'Country calling code');
});
document.getElementById('profile-phone').placeholder = currentLang === 'fr'
    ? document.getElementById('profile-phone').dataset.frPlaceholder
    : document.getElementById('profile-phone').dataset.enPlaceholder;

document.getElementById('logout').addEventListener('click', async () => {
    try { await api.logoutCustomer(); } catch {}
    localStorage.removeItem('playora_customer_token');
    localStorage.removeItem('playora_customer');
    location.replace('/auth.html');
});

document.getElementById('discard-profile').addEventListener('click', () => {
    if (window._customerProfile) fillProfile(window._customerProfile);
    document.getElementById('profile-message').hidden = true;
});

document.getElementById('customer-profile-form').addEventListener('submit', async event => {
    event.preventDefault();
    const submitButton = document.getElementById('save-profile');
    const message = document.getElementById('profile-message');
    const data = {
        name: `${document.getElementById('profile-first-name').value.trim()} ${document.getElementById('profile-last-name').value.trim()}`.trim(),
        email: document.getElementById('profile-email').value.trim(),
        phone: `${countryCodeSelect.value} ${document.getElementById('profile-phone').value.replace(/\D/g, '').replace(/^0/, '')}`.trim()
    };

    submitButton.disabled = true;
    message.hidden = true;
    try {
        const result = await api.updateCustomer(data);
        if (!result.success) throw new Error(result.message || accountText().saveFailed);

        window._customerProfile = result.customer;
        localStorage.setItem('playora_customer', JSON.stringify(result.customer));
        document.getElementById('customer-name').textContent = result.customer.name;
        document.getElementById('customer-email').textContent = result.customer.email;
        document.getElementById('avatar').textContent = (result.customer.name.trim()[0] || 'P').toUpperCase();
        fillProfile(result.customer);
        showProfileMessage(accountText().saved);
    } catch (error) {
        showProfileMessage(error.message || accountText().saveFailed, true);
    } finally {
        submitButton.disabled = false;
    }
});

(async () => {
    try {
        const profile = await api.getCustomer();
        if (!profile.success) throw new Error('Customer session is invalid.');

        window._customerProfile = profile.customer;
        localStorage.setItem('playora_customer', JSON.stringify(profile.customer));
        document.getElementById('customer-name').textContent = profile.customer.name;
        document.getElementById('customer-email').textContent = profile.customer.email;
        document.getElementById('avatar').textContent = (profile.customer.name.trim()[0] || 'P').toUpperCase();
        fillProfile(profile.customer);
    } catch {
        localStorage.removeItem('playora_customer_token');
        localStorage.removeItem('playora_customer');
        location.replace('/auth.html');
    }
})();
