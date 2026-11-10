(function () {
    const CH = window.CH;

    const formatTime = (date) => (date ? date.toLocaleTimeString('uk-UA') : 'невідомо');

    document.addEventListener('DOMContentLoaded', async () => {
        if (!CH.isLoggedIn()) return; 

        const info = document.getElementById('profile-info');
        const rights = document.getElementById('rights');
        const tokens = document.getElementById('token-info');
        const message = document.getElementById('message');

        const renderTokens = () => {
            const rows = [
                ['Access токен діє до', formatTime(CH.tokenExpiry(CH.getAccess() || ''))],
                ['Refresh токен діє до', formatTime(CH.tokenExpiry(CH.getRefresh() || ''))],
            ];
            tokens.replaceChildren(
                ...rows.map(([label, value]) => {
                    const row = CH.el('p', '', label + ': ');
                    row.append(CH.el('span', '', value));
                    return row;
                }),
            );
        };

        try {
            const user = await CH.api('/auth/me/');
            CH.saveUser(user);
            CH.renderHeader();

            const fields = [
                ['Username', user.username],
                ["Ім'я", user.first_name || '—'],
                ['Прізвище', user.last_name || '—'],
                ['Email', user.email],
                ['Роль', user.role === 'admin' ? 'адміністратор' : 'користувач'],
            ];
            info.replaceChildren(
                ...fields.map(([label, value]) => {
                    const row = CH.el('p', '', label + ': ');
                    row.append(CH.el('span', '', value));
                    return row;
                }),
            );

            const allowed = [
                'Переглядати курси, викладачів і факультети',
                'Додавати та редагувати курси, викладачів і факультети (сторінка «Керування»)',
            ];
            if (user.role === 'admin') allowed.push('Видаляти курси, викладачів і факультети');
            rights.replaceChildren(...allowed.map((text) => CH.el('li', '', text)));
        } catch (error) {
            CH.showMessage(message, 'error', error.describe ? error.describe() : String(error));
        }
        renderTokens();

        document.getElementById('refresh-btn').addEventListener('click', async () => {
            const ok = await CH.refreshAccessToken();
            renderTokens();
            if (ok) CH.showMessage(message, 'success', 'Access токен оновлено за допомогою refresh токена.');
            else CH.showMessage(message, 'error', 'Не вдалося оновити токен. Увійдіть знову.');
        });

        document.getElementById('expire-btn').addEventListener('click', async () => {
            localStorage.setItem('ch_access', 'expired.token.value');
            try {
                const user = await CH.api('/auth/me/');
                renderTokens();
                CH.showMessage(message, 'success', [
                    'Access токен «закінчився», сервер відповів 401.',
                    'Фронтенд сам оновив його за refresh токеном і повторив запит: ' + user.username + ' досі в системі.',
                ]);
            } catch (error) {
                CH.showMessage(message, 'error', error.describe ? error.describe() : String(error));
            }
        });

        document.getElementById('profile-logout').addEventListener('click', CH.logout);
    });
})();
