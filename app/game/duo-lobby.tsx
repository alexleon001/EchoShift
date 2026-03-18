import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';
import { NeonBackgroundStatic } from '@/components/Effects/NeonBackgroundStatic';
import { usePlayerStore } from '@/store/playerStore';
import { useDuoStore } from '@/store/duoStore';
import {
  connectDuo,
  createRoom,
  joinRoom,
  leaveDuo,
  type ServerMessage,
} from '@/services/duoSocket';
import { shareDuoRoom } from '@/services/sharing';

export default function DuoLobbyScreen() {
  const router = useRouter();
  const userId = usePlayerStore((s) => s.id);
  const username = usePlayerStore((s) => s.username);
  const [joinCode, setJoinCode] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'waiting' | 'joining' | 'starting'>('idle');
  const [opponentName, setOpponentName] = useState('');
  const [error, setError] = useState('');
  const setDuoState = useDuoStore((s) => s.setState);

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'roomCreated':
        setRoomCode(msg.code);
        setStatus('waiting');
        break;
      case 'playerJoined':
        setOpponentName(msg.username);
        setStatus('starting');
        // Navigate to duo game after short delay
        setTimeout(() => {
          setDuoState({ connected: true, opponentName: msg.username, roomCode: roomCode || joinCode.toUpperCase() });
          router.replace('/game/duo-match');
        }, 1500);
        break;
      case 'error':
        setError(msg.message);
        setStatus('idle');
        setTimeout(() => setError(''), 3000);
        break;
      case 'opponentLeft':
        setError('El oponente se desconectó');
        setStatus('idle');
        setTimeout(() => setError(''), 3000);
        break;
    }
  }, [roomCode, joinCode, router, setDuoState]);

  const handleCreate = async () => {
    if (!userId || !username) return;
    setStatus('connecting');
    setError('');
    try {
      await connectDuo(handleMessage);
      createRoom(userId, username);
    } catch {
      setError('No se pudo conectar al servidor');
      setStatus('idle');
    }
  };

  const handleJoin = async () => {
    if (!userId || !username || joinCode.length < 4) return;
    setStatus('joining');
    setError('');
    try {
      await connectDuo(handleMessage);
      joinRoom(joinCode, userId, username);
    } catch {
      setError('No se pudo conectar al servidor');
      setStatus('idle');
    }
  };

  const handleBack = () => {
    leaveDuo();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  useEffect(() => {
    return () => { leaveDuo(); };
  }, []);

  return (
    <View style={styles.container}>
      <NeonBackgroundStatic />

      <Pressable style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backText}>{'<'}</Text>
      </Pressable>

      <Animated.Text style={styles.title} entering={FadeIn.duration(500)}>
        MODO DUO
      </Animated.Text>
      <Text style={styles.subtitle}>1 vs 1 en tiempo real</Text>

      {error !== '' && (
        <Animated.Text style={styles.error} entering={FadeIn.duration(200)}>
          {error}
        </Animated.Text>
      )}

      {status === 'idle' && (
        <Animated.View style={styles.options} entering={FadeInDown.delay(200).duration(400)}>
          {/* Create room */}
          <Pressable style={styles.createBtn} onPress={handleCreate}>
            <Text style={styles.createBtnText}>CREAR SALA</Text>
            <Text style={styles.createBtnSub}>Genera un código para tu amigo</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ó</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Join room */}
          <Text style={styles.joinLabel}>UNIRSE A SALA</Text>
          <View style={styles.joinRow}>
            <TextInput
              style={styles.codeInput}
              placeholder="CÓDIGO"
              placeholderTextColor="#555"
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Pressable
              style={[styles.joinBtn, joinCode.length < 4 && styles.joinBtnDisabled]}
              onPress={handleJoin}
              disabled={joinCode.length < 4}
            >
              <Text style={styles.joinBtnText}>UNIRSE</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {status === 'connecting' && (
        <View style={styles.statusBox}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
          <Text style={styles.statusText}>Conectando...</Text>
        </View>
      )}

      {status === 'waiting' && (
        <Animated.View style={styles.statusBox} entering={FadeIn.duration(300)}>
          <Text style={styles.codeDisplay}>{roomCode}</Text>
          <Text style={styles.codeHint}>Comparte este código con tu amigo</Text>
          <Pressable
            style={styles.shareRoomBtn}
            onPress={() => shareDuoRoom(roomCode)}
          >
            <Text style={styles.shareRoomText}>COMPARTIR SALA</Text>
          </Pressable>
          <ActivityIndicator size="small" color={COLORS.cyan} style={{ marginTop: 20 }} />
          <Text style={styles.statusText}>Esperando oponente...</Text>
        </Animated.View>
      )}

      {status === 'joining' && (
        <View style={styles.statusBox}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
          <Text style={styles.statusText}>Uniéndose a la sala...</Text>
        </View>
      )}

      {status === 'starting' && (
        <Animated.View style={styles.statusBox} entering={FadeIn.duration(300)}>
          <Text style={styles.matchFound}>PARTIDA ENCONTRADA</Text>
          <Text style={styles.opponentName}>vs {opponentName}</Text>
          <ActivityIndicator size="small" color={COLORS.magenta} style={{ marginTop: 16 }} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07080f',
    paddingHorizontal: 24,
    paddingTop: 60,
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
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.magenta,
    letterSpacing: 6,
    textShadowColor: COLORS.magenta,
    textShadowRadius: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 6,
    marginBottom: 32,
    textAlign: 'center',
  },
  error: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.magenta,
    textAlign: 'center',
    marginBottom: 12,
  },
  options: {
    width: '100%',
  },
  createBtn: {
    backgroundColor: 'rgba(247, 37, 133, 0.12)',
    borderWidth: 1.5,
    borderColor: COLORS.magenta,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.magenta,
    letterSpacing: 3,
  },
  createBtnSub: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1a1b2e',
  },
  dividerText: {
    fontSize: 13,
    color: '#555',
    marginHorizontal: 16,
    fontWeight: '600',
  },
  joinLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 2,
    marginBottom: 10,
  },
  joinRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  codeInput: {
    flex: 1,
    minWidth: 0,
    height: 48,
    backgroundColor: 'rgba(26, 27, 46, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
  },
  joinBtn: {
    backgroundColor: COLORS.cyan,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    flexShrink: 0,
  },
  joinBtnDisabled: {
    opacity: 0.4,
  },
  joinBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#07080f',
    letterSpacing: 2,
  },
  shareRoomBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  shareRoomText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 2,
  },
  statusBox: {
    alignItems: 'center',
    marginTop: 40,
  },
  statusText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginTop: 12,
  },
  codeDisplay: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.cyan,
    letterSpacing: 10,
    textShadowColor: COLORS.cyan,
    textShadowRadius: 20,
  },
  codeHint: {
    fontSize: 12,
    color: '#555',
    marginTop: 8,
  },
  matchFound: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.magenta,
    letterSpacing: 4,
    textShadowColor: COLORS.magenta,
    textShadowRadius: 15,
  },
  opponentName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
  },
});
