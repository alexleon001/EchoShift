import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { COLORS } from '@/constants/theme';

interface HowToPlayProps {
  visible: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: '👀',
    title: 'OBSERVA',
    description: 'Las celdas se iluminan en secuencia. Memoriza el orden y los colores.',
    color: COLORS.yellow,
  },
  {
    icon: '👆',
    title: 'REPLICA',
    description: 'Toca las celdas en el mismo orden. Pistas sutiles te guiarán al inicio.',
    color: COLORS.cyan,
  },
  {
    icon: '🔥',
    title: 'COMBO',
    description: 'Acierta seguido para multiplicar tu puntaje. Responde rápido para más puntos.',
    color: COLORS.magenta,
  },
  {
    icon: '📈',
    title: 'EVOLUCIONA',
    description: 'Cada ronda sube la dificultad: más celdas, más rápido, más colores.',
    color: COLORS.violet,
  },
];

const MODES_INFO = [
  { icon: '∞', name: 'ENDLESS', desc: 'Sin límite de tiempo. 3 errores seguidos = fin.', color: COLORS.cyan },
  { icon: '⚡', name: 'BLITZ', desc: '60 segundos. Máximo puntaje posible.', color: COLORS.yellow },
  { icon: '◆', name: 'DAILY', desc: 'Un patrón diario. Todos juegan lo mismo.', color: COLORS.magenta },
];

export function HowToPlay({ visible, onClose }: HowToPlayProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>COMO JUGAR</Text>

            {STEPS.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNumber, { borderColor: step.color }]}>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: step.color }]}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.description}</Text>
                </View>
              </View>
            ))}

            <Text style={styles.modesTitle}>MODOS DE JUEGO</Text>
            {MODES_INFO.map((m, i) => (
              <View key={i} style={styles.modeRow}>
                <Text style={[styles.modeIcon, { color: m.color }]}>{m.icon}</Text>
                <View style={styles.modeContent}>
                  <Text style={[styles.modeName, { color: m.color }]}>{m.name}</Text>
                  <Text style={styles.modeDesc}>{m.desc}</Text>
                </View>
              </View>
            ))}

            <Text style={styles.tip}>
              Tip: Las celdas del patrón muestran un brillo sutil durante la fase de réplica. Busca las pistas!
            </Text>
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>ENTENDIDO</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 8, 15, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'rgba(13, 14, 26, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  scroll: {
    padding: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.cyan,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: COLORS.cyan,
    textShadowRadius: 10,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 18,
    gap: 14,
  },
  stepNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    backgroundColor: 'rgba(26, 27, 46, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: {
    fontSize: 20,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
  },
  stepDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 3,
    lineHeight: 17,
  },
  modesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#444',
    letterSpacing: 3,
    marginTop: 12,
    marginBottom: 14,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  modeIcon: {
    fontSize: 20,
    width: 30,
    textAlign: 'center',
  },
  modeContent: {
    flex: 1,
  },
  modeName: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
  },
  modeDesc: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  tip: {
    fontSize: 11,
    color: COLORS.yellow,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  closeBtn: {
    backgroundColor: COLORS.cyan,
    paddingVertical: 14,
    alignItems: 'center',
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  closeBtnText: {
    color: '#07080f',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 2,
  },
});
