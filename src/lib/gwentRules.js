export const NILFGAARD = 'Нільфгард'
export const MAX_ROUNDS = 3
export const ROUNDS_TO_WIN = 2

export function isMatchDecided(roundsWonA, roundsWonB, roundsPlayed) {
  return roundsWonA >= ROUNDS_TO_WIN || roundsWonB >= ROUNDS_TO_WIN || roundsPlayed >= MAX_ROUNDS
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
