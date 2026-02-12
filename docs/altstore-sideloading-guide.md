# AltStore Sideloading Guide

## Overview

This guide covers building a local `.ipa` file using `expo prebuild` + Xcode, then sideloading it via AltStore. No paid Apple Developer account is required — AltStore handles code signing with your free Apple ID.

## Prerequisites

- **Mac with Xcode** installed (required to build the `.ipa`)
- **AltServer** running on your Mac ([download](https://altstore.io/))
- **AltStore** installed on your iOS device
- **Developer Mode** enabled on iOS device (Settings > Privacy & Security > Developer Mode)
- **Free Apple ID** (no paid developer program needed)
- iOS device and Mac on the same Wi-Fi network

## Building the IPA

### 1. Generate the native iOS project

```bash
cd apps/mobile
npm run prebuild
```

This runs `expo prebuild --clean`, generating the `ios/` directory with an Xcode project. The `ios/` folder is gitignored — it's regenerated from `app.json` and your Expo config each time.

### 2. Open in Xcode

```bash
open ios/AIFitnessTracker.xcworkspace
```

> **Important:** Open the `.xcworkspace` file, not the `.xcodeproj`.

### 3. Configure signing

1. In Xcode, select the **AIFitnessTracker** project in the navigator
2. Select the **AIFitnessTracker** target
3. Go to **Signing & Capabilities**
4. Check **Automatically manage signing**
5. Select your **Personal Team** (your free Apple ID) from the Team dropdown
6. If prompted about the bundle identifier, let Xcode fix it

### 4. Archive the build

1. Set the build destination to **Any iOS Device (arm64)** (not a simulator)
2. Menu: **Product > Archive**
3. Wait for the archive to complete (this takes a few minutes)

### 5. Export the IPA

1. When archiving finishes, the **Organizer** window opens automatically
2. Select the archive and click **Distribute App**
3. Choose **Custom** > **Development** > **Next**
4. Accept the default options and click **Export**
5. Choose a save location — this produces a folder containing your `.ipa` file

## Installing via AltStore

1. Transfer the `.ipa` file to your iOS device (AirDrop, iCloud Drive, or Files app)
2. Open **AltStore** on your iOS device
3. Go to the **My Apps** tab
4. Tap the **+** button in the top-left corner
5. Navigate to and select the `.ipa` file
6. AltStore re-signs the app with your free Apple ID and installs it
7. The app appears on your home screen as **AI Fitness Tracker**

## App Refresh (7-Day Cycle)

With a free Apple ID, sideloaded apps expire after **7 days**. AltStore handles the refresh process.

### Automatic Refresh

- Keep AltServer running on your Mac
- Ensure your iOS device and Mac are on the same Wi-Fi network
- AltStore refreshes apps automatically in the background when expiration is within 1–2 days
- Enable **Background App Refresh** for AltStore in iOS Settings

### Manual Refresh

1. Open AltStore
2. Go to **My Apps**
3. Tap **Refresh All**
4. Enter your Apple ID password if prompted

### Limitations (Free Apple ID)

- Maximum **3 sideloaded apps** at a time
- Apps expire after **7 days** and must be refreshed
- AltStore must be able to reach AltServer on the same Wi-Fi to refresh

## Backend Connectivity

The sideloaded app works identically to any other build:

- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are embedded at build time via environment variables
- Connects to the same Supabase backend as the web app
- All sync, authentication, and data operations work as expected

### Testing After Install

1. Launch the sideloaded app
2. Sign in with your account
3. Verify sync status in Settings
4. Create a workout and confirm it syncs to the web app
5. Make changes on web and verify they appear on mobile

## When to Rebuild

**Rebuild needed:**

- Changes to mobile UI/UX components
- Mobile dependency updates
- Environment variable changes
- Native module updates
- Version bumps

**No rebuild needed:**

- Supabase schema changes
- Backend API modifications (if backward compatible)
- RLS policy updates

## Troubleshooting

| Issue                            | Fix                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| `prebuild` fails                 | Run `npm run prebuild` again; check `app.json` for config errors                    |
| Xcode signing errors             | Ensure your free Apple ID is added in Xcode > Settings > Accounts                   |
| Archive fails                    | Verify build target is "Any iOS Device (arm64)", not a simulator                    |
| IPA won't install via AltStore   | Check 3-app limit isn't exceeded; ensure Developer Mode is on                       |
| App crashes on launch            | Check that env vars were set before building; verify bundle ID                      |
| Sync not working                 | Check Settings for sync status; verify Supabase dashboard for errors                |
| App expired                      | Refresh via AltStore within 7 days; reinstall if expired (data preserved if synced) |
| CocoaPods errors during prebuild | Run `cd ios && pod install --repo-update` then try archiving again                  |

## Migration to TestFlight

If you later obtain a paid Apple Developer account ($99/year):

```bash
eas build --profile preview --platform ios
eas submit --platform ios
```

No code changes needed — same app, different distribution channel. TestFlight removes the 7-day expiration and 3-app limit.
