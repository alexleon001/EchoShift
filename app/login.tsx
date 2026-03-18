import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from '@/services/auth';
import { NeonBackgroundStatic } from '@/components/Effects/NeonBackgroundStatic';

function translateAuthError(msg?: string): string {
  if (!msg) return 'Algo salió mal';
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'Email o contraseña incorrectos';
  if (lower.includes('email not confirmed')) return 'Confirma tu email antes de iniciar sesión';
  if (lower.includes('user already registered')) return 'Este email ya está registrado';
  if (lower.includes('password') && lower.includes('short')) return 'La contraseña debe tener al menos 6 caracteres';
  if (lower.includes('invalid email')) return 'Email no válido';
  if (lower.includes('network') || lower.includes('fetch')) return 'Error de conexión. Verifica tu internet';
  if (lower.includes('rate limit')) return 'Demasiados intentos. Espera un momento';
  return msg;
}

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleEmailAuth() {
    setErrorMsg('');
    if (!email || !password || (isSignUp && !username)) {
      setErrorMsg('Completa todos los campos');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Ingresa un email válido');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (isSignUp && username.length < 3) {
      setErrorMsg('El username debe tener al menos 3 caracteres');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, username);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setErrorMsg(translateAuthError(err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setErrorMsg('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message ?? 'No se pudo iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <NeonBackgroundStatic />

      <View style={styles.inner}>
        <Animated.Text style={styles.logo} entering={FadeIn.duration(600)}>ECHO</Animated.Text>
        <Animated.Text style={styles.logoSub} entering={FadeIn.delay(200).duration(600)}>SHIFT</Animated.Text>
        <Animated.Text style={styles.tagline} entering={FadeIn.delay(400).duration(600)}>Memoriza. Replica. Domina.</Animated.Text>

        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, !isSignUp && styles.toggleActive]}
            onPress={() => setIsSignUp(false)}
          >
            <Text style={[styles.toggleText, !isSignUp && styles.toggleTextActive]}>
              Iniciar sesión
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, isSignUp && styles.toggleActive]}
            onPress={() => setIsSignUp(true)}
          >
            <Text style={[styles.toggleText, isSignUp && styles.toggleTextActive]}>
              Crear cuenta
            </Text>
          </TouchableOpacity>
        </View>

        {errorMsg !== '' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#444"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#444"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Password"
            placeholderTextColor="#444"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeText}>{showPassword ? '◉' : '◎'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.disabledBtn]}
          onPress={handleEmailAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#07080f" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.googleBtn, loading && styles.disabledBtn]}
          onPress={handleGoogleAuth}
          disabled={loading}
        >
          <Text style={styles.googleBtnText}>Continuar con Google</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07080f',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logo: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 12,
    textShadowColor: 'rgba(255,255,255,0.1)',
    textShadowRadius: 20,
  },
  logoSub: {
    fontSize: 44,
    fontWeight: '900',
    color: COLORS.cyan,
    textAlign: 'center',
    letterSpacing: 12,
    marginTop: -8,
    textShadowColor: COLORS.cyan,
    textShadowRadius: 25,
  },
  tagline: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 36,
    letterSpacing: 3,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: 'rgba(26, 27, 46, 0.8)',
  },
  toggleText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 13,
  },
  toggleTextActive: {
    color: '#fff',
  },
  errorContainer: {
    backgroundColor: 'rgba(247, 37, 133, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(247, 37, 133, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: COLORS.magenta,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: '#fff',
    fontSize: 15,
    marginBottom: 10,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    marginRight: 8,
  },
  eyeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  eyeText: {
    color: '#666',
    fontSize: 18,
  },
  primaryBtn: {
    backgroundColor: COLORS.cyan,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    // @ts-ignore web
    boxShadow: `0 0 20px ${COLORS.cyan}30`,
  },
  primaryBtnText: {
    color: '#07080f',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: '#444',
    marginHorizontal: 16,
    fontSize: 13,
  },
  googleBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: 'rgba(13, 14, 26, 0.7)',
  },
  googleBtnText: {
    color: '#ccc',
    fontWeight: '600',
    fontSize: 15,
  },
});
