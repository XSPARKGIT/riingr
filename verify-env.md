# Verify Your .env Setup

Make sure your `.env` or `.env.local` file has these 6 variables (all starting with `VITE_`):

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Important:
- ✅ All variables MUST start with `VITE_`
- ✅ No quotes around values
- ✅ No spaces around the `=` sign
- ✅ One variable per line

## Next Steps:
1. Restart your dev server (stop with Ctrl+C, then run `npm run dev`)
2. Test the authentication flow
3. Check browser console for any Firebase errors
