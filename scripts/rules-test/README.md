# Firestore rules tests (privacy)

Checks that the public `users` docs can't hold an email, that `users_private`
is owner-only, and that `users/{uid}/fcmTokens` is owner-only. Runs against
the local emulator (needs Java).

```bash
npm --prefix scripts/rules-test ci     # once — this folder has its own dependencies
npm run test:rules                     # from the repo root
```

The emulator config is `firebase.rules-test.json` at the repo root (the Firebase CLI refuses
rules files outside its project directory, so the config can't live in this folder). Never
install these packages in the root: `firebase@10` here would replace the app's `firebase@12`.

Every line should start with `PASS`.
