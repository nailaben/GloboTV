const accountCopy = {
    en: {
        none: 'You have no orders yet.',
        pending: 'Pending',
        confirmed: 'Confirmed',
        shipped: 'Shipped',
        completed: 'Completed',
        cancelled: 'Cancelled',
        saved: 'Your account information was saved.',
        saveFailed: 'Could not save your changes. Please try again.',
        save: 'Save changes'
    },
    fr: {
        none: 'Vous n’avez pas encore de commande.',
        pending: 'En attente',
        confirmed: 'Confirmée',
        shipped: 'Expédiée',
        completed: 'Terminée',
        cancelled: 'Annulée',
        saved: 'Vos informations ont été enregistrées.',
        saveFailed: 'Impossible d’enregistrer les modifications. Réessayez.',
        save: 'Enregistrer les modifications'
    }
};

initLang();
setupLangToggle();

function accountText() {
    return accountCopy[currentLang] || accountCopy.en;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function fillProfile(customer) {
    document.getElementById('profile-name').value = customer.name || '';
    document.getElementById('profile-email').value = customer.email || '';
    document.getElementById('profile-phone').value = customer.phone || '';
    document.getElementById('profile-address').value = customer.address || '';
}

function showProfileMessage(message, isError = false) {
    const element = document.getElementById('profile-message');
    element.textContent = message;
    element.classList.toggle('is-error', isError);
    element.hidden = false;
}

function renderAccountOrders() {
    const orders = window._customerOrders || [];
    const copy = accountText();
    document.getElementById('orders').innerHTML = orders.length
        ? orders.map(order => `
            <article class="order-row">
                <div>
                    <strong>${escapeHtml(order.order_number)}</strong>
                    <small>${new Date(order.created_at).toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US')}</small>
                </div>
                <div style="text-align:end">
                    <strong>${new Intl.NumberFormat(currentLang === 'fr' ? 'fr-FR' : 'en-IE', {
                        style: 'currency',
                        currency: order.currency || 'USD'
                    }).format(Number(order.total_amount))}</strong>
                    <small class="order-status">${copy[order.status] || escapeHtml(order.status)}</small>
                </div>
            </article>
        `).join('')
        : `<p class="account-muted">${copy.none}</p>`;
}

document.addEventListener('langChange', () => {
    document.querySelectorAll('[data-en]').forEach(element => {
        element.textContent = element.dataset[currentLang] || element.dataset.en;
    });
    if (window._customerOrders) renderAccountOrders();
});

document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('playora_customer_token');
    localStorage.removeItem('playora_customer');
    location.href = '/auth.html';
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
        name: document.getElementById('profile-name').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        phone: document.getElementById('profile-phone').value.trim(),
        address: document.getElementById('profile-address').value.trim()
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
    if (!localStorage.getItem('playora_customer_token')) {
        location.href = '/auth.html';
        return;
    }

    try {
        const [profile, orders] = await Promise.all([api.getCustomer(), api.getCustomerOrders()]);
        if (!profile.success || !orders.success) throw new Error('Customer session is invalid.');

        window._customerProfile = profile.customer;
        localStorage.setItem('playora_customer', JSON.stringify(profile.customer));
        document.getElementById('customer-name').textContent = profile.customer.name;
        document.getElementById('customer-email').textContent = profile.customer.email;
        document.getElementById('avatar').textContent = (profile.customer.name.trim()[0] || 'P').toUpperCase();
        fillProfile(profile.customer);
        window._customerOrders = orders.orders;
        renderAccountOrders();
    } catch {
        localStorage.removeItem('playora_customer_token');
        localStorage.removeItem('playora_customer');
        location.href = '/auth.html';
    }
})();
