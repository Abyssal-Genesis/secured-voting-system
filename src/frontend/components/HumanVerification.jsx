import React, { useState, useRef, useEffect } from 'react';
import { AuthService } from '../services/authService';
import '../styles/HumanVerification.css';

/**
 * Human Verification Component
 * Multi-step verification process for voting eligibility
 */
const HumanVerification = ({ user }) => {
  const [verificationStep, setVerificationStep] = useState(1);
  const [verificationMethod, setVerificationMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Email verification
  const [email, setEmail] = useState(user?.email || '');

  // Phone verification
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');

  // Video/Liveness
  const [facePicture, setFacePicture] = useState(null);
  const [videoStarted, setVideoStarted] = useState(false);

  /**
   * Start camera for facial recognition
   */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setVideoStarted(true);
      }
    } catch (err) {
      setError('Unable to access camera: ' + err.message);
    }
  };

  /**
   * Stop camera
   */
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setVideoStarted(false);
    }
  };

  /**
   * Capture face picture
   */
  const captureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = canvasRef.current.toDataURL('image/png');
      setFacePicture(imageData);
      stopCamera();
    }
  };

  /**
   * Handle email verification
   */
  const handleEmailVerification = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      await AuthService.submitHumanVerification({
        method: 'email',
        email,
        code: verificationCode
      });

      setSuccess('✓ Email verified successfully!');
      setVerificationStep(2);
    } catch (err) {
      setError(err.message || 'Email verification failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle phone verification
   */
  const handlePhoneVerification = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      await AuthService.submitHumanVerification({
        method: 'phone',
        phone,
        code: phoneCode
      });

      setSuccess('✓ Phone verified successfully!');
      setVerificationStep(3);
    } catch (err) {
      setError(err.message || 'Phone verification failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle facial verification
   */
  const handleFacialVerification = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!facePicture) {
        throw new Error('Please capture your face first');
      }

      await AuthService.submitHumanVerification({
        method: 'facial',
        faceImage: facePicture
      });

      setSuccess('✓ Face verified successfully!');
      setVerificationStep(4);
    } catch (err) {
      setError(err.message || 'Facial verification failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Complete verification
   */
  const completeVerification = async () => {
    try {
      setLoading(true);
      setError(null);

      await AuthService.updateProfile({
        verificationComplete: true
      });

      setSuccess('✓ Your verification is complete! You can now vote.');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to complete verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-container">
      <div className="verification-card">
        <div className="verification-header">
          <h1>🔐 Human Verification</h1>
          <p>Complete verification to unlock voting privileges</p>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div className="progress-step active">
            <span className="step-number">1</span>
            <span className="step-label">Email</span>
          </div>
          <div className={`progress-step ${verificationStep >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Phone</span>
          </div>
          <div className={`progress-step ${verificationStep >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Face</span>
          </div>
          <div className={`progress-step ${verificationStep >= 4 ? 'active' : ''}`}>
            <span className="step-number">4</span>
            <span className="step-label">Complete</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        {success && (
          <div className="success-message">
            <span>✓ {success}</span>
          </div>
        )}

        {/* Step 1: Email Verification */}
        {verificationStep === 1 && (
          <form onSubmit={handleEmailVerification} className="verification-form">
            <h3>Step 1: Email Verification</h3>
            <p>We'll send a verification code to your email</p>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <input
                type="text"
                id="code"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength="6"
                disabled={loading}
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? '🔄 Verifying...' : '✓ Verify Email'}
            </button>
          </form>
        )}

        {/* Step 2: Phone Verification */}
        {verificationStep === 2 && (
          <form onSubmit={handlePhoneVerification} className="verification-form">
            <h3>Step 2: Phone Verification</h3>
            <p>We'll send an SMS with a verification code</p>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneCode">Verification Code</label>
              <input
                type="text"
                id="phoneCode"
                placeholder="Enter 6-digit code"
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                maxLength="6"
                disabled={loading}
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? '🔄 Verifying...' : '✓ Verify Phone'}
            </button>
          </form>
        )}

        {/* Step 3: Facial Verification */}
        {verificationStep === 3 && (
          <div className="verification-form facial-verification">
            <h3>Step 3: Facial Recognition</h3>
            <p>We'll verify your identity using facial recognition</p>

            {!facePicture ? (
              <>
                {!videoStarted ? (
                  <button onClick={startCamera} className="camera-button" disabled={loading}>
                    📷 Start Camera
                  </button>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="video-preview"
                    ></video>
                    <button onClick={captureFace} className="capture-button" disabled={loading}>
                      📸 Capture Face
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <canvas ref={canvasRef} className="hidden" width="320" height="240"></canvas>
                <img
                  src={facePicture}
                  alt="Captured face"
                  className="face-preview"
                />
                <div className="button-group">
                  <button
                    onClick={() => setFacePicture(null)}
                    className="retry-button"
                    disabled={loading}
                  >
                    🔄 Retake Photo
                  </button>
                  <button
                    onClick={handleFacialVerification}
                    className="verify-button"
                    disabled={loading}
                  >
                    {loading ? '🔄 Verifying...' : '✓ Verify Face'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Complete */}
        {verificationStep === 4 && (
          <div className="verification-complete">
            <div className="success-icon">✓</div>
            <h3>Verification Complete!</h3>
            <p>Congratulations! Your identity has been verified.</p>
            <p>You can now participate in voting sessions.</p>

            <button
              onClick={completeVerification}
              className="complete-button"
              disabled={loading}
            >
              {loading ? '🔄 Processing...' : '✓ Continue to Voting'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HumanVerification;
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.verified) {
        setMessage('Verification successful!');
        onVerified();
      } else {
        setMessage('Verification failed. Please try again.');
      }
    } catch {
      setMessage('Verification error. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Human Verification</h2>
      <video ref={videoRef} autoPlay muted className="w-full rounded mb-4" />
      <button onClick={startCamera} className="bg-blue-600 text-white px-4 py-2 rounded mr-2 hover:bg-blue-700 transition">Start Camera</button>
      <button onClick={captureAndVerify} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">Verify</button>
      {message && <p className="mt-4 text-gray-700 dark:text-gray-300">{message}</p>}
    </div>
  );
};

export default HumanVerification;
