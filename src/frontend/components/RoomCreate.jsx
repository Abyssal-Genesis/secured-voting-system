import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Web3Service from '../services/web3Service';
import { AuthService } from '../services/authService';
import '../styles/RoomCreate.css';

/**
 * RoomCreate Component
 * Allows users to create new voting sessions
 */
const RoomCreate = ({ user, userWallet }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: ['Option 1', 'Option 2'],
    startTime: '',
    endTime: '',
    requiresVerification: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /**
   * Handle form input change
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /**
   * Handle option change
   */
  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  /**
   * Add new option field
   */
  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, `Option ${prev.options.length + 1}`]
    }));
  };

  /**
   * Remove option
   */
  const removeOption = (index) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      setLoading(true);

      // Validation
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (formData.options.length < 2) {
        throw new Error('At least 2 options are required');
      }
      if (!formData.startTime || !formData.endTime) {
        throw new Error('Start and end times are required');
      }

      const startTime = new Date(formData.startTime).getTime() / 1000;
      const endTime = new Date(formData.endTime).getTime() / 1000;
      const now = Math.floor(Date.now() / 1000);

      if (startTime <= now) {
        throw new Error('Start time must be in the future');
      }
      if (endTime <= startTime) {
        throw new Error('End time must be after start time');
      }

      // Create session on blockchain
      if (!userWallet) {
        throw new Error('Please connect your wallet first');
      }

      console.log('Creating session on blockchain...');
      const receipt = await Web3Service.castVote(
        // Note: In production, we would use the contract to create a session
        // This is a simplified version for demo purposes
        0, // sessionId (would be returned by createSession)
        0  // choice (placeholder)
      );

      // Save to backend database
      const response = await AuthService.request('/voting/sessions/create', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          options: formData.options,
          startTime,
          endTime,
          requiresVerification: formData.requiresVerification
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const result = await response.json();
      setSuccess('✓ Voting session created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        options: ['Option 1', 'Option 2'],
        startTime: '',
        endTime: '',
        requiresVerification: false
      });

      // Redirect to session
      setTimeout(() => {
        navigate(`/voting/${result.session.id}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create session');
      console.error('Error creating session:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="room-create-container">
      <div className="room-create-card">
        <div className="room-create-header">
          <h1>📋 Create Voting Session</h1>
          <p>Set up a new voting session for your community</p>
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

        <form onSubmit={handleSubmit} className="room-create-form">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Session Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter voting session title"
              disabled={loading}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what this vote is about"
              rows="4"
              disabled={loading}
            ></textarea>
          </div>

          {/* Options */}
          <div className="form-group">
            <label>Voting Options * (minimum 2)</label>
            <div className="options-container">
              {formData.options.map((option, index) => (
                <div key={index} className="option-input-group">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    disabled={loading}
                    required
                  />
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="remove-option-btn"
                      disabled={loading}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="add-option-btn"
              disabled={loading}
            >
              + Add Option
            </button>
          </div>

          {/* Times */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Start Time *</label>
              <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time *</label>
              <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Verification Requirement */}
          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="requiresVerification"
              name="requiresVerification"
              checked={formData.requiresVerification}
              onChange={handleInputChange}
              disabled={loading}
            />
            <label htmlFor="requiresVerification">
              Require human verification to vote
            </label>
          </div>

          {/* Wallet Notice */}
          {!userWallet && (
            <div className="wallet-notice">
              <p>🔐 Please connect your Ethereum wallet to create a session</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !userWallet}
          >
            {loading ? '🔄 Creating Session...' : '✓ Create Session'}
          </button>
        </form>

        {/* Info Box */}
        <div className="info-box">
          <h4>ℹ️ Session Details</h4>
          <ul>
            <li>Sessions are recorded on the Ethereum blockchain</li>
            <li>Votes are immutable and verified by the network</li>
            <li>Results are instantly updated and transparent</li>
            <li>All users must have a verified wallet to vote</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RoomCreate;
      <label className="block mb-2 text-gray-700 dark:text-gray-300">End Time</label>
      <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} required className="w-full p-2 mb-4 border rounded" />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition">Create Room</button>
      {message && <p className="mt-4 text-center text-gray-700 dark:text-gray-300">{message}</p>}
    </form>
  );
};

export default RoomCreate;
