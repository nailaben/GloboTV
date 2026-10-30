# Customer email verification

Email/password registration now sends a six-digit code through Resend. The code expires after 15 minutes and is limited to five attempts. Google sign-in continues to rely on Google's verified email.

## Render setup

1. Create a Resend account and verify the domain you will send from.
2. Create a Resend API key.
3. In the Render web service environment, set:

   - `RESEND_API_KEY` to the API key.
   - `EMAIL_FROM` to a sender on the verified domain, for example `GloboTV <auth@yourdomain.com>`.

4. Save the environment variables and redeploy the service.

The verification table is created automatically in the app's configured PostgreSQL schema when registration or verification is first used. No manual SQL migration is required.
