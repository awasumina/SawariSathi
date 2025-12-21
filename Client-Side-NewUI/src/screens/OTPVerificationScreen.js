import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { AUTH_API_BASE_URL } from '../config/api';
import { fontSizes } from '../constants/theme';

const COLORS = {
  primary: '#F96E2A',
  secondary: '#2E5077',
  background: '#FFFFFF',
  text: '#1A1A1A',
  textLight: '#666666',
  border: '#E0E0E0',
  inputBg: '#F5F5F5',
};

const { width } = Dimensions.get('window');

const OTPVerificationScreen = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 minutes countdown
  const [canResend, setCanResend] = useState(false);
  
  const navigation = useNavigation();
  const route = useRoute();
  const { email, fullName } = route.params || {};
  
  // Refs for OTP inputs
  const inputRefs = useRef([]);

  useEffect(() => {
    // Start countdown timer
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (value, index) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter all 6 digits');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email not found. Please try signing up again.');
      navigation.navigate('Register');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${AUTH_API_BASE_URL}/verify-otp`, {
        email: email,
        otp: otpCode,
      });

      if (response.data.success) {
        Alert.alert(
          'Success! 🎉',
          'Your account has been verified successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Login'),
            },
          ]
        );
      }
    } catch (error) {
      const errorMessage = 
        error.response?.data?.message || 
        'OTP verification failed. Please try again.';
      
      const attemptsLeft = error.response?.data?.attemptsLeft;
      
      Alert.alert(
        'Verification Failed',
        attemptsLeft !== undefined 
          ? `${errorMessage} (${attemptsLeft} attempts left)`
          : errorMessage
      );
      
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || !email) return;

    setResendLoading(true);
    try {
      const response = await axios.post(`${AUTH_API_BASE_URL}/resend-otp`, {
        email: email,
      });

      if (response.data.success) {
        Alert.alert('Success', 'A new verification code has been sent to your email!');
        setCountdown(120);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      const errorMessage = 
        error.response?.data?.message || 
        'Failed to resend OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="email-check" size={70} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit verification code to
          </Text>
          <Text style={styles.email}>{email}</Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <Pressable
            onPress={handleVerifyOTP}
            style={[loading && styles.verifyButtonDisabled]}
            disabled={loading}
          >
            <LinearGradient
              colors={[COLORS.primary, '#FF8C42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.verifyButton}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify & Continue</Text>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.resendContainer}>
            {canResend ? (
              <Pressable onPress={handleResendOTP} disabled={resendLoading}>
                {resendLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <View style={styles.resendButtonContent}>
                    <MaterialCommunityIcons name="refresh" size={16} color={COLORS.primary} />
                    <Text style={styles.resendText}> Resend Code</Text>
                  </View>
                )}
              </Pressable>
            ) : (
              <View style={styles.timerContainer}>
                <MaterialCommunityIcons name="timer-sand" size={18} color={COLORS.textLight} />
                <Text style={styles.timerText}>
                  {' '}Resend in {formatTime(countdown)}
                </Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={() => navigation.navigate('Register')}
            style={styles.changeEmailLink}
          >
            <View style={styles.changeEmailContent}>
              <MaterialIcons name="edit" size={14} color={COLORS.textLight} />
              <Text style={styles.changeEmailText}> Change Email Address</Text>
            </View>
          </Pressable>
        </View>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: COLORS.inputBg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  email: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 50,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 50,
    width: '100%',
    maxWidth: 400,
  },
  otpInput: {
    width: 54,
    height: 64,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    textAlign: 'center',
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: COLORS.text,
    backgroundColor: COLORS.inputBg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
    borderWidth: 3,
  },
  verifyButton: {
    borderRadius: 16,
    paddingVertical: 18,
    width: '100%',
    maxWidth: 400,
    marginBottom: 24,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    textAlign: 'center',
    color: COLORS.background,
    fontSize: fontSizes.lg,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resendContainer: {
    marginTop: 12,
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
    fontWeight: '700',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    color: COLORS.textLight,
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  changeEmailLink: {
    marginTop: 24,
    paddingVertical: 8,
  },
  changeEmailContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeEmailText: {
    color: COLORS.textLight,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});

export default OTPVerificationScreen;
