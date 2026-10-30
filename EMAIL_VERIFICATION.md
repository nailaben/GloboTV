# Customer email verification

Email/password registration and checkout verification send six-digit codes through Mailjet SMTP using Nodemailer. Codes expire after 15 minutes and are limited to five incorrect attempts. Google sign-in continues to rely on Google's verified email.

## Render configuration

In the Render web service's **Environment** settings, configure:

- `MAILJET_API_KEY`: Mailjet's public API key (`mailjetUser` is also accepted for compatibility with the supplied mailer example).
- `MAILJET_SECRET_KEY`: Mailjet's private API key (`mailjetPass` is also accepted). Keep it secret and do not commit it to Git.
- `EMAIL_FROM`: optional sender address already verified in Mailjet. If omitted, the app uses `GloboTV <contact.globotv@gmail.com>`.

Save the variables and redeploy the service. The sender can be an individually verified email address; a custom domain is not required for this setup. The `contact.globotv@gmail.com` sender must be active in Mailjet.

## Checkout flow

After the customer signs in and proceeds from the account step to verification, the page requests the codes automatically. The checkout email code is sent to the signed-in customer's account email. The customer enters the six-digit email code in the email verification boxes; WhatsApp is handled separately. The server only accepts the email code if Mailjet accepted the message, and the order remains blocked until the required channels are verified.

If the page reports that email verification is not configured, check that both Mailjet API keys are present in Render and that the configured sender (or the default sender above) is active in Mailjet. Check the Render service logs for Mailjet delivery failures after requesting a code. Saving local `.env` values does not set variables on Render.
