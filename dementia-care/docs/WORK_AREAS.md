# Work areas (what each folder really involves)

Seven areas, not yet assigned. Team of 4.
Each area below says: what it is, what you actually do, skills, who you depend on, who depends on you, how you know you are done.

## 1. app/lib/core - the foundation- Pehla pehla padaav
What it is: the shared base that every screen stands on. If this is late, everyone waits, so it goes first.
What you do: create the Flutter project, connect Firebase, build login and sign-up, load the user's role and open the right mode, set the big-button high-contrast theme, set up routes and a role guard, set up Hindi + English strings,
write shared models and helpers (Firestore read/write, big button, status dot). Write 2 or 3 example screens early so others copy the pattern.
Skills: Flutter and Dart (the OG, OUR beloved "HARSHITA"). Review and organize flutter side
Depends on: firebase (project and config files). Others depend on you for everything.
Done when: the app opens on a real phone, a user logs in, and lands in the right mode.

## 2. app/lib/patient - the patient experience
What it is: what an elderly person with dementia touches 👆. Must be calm, huge buttons, few choices.
What you do (mota-moti tasks): home screen; Games button [the 2 games and difficulty rules]; one-touch SOS; reminders; voice assistant; family connect; profile.
(speech in, reply spoken out); contacts and tap-to-call; location sharing and the geofence check; the screen that shows the pairing code.
Skills: Flutter (learn on a practice app first), some Android permission handling for location. Large area: expect to split it.
Suggested split inside: games | safety (SOS, location, geofence) | daily help (reminders, assistant, calls), profile,
Depends on: core, functions (pairing, assistant), content. Caregiver side depends on you for data (sessions, alerts, location).
Done when: a full patient day works: reminder, game, assistant, SOS, and the phone survives airplane mode.

## 3. app/lib/caregiver - the caregiver experience
What it is: the control centre for family or an NGO. Data-heavy but must stay easy to read.
What you do: enter the pairing code; patient dashboard; alerts list with Acknowledge; live map with the safe zone circle;
trend charts with a plain-language insight; settings (safe zone, reminders, contacts, revoke access); optional NGO multi-patient list.
Skills: Flutter (learn first), charts and maps, a feel for clear information design.
Depends on: core, functions, patient data in Firestore. Pitch depends on you for the demo.
Done when: a caregiver pairs, sees the live dot, gets an alert, acknowledges it, and sees a trend with a flagged change.

## 4. functions - the server side (Python)
What it is: the small amount of trusted server code. Only 3 functions are essential.
What you do: alert push (when an alert doc appears, push to every linked caregiver, remove bad tokens); pairing (create and
link with a code, safely); assistant (add context, call the AI, 8 second timeout, kind fallback); baseline and trend logic;
optional Telegram alerts and scheduled checks (patient offline, low battery, unacknowledged SOS).
Skills: Python (the team's strength), careful with security. Learn Firebase Functions in a throwaway project first.
Depends on: firebase (project, billing, secrets, rules). App depends on you for pairing, push and assistant.
Done when: all functions run in the emulator, deploy, and a test alert reaches a phone.

## 5. firebase - the cloud setup and safety
What it is: the project, the money and the rules. This is the person who owns billing and keys.
What you do: create the Firebase project (asia-south1), switch to Blaze with a budget alert, set up Auth, write and test
Firestore security rules, store secrets, set a spend limit on the AI key, run the emulator, deploy, read logs, keep a security checklist.
Skills: patient and careful; learns tools fast. Pairs naturally with functions.
Depends on: nothing at the start; everyone depends on you in the first hour.
Done when: team members can sign in to the same project, rules tests pass, budget alert exists, no secret is in git.

## 6. content - what the patient reads and sees
What it is: the material that makes games and reminders feel kind and familiar.
What you do: Hindi + English words with images (license-safe, note sources), short stories with 2 or 3 questions each,
difficulty levels, reminder wording, assistant fallback messages, and the language strings for screens.
Skills: language and care in wording; no coding needed at first, simple JSON later.
Depends on: patient games to define the format. Patient depends on you for every game round.
Done when: at least 30 words and 5 stories exist, reviewed by a native Hindi speaker.

## 7. pitch - proving it works
What it is: the demo, the story and the testing. Judges score what they see in 3 minutes.
What you do: write the 3-minute script and judge Q&A; build the deck (with a sourced India statistic); create 30 days of realistic
demo data; run the full flow on two phones again and again; record a backup video; keep a bug list.
Skills: clear thinking, presentation, patience with testing.
Depends on: everything working by about hour 17. Others depend on you for the freeze and rehearsal.
Done when: the demo runs clean three times in a row, with a backup video ready.

## Order of work (rough)
Hour 0-1: firebase and core start together. Hours 1-8: pairing, games, caregiver shell, location. Hours 8-16: SOS, geofence,
alerts, trends, reminders, assistant, deck. Then sleep rotation, bug bash, freeze at hour 19, rehearsal.
