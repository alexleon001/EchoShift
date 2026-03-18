/**
 * Public Profile Screen — view another player's stats and ranking.
 * Route: /profile/[id]
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';
import { NeonBackgroundStatic } from '@/components/Effects/NeonBackgroundStatic';
import { supabase } from '@/services/supabase';
import { usePlayerStore } from '@/store/playerStore';
import { sendFriendRequest, getFriends, type FriendProfile } from '@/services/friends';

const RANK_COLORS: Record<string, string> = {
  Bronce: '#cd7f32',
  Plata: '#c0c0c0',
  Oro: '#ffd700',
  Platino: '#e5e4e2',
  Diamante: '#b9f2ff',
};

interface ProfileData {
  id: string;
  username: string;
  rank: string;
  total_xp: number;
  echoes: number;
  games_played: number;
  created_at: string;
}

interface ScoreEntry {
  mode: string;
  score: number;
  max_combo: number;
  created_at: string;
}

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const myId = usePlayerStore((s) => s.id);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [topScores, setTopScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [friendStatus, setFriendStatus] = useState<'none' | 'friend' | 'pending' | 'sending'>('none');

  useEffect(() => {
    if (!id) return;
    loadProfile();
  }, [id]);

  async function loadProfile() {
    setLoading(true);
    try {
      // Fetch profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, username, rank, total_xp, echoes, games_played, created_at')
        .eq('id', id!)
        .single();

      if (prof) setProfile(prof);

      // Fetch top scores (best per mode)
      const { data: scores } = await supabase
        .from('scores')
        .select('mode, score, max_combo, created_at')
        .eq('player_id', id!)
        .order('score', { ascending: false })
        .limit(20);

      if (scores) {
        // Get best score per mode
        const bestByMode = new Map<string, ScoreEntry>();
        for (const s of scores) {
          if (!bestByMode.has(s.mode) || s.score > bestByMode.get(s.mode)!.score) {
            bestByMode.set(s.mode, s);
          }
        }
        setTopScores(Array.from(bestByMode.values()));
      }

      // Check friendship status
      if (myId && myId !== id) {
        const friends = await getFriends(myId);
        if (friends.some((f) => f.id === id)) {
          setFriendStatus('friend');
          setIsFriend(true);
        }
      }
    } catch {}
    setLoading(false);
  }

  const handleAddFriend = async () => {
    if (!myId || !id) return;
    setFriendStatus('sending');
    try {
      await sendFriendRequest(myId, id);
      setFriendStatus('pending');
    } catch {
      setFriendStatus('none');
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const isMe = myId === id;
  const rankColor = RANK_COLORS[profile?.rank ?? 'Bronce'] ?? COLORS.yellow;
  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString('es', { year: 'numeric', month: 'short' })
    : '';

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'blitz': return COLORS.yellow;
      case 'daily': return COLORS.magenta;
      case 'duo': return COLORS.magenta;
      default: return COLORS.cyan;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <NeonBackgroundStatic />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <NeonBackgroundStatic />
        <View style={styles.center}>
          <Text style={styles.errorText}>Jugador no encontrado</Text>
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>VOLVER</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NeonBackgroundStatic />

      <Pressable style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backText}>{'<'}</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile header */}
        <Animated.View style={styles.profileCard} entering={FadeInDown.duration(400)}>
          <View style={[styles.avatar, { borderColor: rankColor }]}>
            <Text style={[styles.avatarText, { color: rankColor }]}>
              {profile.username[0]?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>{profile.username}</Text>
          <View style={[styles.rankBadge, { borderColor: rankColor }]}>
            <Text style={[styles.rankText, { color: rankColor }]}>{profile.rank}</Text>
          </View>
          <Text style={styles.memberSince}>Miembro desde {memberSince}</Text>

          {/* Add friend button */}
          {!isMe && friendStatus === 'none' && (
            <Pressable style={styles.addFriendBtn} onPress={handleAddFriend}>
              <Text style={styles.addFriendText}>AGREGAR AMIGO</Text>
            </Pressable>
          )}
          {friendStatus === 'pending' && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>SOLICITUD ENVIADA</Text>
            </View>
          )}
          {friendStatus === 'friend' && (
            <View style={styles.friendBadge}>
              <Text style={styles.friendText}>AMIGOS</Text>
            </View>
          )}
        </Animated.View>

        {/* Stats */}
        <Animated.View style={styles.statsRow} entering={FadeIn.delay(200).duration(300)}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.total_xp.toLocaleString()}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: COLORS.violet }]}>
              {profile.games_played}
            </Text>
            <Text style={styles.statLabel}>PARTIDAS</Text>
          </View>
        </Animated.View>

        {/* Best scores */}
        {topScores.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>MEJORES PUNTAJES</Text>
            <Animated.View style={styles.scoresContainer} entering={FadeIn.delay(300).duration(300)}>
              {topScores.map((s) => (
                <View key={s.mode} style={styles.scoreRow}>
                  <Text style={[styles.scoreMode, { color: getModeColor(s.mode) }]}>
                    {s.mode.toUpperCase()}
                  </Text>
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreValue}>{s.score.toLocaleString()}</Text>
                    <Text style={styles.scoreCombo}>x{s.max_combo} combo</Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07080f',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: COLORS.cyan,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#07080f',
    letterSpacing: 2,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 27, 46, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#888',
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  profileCard: {
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    backgroundColor: 'rgba(26, 27, 46, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '900',
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  rankBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 3,
    marginBottom: 8,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  memberSince: {
    fontSize: 10,
    color: '#444',
    letterSpacing: 1,
  },
  addFriendBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  addFriendText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 2,
  },
  pendingBadge: {
    marginTop: 14,
    backgroundColor: 'rgba(255, 209, 102, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.3)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.yellow,
    letterSpacing: 2,
  },
  friendBadge: {
    marginTop: 14,
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  friendText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.cyan,
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(13, 14, 26, 0.7)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 9,
    color: '#555',
    marginTop: 4,
    letterSpacing: 2,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#444',
    letterSpacing: 3,
    marginBottom: 10,
  },
  scoresContainer: {
    backgroundColor: 'rgba(13, 14, 26, 0.7)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 27, 46, 0.5)',
  },
  scoreMode: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    width: 70,
  },
  scoreInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  scoreCombo: {
    fontSize: 10,
    color: '#555',
    marginTop: 2,
  },
});
