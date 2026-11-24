# firebase - plan (suggestions, create your own files)

Cloud setup and safety. Owns billing, keys and the rules.

## Suggested sub-folders (tasks)
- project/      Create the Firebase project, region asia-south1, add the team, enable Auth (email/password), Firestore, Cloud Messaging.
                Switch to Blaze, add a budget alert BEFORE deploying anything. Android app registration and config file.
- rules/        firestore.rules. Start deny-all and open only what each role needs:
                users: own doc only, role not editable; patients: patient + listed caregivers read, caregivers edit zone/reminders/contacts;
                alerts: patient creates, caregivers read and acknowledge; sessions/daily: patient writes, caregivers read;
                pairingCodes: no client access. Test every rule with a wrong user.
- secrets/      Store AI key and Telegram token as Firebase secrets. Set a spend limit on the AI key. Document names, never values.
- emulator/     Emulator setup for Auth, Firestore, Functions so everyone can test without cost. Short how-to for the team.
- deploy/       Deploy steps for functions and rules, how to read logs, free-tier usage watch.
- security/     One checklist: rules tested, no secrets in git, budget alert, hashed expiring pairing codes, consent screen, delete-my-data.

## Talks to
Everyone in the first hour (project access). functions (secrets, deploy), core (config files).

## Done when
Everyone can sign in to the same project, rules tests pass, budget alert exists, no secret is in git.

## Watch out
Warn the team before anything that costs money. Never commit service account files or keys.
