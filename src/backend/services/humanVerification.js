const axios = require("axios");
const crypto = require("crypto");

/**
 * Human Verification Service
 * Provides multi-method human verification including:
 * - Facial Recognition
 * - Liveness Detection
 * - Phone Verification
 * - Email Verification
 * - Behavioral Analysis
 */

class HumanVerificationService {
  constructor() {
    this.verificationMethods = {
      FACE_RECOGNITION: "face_recognition",
      LIVENESS_DETECTION: "liveness_detection",
      PHONE_VERIFICATION: "phone_verification",
      EMAIL_VERIFICATION: "email_verification",
      BEHAVIORAL_ANALYSIS: "behavioral_analysis"
    };

    this.apiEndpoints = {
      faceRecognition: process.env.FACE_API_URL || "https://api.example.com/face-verify",
      livenessDetection: process.env.LIVENESS_API_URL || "https://api.example.com/liveness-check",
      phoneVerification: process.env.PHONE_API_URL || "https://api.example.com/phone-verify",
      emailVerification: process.env.EMAIL_API_URL || "https://api.example.com/email-verify"
    };

    this.verificationResults = new Map();
    this.verificationAttempts = new Map();
    this.verificationLimits = {
      maxAttemptsPerUser: 5,
      attemptsWindowMinutes: 60,
      successRequired: 2 // Number of successful verifications required
    };
  }

  /**
   * Main verification method - combines multiple techniques
   * @param {string} userId - User ID
   * @param {object} verificationData - Contains face image, video, email, phone, etc.
   * @returns {object} Verification result
   */
  async verifyUser(userId, verificationData) {
    try {
      // Check attempt limits
      if (!this.canAttemptVerification(userId)) {
        return {
          success: false,
          message: "Too many verification attempts. Please try again later.",
          errorCode: "RATE_LIMITED"
        };
      }

      // Record attempt
      this.recordAttempt(userId);

      // Array to hold results from different methods
      const verificationChecks = [];

      // Facial Recognition
      if (verificationData.faceImage) {
        const faceResult = await this.verifyFacialRecognition(
          userId,
          verificationData.faceImage,
          verificationData.referencePhoto
        );
        verificationChecks.push({
          method: this.verificationMethods.FACE_RECOGNITION,
          success: faceResult.success,
          confidence: faceResult.confidence,
          details: faceResult
        });
      }

      // Liveness Detection
      if (verificationData.livenessVideo) {
        const livenessResult = await this.checkLiveness(
          userId,
          verificationData.livenessVideo
        );
        verificationChecks.push({
          method: this.verificationMethods.LIVENESS_DETECTION,
          success: livenessResult.success,
          confidence: livenessResult.confidence,
          details: livenessResult
        });
      }

      // Email Verification
      if (verificationData.email) {
        const emailResult = await this.verifyEmail(
          userId,
          verificationData.email
        );
        verificationChecks.push({
          method: this.verificationMethods.EMAIL_VERIFICATION,
          success: emailResult.success,
          details: emailResult
        });
      }

      // Phone Verification
      if (verificationData.phone) {
        const phoneResult = await this.verifyPhone(
          userId,
          verificationData.phone
        );
        verificationChecks.push({
          method: this.verificationMethods.PHONE_VERIFICATION,
          success: phoneResult.success,
          details: phoneResult
        });
      }

      // Behavioral Analysis
      if (verificationData.behavioralData) {
        const behavioralResult = await this.analyzeBehavior(
          userId,
          verificationData.behavioralData
        );
        verificationChecks.push({
          method: this.verificationMethods.BEHAVIORAL_ANALYSIS,
          success: behavioralResult.success,
          confidence: behavioralResult.confidence,
          details: behavioralResult
        });
      }

      // Calculate overall result
      const successCount = verificationChecks.filter(check => check.success).length;
      const averageConfidence = verificationChecks.length > 0
        ? verificationChecks.reduce((sum, check) => sum + (check.confidence || 0), 0) / verificationChecks.length
        : 0;

      const overallSuccess = successCount >= this.verificationLimits.successRequired &&
        averageConfidence >= 0.85;

      const result = {
        userId,
        success: overallSuccess,
        successCount,
        totalChecks: verificationChecks.length,
        averageConfidence,
        checks: verificationChecks,
        timestamp: new Date().toISOString(),
        verificationId: this.generateVerificationId(userId)
      };

      // Store result
      this.verificationResults.set(userId, result);

      return result;
    } catch (error) {
      console.error("Verification error:", error);
      return {
        success: false,
        message: "Verification process failed",
        error: error.message,
        errorCode: "VERIFICATION_ERROR"
      };
    }
  }

