// `games` is expected sorted newest-first (as returned by getMyGames).

export function gameOutcome(game, userId) {
  if (game.is_draw) return 'draw'
  return game.winner_id === userId ? 'win' : 'loss'
}

// Like gameOutcome, but an incomplete match is its own bucket rather than
// falling into win/loss/draw — used for the History page filters.
export function getGameStatus(game, userId) {
  if (game.is_incomplete) return 'incomplete'
  return gameOutcome(game, userId)
}

export function computeCurrentStreak(games, userId) {
  let streak = 0
  for (const g of games) {
    if (gameOutcome(g, userId) !== 'win') break
    streak++
  }
  return streak
}

export function computeLongestStreak(games, userId) {
  let longest = 0
  let current = 0
  for (const g of games) {
    if (gameOutcome(g, userId) === 'win') {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }
  return longest
}

// Newest -> oldest, left to right (most recent game first).
export function computeForm(games, userId, count = 12) {
  return games
    .slice(0, count)
    .map((g) => gameOutcome(g, userId))
}

// Builds one card per registered profile (excluding yourself), enriched with
// your head-to-head record. Profiles you've never played show zeroed/null
// stats rather than being left out entirely.
export function buildOpponentCards(profiles, games, rounds, userId) {
  const roundsByGame = new Map()
  for (const r of rounds) {
    if (!roundsByGame.has(r.game_id)) roundsByGame.set(r.game_id, [])
    roundsByGame.get(r.game_id).push(r)
  }

  return profiles.map((profile) => {
    const gamesWithThem = games
      .filter((g) => g.player1_id === profile.id || g.player2_id === profile.id)
      .sort((a, b) => new Date(b.finished_at) - new Date(a.finished_at))

    if (gamesWithThem.length === 0) {
      return {
        profile,
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: null,
        streak: null,
        avgPoints: null,
        favoriteFaction: null,
        lastPlayedAt: null,
      }
    }

    let wins = 0
    let losses = 0
    let draws = 0
    const factionCounts = {}
    let pointsSum = 0
    let pointsGames = 0

    for (const g of gamesWithThem) {
      const isPlayer1 = g.player1_id === userId
      const status = gameOutcome(g, userId)
      if (status === 'win') wins++
      else if (status === 'loss') losses++
      else draws++

      const opponentFaction = isPlayer1 ? g.player2_faction : g.player1_faction
      factionCounts[opponentFaction] = (factionCounts[opponentFaction] || 0) + 1

      const gameRounds = roundsByGame.get(g.id) || []
      if (gameRounds.length > 0) {
        pointsSum += gameRounds.reduce(
          (s, r) => s + (isPlayer1 ? r.player1_points : r.player2_points),
          0,
        )
        pointsGames++
      }
    }

    // Current streak against this specific opponent — positive for an active
    // win streak, negative for a loss streak, 0 if the last game was a draw.
    let streak = 0
    const firstStatus = gameOutcome(gamesWithThem[0], userId)
    if (firstStatus !== 'draw') {
      const sign = firstStatus === 'win' ? 1 : -1
      for (const g of gamesWithThem) {
        const status = gameOutcome(g, userId)
        if (status === 'draw' || (status === 'win' ? 1 : -1) !== sign) break
        streak += sign
      }
    }

    const favoriteFaction =
      Object.entries(factionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    return {
      profile,
      totalGames: gamesWithThem.length,
      wins,
      losses,
      draws,
      winRate: Math.round((wins / gamesWithThem.length) * 100),
      streak,
      avgPoints: pointsGames > 0 ? Math.round(pointsSum / pointsGames) : null,
      favoriteFaction,
      lastPlayedAt: gamesWithThem[0].finished_at,
    }
  })
}

// This player's own overall record — across ALL their games, against anyone,
// not just head-to-head vs the currently logged-in user.
export function computeOverallPlayerStats(games, rounds, playerId) {
  if (games.length === 0) {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: null,
      currentStreak: 0,
      longestStreak: 0,
      favoriteFaction: null,
      avgPoints: null,
      lastPlayedAt: null,
    }
  }

  const roundsByGame = new Map()
  for (const r of rounds) {
    if (!roundsByGame.has(r.game_id)) roundsByGame.set(r.game_id, [])
    roundsByGame.get(r.game_id).push(r)
  }

  let wins = 0
  let losses = 0
  let draws = 0
  const factionCounts = {}
  let pointsSum = 0
  let pointsGames = 0

  for (const g of games) {
    const outcome = gameOutcome(g, playerId)
    if (outcome === 'win') wins++
    else if (outcome === 'loss') losses++
    else draws++

    const isPlayer1 = g.player1_id === playerId
    const faction = isPlayer1 ? g.player1_faction : g.player2_faction
    factionCounts[faction] = (factionCounts[faction] || 0) + 1

    const gameRounds = roundsByGame.get(g.id) || []
    if (gameRounds.length > 0) {
      pointsSum += gameRounds.reduce(
        (s, r) => s + (isPlayer1 ? r.player1_points : r.player2_points),
        0,
      )
      pointsGames++
    }
  }

  const favoriteFaction = Object.entries(factionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    totalGames: games.length,
    wins,
    losses,
    draws,
    winRate: Math.round((wins / games.length) * 100),
    currentStreak: computeCurrentStreak(games, playerId),
    longestStreak: computeLongestStreak(games, playerId),
    favoriteFaction,
    avgPoints: pointsGames > 0 ? Math.round(pointsSum / pointsGames) : null,
    lastPlayedAt: games[0].finished_at,
  }
}

export function computeOpponentStats(games, userId) {
  const byOpponent = new Map()

  for (const g of games) {
    const isPlayer1 = g.player1_id === userId
    const opponent = isPlayer1 ? g.player2 : g.player1
    const outcome = gameOutcome(g, userId)

    const entry = byOpponent.get(opponent.id) || { opponent, wins: 0, losses: 0, draws: 0 }
    if (outcome === 'win') entry.wins++
    else if (outcome === 'loss') entry.losses++
    else entry.draws++
    byOpponent.set(opponent.id, entry)
  }

  return [...byOpponent.values()].sort(
    (a, b) => b.wins + b.losses + b.draws - (a.wins + a.losses + a.draws),
  )
}
