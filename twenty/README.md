# BojumboCRM - Посібник із запуску

Короткий посібник для швидкого розгортання та запуску системи локально.

## 1. Попередні вимоги
* **Node.js**: версія 18.x або новіша.
* **Docker**: для запуску бази даних PostgreSQL.

## 2. Крок за кроком

### 1. Запуск бази даних
Використовуйте Docker Compose для підняття контейнера з PostgreSQL:
```bash
docker-compose up -d
```

### 2. Встановлення залежностей
```bash
npm install
```

### 3. Налаштування середовища (Environment)
Переконайтеся, що файл `.env` містить правильні параметри:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bojumbocrm_db?schema=public"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Налаштування бази даних та Prisma
Синхронізуйте схему, згенеруйте клієнт та створіть початкового адміністратора:
```bash
npx prisma db push
npx prisma generate
npx prisma db seed
```

### 5. Запуск сервера розробки
```bash
npm run dev
```

## 3. Вхід у систему
Після запуску відкрийте [http://localhost:3000](http://localhost:3000).

**Дані для першого входу (Адмін):**
* **Логін:** `admin@crm.com`
* **Пароль:** `admin123`

---
*Примітка: Нові користувачі, які реєструються самостійно, потребують підтвердження від адміністратора в розділі **Admin Panel**.*
