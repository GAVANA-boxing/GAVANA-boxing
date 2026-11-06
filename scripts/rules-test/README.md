# Firestore rules tests (privacy)

Checks that the public `users` docs can't hold an email, that `users_private`
is owner-only, and that `users/{uid}/fcmTokens` is owner-only. Runs against
the local emulator (needs Java).

```bash
cd scripts/rules-test
npm i --no-save firebase-tools@13 @firebase/rules-unit-testing@3 firebase@10
npx firebase emulators:exec --only firestore --project demo-gavana "node rules.test.mjs"
```

Every line should start with `PASS`.
