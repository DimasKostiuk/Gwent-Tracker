import logo from '../assets/gwent-tracker-logo.png'

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-300">
      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-8">
        <img src={logo} alt="Gwent Tracker" className="h-16 w-auto object-contain" />

        <div>
          <p className="text-sm uppercase tracking-widest text-stone-500">Gwent Tracker</p>
          <h1 className="text-4xl text-amber-50">Правила</h1>
        </div>

        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-2">
            <h2 className="text-xl text-amber-100">1. Загальні положення</h2>
            <p className="text-[17px] leading-relaxed text-stone-400">
              Gwent Tracker — це застосунок для обліку партій у настільну карткову гру Gwent серед
              кола знайомих гравців. Він не пов'язаний із CD Projekt RED і не є офіційним продуктом
              франшизи The Witcher — це самостійний проєкт для зручного підрахунку очок та ведення
              статистики. Реєструючись, ти погоджуєшся використовувати сервіс чесно і не на шкоду
              іншим учасникам - особливо Олегу.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-xl text-amber-100">2. Реєстрація та акаунт</h2>
            <p className="text-[17px] leading-relaxed text-stone-400">
              Для використання застосунку потрібен один акаунт на людину, прив'язаний до реальної
              email-адреси. Ти відповідаєш за збереження свого пароля в таємниці та за всі дії, що
              відбуваються під твоїм акаунтом. Ім'я, яке ти вказуєш при реєстрації, буде видно іншим
              зареєстрованим гравцям а також Олегу — обери те, за яким тебе впізнають за столом.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-xl text-amber-100">3. Правила гри та підрахунку очок</h2>
            <p className="text-[17px] leading-relaxed text-stone-400">
              Партія триває до перемоги в двох раундах із трьох (best of 3). Якщо один гравець
              виграє перші два раунди поспіль, третій не грається — партія завершується одразу.
              Раунд вважається виграним тим, у кого більше очок на момент, коли обидва гравці
              спасували. Якщо очки рівні — раунд програють обидва, окрім випадку, коли один із
              гравців грає за Нільфгард: лідерська здібність цієї фракції означає автоматичну
              перемогу в раунді при нічиї. Якщо за Нільфгард грають обидва — здібності скасовують
              одна одну, і фіксується справжня нічия.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-xl text-amber-100">4. Поведінка гравців</h2>
            <p className="text-[17px] leading-relaxed text-stone-400">
              Очікується, що результати ігор вносяться чесно й одразу після партії. Навмисне
              спотворення рахунку, образливі імена профілю чи інша поведінка, що псує гру іншим
              учасникам, є підставою для обмеження доступу до застосунку.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-xl text-amber-100">5. Конфіденційність даних</h2>
            <p className="text-[17px] leading-relaxed text-stone-400">
              Ми зберігаємо email, вказане ім'я та історію твоїх ігор (суперники, фракції, рахунок,
              дати а також голі фоткі Олега) у базі даних Supabase. Ці дані не передаються третім особам і не використовуються
              для реклами. Ігрова статистика (результати партій, фракції, рахунок раундів) видима
              іншим зареєстрованим гравцям — така прозорість потрібна для спільної історії та
              рейтингів. 
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
