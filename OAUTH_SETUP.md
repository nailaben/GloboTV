# Google buyer sign-in setup

Email and password registration works independently. To enable Google sign-in, create a Google OAuth web app, then set these values in `.env`:

```env
PUBLIC_BASE_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Register this exact redirect URI in Google Cloud:

- Google: `http://localhost:3000/api/customer/google/callback`

For a deployed site, set `PUBLIC_BASE_URL` in the hosting provider's environment variables to the site's HTTPS origin (for example, `https://your-service.onrender.com`, without a trailing slash). Register this exact redirect URI in Google Cloud:

`https://your-service.onrender.com/api/customer/google/callback`

The origin and callback URI must match exactly, including `https` and any custom domain. Restart/redeploy the server after changing environment variables. Keep provider secrets private and out of browser code.
