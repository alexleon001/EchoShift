import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, ActivityIndicator, Modal } from 'react-native';
import { COLORS } from '@/constants/theme';
import { usePlayerStore } from '@/store/playerStore';
import {
  searchPlayers,
  sendFriendRequest,
  getFriends,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  type FriendProfile,
  type FriendRequest,
} from '@/services/friends';

interface FriendsPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function FriendsPanel({ visible, onClose }: FriendsPanelProps) {
  const userId = usePlayerStore((s) => s.id);
  const [tab, setTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [f, r] = await Promise.all([getFriends(userId), getPendingRequests(userId)]);
      setFriends(f);
      setRequests(r);
    } catch {}
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (visible) loadData();
  }, [visible, loadData]);

  const handleSearch = async () => {
    if (!userId || searchQuery.length < 2) return;
    setLoading(true);
    try {
      const results = await searchPlayers(searchQuery, userId);
      const friendIds = new Set(friends.map((f) => f.id));
      setSearchResults(results.filter((r) => !friendIds.has(r.id)));
    } catch {}
    setLoading(false);
  };

  const handleSendRequest = async (targetId: string) => {
    if (!userId) return;
    try {
      await sendFriendRequest(userId, targetId);
      setFeedback('Solicitud enviada');
      setSearchResults((prev) => prev.filter((r) => r.id !== targetId));
      setTimeout(() => setFeedback(''), 2000);
    } catch (err: any) {
      setFeedback(err.message || 'Error');
      setTimeout(() => setFeedback(''), 2000);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      loadData();
    } catch {}
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>AMIGOS</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>

          {/* Feedback */}
          {feedback !== '' && <Text style={styles.feedback}>{feedback}</Text>}

          {/* Tab selector */}
          <View style={styles.tabs}>
            <Pressable style={[styles.tab, tab === 'friends' && styles.tabActive]} onPress={() => setTab('friends')}>
              <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>
                Amigos ({friends.length})
              </Text>
            </Pressable>
            <Pressable style={[styles.tab, tab === 'requests' && styles.tabActive]} onPress={() => setTab('requests')}>
              <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>
                Solicitudes {requests.length > 0 ? `(${requests.length})` : ''}
              </Text>
            </Pressable>
            <Pressable style={[styles.tab, tab === 'search' && styles.tabActive]} onPress={() => setTab('search')}>
              <Text style={[styles.tabText, tab === 'search' && styles.tabTextActive]}>Buscar</Text>
            </Pressable>
          </View>

          {/* Content */}
          {loading && (
            <View style={styles.center}>
              <ActivityIndicator color={COLORS.cyan} size="large" />
            </View>
          )}

          {!loading && tab === 'friends' && (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.emptyText}>Sin amigos aún</Text>
                  <Text style={styles.emptyHint}>Busca jugadores por nombre</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.meta}>{item.rank} · {item.total_xp.toLocaleString()} XP</Text>
                  </View>
                </View>
              )}
            />
          )}

          {!loading && tab === 'requests' && (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.emptyText}>Sin solicitudes pendientes</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.requester.username[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.username}>{item.requester.username}</Text>
                    <Text style={styles.meta}>{item.requester.rank}</Text>
                  </View>
                  <Pressable style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
                    <Text style={styles.acceptText}>✓</Text>
                  </Pressable>
                  <Pressable style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                    <Text style={styles.rejectText}>✕</Text>
                  </Pressable>
                </View>
              )}
            />
          )}

          {!loading && tab === 'search' && (
            <View style={styles.searchContainer}>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar por nombre..."
                  placeholderTextColor="#555"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable style={styles.searchBtn} onPress={handleSearch}>
                  <Text style={styles.searchBtnText}>BUSCAR</Text>
                </Pressable>
              </View>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  searchQuery.length >= 2 ? (
                    <View style={styles.center}>
                      <Text style={styles.emptyText}>Sin resultados</Text>
                    </View>
                  ) : null
                }
                renderItem={({ item }) => (
                  <View style={styles.row}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.username}>{item.username}</Text>
                      <Text style={styles.meta}>{item.rank} · {item.games_played} partidas</Text>
                    </View>
                    <Pressable style={styles.addBtn} onPress={() => handleSendRequest(item.id)}>
                      <Text style={styles.addText}>+</Text>
                    </Pressable>
                  </View>
                )}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 8, 15, 0.95)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#0d0e1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.border,
    maxHeight: '80%',
    minHeight: '60%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.cyan,
    letterSpacing: 4,
  },
  closeBtn: {
    fontSize: 18,
    color: '#666',
    padding: 4,
  },
  feedback: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.yellow,
    textAlign: 'center',
    marginBottom: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 27, 46, 0.5)',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(26, 27, 46, 0.8)',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
  },
  tabTextActive: {
    color: COLORS.cyan,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 11,
    color: '#333',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 27, 46, 0.4)',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(26, 27, 46, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  info: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  meta: {
    fontSize: 10,
    color: '#555',
    marginTop: 2,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 245, 212, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  acceptBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 245, 212, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    fontSize: 16,
    color: COLORS.cyan,
    fontWeight: '800',
  },
  rejectBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(247, 37, 133, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: {
    fontSize: 14,
    color: COLORS.magenta,
    fontWeight: '800',
  },
  searchContainer: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(26, 27, 46, 0.6)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    color: '#fff',
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: COLORS.cyan,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  searchBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#07080f',
    letterSpacing: 1,
  },
});
