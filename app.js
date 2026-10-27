document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:8000/api/courses/';
    const gridContainer = document.getElementById('courses-grid');

    const fetchCourses = async () => {
        try {
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                throw new Error(`Помилка HTTP: ${response.status}`);
            }

            const courses = await response.json();
            renderCourses(courses);

        } catch (error) {
            console.error('Помилка при отриманні даних:', error);
            gridContainer.innerHTML = `
                <div class="error-message">
                    <strong>Не вдалося підключитися до сервера.</strong><br>
                    Переконайтеся, що бекенд запущено на ${API_URL}, і налаштовано CORS (CORS_ALLOW_ALL_ORIGINS = True).
                </div>
            `;
        }
    };

    const renderCourses = (courses) => {
        gridContainer.innerHTML = '';
        if (courses.length === 0) {
            gridContainer.innerHTML = '<div class="loading-spinner">Курсів поки немає. Створіть їх через API або Postman.</div>';
            return;
        }

        courses.forEach(course => {
            const card = document.createElement('article');
            card.className = 'course-card';

            card.innerHTML = `
                <h3>${course.title}</h3>
                <div class="course-meta">
                    <p>ID Факультету: <span>${course.faculty}</span></p>
                    <p>ID Викладача: <span>${course.teacher}</span></p>
                </div>
                <div class="credits-badge">${course.credits} кредитів</div>
            `;

            gridContainer.appendChild(card);
        });
    };

    fetchCourses();
});