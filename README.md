# Mobolaji & Oyekoya

An animated, mobile-first wedding invitation built with React, Vite, TypeScript, Tailwind CSS and Motion. Original PDF logo faithfully rendered and cropped only to remove blank page margins. No redesigned monogram.

## Run locally

Node 22 recommended (Node 20.20+ also works).

```sh
npm ci
npm run dev
npm run build
npm test
npm run preview
```

`dist/` is the complete deployment artifact. RSVP submission is deliberately blocked on localhost and development builds: a local preview must never claim it saved a guest's reply.

## Edit wedding details

Everything editable is in **src/wedding.json**. Rebuild after changing it; social metadata and preview are generated from the same configuration.

- `couple`, `theme`, `date`: display content and calendar date.
- `countdownAt`: ISO timestamp with explicit UTC offset. Currently midnight on the wedding day in West Africa Time, **an assumption to confirm**, not the ceremony time. Update `timezone` and `timezoneNote` together if needed.
- `events`: ceremony/reception description, time label, venue, address, `mapsQuery`. Directions appear once a real address is configured. Optional `start` and `end` must both be ISO timestamps with timezone offset. Until supplied, calendars save an all-day date and clearly state times are pending.
- `dressCode`, `dressNote`, `colours`: currently provisional wording and requested palette.
- `coverImage`, `coverImageAlt`, `coverImagePosition`: opening portrait and its responsive focal point.
- `photos`: gallery objects with `src`, `alt`, `caption`, `width`, and `height`. Place files in `public/photos/`. The five supplied couple photographs are optimized as WebP without retouching faces or changing colours. Three appear in the editorial gallery.
- `rsvp.photo`: candid photograph and caption beside the RSVP.
- `sections.gallery`, `sections.story`, `sections.gifts`: show/hide sections. Story and gifts default off.
- `story`, `gifts`: provide real content before enabling. Registry URL must use HTTPS; optional account information and copy button are supported.
- `rsvp.maxGuests`: defaults to one guest per response; set the permitted party size.
- `rsvp.deadline`: optional YYYY-MM-DD label. It is informational, not an enforced cutoff.
- `notifications.recipients`: both wedding notification recipients and the recipients of the fallback contact-email link. The server-side Resend notification function reads this list directly.
- `notifications.subject`: subject used by the form notification emails.
- `siteUrl`: update if the preferred Netlify name is unavailable; rebuild to update WhatsApp link, canonical, sitemap and social preview.

The source logo is `public/wedding-logo-original.pdf`. The unchanged rendered design is `public/wedding-logo.png`. Do not distort or recolour it. The social preview `dist/og-image.jpg` uses this same logo at 1200 × 630. WhatsApp reads these public Open Graph tags once the site is deployed; its cache can delay refreshed previews.

## GitHub deployment

Create an empty repository in your GitHub account, then run from this directory, replacing YOUR_ACCOUNT:

```sh
git init -b main
git add .
git commit -m "Build Mobolaji and Oyekoya wedding invitation"
git remote add origin https://github.com/YOUR_ACCOUNT/mobolajiandoyekoya.git
git push -u origin main
```

No credentials or guest data belong in Git. The repository includes no API keys. `.gitignore` excludes dependencies, build outputs and environment files.

## Netlify deployment

1. In Netlify, import the GitHub repository as a new project.
2. Use build command `npm run build`, publish directory `dist`, and Node 22. These are already set in `netlify.toml`.
3. Set the project/site name to **mobolajiandoyekoya** if available. This yields `https://mobolajiandoyekoya.netlify.app`. The project cannot reserve that name from source code.
4. **Enable form detection in Forms**, then redeploy. The build generates the static `wedding-rsvp` discovery form required for React applications. Verify that `wedding-rsvp` appears in the Netlify Forms dashboard.
5. Submit a clearly identified test RSVP on the deployed website. Check both the thank-you state and the record in Netlify Forms. Check the spam folder if needed. Delete your test record through the dashboard when finished.
6. Configure Resend as described below. Guest confirmation is shown immediately on the website after a successful POST; automatic guest email is not configured or promised.
7. Confirm venue/time, timezone assumption, guest allowance, dress code and photographs before distributing invitations.

Deploy through the Git-connected Netlify build so both the website and server-side notification function are deployed. Uploading only `dist` does not deploy the Resend function.

