import nilfgaardArt from '../assets/player-panel/nilfgaard.png'
import skeligeArt from '../assets/player-panel/skellige.png'
import scoiatealArt from '../assets/player-panel/scoiatael.png'
import witchersArt from '../assets/player-panel/witchers.png'
import monstersArt from '../assets/player-panel/monsters.png'
import temeriaArt from '../assets/player-panel/temeria.png'
import toussaintArt from '../assets/player-panel/toussaint.png'
import velenArt from '../assets/player-panel/velen.png'
import redaniaArt from '../assets/player-panel/redania.png'
import wildHuntArt from '../assets/player-panel/wild-hunt.png'

// One accent color + flavor quote + side ornament art per faction. Colors are
// sampled directly from the supplied ornament artwork so the UI accent always
// matches the art exactly. Plain hex (not Tailwind tokens) since they're
// applied via inline style — borders/text/avatar all derive from the same
// value, so each card reads as one coherent theme.
export const FACTION_THEMES = {
  Нільфгард: { color: '#e1bd6a', quote: 'Імперія понад усе', art: nilfgaardArt },
  Скеліге: { color: '#7fb7da', quote: "Море пам'ятає", art: skeligeArt },
  Скоатаелі: { color: '#6eb98b', quote: "Ліс пам'ятає", art: scoiatealArt },
  Відьмаки: { color: '#c2c7ce', quote: 'Менше зло', art: witchersArt },
  Чудовиська: { color: '#b25a7b', quote: 'Голод ночі', art: monstersArt },
  Темерія: { color: '#6b91e0', quote: 'За Темерію', art: temeriaArt },
  Тусент: { color: '#d17d96', quote: 'Вино й турніри', art: toussaintArt },
  Велен: { color: '#9c9c5d', quote: 'Твоє слово', art: velenArt },
  Реданія: { color: '#cf5f51', quote: 'Порядок і віра', art: redaniaArt },
  'Дикий Гін': { color: '#9fd8e9', quote: 'Біла Памороз', art: wildHuntArt },
}

export function getFactionTheme(faction) {
  return FACTION_THEMES[faction] ?? null
}
