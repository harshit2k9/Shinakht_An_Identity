# functions - plan (suggestions, create your own files)

Python Cloud Functions (2nd gen), region asia-south1. Create the project with `firebase init functions` (Python).
Practise first in a throwaway project: emulator, dummy function, secret, logs.

## Suggested sub-folders / files (tasks)
- alerts/       send_alert_push: Firestore trigger when an alert doc is created. Read patients/{pid}.caregivers,
                get each fcmToken, send a HIGH priority push, remove invalid tokens, never crash.
- pairing/      create_pairing_code (patient only, 6 digits, store only a hash, 10 min, single use) and
                link_with_code (caregiver only, validate, ArrayUnion into caregivers, limit wrong attempts).
- assistant/    assistant_chat callable: text, language, last few turns in; {reply, action} out. Add context (patient name,
                time, reminders, contact names). 8 second timeout, kind fallback. System prompt: calm, short, patient,
                no medical advice, redirect worries to the caregiver. Provider switch (Claude or Gemini) lives only here.
- analytics/    Per-patient baseline (rolling mean and standard deviation, or regression) from sessions. Flag an unusual drop
                against the person's own baseline. Write daily summaries. Plain-language insight line.
- telegram/     Optional. Bot alerts for SOS and geofence. Token as a secret.
- watchdog/     Optional (needs Cloud Scheduler on Blaze). Patient offline, low battery, unacknowledged SOS.
- shared/       auth checks (require login, require role, require caregiver-of-patient), one place for settings and limits.

## AI provider and cost
- Claude API: paid, pay-as-you-go after a small trial credit. A demo costs cents. Set a spend limit.
- Gemini: the free API tier is separate from the student Google AI Pro plan. The student plan does NOT include API access.
  Get an API key in Google AI Studio. Free tier has tight limits and free-tier content may be used to improve Google products,
  so use demo data only.
- Keys only as Firebase secrets. Never in code or git.

## Talks to
firebase (project, rules, secrets, billing), patient and caregiver apps (they call the callables).

## Done when
All functions run in the emulator, deploy, and a test alert reaches a phone.

## Watch out
Check auth in every callable. Be careful about cost: low max instances, budget alert on.
