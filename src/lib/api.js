import { supabase } from './supabaseClient'

export async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, created_at')
    .order('display_name')
  if (error) throw error
  return data
}

export async function getMyGames(userId) {
  const { data, error } = await supabase
    .from('games')
    .select(
      `id, player1_id, player2_id, player1_faction, player2_faction,
       player1_rounds_won, player2_rounds_won, winner_id, started_at, finished_at,
       player1:player1_id (id, display_name),
       player2:player2_id (id, display_name)`,
    )
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .order('finished_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getGameRounds(gameId) {
  const { data, error } = await supabase
    .from('game_rounds')
    .select('*')
    .eq('game_id', gameId)
    .order('round_number')
  if (error) throw error
  return data
}

export async function saveGame({ player1, player2, player1Faction, player2Faction, rounds, startedAt }) {
  const player1RoundsWon = rounds.filter((r) => r.roundWinnerId === player1.id).length
  const player2RoundsWon = rounds.filter((r) => r.roundWinnerId === player2.id).length
  const winnerId = player1RoundsWon > player2RoundsWon ? player1.id : player2.id

  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert({
      player1_id: player1.id,
      player2_id: player2.id,
      player1_faction: player1Faction,
      player2_faction: player2Faction,
      player1_rounds_won: player1RoundsWon,
      player2_rounds_won: player2RoundsWon,
      winner_id: winnerId,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (gameError) throw gameError

  const roundRows = rounds.map((r, i) => ({
    game_id: game.id,
    round_number: i + 1,
    player1_points: r.player1Points,
    player2_points: r.player2Points,
    round_winner_id: r.roundWinnerId,
  }))

  const { error: roundsError } = await supabase.from('game_rounds').insert(roundRows)
  if (roundsError) throw roundsError

  return game
}
