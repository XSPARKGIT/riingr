# Firebase Setup Guide

## Quick Start

1. **Get your Firebase credentials:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings (gear icon) > General
   - Scroll down to "Your apps" section
   - Copy your Firebase configuration object

2. **Add your Firebase config:**
   - Open `services/firebaseConfig.ts`
   - Replace the placeholder values with your actual Firebase credentials:
     ```typescript
     const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
     };
     ```

   **OR** use environment variables:
   - Create a `.env` file in the project root
   - Add your credentials:
     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

3. **Enable Phone Authentication in Firebase Console:**
   - Go to Authentication > Sign-in method
   - Enable "Phone" provider
   - Save

4. **Set up test phone numbers (optional but recommended for development):**
   - Go to Authentication > Settings > Phone numbers for testing
   - Add your phone number with a fixed verification code (e.g., 123456)
   - This allows you to test without using real SMS credits

5. **Configure reCAPTCHA:**
   - This is usually automatic, but verify in Authentication settings
   - The app uses invisible reCAPTCHA, so users won't see a checkbox

## Testing

- **With test number:** Use the fixed code you set in Firebase Console
- **With real number:** You'll receive an actual SMS with a verification code
- **reCAPTCHA:** Will appear automatically when needed (usually invisible)

## Firebase Free Tier Benefits

- ✅ 10,000 free SMS verifications per month
- ✅ No credit card required (Spark Plan)
- ✅ Unlimited test phone numbers
- ✅ Automatic reCAPTCHA protection

## Troubleshooting

- **"reCAPTCHA verification failed":** Make sure Phone Authentication is enabled in Firebase Console
- **"Invalid phone number":** Ensure phone number is in E.164 format (e.g., +27123456789)
- **"SMS quota exceeded":** You've hit the 10k monthly limit, or need to upgrade your plan
- **"Too many requests":** Wait a few minutes before trying again

## Next Steps

After authentication is working, you can:
- Store user profiles in Firestore
- Sync messages to Firebase
- Add real-time chat features
- Implement push notifications