  /**
   * Facial Recognition Verification
   * @param {string} userId - User ID
   * @param {string} faceImage - Base64 encoded face image
   * @param {string} referencePhoto - Base64 encoded reference photo (from ID)
   * @returns {object} Verification result
   */
  async verifyFacialRecognition(userId, faceImage, referencePhoto) {
    try {
      // In production, call actual face recognition API
      // Example: AWS Rekognition, Azure Face API, Google Cloud Vision

      console.log(`[Face Recognition] Verifying user: ${userId}`);

      // Mock verification - in production, use real API
      const response = await this.callFaceRecognitionAPI({
        userId,
        liveImage: faceImage,
        referenceImage: referencePhoto
      });

      return {
        success: response.match > 0.95,
        confidence: response.match || 0,
        matchScore: response.match,
        details: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Facial recognition error:", error);
      return {
        success: false,
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Liveness Detection
   * Verifies that the person in the image/video is alive and not a spoof
   * @param {string} userId - User ID
   * @param {string} livenessVideo - Video data for liveness check
   * @returns {object} Verification result
   */
  async checkLiveness(userId, livenessVideo) {
    try {
      console.log(`[Liveness Detection] Checking user: ${userId}`);

      // In production, use liveness detection APIs like:
      // - AWS Rekognition Liveness
      // - Live Person API
      // - IDology

      const response = await this.callLivenessDetectionAPI({
        userId,
        videoData: livenessVideo
      });

      return {
        success: response.isLive && response.confidence > 0.9,
        confidence: response.confidence || 0,
        isLive: response.isLive,
        spoofDetectionScore: response.spoofScore,
        details: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Liveness detection error:", error);
      return {
        success: false,
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Email Verification
   * @param {string} userId - User ID
   * @param {string} email - Email to verify
   * @returns {object} Verification result
   */
  async verifyEmail(userId, email) {
    try {
      console.log(`[Email Verification] Verifying email for user: ${userId}`);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // In production, send email with verification link
      // const emailSent = await this.sendVerificationEmail(email, verificationToken);

      // Mock: Assume verification successful if email is valid
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      return {
        success: isValidEmail,
        email,
        verificationToken,
        expiresAt,
        message: isValidEmail ? "Verification email sent" : "Invalid email format"
      };
    } catch (error) {
      console.error("Email verification error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Phone Verification
   * @param {string} userId - User ID
   * @param {string} phoneNumber - Phone number to verify
   * @returns {object} Verification result
   */
  async verifyPhone(userId, phoneNumber) {
    try {
      console.log(`[Phone Verification] Verifying phone for user: ${userId}`);

      // In production, use Twilio, AWS SNS, or similar
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Mock: Assume verification successful if phone is valid
      const isValidPhone = /^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\D/g, ""));

      return {
        success: isValidPhone,
        phone: phoneNumber,
        verificationCode,
        expiresAt,
        message: isValidPhone ? "Verification code sent" : "Invalid phone format"
      };
    } catch (error) {
      console.error("Phone verification error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Behavioral Analysis
   * Analyzes user behavior patterns for anomalies
   * @param {string} userId - User ID
   * @param {object} behavioralData - User behavioral metrics
   * @returns {object} Analysis result
   */
  async analyzeBehavior(userId, behavioralData) {
    try {
      console.log(`[Behavioral Analysis] Analyzing behavior for user: ${userId}`);

      const analysis = {
        mousePatterns: this.analyzeMouse(behavioralData.mouseMovements),
        typingPatterns: this.analyzeTyping(behavioralData.keystrokes),
        deviceConsistency: this.checkDeviceConsistency(behavioralData.device),
        locationConsistency: this.checkLocationConsistency(behavioralData.location),
        timePattern: this.analyzeTimePattern(behavioralData.timestamp)
      };

      // Calculate anomaly score (0-1, where 1 is most anomalous)
      const anomalyScores = Object.values(analysis).map(a => a.anomalyScore || 0);
      const averageAnomalyScore = anomalyScores.reduce((a, b) => a + b, 0) / anomalyScores.length;

      return {
        success: averageAnomalyScore < 0.3, // Accept if anomaly score is low
        confidence: 1 - averageAnomalyScore,
        anomalyScore: averageAnomalyScore,
        analysis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Behavioral analysis error:", error);
      return {
        success: false,
        confidence: 0,
        error: error.message
      };
    }
  }

  // Helper Methods

  analyzeMouse(mouseData) {
    // Analyze mouse movement patterns
    if (!mouseData || mouseData.length < 100) {
      return { anomalyScore: 0.5, reason: "Insufficient data" };
    }
    
    // Calculate velocity, acceleration patterns
    return {
      anomalyScore: 0.1,
      pattern: "normal",
      velocity: "consistent"
    };
  }

  analyzeTyping(keystrokeData) {
    // Analyze keystroke dynamics (rhythm, speed, pressure)
    if (!keystrokeData || keystrokeData.length < 20) {
      return { anomalyScore: 0.5, reason: "Insufficient data" };
    }
    
    return {
      anomalyScore: 0.15,
      speed: "consistent",
      rhythm: "normal"
    };
  }

  checkDeviceConsistency(deviceData) {
    // Check if device info matches user's known devices
    return {
      anomalyScore: 0,
      status: "consistent"
    };
  }

  checkLocationConsistency(locationData) {
    // Check if location is consistent with user's typical locations
    return {
      anomalyScore: 0,
      status: "consistent"
    };
  }

  analyzeTimePattern(timestamp) {
    // Check if activity time is within user's normal hours
    const hour = new Date(timestamp).getHours();
    const isNormalHour = hour >= 6 && hour <= 23; // Normal activity hours
    
    return {
      anomalyScore: isNormalHour ? 0 : 0.3,
      hour,
      normalPattern: isNormalHour
    };
  }

  canAttemptVerification(userId) {
    const attempts = this.verificationAttempts.get(userId) || [];
    const recentAttempts = attempts.filter(
      time => Date.now() - time < this.verificationLimits.attemptsWindowMinutes * 60 * 1000
    );

    return recentAttempts.length < this.verificationLimits.maxAttemptsPerUser;
  }

  recordAttempt(userId) {
    const attempts = this.verificationAttempts.get(userId) || [];
    attempts.push(Date.now());
    this.verificationAttempts.set(userId, attempts);
  }

  generateVerificationId(userId) {
    return `VER_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getVerificationResult(userId) {
    return this.verificationResults.get(userId) || null;
  }

  // Mock API Calls (Replace with real API calls in production)

  async callFaceRecognitionAPI(data) {
    // In production: call AWS Rekognition, Azure Face API, etc.
    console.log("Calling Face Recognition API with data:", { userId: data.userId });
    
    return {
      match: 0.98,
      confidence: 0.98,
      liveness: true
    };
  }

  async callLivenessDetectionAPI(data) {
    // In production: call liveness detection service
    console.log("Calling Liveness Detection API with data:", { userId: data.userId });
    
    return {
      isLive: true,
      confidence: 0.95,
      spoofScore: 0.02
    };
  }

  async sendVerificationEmail(email, token) {
    // In production: send actual email
    console.log(`Sending verification email to: ${email}`);
    return true;
  }

  async sendVerificationSMS(phone, code) {
    // In production: send actual SMS
    console.log(`Sending verification SMS to: ${phone}`);
    return true;
  }
}

// Export service
module.exports = new HumanVerificationService();
