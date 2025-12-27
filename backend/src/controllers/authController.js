import supabase from "../config/supabaseClient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from "../utils/emailService.js";

// JWT Secret (Add to .env file: JWT_SECRET=your_secret_key_here)
const JWT_SECRET = process.env.JWT_SECRET || "sawari_sathi_secret_2025";
const JWT_EXPIRES_IN = "7d"; // Token expires in 7 days
const OTP_EXPIRY_MINUTES = 30; // OTP valid for 30 minutes (increased for testing)

// ============================================
// SECURE User Signup with Email OTP Verification
// ============================================
export const userSignup = async (req, res) => {
  const { email, password, fullName, phoneNumber } = req.body;

  try {
    // Validate input
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and full name are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Password strength check
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: "Password must contain uppercase, lowercase, and numbers",
      });
    }

    // Sanitize email (trim and lowercase)
    const sanitizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("email, is_verified")
      .eq("email", sanitizedEmail)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing user:", checkError.message);
      throw checkError;
    }

    if (existingUser && existingUser.is_verified) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists. Please login.",
      });
    }

    // Hash password with bcrypt (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    // Add extra buffer for timezone differences (UTC vs local)
    const otpExpires = new Date(Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000) + (6 * 60 * 60 * 1000)); // +6 hours buffer

    // If user exists but not verified, update their info
    if (existingUser && !existingUser.is_verified) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password: hashedPassword,
          full_name: fullName.trim(),
          phone_number: phoneNumber?.trim() || null,
          otp_code: otp,
          otp_expires: otpExpires.toISOString(),
          verification_attempts: 0,
        })
        .eq("email", sanitizedEmail);

      if (updateError) {
        console.error("Error updating user:", updateError.message);
        throw updateError;
      }
    } else {
      // Insert new user with OTP
      const { error: insertError } = await supabase
        .from("users")
        .insert([
          {
            email: sanitizedEmail,
            password: hashedPassword,
            full_name: fullName.trim(),
            phone_number: phoneNumber?.trim() || null,
            otp_code: otp,
            otp_expires: otpExpires.toISOString(),
            is_verified: false,
            verification_attempts: 0,
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        console.error("Error creating user:", insertError.message);
        throw insertError;
      }
    }

    // Send OTP email
    try {
      await sendOTPEmail(sanitizedEmail, otp, fullName.trim());
    } catch (emailError) {
      console.error("Error sending OTP email:", emailError);
      // Delete the user if email fails
      await supabase.from("users").delete().eq("email", sanitizedEmail).eq("is_verified", false);
      
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please check your email address and try again.",
      });
    }

    // Send response - user must verify OTP
    res.status(201).json({
      success: true,
      message: `Verification code sent to ${sanitizedEmail}. Please check your email and verify within ${OTP_EXPIRY_MINUTES} minutes.`,
      email: sanitizedEmail,
      requiresVerification: true,
    });
  } catch (err) {
    console.error("Error in userSignup:", err.message);
    res.status(500).json({
      success: false,
      message: "Error creating user account",
      error: err.message,
    });
  }
};

// ============================================
// Verify OTP and Complete Registration
// ============================================
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Find user with OTP
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, email, password, full_name, phone_number, otp_code, otp_expires, verification_attempts, is_verified")
      .eq("email", sanitizedEmail)
      .maybeSingle();

    if (findError || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already verified
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified. Please login.",
      });
    }

    // Check verification attempts (max 5 attempts)
    if (user.verification_attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    // Check if OTP expired
    const now = new Date();
    const otpExpires = new Date(user.otp_expires);
    
    // Debug logging
    console.log('🔍 OTP Verification Debug:');
    console.log('Current Time:', now.toISOString());
    console.log('OTP Expires:', otpExpires.toISOString());
    console.log('Time Remaining (minutes):', ((otpExpires - now) / 1000 / 60).toFixed(2));
    console.log('OTP Code:', user.otp_code);
    
    if (now > otpExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
        debug: {
          currentTime: now.toISOString(),
          expiryTime: otpExpires.toISOString()
        }
      });
    }

    // Verify OTP
    if (user.otp_code !== otp) {
      // Increment failed attempts
      await supabase
        .from("users")
        .update({ verification_attempts: user.verification_attempts + 1 })
        .eq("email", sanitizedEmail);

      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
        attemptsLeft: 5 - (user.verification_attempts + 1),
      });
    }

    // OTP is correct - verify user and clear OTP
    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_verified: true,
        otp_code: null,
        otp_expires: null,
        verification_attempts: 0,
      })
      .eq("email", sanitizedEmail);

    if (updateError) {
      throw updateError;
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(sanitizedEmail, user.full_name).catch(err => 
      console.error("Failed to send welcome email:", err)
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: "Email verified successfully! Welcome to Sawari Sathi.",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phoneNumber: user.phone_number,
      },
    });
  } catch (err) {
    console.error("Error in verifyOTP:", err.message);
    res.status(500).json({
      success: false,
      message: "Error verifying OTP",
      error: err.message,
    });
  }
};

// ============================================
// Resend OTP
// ============================================
export const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Find user
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("email, full_name, is_verified")
      .eq("email", sanitizedEmail)
      .maybeSingle();

    if (findError || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified. Please login.",
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    // Add extra buffer for timezone differences (UTC vs local)
    const otpExpires = new Date(Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000) + (6 * 60 * 60 * 1000)); // +6 hours buffer

    // Update user with new OTP
    const { error: updateError } = await supabase
      .from("users")
      .update({
        otp_code: otp,
        otp_expires: otpExpires.toISOString(),
        verification_attempts: 0,
      })
      .eq("email", sanitizedEmail);

    if (updateError) {
      throw updateError;
    }

    // Send new OTP email
    await sendOTPEmail(sanitizedEmail, otp, user.full_name);

    res.status(200).json({
      success: true,
      message: `New verification code sent to ${sanitizedEmail}`,
    });
  } catch (err) {
    console.error("Error in resendOTP:", err.message);
    res.status(500).json({
      success: false,
      message: "Error resending OTP",
      error: err.message,
    });
  }
};

