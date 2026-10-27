# CourseHub Frontend

Фронтенд для перегляду каталогу курсів CourseHub. Статична сторінка
(HTML + CSS + JS), яка отримує список курсів з REST API бекенду
(`GET /api/courses/`) і рендерить їх картками.

## Адреси та порти

| Сервіс | URL | Порт |
|---|---|---|
| Frontend | `http://127.0.0.1:3000/` | `3000` |
| Backend API | `http://127.0.0.1:8000/api/` | `8000` |

## Як запустити проєкт

### 1. Бекенд

```bash
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Фронтенд
```bash
python -m http.server 3000