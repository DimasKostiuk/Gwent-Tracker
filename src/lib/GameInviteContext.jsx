import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import { saveGame } from './api'

const GameInviteContext = createContext(undefined)

export function GameInviteProvider({ children }) {
  const { user } = useAuth()
  const [activeInvite, setActiveInvite] = useState(null)

  const reload = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('game_invites')
      .select(
        '*, from_profile:from_user_id(id, display_name), to_profile:to_user_id(id, display_name)',
      )
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .in('status', ['pending', 'accepted', 'playing', 'finished'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setActiveInvite(data ?? null)
  }, [user])

  useEffect(() => {
    if (!user) {
      setActiveInvite(null)
      return
    }
    reload()

    const channel = supabase
      .channel(`game_invites:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_invites', filter: `to_user_id=eq.${user.id}` },
        reload,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_invites', filter: `from_user_id=eq.${user.id}` },
        reload,
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, reload])

  const isInvitee = activeInvite?.to_user_id === user?.id
  const opponent = activeInvite ? (isInvitee ? activeInvite.from_profile : activeInvite.to_profile) : null

  const myFaction = activeInvite ? (isInvitee ? activeInvite.to_faction : activeInvite.from_faction) : null
  const opponentFaction = activeInvite
    ? isInvitee
      ? activeInvite.from_faction
      : activeInvite.to_faction
    : null
  const myPoints = activeInvite ? (isInvitee ? activeInvite.to_points : activeInvite.from_points) : 0
  const opponentPoints = activeInvite
    ? isInvitee
      ? activeInvite.from_points
      : activeInvite.to_points
    : 0

  const rounds = useMemo(() => {
    if (!activeInvite) return []
    return (activeInvite.rounds || []).map((r) => ({
      round: r.round,
      myPoints: isInvitee ? r.to_points : r.from_points,
      opponentPoints: isInvitee ? r.from_points : r.to_points,
      iWon: r.winner_id === user?.id,
    }))
  }, [activeInvite, isInvitee, user?.id])

  async function sendInvite(toUserId) {
    const { error } = await supabase
      .from('game_invites')
      .insert({ from_user_id: user.id, to_user_id: toUserId })
    if (error) throw error
    await reload()
  }

  async function respond(status) {
    const { error } = await supabase
      .from('game_invites')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', activeInvite.id)
    if (error) throw error
    await reload()
  }

  async function setMyFaction(faction) {
    const column = isInvitee ? 'to_faction' : 'from_faction'
    const { error } = await supabase
      .from('game_invites')
      .update({ [column]: faction })
      .eq('id', activeInvite.id)
    if (error) throw error

    // Whoever sets their faction *second* is the one that observes both
    // sides filled in, and flips the session into "playing".
    const otherFaction = isInvitee ? activeInvite.from_faction : activeInvite.to_faction
    if (otherFaction) {
      await supabase
        .from('game_invites')
        .update({ status: 'playing', game_started_at: new Date().toISOString() })
        .eq('id', activeInvite.id)
        .eq('status', 'accepted')
    }
    await reload()
  }

  async function setMyPoints(points) {
    const column = isInvitee ? 'to_points' : 'from_points'
    const { error } = await supabase
      .from('game_invites')
      .update({ [column]: points })
      .eq('id', activeInvite.id)
    if (error) throw error
    await reload()
  }

  async function finishRound() {
    const { from_points: fp, to_points: tp, current_round, from_user_id, to_user_id } = activeInvite
    if (fp === tp) throw new Error('Раунд не може закінчитись внічию — очки мають відрізнятись.')

    const winnerId = fp > tp ? from_user_id : to_user_id
    const newRounds = [
      ...(activeInvite.rounds || []),
      { round: current_round, from_points: fp, to_points: tp, winner_id: winnerId },
    ]

    const { error } = await supabase
      .from('game_invites')
      .update({ rounds: newRounds, from_points: 0, to_points: 0, current_round: current_round + 1 })
      .eq('id', activeInvite.id)
    if (error) throw error
    await reload()
  }

  async function finishGame() {
    const player1 = { id: activeInvite.from_user_id, name: activeInvite.from_profile.display_name }
    const player2 = { id: activeInvite.to_user_id, name: activeInvite.to_profile.display_name }
    const gameRounds = (activeInvite.rounds || []).map((r) => ({
      player1Points: r.from_points,
      player2Points: r.to_points,
      roundWinnerId: r.winner_id,
    }))

    await saveGame({
      player1,
      player2,
      player1Faction: activeInvite.from_faction,
      player2Faction: activeInvite.to_faction,
      rounds: gameRounds,
      startedAt: activeInvite.game_started_at,
    })

    const { error } = await supabase
      .from('game_invites')
      .update({ status: 'finished' })
      .eq('id', activeInvite.id)
    if (error) throw error
    await reload()
  }

  async function dismiss() {
    const { error } = await supabase.from('game_invites').delete().eq('id', activeInvite.id)
    if (error) throw error
    await reload()
  }

  const value = {
    activeInvite,
    isInvitee,
    opponent,
    myFaction,
    opponentFaction,
    myPoints,
    opponentPoints,
    rounds,
    sendInvite,
    acceptInvite: () => respond('accepted'),
    declineInvite: () => respond('declined'),
    cancelInvite: () => respond('cancelled'),
    setMyFaction,
    setMyPoints,
    finishRound,
    finishGame,
    dismiss,
  }

  return <GameInviteContext.Provider value={value}>{children}</GameInviteContext.Provider>
}

export function useGameInvite() {
  const ctx = useContext(GameInviteContext)
  if (ctx === undefined) throw new Error('useGameInvite must be used within a GameInviteProvider')
  return ctx
}
