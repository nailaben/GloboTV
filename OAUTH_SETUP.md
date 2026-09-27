# Buyer sign-in provider setup

Email and password registration works independently. To enable social sign-in, create Google OAuth and Meta/Facebook Login web apps, then set these values in `.env`:

```env
PUBLIC_BASE_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-meta-app-id
FACEBOOK_APP_SECRET=your-meta-app-secret
FACEBOOK_GRAPH_VERSION=v22.0
```

Register these exact redirect URIs in each provider's app settings:

- Google: `http://localhost:3000/api/customer/google/callback`
- Facebook: `http://localhost:3000/api/customer/facebook/callback`

For a deployed site, change `PUBLIC_BASE_URL` to the site's HTTPS origin and register the corresponding HTTPS callback URLs. Restart the server after updating `.env`. Keep provider secrets private and out of browser code.
