(function () {
    const CH = window.CH;
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('register-form');
        const message = document.getElementById('message');
        const button = form.querySelector('button[type="submit"]');
        const params = new URLSearchParams(window.location.search);

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            CH.clearMessage(message);
            CH.showFieldErrors(form, null);

            const fields = {
                username: form.elements.username.value.trim(),
                first_name: form.elements.first_name.value.trim(),
                last_name: form.elements.last_name.value.trim(),
                email: form.elements.email.value.trim(),
                password: form.elements.password.value,
                password_confirm: form.elements.password_confirm.value,
            };

            if (fields.password !== fields.password_confirm) {
                CH.showFieldErrors(form, { password_confirm: 'Паролі не збігаються.' });
                return;
            }

            button.disabled = true;
            try {
                await CH.register(fields);
            } catch (error) {
                CH.showMessage(message, 'error', error.describe ? error.describe() : String(error));
                if (error.data) CH.showFieldErrors(form, error.data.details);
                button.disabled = false;
                return;
            }

            try {
                await CH.login(fields.username, fields.password);
                CH.navigate(CH.safeNext(params.get('next')) || 'index.html');
            } catch (error) {
                CH.navigate('login.html?registered=1');
            }
        });
    });
})();
