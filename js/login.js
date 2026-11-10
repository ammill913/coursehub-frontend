(function () {
    const CH = window.CH;
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('login-form');
        const message = document.getElementById('message');
        const button = form.querySelector('button[type="submit"]');
        const params = new URLSearchParams(window.location.search);

        if (params.get('registered')) {
            CH.showMessage(message, 'success', 'Реєстрація успішна. Тепер увійдіть.');
        }

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            CH.clearMessage(message);
            CH.showFieldErrors(form, null);
            button.disabled = true;
            try {
                await CH.login(form.elements.username.value.trim(), form.elements.password.value);
                CH.navigate(CH.safeNext(params.get('next')) || 'index.html');
            } catch (error) {
                CH.showMessage(message, 'error', error.describe ? error.describe() : String(error));
                if (error.data) CH.showFieldErrors(form, error.data.details);
                button.disabled = false;
            }
        });
    });
})();
