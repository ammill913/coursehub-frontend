(function () {
    const CH = window.CH;

    const teacherName = (t) => t.last_name + ' ' + t.first_name;

    const RESOURCES = {
        courses: {
            title: 'Курси',
            path: '/courses/',
            columns: (data) => [
                ['Назва', (item) => item.title],
                ['Кредити', (item) => Number(item.credits)],
                ['Факультет', (item) => data.faculties.find((f) => f.id === item.faculty)?.name || '—'],
                ['Викладач', (item) => {
                    const teacher = data.teachers.find((t) => t.id === item.teacher);
                    return teacher ? teacherName(teacher) : '—';
                }],
            ],
            fields: (data) => [
                { name: 'title', label: 'Назва', type: 'text', required: true, maxlength: 200 },
                { name: 'description', label: 'Опис', type: 'textarea' },
                { name: 'credits', label: 'Кредити (від 1 до 15, крок 0.5)', type: 'number', required: true, min: 1, max: 15, step: 0.5 },
                { name: 'faculty', label: 'Факультет', type: 'select', required: true, options: data.faculties.map((f) => [f.id, f.name]) },
                { name: 'teacher', label: 'Викладач', type: 'select', required: true, options: data.teachers.map((t) => [t.id, teacherName(t)]) },
            ],
        },
        teachers: {
            title: 'Викладачі',
            path: '/teachers/',
            columns: (data) => [
                ['Прізвище та імʼя', teacherName],
                ['Посада', (item) => CH.POSITIONS[item.position] || item.position],
                ['Email', (item) => item.email || '—'],
                ['Факультет', (item) => data.faculties.find((f) => f.id === item.faculty)?.name || '—'],
            ],
            fields: (data) => [
                { name: 'first_name', label: 'Імʼя', type: 'text', required: true, maxlength: 100 },
                { name: 'last_name', label: 'Прізвище', type: 'text', required: true, maxlength: 100 },
                { name: 'position', label: 'Посада', type: 'select', required: true, options: Object.entries(CH.POSITIONS) },
                { name: 'email', label: 'Email', type: 'email', maxlength: 254 },
                { name: 'faculty', label: 'Факультет', type: 'select', required: true, options: data.faculties.map((f) => [f.id, f.name]) },
            ],
        },
        faculties: {
            title: 'Факультети',
            path: '/faculties/',
            columns: () => [
                ['Назва', (item) => item.name],
                ['Опис', (item) => item.description || '—'],
            ],
            fields: () => [
                { name: 'name', label: 'Назва', type: 'text', required: true, maxlength: 150 },
                { name: 'description', label: 'Опис', type: 'textarea' },
            ],
        },
    };

    document.addEventListener('DOMContentLoaded', async () => {
        if (!CH.isLoggedIn()) return;

        const tabs = document.getElementById('tabs');
        const tableBox = document.getElementById('table-box');
        const formBox = document.getElementById('form-box');
        const message = document.getElementById('message');
        const note = document.getElementById('role-note');

        const state = { tab: 'courses', editing: null, isAdmin: false };
        const data = { courses: [], teachers: [], faculties: [] };

        const showError = (error) =>
            CH.showMessage(message, 'error', error.describe ? error.describe() : String(error));

        const loadData = async () => {
            const [courses, teachers, faculties] = await Promise.all([
                CH.api('/courses/', { auth: false }),
                CH.api('/teachers/', { auth: false }),
                CH.api('/faculties/', { auth: false }),
            ]);
            data.courses = courses;
            data.teachers = teachers;
            data.faculties = faculties;
        };

        // ---------- table ----------

        const renderTable = () => {
            const resource = RESOURCES[state.tab];
            const items = data[state.tab];
            const columns = resource.columns(data);

            const table = CH.el('table', 'table');
            const head = CH.el('tr');
            for (const [label] of columns) head.append(CH.el('th', '', label));
            
            if (state.isAdmin) {
                head.append(CH.el('th', '', 'Дії'));
            }
            
            table.append(head);

            if (items.length === 0) {
                const row = CH.el('tr');
                const cell = CH.el('td', '', 'Поки що порожньо.');
                cell.colSpan = columns.length + 1;
                row.append(cell);
                table.append(row);
            }

            for (const item of items) {
                const row = CH.el('tr');
                for (const [, getValue] of columns) row.append(CH.el('td', '', String(getValue(item))));

                const actions = CH.el('td', 'actions');
                const edit = CH.el('button', 'btn btn-small', 'Редагувати');
                edit.type = 'button';
                edit.addEventListener('click', () => {
                    state.editing = item;
                    renderForm();
                    formBox.scrollIntoView({ behavior: 'smooth' });
                });
                actions.append(edit);

                if (state.isAdmin) {
                    const remove = CH.el('button', 'btn btn-small btn-danger', 'Видалити');
                    remove.type = 'button';
                    remove.addEventListener('click', () => removeItem(item));
                    actions.append(remove);
                }
                row.append(actions);
                table.append(row);
            }
            tableBox.replaceChildren(table);
        };

        const removeItem = async (item) => {
            if (!window.confirm('Видалити цей запис?')) return;
            try {
                await CH.api(RESOURCES[state.tab].path + item.id + '/', { method: 'DELETE' });
                CH.showMessage(message, 'success', 'Запис видалено.');
                state.editing = null;
                await loadData();
                renderTable();
                renderForm();
            } catch (error) {
                showError(error);
            }
        };

        // ---------- form ----------

        const renderForm = () => {
            if (!state.isAdmin) {
                formBox.replaceChildren();
                return;
            }

            const resource = RESOURCES[state.tab];
            const editing = state.editing;
            const form = CH.el('form', 'form');
            form.noValidate = false;

            form.append(CH.el('h3', '', editing ? 'Редагування запису' : 'Новий запис'));

            for (const field of resource.fields(data)) {
                const row = CH.el('div', 'form-row');
                const label = CH.el('label', '', field.label);
                label.htmlFor = 'f-' + field.name;

                let input;
                if (field.type === 'textarea') {
                    input = CH.el('textarea');
                    input.rows = 3;
                } else if (field.type === 'select') {
                    input = CH.el('select');
                    const empty = CH.el('option', '', '— оберіть —');
                    empty.value = '';
                    input.append(empty);
                    for (const [value, text] of field.options) {
                        const option = CH.el('option', '', text);
                        option.value = value;
                        input.append(option);
                    }
                } else {
                    input = CH.el('input');
                    input.type = field.type;
                }
                input.id = 'f-' + field.name;
                input.name = field.name;
                if (field.required) input.required = true;
                for (const attr of ['maxlength', 'min', 'max', 'step']) {
                    if (field[attr] !== undefined) input.setAttribute(attr, field[attr]);
                }
                if (editing && editing[field.name] !== null && editing[field.name] !== undefined) {
                    input.value = editing[field.name];
                }

                const error = CH.el('small', 'field-error');
                error.dataset.for = field.name;
                row.append(label, input, error);
                form.append(row);
            }

            const buttons = CH.el('div', 'form-buttons');
            const submit = CH.el('button', 'btn', editing ? 'Зберегти зміни' : 'Додати');
            submit.type = 'submit';
            buttons.append(submit);
            if (editing) {
                const cancel = CH.el('button', 'btn btn-outline', 'Скасувати');
                cancel.type = 'button';
                cancel.addEventListener('click', () => {
                    state.editing = null;
                    renderForm();
                });
                buttons.append(cancel);
            }
            form.append(buttons);

            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                CH.clearMessage(message);
                CH.showFieldErrors(form, null);

                const body = {};
                for (const field of resource.fields(data)) {
                    const value = form.elements[field.name].value;
                    body[field.name] = field.type === 'select' && field.name !== 'position' ? Number(value) : value;
                }

                submit.disabled = true;
                try {
                    if (editing) {
                        await CH.api(resource.path + editing.id + '/', { method: 'PUT', body });
                    } else {
                        await CH.api(resource.path, { method: 'POST', body });
                    }
                    CH.showMessage(message, 'success', editing ? 'Зміни збережено.' : 'Запис додано.');
                    state.editing = null;
                    await loadData();
                    renderTable();
                    renderForm();
                } catch (error) {
                    showError(error);
                    if (error.data) CH.showFieldErrors(form, error.data.details);
                    submit.disabled = false;
                }
            });

            formBox.replaceChildren(form);
        };

        // ---------- tabs ----------

        const renderTabs = () => {
            tabs.replaceChildren(
                ...Object.entries(RESOURCES).map(([key, resource]) => {
                    const button = CH.el('button', 'tab-btn' + (key === state.tab ? ' active' : ''), resource.title);
                    button.type = 'button';
                    button.addEventListener('click', () => {
                        state.tab = key;
                        state.editing = null;
                        CH.clearMessage(message);
                        renderTabs();
                        renderTable();
                        renderForm();
                    });
                    return button;
                }),
            );
        };

        // ---------- start ----------

        try {
            const user = await CH.api('/auth/me/');
            CH.saveUser(user);
            CH.renderHeader();
            state.isAdmin = user.role === 'admin';
            note.textContent = state.isAdmin
                ? 'Ви адміністратор: можете додавати, редагувати та видаляти записи.'
                : 'Ви можете додавати та редагувати записи. Видаляти можуть лише адміністратори.';

            await loadData();
            renderTabs();
            renderTable();
            renderForm();
        } catch (error) {
            showError(error);
        }
    });
})();
