export const NILFGAARD = 'Нільфгард'
export const MAX_ROUNDS = 3
export const ROUNDS_TO_WIN = 2

// A match is decided once either side wins 2 rounds, or all 3 rounds have
// been played. Special case: if the first 2 rounds were BOTH ties, neither
// side has a round win at all (0-0) — there's nothing left to decide, so the
// match ends right there as a draw instead of playing a 3rd round. A regular
// 1-1 split (someone actually won a round each) still goes to a 3rd, decisive
// round as usual.
export function isMatchDecided(roundsWonA, roundsWonB, roundsPlayed) {
  if (roundsWonA >= ROUNDS_TO_WIN || roundsWonB >= ROUNDS_TO_WIN) return true
  if (roundsPlayed >= MAX_ROUNDS) return true
  if (roundsPlayed >= 2 && roundsWonA === 0 && roundsWonB === 0) return true
  return false
}

// Returns 'a', 'b', or 'tie'. A tie is a fully valid round/match outcome —
// EXCEPT Nilfgaard's leader ability always wins a draw. If both sides play
// Nilfgaard, the abilities cancel out and it's a genuine tie again.
export function resolveRoundWinner(pointsA, pointsB, factionA, factionB) {
  if (pointsA > pointsB) return 'a'
  if (pointsB > pointsA) return 'b'

  const aIsNilfgaard = factionA === NILFGAARD
  const bIsNilfgaard = factionB === NILFGAARD
  if (aIsNilfgaard && !bIsNilfgaard) return 'a'
  if (bIsNilfgaard && !aIsNilfgaard) return 'b'
  return 'tie'
}
