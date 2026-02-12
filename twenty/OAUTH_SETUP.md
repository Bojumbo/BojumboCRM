# Налаштування Google OAuth 2.0

Оскільки Service Account має обмежене (або нульове) сховище, ми переходимо на OAuth 2.0, щоб використовувати ваш особистий Google Drive (15 ГБ).

### Крок 1: Створення OAuth Credenitals
1. Перейдіть у [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Переконайтеся, що обрано правильний проект (`bojumbocrm`).
3. Натисніть **+ CREATE CREDENTIALS** -> **OAuth client ID**.
4. Якщо запитає налаштувати "Oauth Consent Screen":
   - User Type: **External**.
   - App Name: `BojumboCRM`.
   - User Support Email: ваш email.
   - Developer Contact Email: ваш email.
   - Save and Continue (пропустіть Scopes і Test Users, натискаючи Save).
   - **ВАЖЛИВО**: У розділі "Test Users" додайте **свій email** (щоб мати доступ під час тестування).
5. Поверніться до **Credentials** -> **OAuth client ID**.
6. **Application type**: Виберіть **Desktop app** (це найпростіший спосіб отримати токен один раз).
7. Name: `Bojumbo Desktop`.
8. Натисніть **CREATE**.
9. Завантажте JSON файл (натисніть іконку завантаження ⬇️).
10. Збережіть цей файл у папку проекту (`d:\Projects\twenty`) з назвою **`credentials.json`**.

### Крок 2: Отримання Refresh Token
1. Запустіть скрипт генерації токена (який я зараз створю):
   ```bash
   node get-refresh-token.js
   ```
2. Скрипт покаже посилання. Відкрийте його в браузері.
3. Увійдіть у свій Google аккаунт.
4. Якщо побачите "Google hasn't verified this app", натисніть **Advanced** -> **Go to BojumboCRM (unsafe)**.
5. Надайте дозволи (Drive, Docs).
6. Скопіюйте код, який з'явиться.
7. Вставте код у термінал, де запущено скрипт.
8. Скрипт створить файл `token.json`.

Після цього програма зможе використовувати ваш Google Drive!
