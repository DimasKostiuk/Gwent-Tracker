// Supabase (and the browser's own fetch/auth errors) come back in English by
// default — this maps the ones we actually run into to Ukrainian. Patterns
// are matched case-insensitively against the raw message; anything
// unrecognized falls back to a generic Ukrainian message instead of leaking
// raw English/API text into the UI. The original is still logged to the
// console so it's not lost for debugging.
const KNOWN_ERRORS = [
  [/invalid login credentials/i, 'Неправильний email або пароль'],
  [/email not confirmed/i, 'Email не підтверджено'],
  [/user already registered/i, 'Користувач із цим email вже зареєстрований'],
  [
    /password should be at least (\d+) characters?/i,
    (m) => `Пароль має містити щонайменше ${m[1]} символів`,
  ],
  [/unable to validate email address/i, 'Некоректний формат email'],
  [
    /for security purposes.*after (\d+) seconds?/i,
    (m) => `З міркувань безпеки спробуй ще раз через ${m[1]} с`,
  ],
  [/jwt expired|invalid jwt|invalid refresh token/i, 'Сесія закінчилася — увійди ще раз'],
  [/duplicate key value violates unique constraint/i, 'Такий запис уже існує'],
  [/row-level security/i, 'Немає доступу для цієї дії'],
  [/failed to fetch|networkerror|load failed/i, "Немає з'єднання з сервером. Перевір інтернет і спробуй ще раз"],
]

export function translateError(error) {
  const message = typeof error === 'string' ? error : error?.message
  if (!message) return 'Сталася невідома помилка'

  for (const [pattern, replacement] of KNOWN_ERRORS) {
    const match = message.match(pattern)
    if (match) return typeof replacement === 'function' ? replacement(match) : replacement
  }

  console.error('Untranslated error:', message)
  return 'Щось пішло не так. Спробуй ще раз'
}
