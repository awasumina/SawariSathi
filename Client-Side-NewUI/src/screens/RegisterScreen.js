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
    ScrollView,
    ActivityIndicator,
  } from "react-native";
  import React, { useState } from "react";
  import { MaterialIcons, AntDesign, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
  import { LinearGradient } from 'expo-linear-gradient';
  import { useNavigation } from "@react-navigation/native";
  import axios from "axios";
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
    maxLength,
  }) => {
    const hasError = uiState.errors[fieldName];
    let IconComponent;
    if (iconType === "MaterialIcons") IconComponent = MaterialIcons;
    else if (iconType === "AntDesign") IconComponent = AntDesign;
    else IconComponent = FontAwesome;
    
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
            secureTextEntry={secureTextEntry && (fieldName === 'confirmPassword' ? !uiState.showConfirmPassword : !uiState.showPassword)}
            editable={editable}
            maxLength={maxLength}
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
          {fieldName === 'confirmPassword' && (
            <TouchableOpacity
              onPress={() => setUiState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
              style={styles.eyeIcon}
              disabled={!editable}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={uiState.showConfirmPassword ? "visibility" : "visibility-off"}
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
  
  const RegisterScreen = () => {
    const [formData, setFormData] = useState({
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: ""
    });
    const [uiState, setUiState] = useState({
      isLoading: false,
      showPassword: false,
      showConfirmPassword: false,
      errors: {}
    });
    
    const navigation = useNavigation();

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    const validateForm = () => {
      const errors = {};
      
      if (!formData.fullName.trim()) {
        errors.fullName = "Full name is required";
      }
      
      if (!formData.email.trim()) {
        errors.email = "Email is required";
      } else if (!validateEmail(formData.email)) {
        errors.email = "Enter a valid email";
      }
      
      if (!formData.password.trim()) {
        errors.password = "Password is required";
      } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      } else {
        const hasUpperCase = /[A-Z]/.test(formData.password);
        const hasLowerCase = /[a-z]/.test(formData.password);
        const hasNumber = /[0-9]/.test(formData.password);

        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
          errors.password = "Must contain uppercase, lowercase & number";
        }
      }

      if (!formData.confirmPassword.trim()) {
        errors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
      
      if (formData.phoneNumber && formData.phoneNumber.trim()) {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(formData.phoneNumber.trim())) {
          errors.phoneNumber = "Phone number must be 10 digits";
        }
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
  
    const handleRegister = async () => {
      if (!validateForm()) return;
  
      setUiState(prev => ({ ...prev, isLoading: true }));
      try {
        const userData = {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber.trim() || undefined,
        };
  
        const response = await axios.post(`${AUTH_API_BASE_URL}/signup`, userData);
  
        if (response.data.success) {
          Alert.alert(
            "Account Created! 📧",
            response.data.message,
            [
              {
                text: "Verify Now",
                onPress: () => {
                  navigation.navigate("OTPVerification", {
                    email: formData.email.trim(),
                    fullName: formData.fullName.trim(),
                  });
                },
              },
            ]
          );
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          "Registration failed. Please try again.";
        Alert.alert("Registration Error", errorMessage);
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
                  <MaterialCommunityIcons name="account-plus" size={60} color="#F96E2A" />
                </View>
                <Text style={styles.title}>Join Sawari Sathi</Text>
                <Text style={styles.subtitle}>Create your account to get started</Text>
              </View>

              <View style={styles.formSection}>
                <InputField
                  iconType="FontAwesome"
                  iconName="user"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChangeText={value => handleInputChange('fullName', value)}
                  fieldName="fullName"
                  uiState={uiState}
                  setUiState={setUiState}
                  editable={!uiState.isLoading}
                />
                
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
                  iconType="FontAwesome"
                  iconName="phone"
                  placeholder="Phone Number (Optional)"
                  value={formData.phoneNumber}
                  onChangeText={value => handleInputChange('phoneNumber', value)}
                  keyboardType="phone-pad"
                  fieldName="phoneNumber"
                  uiState={uiState}
                  setUiState={setUiState}
                  editable={!uiState.isLoading}
                  maxLength={10}
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

                <InputField
                  iconType="AntDesign"
                  iconName="lock1"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={value => handleInputChange('confirmPassword', value)}
                  secureTextEntry={true}
                  fieldName="confirmPassword"
                  uiState={uiState}
                  setUiState={setUiState}
                  editable={!uiState.isLoading}
                />

                <View style={styles.passwordHintContainer}>
                  <Text style={styles.passwordHint}>
                    8+ chars with uppercase, lowercase & number
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleRegister}
                  style={[styles.registerButton, uiState.isLoading && styles.registerButtonDisabled]}
                  disabled={uiState.isLoading}
                  activeOpacity={0.8}
                >
                  {uiState.isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.registerButtonText}>Sign Up</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.loginSection}>
                  <Text style={styles.loginPrompt}>Already have an account? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Login")}
                    disabled={uiState.isLoading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.loginLink}>Sign In</Text>
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
      marginBottom: 50,
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
      paddingHorizontal: 20,
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
    passwordHintContainer: {
      marginBottom: 8,
    },
    passwordHint: {
      fontSize: fontSizes.sm,
      color: COLORS.muted,
      textAlign: 'center',
      lineHeight: 16,
    },
    registerButton: {
      backgroundColor: COLORS.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 18,
    },
    registerButtonDisabled: {
      backgroundColor: COLORS.muted,
    },
    registerButtonText: {
      color: "#fff",
      fontSize: fontSizes.md,
      fontWeight: "700",
    },
    loginSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    loginPrompt: {
      color: COLORS.muted,
      fontSize: fontSizes.md,
    },
    loginLink: {
      color: COLORS.accent,
      fontSize: fontSizes.md,
      fontWeight: '600',
    },
  });
  
  export default RegisterScreen;
