import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { MaterialIcons, AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUTH_API_BASE_URL } from "../config/api";
import { fontSizes } from '../constants/theme';

const COLORS = {
  primary: '#F96E2A',
  accent: '#4A90E2',
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#1F2937',
  muted: '#6B7280',
  error: '#EF4444',
};

const InputField = ({
  iconType,
  iconName,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  secureTextEntry = false,
  fieldName,
  uiState,
  setUiState,
  editable = true,
}) => {
  const hasError = uiState.errors[fieldName];
  const IconComponent = iconType === "MaterialIcons" ? MaterialIcons : AntDesign;
  
  return (
    <View style={styles.inputGroup}>
      <View style={[styles.inputWrapper, hasError && styles.inputWrapperError]}>
        <View style={styles.iconContainer}>
          <IconComponent name={iconName} size={20} color={COLORS.primary} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.muted}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
          secureTextEntry={secureTextEntry && !uiState.showPassword}
          editable={editable}
        />
        {fieldName === 'password' && (
          <TouchableOpacity
            onPress={() => setUiState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
            style={styles.eyeIcon}
            disabled={!editable}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={uiState.showPassword ? "visibility" : "visibility-off"}
              size={22}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        )}
      </View>
      {hasError && <Text style={styles.errorText}>{hasError}</Text>}
    </View>
  );
};

const LoginScreen = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [uiState, setUiState] = useState({
    isLoading: false,
    showPassword: false,
    errors: {},
    checkingAuth: true, // Add initial auth check state
  });
  const navigation = useNavigation();

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        navigation.replace("Main");
      } else {
        setUiState(prev => ({ ...prev, checkingAuth: false }));
      }
    } catch (err) {
      console.log("Error checking auth status:", err);
      setUiState(prev => ({ ...prev, checkingAuth: false }));
    }
  };

  // Show loading screen while checking auth status
  if (uiState.checkingAuth) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Enter a valid email";
    }
    
    if (!formData.password.trim()) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setUiState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (uiState.errors[field]) {
      setUiState(prev => ({
        ...prev, 
        errors: { ...prev.errors, [field]: null }
      }));
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setUiState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await axios.post(`${AUTH_API_BASE_URL}/login`, {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      if (response.data.success) {
        const { token, user } = response.data;
        
        await AsyncStorage.setItem("authToken", token);
        await AsyncStorage.setItem("userData", JSON.stringify(user));

        setFormData({ email: "", password: "" });
        navigation.replace("Main");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
      
      if (error.response?.data?.message?.includes("verify") || 
          error.response?.data?.message?.includes("not verified")) {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before logging in.",
          [
            {
              text: "Verify Now",
              onPress: () => {
                navigation.navigate("OTPVerification", {
                  email: formData.email.trim(),
                  fullName: "User",
                });
              },
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
      } else {
        Alert.alert("Login Error", errorMessage);
      }
    } finally {
      setUiState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[COLORS.background, COLORS.white]} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <MaterialCommunityIcons name="bus-multiple" size={60} color="#F96E2A" />
              </View>
              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Sign in to continue your journey</Text>
            </View>

            <View style={styles.formSection}>
              <InputField
                iconType="MaterialIcons"
                iconName="email"
                placeholder="Email"
                value={formData.email}
                onChangeText={value => handleInputChange('email', value)}
                keyboardType="email-address"
                fieldName="email"
                uiState={uiState}
                setUiState={setUiState}
                editable={!uiState.isLoading}
              />
              
              <InputField
                iconType="AntDesign"
                iconName="lock1"
                placeholder="Password"
                value={formData.password}
                onChangeText={value => handleInputChange('password', value)}
                secureTextEntry={true}
                fieldName="password"
                uiState={uiState}
                setUiState={setUiState}
                editable={!uiState.isLoading}
              />

              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
                disabled={uiState.isLoading}
                style={styles.forgotPasswordLink}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogin}
                style={[styles.loginButton, uiState.isLoading && styles.loginButtonDisabled]}
                disabled={uiState.isLoading}
                activeOpacity={0.8}
              >
                {uiState.isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <View style={styles.registerSection}>
                <Text style={styles.registerPrompt}>Don't have an account? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Register")}
                  disabled={uiState.isLoading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.registerLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  gradient: { 
    flex: 1 
  },
  keyboardView: { 
    flex: 1 
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 60,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: COLORS.muted,
    fontWeight: '400',
    textAlign: 'center',
  },
  formSection: { 
    flex: 1 
  },
  inputGroup: { 
    marginBottom: 18 
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputWrapperError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  iconContainer: { 
    marginRight: 12 
  },
  input: {
    flex: 1,
    fontSize: fontSizes.md,
    color: COLORS.text,
    fontWeight: '400',
  },
  eyeIcon: { 
    padding: 4 
  },
  errorText: {
    color: COLORS.error,
    fontSize: fontSizes.sm,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    color: COLORS.accent,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.muted,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: fontSizes.md,
    fontWeight: "700",
  },
  registerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  registerPrompt: {
    color: COLORS.muted,
    fontSize: fontSizes.md,
  },
  registerLink: {
    color: COLORS.accent,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});

export default LoginScreen;
