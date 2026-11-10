(function () {
    const CH = window.CH;
    document.addEventListener('DOMContentLoaded', async () => {
        const grid = document.getElementById('courses-grid');
        const search = document.getElementById('search');
        const facultySelect = document.getElementById('faculty-filter');

        let courses = [];
        let faculties = new Map();
        let teachers = new Map();

        const render = () => {
            const text = search.value.trim().toLowerCase();
            const faculty = facultySelect.value;
            const shown = courses.filter(
                (course) =>
                    course.title.toLowerCase().includes(text) &&
                    (!faculty || String(course.faculty) === faculty),
            );

            if (shown.length === 0) {
                grid.replaceChildren(CH.el('div', 'loading-spinner', 'Курсів не знайдено.'));
                return;
            }

            grid.replaceChildren(
                ...shown.map((course) => {
                    const card = CH.el('article', 'course-card');
                    card.append(CH.el('h3', '', course.title));
                    if (course.description) card.append(CH.el('p', 'card-text', course.description));

                    const meta = CH.el('div', 'course-meta');
                    const teacher = teachers.get(course.teacher);
                    for (const [label, value] of [
                        ['Факультет', faculties.get(course.faculty) || '—'],
                        ['Викладач', teacher ? teacher.last_name + ' ' + teacher.first_name : '—'],
                    ]) {
                        const row = CH.el('p', '', label + ': ');
                        row.append(CH.el('span', '', value));
                        meta.append(row);
                    }
                    card.append(meta);
                    card.append(CH.el('div', 'credits-badge', Number(course.credits) + ' кредитів'));
                    return card;
                }),
            );
        };

        try {
            // The three lists are public: auth: false.
            const [courseList, facultyList, teacherList] = await Promise.all([
                CH.api('/courses/', { auth: false }),
                CH.api('/faculties/', { auth: false }),
                CH.api('/teachers/', { auth: false }),
            ]);
            courses = courseList;
            faculties = new Map(facultyList.map((f) => [f.id, f.name]));
            teachers = new Map(teacherList.map((t) => [t.id, t]));

            for (const faculty of facultyList) {
                const option = CH.el('option', '', faculty.name);
                option.value = faculty.id;
                facultySelect.append(option);
            }
            render();
        } catch (error) {
            const box = CH.el('div');
            CH.showMessage(box, 'error', error.describe ? error.describe() : String(error));
            grid.replaceChildren(box);
        }

        search.addEventListener('input', render);
        facultySelect.addEventListener('change', render);
    });
})();
