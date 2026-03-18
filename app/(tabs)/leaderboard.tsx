import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { getLeaderboard } from '@/services/supabase';
import { getFriendsLeaderboard } from '@/services/friends';
import { usePlayerStore } from '@/store/playerStore';
import { NeonBackgroundStatic } from '@/components/Effects/NeonBackgroundStatic';
import { FriendsPanel } from '@/components/Social/FriendsPanel';
import type { GameMode } from '@/types/database';

const MODES: { key: GameMode; label: string; color: string }[] = [
  { key: 'endless', label: 'Endless', color: COLORS.cyan },
  { key: 'blitz', label: 'Blitz', color: COLORS.yellow },
  { key: 'daily', label: 'Daily', color: COLORS.magenta },
];

const MEDAL_COLORS = [COLORS.yellow, '#c0c0c0', '#cd7f32'];

export default function LeaderboardScreen() {
  const [selectedMode, setSelectedMode] = useState<GameMode>('endless');
  const [scope, setScope] = useState<'global' | 'friends'>('global');
  const [showFriends, setShowFriends] = useState(false);
  const router = useRouter();
  const activeMode = MODES.find((m) => m.key === selectedMode)!;
  const currentUsername = usePlayerStore((s) => s.username);
  const userId = usePlayerStore((s) => s.id);

  const { data: entries = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leaderboard', selectedMode, scope, userId],
    queryFn: () =>
      scope === 'friends' && userId
        ? getFriendsLeaderboard(userId, selectedMode, 20)
        : getLeaderboard(selectedMode, 20),
    staleTime: 30_000,
  });

  return (
    <View style={styles.container}>
      <NeonBackgroundStatic />

      <View style={styles.headerRow}>
        <Text style={styles.title}>RANKING</Text>
        <Pressable style={styles.friendsBtn} onPress={() => setShowFriends(true)}>
          <Text style={styles.friendsBtnText}>AMIGOS</Text>
        </Pressable>
      </View>

      {/* Scope toggle: Global / Amigos */}
      <View style={styles.scopeRow}>
        <Pressable
          style={[styles.scopeBtn, scope === 'global' && styles.scopeBtnActive]}
          onPress={() => setScope('global')}
        >
          <Text style={[styles.scopeText, scope === 'global' && { color: COLORS.cyan }]}>GLOBAL</Text>
        </Pressable>
        <Pressable
          style={[styles.scopeBtn, scope === 'friends' && styles.scopeBtnActive]}
          onPress={() => setScope('friends')}
        >
          <Text style={[styles.scopeText, scope === 'friends' && { color: COLORS.cyan }]}>AMIGOS</Text>
        </Pressable>
      </View>

      {/* Mode selector */}
      <View style={styles.modeRow}>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.modeBtn, selectedMode === m.key && { backgroundColor: 'rgba(26, 27, 46, 0.8)' }]}
            onPress={() => setSelectedMode(m.key)}
          >
            <Text style={[
              styles.modeText,
              selectedMode === m.key && { color: m.color },
            ]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={activeMode.color} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>◇</Text>
          <Text style={styles.emptyText}>
            {scope === 'friends' ? 'Sin amigos con puntajes' : 'Sin puntajes aún'}
          </Text>
          <Text style={styles.emptySubtext}>
            {scope === 'friends' ? 'Agrega amigos para competir' : `Sé el primero en jugar ${activeMode.label}!`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(_, index) => String(index)}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={activeMode.color}
              colors={[activeMode.color]}
            />
          }
          renderItem={({ item, index }) => {
            const username = (item.profiles as any)?.username ?? 'Anónimo';
            const playerId = (item as any).player_id as string | undefined;
            const isTop3 = index < 3;
            const isMe = username === currentUsername && currentUsername !== '';
            return (
              <Pressable
                style={[styles.row, isTop3 && styles.rowTop, isMe && styles.rowMe]}
                onPress={() => playerId && !isMe && router.push(`/profile/${playerId}`)}
              >
                <View style={[
                  styles.rankBadge,
                  isTop3 && { backgroundColor: `${MEDAL_COLORS[index]}20`, borderColor: MEDAL_COLORS[index] },
                ]}>
                  <Text style={[
                    styles.rank,
                    isTop3 && { color: MEDAL_COLORS[index] },
                  ]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.username, isMe && styles.usernameMe]}>
                    {username}{isMe ? ' (tú)' : ''}
                  </Text>
                  <Text style={styles.comboLabel}>x{item.max_combo} combo</Text>
                </View>
                <Text style={[styles.score, { color: activeMode.color }]}>
                  {item.score.toLocaleString()}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      <FriendsPanel visible={showFriends} onClose={() => { setShowFriends(false); refetch(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07080f',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 4,
    textShadowColor: COLORS.cyan,
    textShadowRadius: 10,
  },
  friendsBtn: {
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  friendsBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.cyan,
    letterSpacing: 2,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  scopeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scopeBtnActive: {
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  scopeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 2,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 14, 26, 0.7)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 27, 46, 0.5)',
  },
  rowTop: {
    backgroundColor: 'rgba(13, 14, 26, 0.4)',
    borderRadius: 10,
    marginBottom: 4,
    borderBottomWidth: 0,
    paddingHorizontal: 10,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 27, 46, 0.6)',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rank: {
    fontSize: 14,
    fontWeight: '800',
    color: '#666',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  comboLabel: {
    fontSize: 10,
    color: '#555',
    marginTop: 1,
  },
  score: {
    fontSize: 16,
    fontWeight: '800',
  },
  rowMe: {
    backgroundColor: 'rgba(0, 245, 212, 0.06)',
    borderRadius: 10,
    borderBottomWidth: 0,
    paddingHorizontal: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.15)',
  },
  usernameMe: {
    color: COLORS.cyan,
  },
});
