(function () {
    const CH = window.CH;
    document.addEventListener('DOMContentLoaded', async () => {
        const grid = document.getElementById('list-grid');
        const kind = document.body.dataset.list;

        try {
            if (kind === 'teachers') {
                const [teachers, faculties] = await Promise.all([
                    CH.api('/teachers/', { auth: false }),
                    CH.api('/faculties/', { auth: false }),
                ]);
                const names = new Map(faculties.map((f) => [f.id, f.name]));
                grid.replaceChildren(
                    ...teachers.map((teacher) => {
                        const card = CH.el('article', 'course-card');
                        card.append(CH.el('h3', '', teacher.last_name + ' ' + teacher.first_name));
                        const meta = CH.el('div', 'course-meta');
                        for (const [label, value] of [
                            ['Посада', CH.POSITIONS[teacher.position] || teacher.position],
                            ['Факультет', names.get(teacher.faculty) || '—'],
                            ['Email', teacher.email || '—'],
                        ]) {
                            const row = CH.el('p', '', label + ': ');
                            row.append(CH.el('span', '', value));
                            meta.append(row);
                        }
                        card.append(meta);
                        return card;
                    }),
                );
            } else {
                const faculties = await CH.api('/faculties/', { auth: false });
                grid.replaceChildren(
                    ...faculties.map((faculty) => {
                        const card = CH.el('article', 'course-card');
                        card.append(CH.el('h3', '', faculty.name));
                        card.append(CH.el('p', 'card-text', faculty.description || 'Опису немає.'));
                        return card;
                    }),
                );
            }
            if (!grid.children.length) {
                grid.replaceChildren(CH.el('div', 'loading-spinner', 'Поки що тут нічого немає.'));
            }
        } catch (error) {
            const box = CH.el('div');
            CH.showMessage(box, 'error', error.describe ? error.describe() : String(error));
            grid.replaceChildren(box);
        }
    });
})();
