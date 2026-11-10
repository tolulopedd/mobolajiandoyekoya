import { deliverNotification } from '../../server/rsvp-notification.mjs';

// Netlify's reserved event filename subscribes to verified form submissions.
// Netlify verifies the event signature before invoking this handler.
export async function handler(event) {
  const { payload } = JSON.parse(event.body || '{}');
  const result = await deliverNotification(payload);
  if (!result.skipped) console.info('Wedding notification accepted by Resend', { emailId: result.emailId });
  return { statusCode: 200, body: '' };
}
