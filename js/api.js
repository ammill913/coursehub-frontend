(function () {
    const CH = window.CH;

    const KEYS = { access: 'ch_access', refresh: 'ch_refresh', user: 'ch_user' };

    // ---------- storage ----------

    CH.getAccess = () => localStorage.getItem(KEYS.access);
    CH.getRefresh = () => localStorage.getItem(KEYS.refresh);
    CH.getUser = () => {
        try {
            return JSON.parse(localStorage.getItem(KEYS.user));
        } catch (error) {
            return null;
        }
    };

    CH.saveSession = ({ access, refresh, user }) => {
        localStorage.setItem(KEYS.access, access);
        localStorage.setItem(KEYS.refresh, refresh);
        localStorage.setItem(KEYS.user, JSON.stringify(user));
    };

    CH.saveUser = (user) => localStorage.setItem(KEYS.user, JSON.stringify(user));

    CH.clearSession = () => {
        localStorage.removeItem(KEYS.access);
        localStorage.removeItem(KEYS.refresh);
        localStorage.removeItem(KEYS.user);
    };
    CH.isLoggedIn = () => Boolean(CH.getRefresh() && CH.getAccess());

    // ---------- navigation ----------

    CH.navigate = (url) => window.location.assign(url);
    CH.safeNext = (value) => {
        if (typeof value === 'string' && /^[\w-]+\.html(\?[\w=&%.-]*)?$/.test(value)) {
            return value;
        }
        return null;
    };

    CH.currentPage = () => {
        const file = window.location.pathname.split('/').pop() || 'index.html';
        return file + window.location.search;
    };

    CH.redirectToLogin = () => {
        CH.navigate('login.html?next=' + encodeURIComponent(CH.currentPage()));
    };

    CH.requireAuth = () => {
        if (!CH.isLoggedIn()) {
            CH.redirectToLogin();
            return false;
        }
        return true;
    };

    CH.redirectIfLoggedIn = () => {
        if (CH.isLoggedIn()) {
            const next = CH.safeNext(new URLSearchParams(window.location.search).get('next'));
            CH.navigate(next || 'index.html');
            return true;
        }
        return false;
    };

    // ---------- token refresh ----------

    let refreshPromise = null;

    CH.refreshAccessToken = () => {
        if (!refreshPromise) {
            refreshPromise = (async () => {
                try {
                    const response = await fetch(CH.API_URL + '/auth/refresh/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh: CH.getRefresh() }),
                    });
                    if (!response.ok) return false;
                    const data = await response.json();
                    localStorage.setItem(KEYS.access, data.access);
                    return true;
                } catch (error) {
                    return false;
                } finally {
                    refreshPromise = null;
                }
            })();
        }
        return refreshPromise;
    };

    // ---------- requests ----------

    class ApiError extends Error {
        constructor(status, data) {
            super((data && data.error) || 'Помилка ' + status);
            this.status = status;
            this.data = data || {};
        }

        describe() {
            const lines = [this.message];
            const details = this.data.details;
            if (details && typeof details === 'object') {
                for (const [field, messages] of Object.entries(details)) {
                    const label = CH.FIELD_LABELS[field] || field;
                    lines.push(label + ': ' + [].concat(messages).join(' '));
                }
            }
            return lines;
        }
    }
    CH.ApiError = ApiError;

    CH.FIELD_LABELS = {
        username: 'Username',
        first_name: "Ім'я",
        last_name: 'Прізвище',
        email: 'Email',
        password: 'Пароль',
        password_confirm: 'Підтвердження пароля',
        title: 'Назва',
        description: 'Опис',
        credits: 'Кредити',
        faculty: 'Факультет',
        teacher: 'Викладач',
        name: 'Назва',
        position: 'Посада',
    };

    CH.api = async (path, options = {}) => {
        const { auth = true, body, method = 'GET' } = options;

        const send = () => {
            const headers = {};
            if (body !== undefined) headers['Content-Type'] = 'application/json';
            if (auth && CH.getAccess()) headers.Authorization = 'Bearer ' + CH.getAccess();
            return fetch(CH.API_URL + path, {
                method,
                headers,
                body: body === undefined ? undefined : JSON.stringify(body),
            });
        };

        let response;
        try {
            response = await send();
        } catch (error) {
            throw new ApiError(0, {
                error: 'Не вдалося підключитися до сервера. Перевірте, що бекенд запущено.',
            });
        }

        if (response.status === 401 && auth && CH.getRefresh()) {
            const refreshed = await CH.refreshAccessToken();
            if (!refreshed) {
                CH.clearSession();
                CH.redirectToLogin();
                throw new ApiError(401, { error: 'Сесія завершилась. Увійдіть знову.' });
            }
            response = await send();
        }

        if (response.status === 204) return null;
        let data = null;
        if (response.status !== 500) {
           data = await response.json().catch(() => null);
        }

        if (!response.ok) throw new ApiError(response.status, data);
        return data;
    };

    // ---------- login, register, logout ----------

    CH.login = async (username, password) => {
        const data = await CH.api('/auth/login/', {
            method: 'POST',
            body: { username, password },
            auth: false,
        });
        CH.saveSession(data);
        return data.user;
    };

    CH.register = (fields) =>
        CH.api('/auth/register/', { method: 'POST', body: fields, auth: false });

    CH.logout = () => {
        CH.clearSession();
        CH.navigate('index.html');
    };

    CH.tokenExpiry = (token) => {
        try {
            const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            return new Date(JSON.parse(atob(payload)).exp * 1000);
        } catch (error) {
            return null;
        }
    };

    window.addEventListener('storage', (event) => {
        if (event.key === KEYS.access && !event.newValue) {
            window.location.reload();
        }
    });
})();
