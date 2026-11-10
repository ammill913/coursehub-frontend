(function () {
    const CH = window.CH;
    CH.el = (tag, className, text) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined && text !== null) element.textContent = text;
        return element;
    };

    CH.showMessage = (container, kind, lines) => {
        const box = CH.el('div', 'alert alert-' + kind);
        for (const line of [].concat(lines)) box.append(CH.el('p', '', line));
        container.replaceChildren(box);
    };

    CH.clearMessage = (container) => container.replaceChildren();

    CH.showFieldErrors = (form, details) => {
        for (const note of form.querySelectorAll('.field-error')) note.textContent = '';
        if (!details || typeof details !== 'object') return;
        for (const [field, messages] of Object.entries(details)) {
            const note = form.querySelector('.field-error[data-for="' + field + '"]');
            if (note) note.textContent = [].concat(messages).join(' ');
        }
    };

    CH.displayName = (user) => {
        const full = [user.first_name, user.last_name].filter(Boolean).join(' ');
        return full || user.username;
    };

    CH.POSITIONS = {
        professor: 'професор',
        associate_professor: 'доцент',
        senior_lecturer: 'старший викладач',
        assistant: 'асистент',
    };

    CH.renderHeader = () => {
        const header = document.getElementById('site-header');
        if (!header) return;

        const page = window.location.pathname.split('/').pop() || 'index.html';
        const container = CH.el('div', 'container');

        const logo = CH.el('a', 'logo', 'CourseHub ');
        logo.href = 'index.html';
        logo.append(CH.el('span', '', 'API'));

        const nav = CH.el('nav', 'nav');
        const links = [
            ['index.html', 'Курси'],
            ['teachers.html', 'Викладачі'],
            ['faculties.html', 'Факультети'],
            ['manage.html', 'Керування'],
            ['profile.html', 'Профіль'],
        ];
        for (const [href, label] of links) {
            const link = CH.el('a', page === href ? 'active' : '', label);
            link.href = href;
            nav.append(link);
        }

        const box = CH.el('div', 'auth-box');
        if (CH.isLoggedIn()) {
            const user = CH.getUser();
            if (user) {
                box.append(CH.el('span', 'user-name', CH.displayName(user)));
                box.append(CH.el('span', 'role-badge', user.role === 'admin' ? 'адмін' : 'користувач'));
            }
            const logout = CH.el('button', 'btn btn-outline', 'Вийти');
            logout.type = 'button';
            logout.id = 'logout-btn';
            logout.addEventListener('click', CH.logout);
            box.append(logout);
        } else {
            const next = page === 'login.html' || page === 'register.html' ? '' : '?next=' + encodeURIComponent(CH.currentPage());
            const login = CH.el('a', 'btn', 'Увійти');
            login.href = 'login.html' + next;
            login.id = 'login-btn';
            const register = CH.el('a', 'btn btn-outline', 'Реєстрація');
            register.href = 'register.html' + next;
            box.append(login, register);
        }

        container.append(logo, nav, box);
        header.replaceChildren(container);
    };

    document.addEventListener('DOMContentLoaded', CH.renderHeader);
})();
