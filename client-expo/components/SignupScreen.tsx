import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../lib/auth/AuthContext';

interface SignupScreenProps {
  onNavigateToLogin: () => void;
}

const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};

const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

export const SignupScreen: React.FC<SignupScreenProps> = ({ onNavigateToLogin }) => {
  const { signup, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignup = async () => {
    clearError();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(password, confirmPassword);
    const newErrors: Record<string, string> = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    if (confirmError) newErrors.confirmPassword = confirmError;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setIsLoading(true);
    try { await signup(email, password); } catch { } finally { setIsLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>

      <View style={styles.inputContainer}>
        <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="Email" placeholderTextColor="#7e766e" value={email} onChangeText={(text) => { setEmail(text); if (errors.email) setErrors((prev) => ({ ...prev, email: '' })); }} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <TextInput style={[styles.input, errors.password && styles.inputError]} placeholder="Password" placeholderTextColor="#7e766e" value={password} onChangeText={(text) => { setPassword(text); if (errors.password) setErrors((prev) => ({ ...prev, password: '' })); }} secureTextEntry />
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <TextInput style={[styles.input, errors.confirmPassword && styles.inputError]} placeholder="Confirm Password" placeholderTextColor="#7e766e" value={confirmPassword} onChangeText={(text) => { setConfirmPassword(text); if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' })); }} secureTextEntry />
        {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
      </View>

      <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSignup} disabled={isLoading}>
        <Text style={styles.buttonText}>{isLoading ? 'Creating Account...' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={onNavigateToLogin}>
          <Text style={styles.linkText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D8CFC0', padding: 24 },
  title: { fontSize: 32, fontWeight: '600', color: '#221d18', marginBottom: 8, fontFamily: 'PlusJakartaSans_600SemiBold' },
  subtitle: { fontSize: 16, color: '#526168', marginBottom: 48, fontFamily: 'Inter_400Regular' },
  inputContainer: { width: '100%', marginBottom: 16 },
  input: { backgroundColor: '#E2DACF', borderRadius: 12, padding: 16, fontSize: 16, color: '#221d18', borderWidth: 1.5, borderColor: 'rgba(82,97,104,0.2)', fontFamily: 'Inter_400Regular' },
  inputError: { borderColor: '#ba1a1a' },
  errorText: { color: '#ba1a1a', fontSize: 12, marginTop: 4, marginLeft: 4, fontFamily: 'Inter_400Regular' },
  button: { backgroundColor: '#221d18', borderRadius: 12, padding: 16, width: '100%', alignItems: 'center', marginTop: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#D8CFC0', fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  footer: { flexDirection: 'row', marginTop: 24 },
  footerText: { color: '#526168', fontSize: 14, fontFamily: 'Inter_400Regular' },
  linkText: { color: '#c79152', fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
