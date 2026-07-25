# Gwent Tracker

Трекер очок і історії ігор у Gwent. React (Vite) + Supabase + Vercel.

## Стек

- React + Vite (JavaScript)
- Tailwind CSS
- Supabase (Auth + Postgres, пізніше — Realtime)
- Деплой на Vercel

## Поточний стан

Зроблено фундамент: підключення до Supabase, реєстрація/логін (email + пароль,
без підтвердження email), захищений роут `/dashboard`. Сам дашборд, історія
ігор, живі сесії з запрошенням гравця — наступні кроки.

## Налаштування Supabase

1. Створи проєкт на [supabase.com](https://supabase.com).
2. У **Project Settings → Authentication → Providers → Email** вимкни
   **Confirm email** — реєстрація одразу створює активну сесію.
3. Відкрий **SQL Editor** і виконай вміст файлу [`supabase/schema.sql`](supabase/schema.sql).
   Це створить таблицю `profiles` і тригер, який автоматично додає туди
   запис при реєстрації нового користувача.
4. У **Project Settings → API** скопіюй `Project URL` і `anon public` ключ.

## Локальний запуск

```bash
npm install
cp .env.example .env
# встав VITE_SUPABASE_URL і VITE_SUPABASE_ANON_KEY у .env
npm run dev
```

## Деплой на Vercel

1. Заштовхни репозиторій на GitHub.
2. На [vercel.com](https://vercel.com) імпортуй репозиторій (framework
   визначиться як Vite автоматично).
3. У налаштуваннях проєкту на Vercel додай Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy.
