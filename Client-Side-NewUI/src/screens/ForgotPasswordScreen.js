import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { AUTH_API_BASE_URL } from '../config/api';
import { fontSizes } from '../constants/theme';

const COLORS = {
  primary: '#F96E2A',
  accent: '#4A90E2',
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#1F2937',
  muted: '#6B7280',
  error: '#EF4444',
  success: '#10B981',
  border: '#E5E7EB',
  inputBg: '#F5F5F5',
};

const ForgotPasswordScreen = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const navigation = useNavigation();
  const inputRefs = useRef([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 2) {
      setCanResend(true);
    }
  }, [countdown, step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Step 1: Request password reset OTP
  const handleRequestReset = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!validateEmail(email)) {
      setErrors({ email: 'Enter a valid email' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${AUTH_API_BASE_URL}/forgot-password`, {
        email: email.trim().toLowerCase(),
      }, { timeout: 15000 });

      if (response.data.success) {
        Alert.alert('Success', 'A password reset code has been sent to your email.');
        setStep(2);
        setCountdown(120); // 2 minutes countdown
        setCanResend(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset code. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Resend OTP for password reset
  const handleResendOTP = async () => {
    if (!canResend) return;

    setResendLoading(true);
    try {
      const response = await axios.post(`${AUTH_API_BASE_URL}/forgot-password`, {
        email: email.trim().toLowerCase(),
      }, { timeout: 15000 });

      if (response.data.success) {
        Alert.alert('Success', 'A new reset code has been sent to your email.');
        setCountdown(120);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend code. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${AUTH_API_BASE_URL}/verify-reset-otp`, {
        email: email.trim().toLowerCase(),
        otp: otpCode,
      }, { timeout: 15000 });

      if (response.data.success) {
        setStep(3);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Invalid OTP. Please try again.';
      Alert.alert('Error', errorMessage);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    const validationErrors = {};

    if (!newPassword) {
      validationErrors.newPassword = 'Password is required';
    } else if (newPassword.length < 8) {
      validationErrors.newPassword = 'Password must be at least 8 characters';
    } else {
      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasLowerCase = /[a-z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);

      if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        validationErrors.newPassword = 'Password must contain uppercase, lowercase, and numbers';
      }
    }

    if (!confirmPassword) {
      validationErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${AUTH_API_BASE_URL}/reset-password`, {
        email: email.trim().toLowerCase(),
        otp: otp.join(''),
        newPassword: newPassword,
      }, { timeout: 15000 });

      if (response.data.success) {
        Alert.alert(
          'Password Reset Successful',
          'Your password has been reset successfully. Please login with your new password.',
          [
            {
              text: 'Login',
              onPress: () => navigation.replace('Login'),
            },
          ]
        );
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="lock-reset" size={60} color={COLORS.primary} />
      </View>

      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>
        Enter your email address and we'll send you a verification code to reset your password.
      </Text>

      <View style={styles.inputGroup}>
        <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
          <View style={styles.inputIconContainer}>
            <MaterialIcons name="email" size={20} color={COLORS.primary} />
          </View>
          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (errors.email) setErrors({});
            }}
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={COLORS.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <TouchableOpacity
        onPress={handleRequestReset}
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.primary, '#FF8C42']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Send Reset Code</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="email-check" size={60} color={COLORS.primary} />
      </View>

      <Text style={styles.title}>Verify Code</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to
      </Text>
      <Text style={styles.emailHighlight}>{email}</Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[styles.otpInput, digit && styles.otpInputFilled]}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity
        onPress={handleVerifyOTP}
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.primary, '#FF8C42']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Verify Code</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      
      {/* Resend OTP Section */}
      <View style={styles.resendContainer}>
        {canResend ? (
          <TouchableOpacity onPress={handleResendOTP} disabled={resendLoading}>
            {resendLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <View style={styles.resendButtonContent}>
                <MaterialCommunityIcons name="refresh" size={16} color={COLORS.primary} />
                <Text style={styles.resendText}> Resend Code</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : countdown > 0 ? (
          <View style={styles.timerContainer}>
            <MaterialCommunityIcons name="timer-sand" size={18} color={COLORS.muted} />
            <Text style={styles.timerText}> Resend in {formatTime(countdown)}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={() => {
          setStep(1);
          setOtp(['', '', '', '', '', '']);
          setCountdown(0);
          setCanResend(false);
        }}
        style={styles.changeEmailButton}
      >
        <MaterialIcons name="edit" size={14} color={COLORS.muted} />
        <Text style={styles.changeEmailText}> Change Email</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep3 = () => (
    <>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="lock-check" size={60} color={COLORS.primary} />
      </View>

      <Text style={styles.title}>Create New Password</Text>
      <Text style={styles.subtitle}>
        Your new password must be different from previously used passwords.
      </Text>

      <View style={styles.inputGroup}>
        <View style={[styles.inputWrapper, errors.newPassword && styles.inputWrapperError]}>
          <View style={styles.inputIconContainer}>
            <AntDesign name="lock1" size={20} color={COLORS.primary} />
          </View>
          <TextInput
            value={newPassword}
            onChangeText={(value) => {
              setNewPassword(value);
              if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: null }));
            }}
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor={COLORS.muted}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={22}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        </View>
        {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputWrapperError]}>
          <View style={styles.inputIconContainer}>
            <AntDesign name="lock1" size={20} color={COLORS.primary} />
          </View>
          <TextInput
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null }));
            }}
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={COLORS.muted}
            secureTextEntry={!showConfirmPassword}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <MaterialIcons
              name={showConfirmPassword ? "visibility" : "visibility-off"}
              size={22}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
      </View>

      <View style={styles.passwordRequirements}>
        <Text style={styles.requirementsTitle}>Password must contain:</Text>
        <View style={styles.requirementItem}>
          <MaterialIcons
            name={newPassword.length >= 8 ? "check-circle" : "radio-button-unchecked"}
            size={16}
            color={newPassword.length >= 8 ? COLORS.success : COLORS.muted}
          />
          <Text style={styles.requirementText}> At least 8 characters</Text>
        </View>
        <View style={styles.requirementItem}>
          <MaterialIcons
            name={/[A-Z]/.test(newPassword) ? "check-circle" : "radio-button-unchecked"}
            size={16}
            color={/[A-Z]/.test(newPassword) ? COLORS.success : COLORS.muted}
          />
          <Text style={styles.requirementText}> One uppercase letter</Text>
        </View>
        <View style={styles.requirementItem}>
          <MaterialIcons
            name={/[a-z]/.test(newPassword) ? "check-circle" : "radio-button-unchecked"}
            size={16}
            color={/[a-z]/.test(newPassword) ? COLORS.success : COLORS.muted}
          />
          <Text style={styles.requirementText}> One lowercase letter</Text>
        </View>
        <View style={styles.requirementItem}>
          <MaterialIcons
            name={/[0-9]/.test(newPassword) ? "check-circle" : "radio-button-unchecked"}
            size={16}
            color={/[0-9]/.test(newPassword) ? COLORS.success : COLORS.muted}
          />
          <Text style={styles.requirementText}> One number</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleResetPassword}
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.primary, '#FF8C42']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                if (step > 1) {
                  setStep(step - 1);
                } else {
                  navigation.goBack();
                }
              }}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.stepIndicator}>
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    s === step && styles.stepDotActive,
                    s < step && styles.stepDotCompleted,
                  ]}
                />
              ))}
            </View>

            <View style={styles.placeholder} />
          </View>

          <View style={styles.content}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.backToLoginButton}
          >
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  stepDotCompleted: {
    backgroundColor: COLORS.success,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  emailHighlight: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 30,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.md,
    color: COLORS.text,
    fontWeight: '400',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: COLORS.error,
    fontSize: fontSizes.sm,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradientButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
    width: '100%',
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  resendContainer: {
    marginTop: 16,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    color: COLORS.primary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    color: COLORS.muted,
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  changeEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  changeEmailText: {
    color: COLORS.muted,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  passwordRequirements: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: fontSizes.sm,
    color: COLORS.muted,
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backToLoginText: {
    color: COLORS.accent,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
