/**
 * Friends Service — Search, add, accept/reject, and list friends.
 */

import { supabase } from './supabase';

export interface FriendProfile {
  id: string;
  username: string;
  rank: string;
  total_xp: number;
  games_played: number;
}

export interface FriendRequest {
  id: string;
  requester: FriendProfile;
  created_at: string;
}

/** Search players by username (partial match) */
export async function searchPlayers(query: string, currentUserId: string): Promise<FriendProfile[]> {
  if (!query || query.length < 2) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, rank, total_xp, games_played')
    .ilike('username', `%${query}%`)
    .neq('id', currentUserId)
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

/** Send a friend request */
export async function sendFriendRequest(requesterId: string, addresseeId: string): Promise<void> {
  const { error } = await supabase.from('friendships').insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: 'pending',
  });

  if (error) {
    if (error.code === '23505') throw new Error('Ya enviaste una solicitud');
    throw error;
  }
}

/** Accept a friend request */
export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId);

  if (error) throw error;
}

/** Reject a friend request */
export async function rejectFriendRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'rejected' })
    .eq('id', friendshipId);

  if (error) throw error;
}

/** Remove a friend */
export async function removeFriend(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);

  if (error) throw error;
}

/** Get accepted friends list */
export async function getFriends(userId: string): Promise<FriendProfile[]> {
  // Get friendships where I'm requester
  const { data: asRequester } = await supabase
    .from('friendships')
    .select('addressee_id, profiles!friendships_addressee_id_fkey(id, username, rank, total_xp, games_played)')
    .eq('requester_id', userId)
    .eq('status', 'accepted');

  // Get friendships where I'm addressee
  const { data: asAddressee } = await supabase
    .from('friendships')
    .select('requester_id, profiles!friendships_requester_id_fkey(id, username, rank, total_xp, games_played)')
    .eq('addressee_id', userId)
    .eq('status', 'accepted');

  const friends: FriendProfile[] = [];

  if (asRequester) {
    for (const row of asRequester) {
      const profile = (row as any).profiles;
      if (profile) friends.push(profile);
    }
  }

  if (asAddressee) {
    for (const row of asAddressee) {
      const profile = (row as any).profiles;
      if (profile) friends.push(profile);
    }
  }

  return friends;
}

/** Get pending friend requests (received) */
export async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('id, created_at, profiles!friendships_requester_id_fkey(id, username, rank, total_xp, games_played)')
    .eq('addressee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    requester: (row as any).profiles as FriendProfile,
    created_at: row.created_at,
  }));
}

/** Get friend IDs for leaderboard filtering */
export async function getFriendIds(userId: string): Promise<string[]> {
  const friends = await getFriends(userId);
  return [userId, ...friends.map((f) => f.id)];
}

/** Get friends leaderboard (scores from friends only) */
export async function getFriendsLeaderboard(userId: string, mode: string, limit = 20) {
  const friendIds = await getFriendIds(userId);

  const { data, error } = await supabase
    .from('scores')
    .select('score, max_combo, cells_hit, created_at, player_id, profiles(username)')
    .eq('mode', mode)
    .in('player_id', friendIds)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
