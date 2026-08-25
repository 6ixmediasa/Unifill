# Unifill Android App

Unifill is an Android-first, local-first contractor estimating and invoicing app built with React Native, Expo, TypeScript and SQLite.

## Product promise

- Always free; no subscription or premium tier.
- Unlimited estimates, invoices, clients and jobs.
- Core business functionality works offline.
- All business records are stored locally on-device.
- Complete one-file backup/restore for moving phones.
- Google AdMob funds the free app, with conservative placement and test IDs outside production builds.
- No signup, login, backend or Unifill cloud account.

## Current implemented screens/features

- 5-screen onboarding explaining Always Free, offline use, local data and ad-funded model.
- Business setup and editable business profile/logo.
- Home dashboard and quick actions.
- Global search.
- Client CRUD, archive/restore, call/email/SMS shortcuts.
- Job CRUD, archive/restore, linked client/documents/expenses and attachments.
- Estimate CRUD, reusable price-book items, taxes, discounts, status, duplication, conversion to invoice, PDF/share/print.
- Invoice CRUD, partial payments, payment edit/delete/recalculation, duplication, void/archive, PDF/share/print.
- Three selectable invoice/estimate PDF styles: Clean Standard, Premium Modern and Compact Practical.
- Customer touch-signature capture stored locally and included in PDF/backups.
- Photos/files selected from the device, included in backups and image attachments included in PDFs.
- Saved item/price book CRUD and duplication.
- Expense CRUD and receipt image selection.
- Reports with month/last month/year/all/custom ranges.
- Local reminders with create/edit/delete.
- Backup reminders.
- Full backup/export/restore and CSV exports.
- Light/dark/system appearance.
- Google UMP consent handling and Ad Privacy Choices.
- About screen with version and Contact Developer link to https://www.6ixmediasa.com.

## Android identity

- App name: `Unifill`
- Package: `com.sixmediasa.unifill`
- Version: `1.0.0`
- Version code: `1`

**Do not publish a different app with this package name first. Google Play package names are permanent once published.**

## AdMob

Production IDs are already centralized:

- App ID: `ca-app-pub-4506776618810594~2864195386`
- Banner: `ca-app-pub-4506776618810594/5514409454`
- Interstitial: `ca-app-pub-4506776618810594/5319073539`

Development/preview builds use Google's official test configuration. Production EAS builds use the Unifill production IDs.

## Install dependencies

Use Node.js compatible with Expo SDK 57, then from this folder:

```bash
npm install
npx expo install --fix
npx expo-doctor
```

The project deliberately uses a development build rather than Expo Go because Google Mobile Ads contains custom native Android code.

## Create a development build

```bash
npm install -g eas-cli
eas login
eas init
npm run build:dev
```

Install the resulting APK on an Android device, then run:

```bash
npm start
```

## Create the Play Store AAB

After testing and configuring your Expo/EAS project:

```bash
npm run build:production
```

The `production` profile builds an Android App Bundle (`.aab`) and switches the app to the real Unifill AdMob configuration.

## Important release tasks

Before Google Play submission:

1. Run the app on at least one real Android device.
2. Test create/edit/delete/archive flows and invoice calculations.
3. Perform a full backup round trip on a clean install.
4. Confirm Google UMP messaging is configured in AdMob Privacy & messaging.
5. Host a privacy policy on a public URL.
6. Host `app-ads.txt` on the developer website and verify it in AdMob.
7. Complete Play Console Data Safety, Ads, Content Rating and App Access declarations accurately.
8. Generate final Play Store screenshots from the real application build.
9. Upload the production `.aab` to an internal/closed testing track before production.

## Development status

The source package was generated and statically syntax-checked in this workspace. Native dependencies were not installed or compiled in this environment, so a real Android development build is the next required QA gate before calling the app store-ready.
