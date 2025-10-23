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

3. **Install ngrok**

   ngrok is required to expose your local server to the internet so Okta can send webhooks to it.

   - **macOS (Homebrew)**:
     ```bash
     brew install ngrok/ngrok/ngrok
     ```

   - **Linux (apt)**:
     ```bash
     curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
     echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
     sudo apt update && sudo apt install ngrok
     ```

   - **Windows (Chocolatey)**:
     ```bash
     choco install ngrok
     ```

   - **Manual Installation**: Download from [ngrok.com/download](https://ngrok.com/download)

4. **Run the Service**
   ```bash
   npm start
   ```

5. **Start ngrok Tunnel**

   In a **separate terminal window**, run:
   ```bash
   ngrok http 3000
   ```

   You'll see output like:
   ```
   Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
   ```

   **Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`) - you'll need it for Okta configuration.

6. **Test the Webhook**
   ```bash
   curl -X GET https://your-ngrok-url.ngrok-free.app/health
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

## Updating ngrok URL in Okta (Free Accounts)

**Note**: Free ngrok accounts generate a **new random URL** each time you restart ngrok. You'll need to update this URL in your Okta configuration.

### When to Update

Update the Okta webhook URL whenever:
- You restart ngrok
- Your ngrok session expires
- You see a different ngrok URL in your terminal

### How to Update in Okta Dashboard

1. **Get Your New ngrok URL**
   - Look at the ngrok terminal output
   - Copy the HTTPS forwarding URL (e.g., `https://xyz789.ngrok-free.app`)

2. **Update Okta Inline Hook**
   - Log in to your **Okta Admin Console**
   - Go to **Workflow > Inline Hooks**
   - Find your Voice OTP inline hook (e.g., "Voice OTP Delivery")
   - Click **Edit**
   - Update the **URL** field to: `https://your-new-ngrok-url.ngrok-free.app/okta-voice-otp`
   - Click **Save**

3. **Verify the Update**
   ```bash
   curl -X GET https://your-new-ngrok-url.ngrok-free.app/health
   ```

   You should see: `{"status":"ok"}`

### Pro Tip: Avoid Frequent Updates

To get a **static ngrok URL** and avoid updating Okta constantly:
- Upgrade to a paid ngrok account
- Or use a cloud hosting service (AWS, Google Cloud, Heroku) for production deployments

## License

MIT