// ============================================
// SECURE User Login with Password Verification
// ============================================
export const userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase();

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, email, password, full_name, phone_number, created_at, is_verified")
      .eq("email", sanitizedEmail)
      .maybeSingle();

    if (findError && findError.code !== "PGRST116") {
      console.error("Error finding user:", findError.message);
      throw findError;
    }

    if (!user) {
      // Don't reveal whether email exists (security best practice)
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
        requiresVerification: true,
        email: sanitizedEmail,
      });
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Successful login with token
    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phoneNumber: user.phone_number,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error("Error in userLogin:", err.message);
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: err.message,
    });
  }
};

// ============================================
// Get User Profile (with JWT verification)
// ============================================
export const getUserProfile = async (req, res) => {
  const { id } = req.params;

  try {
    // Verify that the requesting user matches the profile ID
    // (req.user is set by authMiddleware)
    if (req.user && req.user.userId !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own profile",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, full_name, phone_number, created_at")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      throw error;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phoneNumber: user.phone_number,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error("Error in getUserProfile:", err.message);
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
      error: err.message,
    });
  }
};

// ============================================
// Forgot Password - Send Reset OTP
// ============================================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Find user
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("email, full_name, is_verified")
      .eq("email", sanitizedEmail)
      .maybeSingle();

    if (findError || !user) {
      // Don't reveal if email exists (security)
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a reset code has been sent.",
      });
    }

    if (!user.is_verified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email first before resetting password.",
      });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000) + (6 * 60 * 60 * 1000));

    // Update user with reset OTP
    const { error: updateError } = await supabase
      .from("users")
      .update({
        reset_otp: otp,
        reset_otp_expires: otpExpires.toISOString(),
        reset_attempts: 0,
      })
      .eq("email", sanitizedEmail);

    if (updateError) {
      throw updateError;
    }

    // Send reset OTP email
    try {
      await sendOTPEmail(sanitizedEmail, otp, user.full_name, true); // true = password reset
    } catch (emailError) {
      console.error("Error sending reset OTP email:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset code sent to your email.",
    });
  } catch (err) {
    console.error("Error in forgotPassword:", err.message);
    res.status(500).json({
      success: false,
      message: "Error processing password reset request",
      error: err.message,
    });
  }
};

// ============================================
// Verify Reset OTP
// ============================================
export const verifyResetOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Find user with reset OTP
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("email, reset_otp, reset_otp_expires, reset_attempts")
      .eq("email", sanitizedEmail)
      .maybeSingle();

    if (findError || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check attempts
    if (user.reset_attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Please request a new code.",
      });
    }

    // Check if OTP expired
    const now = new Date();
    const otpExpires = new Date(user.reset_otp_expires);

    if (!user.reset_otp || now > otpExpires) {
      return res.status(400).json({
        success: false,
        message: "Reset code has expired. Please request a new one.",
      });
    }

    // Verify OTP
    if (user.reset_otp !== otp) {
      await supabase
        .from("users")
        .update({ reset_attempts: user.reset_attempts + 1 })
        .eq("email", sanitizedEmail);

      return res.status(400).json({
        success: false,
        message: "Invalid code. Please try again.",
        attemptsLeft: 5 - (user.reset_attempts + 1),
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now reset your password.",
    });
  } catch (err) {
    console.error("Error in verifyResetOTP:", err.message);
    res.status(500).json({
      success: false,
      message: "Error verifying reset code",
      error: err.message,
    });
  }
};

// ============================================
// Reset Password
// ============================================
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: "Password must contain uppercase, lowercase, and numbers",
      });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Find user and verify OTP again
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("email, reset_otp, reset_otp_expires")
      .eq("email", sanitizedEmail)
      .maybeSingle();

    if (findError || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify OTP is still valid
    const now = new Date();
    const otpExpires = new Date(user.reset_otp_expires);

    if (!user.reset_otp || user.reset_otp !== otp || now > otpExpires) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code. Please request a new one.",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset OTP
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password: hashedPassword,
        reset_otp: null,
        reset_otp_expires: null,
        reset_attempts: 0,
      })
      .eq("email", sanitizedEmail);

    if (updateError) {
      throw updateError;
    }

    res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login with your new password.",
    });
  } catch (err) {
    console.error("Error in resetPassword:", err.message);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: err.message,
    });
  }
};

// ============================================
// Update User Profile (with JWT verification)
// ============================================
export const updateUserProfile = async (req, res) => {
  const { id } = req.params;
  const { fullName, phoneNumber } = req.body;

  try {
    // Verify that the requesting user matches the profile ID
    if (req.user && req.user.userId !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError) {
      if (checkError.code === "PGRST116") {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      throw checkError;
    }

    // Update user profile
    const updateData = {};
    if (fullName !== undefined) updateData.full_name = fullName.trim();
    if (phoneNumber !== undefined) updateData.phone_number = phoneNumber?.trim() || null;

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select("id, email, full_name, phone_number, created_at")
      .single();

    if (updateError) {
      throw updateError;
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        phoneNumber: updatedUser.phone_number,
        createdAt: updatedUser.created_at,
      },
    });
  } catch (err) {
    console.error("Error in updateUserProfile:", err.message);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: err.message,
    });
  }
};
