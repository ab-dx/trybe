import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../lib/auth/AuthContext';

interface LoginScreenProps {
  onNavigateToSignup: () => void;
}

const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  return null;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToSignup }) => {
  const { login, error, clearError, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async () => {
    clearError();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const newErrors: Record<string, string> = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setIsLoading(true);
    try { await login(email, password); } catch { } finally { setIsLoading(false); }
  };

  const handleForgotPassword = async () => {
    const emailError = validateEmail(resetEmail);
    if (emailError) { Alert.alert('Error', emailError); return; }
    setIsLoading(true);
    try { await resetPassword(resetEmail); setResetSent(true); } catch { } finally { setIsLoading(false); }
  };

  if (showForgotPassword) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {resetSent ? 'Check your email for reset instructions' : 'Enter your email to receive reset instructions'}
        </Text>
        {!resetSent ? (
          <>
            <View style={styles.inputContainer}>
              <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="Email" placeholderTextColor="#7e766e" value={resetEmail} onChangeText={setResetEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />
            </View>
            <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleForgotPassword} disabled={isLoading}>
              <Text style={styles.buttonText}>{isLoading ? 'Sending...' : 'Send Reset Link'}</Text>
            </TouchableOpacity>
          </>
        ) : null}
        <TouchableOpacity style={styles.backButton} onPress={() => { setShowForgotPassword(false); setResetSent(false); setResetEmail(''); clearError(); }}>
          <Text style={styles.linkText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{error.message}</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="Email" placeholderTextColor="#7e766e" value={email} onChangeText={(text) => { setEmail(text); if (errors.email) setErrors((prev) => ({ ...prev, email: '' })); clearError(); }} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <TextInput style={[styles.input, errors.password && styles.inputError]} placeholder="Password" placeholderTextColor="#7e766e" value={password} onChangeText={(text) => { setPassword(text); if (errors.password) setErrors((prev) => ({ ...prev, password: '' })); clearError(); }} secureTextEntry />
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
      </View>

      <TouchableOpacity style={styles.forgotPassword} onPress={() => setShowForgotPassword(true)}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading}>
        <Text style={styles.buttonText}>{isLoading ? 'Signing In...' : 'Login'}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don&apos;t have an account? </Text>
        <TouchableOpacity onPress={onNavigateToSignup}>
          <Text style={styles.linkText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D8CFC0', padding: 24 },
  title: { fontSize: 32, fontWeight: '600', color: '#221d18', marginBottom: 8, fontFamily: 'PlusJakartaSans_600SemiBold' },
  subtitle: { fontSize: 16, color: '#526168', marginBottom: 32, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  errorContainer: { backgroundColor: '#ffdad6', borderWidth: 1, borderColor: '#ba1a1a', borderRadius: 8, padding: 12, width: '100%', marginBottom: 16 },
  errorMessage: { color: '#93000a', fontSize: 14, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  inputContainer: { width: '100%', marginBottom: 16 },
  input: { backgroundColor: '#E2DACF', borderRadius: 12, padding: 16, fontSize: 16, color: '#221d18', borderWidth: 1.5, borderColor: 'rgba(82,97,104,0.2)', fontFamily: 'Inter_400Regular' },
  inputError: { borderColor: '#ba1a1a' },
  errorText: { color: '#ba1a1a', fontSize: 12, marginTop: 4, marginLeft: 4, fontFamily: 'Inter_400Regular' },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotPasswordText: { color: '#c79152', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  button: { backgroundColor: '#221d18', borderRadius: 12, padding: 16, width: '100%', alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#D8CFC0', fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  backButton: { marginTop: 24 },
  footer: { flexDirection: 'row', marginTop: 24 },
  footerText: { color: '#526168', fontSize: 14, fontFamily: 'Inter_400Regular' },
  linkText: { color: '#c79152', fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
