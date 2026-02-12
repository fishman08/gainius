# AltStore Sideloading Guide

## Prerequisites

- Mac or Windows computer with [AltServer](https://altstore.io/) installed
- AltStore app installed on iOS device (iOS 14.0+)
- Developer Mode enabled on iOS device (Settings > Privacy & Security > Developer Mode)
- Apple ID credentials (free account works, no paid developer program needed)
- iTunes and iCloud installed (from Apple, not Microsoft Store on Windows)
- iOS device and computer on the same Wi-Fi network
- USB cable for initial AltStore setup

## Building the IPA

1. Navigate to the mobile app directory:

   ```bash
   cd apps/mobile
   ```

2. Ensure you're logged into EAS:

   ```bash
   eas login
   ```

3. Run the build:

   ```bash
   npm run build:altstore
   ```

4. Wait for the build to complete (typically 15-30 minutes)

5. EAS provides a download link in the terminal and on the [EAS dashboard](https://expo.dev/accounts/alexsalman/projects/ai-fitness-tracker/builds)

6. Download the `.ipa` file to your computer

### Build Verification

- Check the EAS dashboard — build status should show "Finished"
- Confirm file size is reasonable (typically 50-150 MB)

## Installing via AltStore

1. Open AltServer on your computer (system tray / menu bar)
2. Connect iOS device via USB (first time only)
3. In AltServer, select "Install AltStore" and choose your device
4. Enter Apple ID credentials when prompted
5. Trust the developer certificate on iOS: Settings > General > VPN & Device Management
6. Open AltStore on your iOS device
7. Tap the "My Apps" tab
8. Tap "+" to sideload an app
9. Navigate to the downloaded `.ipa` file (transfer via Files app or AirDrop)
10. AltStore installs the app (1-2 minutes)
11. The app appears on your home screen as "AI Fitness Tracker"

### Limitations (Free Apple ID)

- Maximum 3 sideloaded apps at once
- Apps expire after 7 days and must be refreshed
- AltStore must refresh apps while device and computer are on the same Wi-Fi
- Enable Background Refresh for AltStore to auto-refresh

## Refreshing Apps

### Automatic

- Keep AltServer running on your computer
- Ensure device and computer are on the same Wi-Fi
- AltStore refreshes apps automatically in the background when expiration is within 1-2 days

### Manual

1. Open AltStore
2. Go to "My Apps"
3. Tap "Refresh All"
4. Enter Apple ID password if prompted

## Backend Connectivity

The sideloaded app works identically to any other build:

- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are embedded at build time
- Connects to the same Supabase backend as the web app
- All sync, authentication, and data operations work as expected
- Vercel backend is unaffected — it only serves the web app

### Testing

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
- Vercel configuration changes

## Troubleshooting

| Issue                 | Fix                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------- |
| Build fails on EAS    | Check logs in EAS dashboard; run `npm run typecheck` locally                        |
| IPA won't install     | Verify 3-app limit not exceeded; ensure Developer Mode is on                        |
| App crashes on launch | Check env vars are embedded; verify bundle ID matches provisioning                  |
| Sync not working      | Check Settings for sync status; verify Supabase dashboard for errors                |
| App expired           | Refresh via AltStore within 7 days; reinstall if expired (data preserved if synced) |

## Migration to TestFlight

If you later want TestFlight distribution:

```bash
npm run build:preview
eas submit --platform ios
```

No code changes needed — same app, different distribution channel.
