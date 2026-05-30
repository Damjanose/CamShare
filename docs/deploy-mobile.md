# Mobile Deploy Pipeline (Android + iOS)

Builds and store submissions are handled by **EAS Build** (Expo Application Services).  
All commands run **locally** — the actual compilation happens on EAS cloud servers.

---

## Project details

| Field | Value |
|---|---|
| EAS owner | `damjanoda` |
| EAS project ID | `4b1def76-d974-409e-91a7-0be8950aec8f` |
| iOS bundle ID | `com.damjano.camshare` |
| iOS App Store Connect app ID | `6772641876` |
| iOS Apple Team ID | `R72R8C56GK` |
| Android package | `com.damjano.camshare` |
| Android submit track | `internal` |
| Production API | `https://camshare.uplisoft.com/api` |

---

## Prerequisites

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Log in to Expo

```bash
eas login
# account: damjanoda
```

### 3. Credentials files (keep out of git)

Place these files inside `apps/mobile/` before submitting:

| File | Purpose |
|---|---|
| `asc-api-key.p8` | App Store Connect API key (already present) |
| `google-play-service-account.json` | Google Play service account for auto-submit |

---

## Build for production

Run all commands from `apps/mobile/`.

```bash
cd apps/mobile
```

### Android (AAB — Google Play)

```bash
eas build --platform android --profile production
```

Output: `.aab` bundle uploaded to EAS dashboard.

### iOS (IPA — App Store)

```bash
eas build --platform ios --profile production
```

Output: signed `.ipa` uploaded to EAS dashboard.

### Both platforms at once

```bash
eas build --platform all --profile production
```

---

## Check build status

```bash
eas build:list --limit 5
```

Or open the EAS dashboard:  
`https://expo.dev/accounts/damjanoda/projects/camshare/builds`

---

## Submit to stores

After a build completes, submit using the `production` submit profile defined in `eas.json`.

### Android → Google Play (internal track)

```bash
eas submit --platform android --profile production
```

Requires `google-play-service-account.json` in `apps/mobile/`.

### iOS → App Store Connect

```bash
eas submit --platform ios --profile production
```

Uses `asc-api-key.p8` + the key/issuer IDs already set in `eas.json`.

### Build + submit in one command

```bash
eas build --platform all --profile production --auto-submit
```

---

## Versioning

`eas.json` sets `"appVersionSource": "remote"` — build-level version numbers (`versionCode` on Android, `buildNumber` on iOS) are managed on EAS servers, not in `app.json`. Do **not** add `versionCode` or `buildNumber` to `app.json`.

The **marketing version** (`1.0.2`, shown to users) lives in `app.json → "version"` and is updated manually.

### Version number reference

| Field | Where it lives | Who manages it | Example |
|---|---|---|---|
| Marketing version | `app.json → "version"` | You, manually | `1.0.2` |
| Android versionCode | EAS remote | EAS (auto-increments) | `2` |
| iOS buildNumber | EAS remote | EAS (auto-increments) | `2` |

### Checking current version codes

```bash
eas build:version:get --platform android
eas build:version:get --platform ios
```

### Before every release — bump version codes

EAS auto-increments on each build when using `appVersionSource: "remote"`. If you hit a **"version code already used"** error, bump manually:

```bash
cd apps/mobile
eas build:version:set --platform android   # enter the next integer (e.g. 2, 3, 4…)
eas build:version:set --platform ios       # same
```

> **Rule:** versionCode/buildNumber must be strictly increasing. If the last submitted build used `2`, set it to `3` or higher.

### Bumping the marketing version

Edit `app.json → "version"` before a new public release:

```json
"version": "1.0.3"
```

### Release log — update this table each time you ship

| Date | Marketing version | Android versionCode | iOS buildNumber | Notes |
|---|---|---|---|---|
| 2026-05-28 | 1.0.2 | 1 | — | First Play Store submission |
| — | — | — | — | — |

---

## Build profiles

| Profile | Distribution | Android output | iOS config | API target |
|---|---|---|---|---|
| `development` | internal | APK (dev client) | Debug | — |
| `preview` | internal | APK | Release | production API |
| `production` | store | AAB | Release | production API |

---

## Notes

- EAS builds run on Expo cloud — no local Android SDK or Xcode required.
- iOS builds require valid Apple credentials managed by EAS (managed credentials flow). If credentials expire, run `eas credentials` to rotate them.
- Android signing keys are stored on EAS. To download a copy: `eas credentials --platform android`.
- After submitting to Google Play internal track, promote to production manually in the Play Console.
- After submitting to App Store Connect, the build must pass review before going live — submit for review in App Store Connect or via `eas submit` with `--latest`.
