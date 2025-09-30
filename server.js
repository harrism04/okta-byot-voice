const express = require('express');
const https = require('https');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * Sends an OTP to a user via an 8x8 voice call.
 * @param {string} phoneNumber - The recipient's phone number in E.164 format
 * @param {string} otpCode - The one-time password to be delivered
 * @returns {Promise<Object>} Response from 8x8 API
 */
async function sendVoiceOTP(phoneNumber, otpCode) {
  const subaccountId = process.env.EIGHTYEIGHTX_SUBACCOUNT_ID;
  const apiKey = process.env.EIGHTYEIGHTX_API_KEY;
  const sourceNumber = process.env.EIGHTYEIGHTX_SOURCE_NUMBER;
  const voiceProfile = process.env.VOICE_PROFILE || 'en-US-Jenny';
  const repetitions = parseInt(process.env.OTP_REPETITIONS) || 2;

  const payload = JSON.stringify({
    callflow: [
      {
        action: 'makeCall',
        params: {
          source: sourceNumber,
          destination: phoneNumber
        }
      },
      {
        action: 'say',
        params: {
          text: `Your verification code is ${otpCode.split('').join(', ')}. I repeat, your verification code is ${otpCode.split('').join(', ')}.`,
          voiceProfile: voiceProfile,
          repetition: repetitions
        }
      },
      {
        action: 'hangup'
      }
    ]
  });

  const options = {
    hostname: 'voice.wavecell.com',
    port: 443,
    path: `/api/v1/subaccounts/${subaccountId}/callflows`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('[8x8 Service] Voice call initiated successfully:', response);
            resolve(response);
          } else {
            console.error('[8x8 Service] API error:', response);
            reject(new Error(`8x8 API error: ${response.message || 'Unknown error'}`));
          }
        } catch (error) {
          console.error('[8x8 Service] Failed to parse response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('[8x8 Service] Request error:', error);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Validates the incoming Okta webhook request
 * @param {Object} req - Express request object
 * @returns {boolean} True if request is valid
 */
function validateOktaRequest(req) {
  // For production, implement proper Okta webhook signature validation if needed
  const oktaSecret = process.env.OKTA_SECRET;
  const authHeader = req.headers.authorization;

  // If auth header is provided, validate it
  if (authHeader && oktaSecret) {
    return authHeader === `Bearer ${oktaSecret}`;
  }

  // Allow requests without auth headers for simplicity
  // In production, consider implementing webhook signature validation
  return true;
}

// Okta Voice OTP webhook endpoint
app.post('/okta-voice-otp', async (req, res) => {
  try {
    console.log('[Server] Received Okta webhook request');

    // Validate request
    if (!validateOktaRequest(req)) {
      console.warn('[Server] Unauthorized request received');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract data from Okta payload
    const { data } = req.body;
    if (!data || !data.userProfile || !data.messageProfile) {
      console.error('[Server] Invalid Okta payload structure');
      return res.status(400).json({ error: 'Invalid payload structure' });
    }

    const phoneNumber = data.messageProfile.phoneNumber || data.userProfile.mobilePhone;
    const otpCode = data.messageProfile.otpCode;

    if (!phoneNumber || !otpCode) {
      console.error('[Server] Missing phone number or OTP code');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`[Server] Processing OTP delivery for ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

    // Respond to Okta immediately
    res.status(200).json({
      commands: [{
        type: 'com.okta.telephony.action',
        value: [{
          status: 'SUCCESSFUL',
          provider: '8x8-voice'
        }]
      }]
    });

    // Handle voice call asynchronously
    try {
      await sendVoiceOTP(phoneNumber, otpCode);
      console.log('[Server] Voice OTP delivery initiated successfully');
    } catch (error) {
      console.error('[Server] Failed to send voice OTP:', error.message);
      // Note: We already responded to Okta, so this is logged for monitoring
    }

  } catch (error) {
    console.error('[Server] Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('[Server] Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Voice OTP service running on port ${PORT}`);
  console.log(`[Server] Webhook endpoint: http://localhost:${PORT}/okta-voice-otp`);
});

module.exports = app;