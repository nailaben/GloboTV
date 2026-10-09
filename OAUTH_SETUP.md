# Google buyer sign-in setup

Email and password registration works independently. To enable Google sign-in, create a Google OAuth web app, then set these values in `.env`:

```env
PUBLIC_BASE_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Register this exact redirect URI in Google Cloud:

- Google: `http://localhost:3000/api/customer/google/callback`

For a deployed site, change `PUBLIC_BASE_URL` to the site's HTTPS origin and register the corresponding HTTPS callback URLs. Restart the server after updating `.env`. Keep provider secrets private and out of browser code.