Official documentation: [Netlify Forms setup](https://docs.netlify.com/manage/forms/setup/) and [submission management](https://docs.netlify.com/manage/forms/submissions/).

## RSVP security and limitations

Netlify Forms provides server-side storage accessed through the authenticated Netlify dashboard. Nothing is stored in public files or browser storage. The form uses HTTPS after deployment, a honeypot, native required/email validation, length limits, consent, and a minimal set of fields. Network or non-2xx failures show an error without a confirmation. Keep Netlify account access limited to the planning team; configure retention and delete responses when no longer required. Form submissions and capacity are subject to your Netlify plan.

This is a public RSVP, not an invitation-code access system. Client validation and guest limits are usability constraints, not server-side authorization. Review unwanted or duplicate submissions in Netlify. For per-invite limits, add an authenticated invitation backend before distributing private codes.

## Accessibility and performance

Keyboard-accessible controls, visible focus, skip navigation, labelled fields, inline error messages, focused success state, reduced-motion support, explicit timezone countdown and responsive mobile layout. Countdown updates are deliberately not announced every second to assistive technology. Hero image is local WebP; optional gallery images lazy-load. Static assets are hashed and cached, with security headers in `netlify.toml`. Fonts use Google Fonts with system fallbacks. The opening, gallery and RSVP use the couple’s supplied photographs. Original source files in Downloads are unchanged.

## Verification

`npm run build` checks TypeScript and creates production output. `npm test` covers countdown boundaries, UTC conversion, all-day calendar semantics, calendar download and Netlify/SEO build output. Browser checks cover invitation opening, navigation, mobile layout and local RSVP error handling. Production RSVP persistence and subdomain availability require the Netlify account deployment steps above.

## Resend email notifications

RSVPs remain securely saved in Netlify Forms. After a verified submission, Netlify invokes `netlify/functions/submission-created.mjs`, which sends one Resend email addressed to BOTH recipients from `src/wedding.json`:

- bolajiosakuade@yahoo.com
- Orilionxyz@gmail.com

The email includes the guest’s name, email, attendance, party size and full optional message. Reply-To is the guest’s email. The guest receives the existing on-page confirmation; no automatic guest email is sent. This integration covers wedding RSVPs and their messages, not Netlify account/billing alerts or inbound mailbox forwarding.

### Activate delivery

1. In Resend, verify a sending domain you own and create a **Sending access** API key for that domain. The Yahoo/Gmail addresses above are recipients, not sending domains you can verify. A `netlify.app` subdomain does not give you DNS ownership for Resend domain verification.
2. In Netlify project environment variables, add these with **Functions** scope:
   - `RESEND_API_KEY`: your secret Resend key.
   - `RESEND_FROM_EMAIL`: a sender on the verified domain, e.g. `Mobolaji & Oyekoya <rsvp@your-verified-domain.com>`.
3. Keep secrets out of `src/wedding.json`, Git, browser code and all `VITE_` variables. Do not paste the API key into chat.
4. Deploy the repository through Netlify. Keep Forms detection enabled. No Netlify email notification rules or HTTP webhook are needed; the reserved event-function filename connects verified submissions automatically. Disable any duplicate Netlify email rules if previously created.
5. Submit one clearly labelled test RSVP on the live site. Confirm the saved record in Netlify Forms, a successful function invocation, and **delivery to both inboxes** in Resend and the email accounts. API acceptance is not proof of inbox delivery; check Resend delivery/bounce status too.

**Status:** integration implemented and tested with mocked Resend responses. Live email has not been sent or verified; credentials, a verified sender and deployment are still required.

### Failure handling

The function is invoked only after Netlify saves and verifies the RSVP. Netlify validates event signatures, so this is not an unauthenticated public email-sending endpoint. Recipients are fixed by server-side configuration, never taken from form input. HTML values are escaped, no raw guest payloads or credentials are logged, and transient network/429/5xx failures retry up to three times. Retries use the same submission-based idempotency key; Resend deduplicates matching requests for 24 hours.

If delivery fails, the RSVP remains saved and the function reports an error in Netlify logs. Check Forms and function logs during the RSVP period. There is no durable email retry queue: resolve configuration/delivery issues and recover missed messages from the saved responses. Do not tell guests to resubmit just because notification email failed.

References: [Netlify event functions](https://docs.netlify.com/build/functions/trigger-on-events/), [Resend send email API](https://resend.com/docs/api-reference/emails/send-email), [Resend idempotency](https://resend.com/blog/engineering-idempotency-keys).

## Background music and venue

`music` in `src/wedding.json` controls the supplied looping track, its credit and initial volume. Audio loads only on interaction, starts when the invitation opens, and can be paused/resumed using the fixed music control. Browsers require a guest gesture before audible playback; a direct section link leaves the play control available. Pausing is respected during subsequent navigation.

`location` contains the supplied Citiview Estate (by Propertymart) address and Google Maps search query. It is shown as the wedding location and included in save-the-date calendars. Individual ceremony/reception venue assignments remain pending until confirmed.
