# Okta BYOT with 8x8 Voice API

A webhook service that integrates Okta's Bring Your Own Telephony (BYOT) with 8x8's Voice API to deliver One-Time Passwords (OTPs) via voice calls.

## Quick Start

1. **Clone and Install**
   ```bash
   gh repo clone harrism04/okta-byot-voice
   cd okta-byot-voice
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Run the Service**
   ```bash
   npm start
   ```

4. **Test the Webhook**
   ```bash
   curl -X GET http://localhost:3000/health
   ```

## Configuration

Set the following environment variables in your `.env` file:

- `EIGHTYEIGHTX_SUBACCOUNT_ID`: Your 8x8 subaccount ID
- `EIGHTYEIGHTX_API_KEY`: Your 8x8 API key
- `EIGHTYEIGHTX_SOURCE_NUMBER`: Your 8x8 phone number (E.164 format)
- `OKTA_SECRET`: Secret for validating Okta webhooks
- `VOICE_PROFILE`: Voice profile for TTS (default: en-US-Jenny)
- `OTP_REPETITIONS`: Number of times to repeat the OTP (default: 2)

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /okta-voice-otp` - Okta webhook endpoint for OTP delivery

## License

MIT
