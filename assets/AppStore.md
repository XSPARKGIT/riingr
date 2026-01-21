# iOS App Store Connect Replacement Guide

This guide explains how to configure a **new iOS project** to replace the existing "Riingr" app in App Store Connect and TestFlight. Following these steps ensures the new app will be recognized as an **update** to the existing app, not a new app.

---

## ⚠️ Critical Requirements

These values **MUST** match exactly for App Store Connect to recognize it as the same app:

### 1. Bundle Identifier (REQUIRED)
```
com.xschatapp.app
```
- **Xcode**: Target → General → Bundle Identifier → Set to `com.xschatapp.app`
- **Cordova/PhoneGap**: Update `config.xml` widget `id` attribute to `com.xschatapp.app`
- **React Native**: Update `ios/PROJECT_NAME/Info.plist` → `CFBundleIdentifier` to `com.xschatapp.app`
- **Native iOS**: Update `Info.plist` → `CFBundleIdentifier` to `com.xschatapp.app`

### 2. App Name (Display Name)
```
Riingr
```
- **Xcode**: Target → General → Display Name → Set to `Riingr`
- **Info.plist**: `CFBundleDisplayName` → `Riingr`
- **Cordova**: `config.xml` → `<name>Riingr</name>`

### 3. Apple Developer Account
- **MUST** use the **same Apple Developer account/team** that created the original app
- **MUST** use the **same Team ID** for code signing

---

## 📱 Version & Build Numbers

### Current Version
- **Current Version**: `1.0.0`
- **Current Build**: `1.0.0`

### New Version Requirements
- **Version Number**: Must be **higher** than `1.0.0`
  - ✅ Good: `1.0.1`, `1.1.0`, `2.0.0`
  - ❌ Bad: `1.0.0`, `0.9.0`

- **Build Number**: Must be **higher** than the last uploaded build
  - Check App Store Connect → TestFlight → Builds to see the highest build number
  - Increment accordingly (e.g., if last build was `1.0.0`, use `1.0.1` or higher)

### Where to Set Version

**Xcode:**
- Target → General → Version: `1.0.1` (or higher)
- Target → General → Build: `1.0.1` (or higher)

**Info.plist:**
```xml
<key>CFBundleShortVersionString</key>
<string>1.0.1</string>
<key>CFBundleVersion</key>
<string>1.0.1</string>
```

**Cordova config.xml:**
```xml
<widget id="com.xschatapp.app" version="1.0.1" ...>
```

---

## 🔐 Code Signing & Certificates

### Required Certificates
1. **Distribution Certificate** (valid and not expired)
2. **App Store Provisioning Profile** for `com.xschatapp.app`
3. **Same Team ID** as the original app

### Steps in Xcode
1. Open Xcode → Preferences → Accounts
2. Add/Select your Apple Developer account
3. Download certificates and provisioning profiles
4. In Target → Signing & Capabilities:
   - Select **Automatically manage signing**
   - Choose your **Team** (must match original app's team)
   - Verify Bundle Identifier is `com.xschatapp.app`

### Manual Provisioning (if needed)
- Go to [Apple Developer Portal](https://developer.apple.com/account)
- Certificates, Identifiers & Profiles
- Ensure App ID `com.xschatapp.app` exists
- Create/Download App Store Distribution Provisioning Profile

---

## 📋 Info.plist Configuration

Your `Info.plist` must include these keys and values:

### Basic App Information
```xml
<key>CFBundleIdentifier</key>
<string>com.xschatapp.app</string>

<key>CFBundleDisplayName</key>
<string>Riingr</string>

<key>CFBundleShortVersionString</key>
<string>1.0.1</string> <!-- Increment from 1.0.0 -->

<key>CFBundleVersion</key>
<string>1.0.1</string> <!-- Increment from 1.0.0 -->
```

### iOS Deployment Target
```xml
<!-- Minimum iOS version -->
IPHONEOS_DEPLOYMENT_TARGET = 13.0
```
- **Xcode**: Target → General → Deployment → iOS 13.0
- **Cordova**: `config.xml` → `<preference name="deployment-target" value="13.0" />`

### Required Permissions (Privacy Descriptions)

These are **required** for App Store review. Include all of them:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to your camera to take photos and videos for sharing in chat.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to your photo library to share images in chat.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>This app needs to save photos to your library.</string>

<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to your microphone to record voice messages.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>This app may use your location for sharing.</string>
```

### Network Security (App Transport Security)
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>supabase.co</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### Orientation Settings
```xml
<key>UIInterfaceOrientation</key>
<array>
    <string>UIInterfaceOrientationPortrait</string>
</array>

<key>UISupportedInterfaceOrientations</key>
<array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationPortraitUpsideDown</string>
</array>
```

---

## 🎨 App Icons

### Required Icon Sizes
Your app must include all required icon sizes in the AppIcon asset catalog:

- **1024x1024** (App Store)
- **180x180** (iPhone 6 Plus and later)
- **120x120** (iPhone 6 and later)
- **60x60** (iPhone 4s and earlier)
- **76x76** (iPad)
- **152x152** (iPad Retina)
- **40x40** (iPad)
- **80x80** (iPad Retina)

### Location
- **Xcode**: `Assets.xcassets/AppIcon.appiconset/`
- **Cordova**: `platforms/ios/PROJECT_NAME/Assets.xcassets/AppIcon.appiconset/`

### Icon Source
- Use `appstore.png` (1024x1024 square with padding) as the master icon
- Generate all sizes from this master icon

---

## 📦 Build & Archive Process

### 1. Clean Build
```bash
# In Xcode: Product → Clean Build Folder (Shift+Cmd+K)
```

### 2. Select Generic iOS Device
- In Xcode, select **"Any iOS Device (arm64)"** or **"Generic iOS Device"** from the device dropdown
- Do NOT select a simulator

### 3. Archive
- **Xcode**: Product → Archive
- Wait for the archive to complete

### 4. Validate & Upload
- In Organizer window, click **"Distribute App"**
- Select **"App Store Connect"**
- Select **"Upload"**
- Follow the wizard:
  - Select your distribution certificate
  - Select your provisioning profile
  - Click **"Upload"**

### 5. Verify in App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app → TestFlight
3. Wait for processing (usually 5-30 minutes)
4. The new build should appear as an **update** to the existing app

---

## ✅ Pre-Upload Checklist

Before uploading, verify:

- [ ] Bundle ID is exactly `com.xschatapp.app`
- [ ] App name (Display Name) is `Riingr`
- [ ] Version number is higher than `1.0.0`
- [ ] Build number is higher than the last uploaded build
- [ ] iOS Deployment Target is `13.0` or lower
- [ ] All required permissions are in Info.plist with descriptions
- [ ] App icons are included in all required sizes
- [ ] Code signing uses the same Team ID as the original app
- [ ] Distribution certificate is valid and not expired
- [ ] App Store provisioning profile is valid
- [ ] Archive is built for "Generic iOS Device" (not simulator)

---

## 🔄 What Happens After Upload

### TestFlight
- ✅ New build appears as an **update** to existing app
- ✅ Testers see it as an update notification
- ✅ Previous build remains available for rollback

### App Store (if published)
- ✅ New build appears as an **update** in App Store Connect
- ✅ Users will see it as an app update (not a new app)
- ✅ App Store listing, reviews, and ratings are preserved

### Users
- ✅ Existing users see it as an **update** in the App Store
- ✅ App data and settings are preserved
- ✅ No need to re-download as a new app

---

## 🚨 Common Issues & Solutions

### Issue: "Bundle ID already exists"
**Solution**: This is expected! It means the bundle ID is already registered. You're updating the existing app, which is correct.

### Issue: "Version must be higher"
**Solution**: Increment the version number. Check App Store Connect for the current version.

### Issue: "Invalid provisioning profile"
**Solution**: 
- Ensure you're using the **App Store Distribution** profile (not Development or Ad Hoc)
- Verify the profile is for bundle ID `com.xschatapp.app`
- Download the latest profile from Apple Developer Portal

### Issue: "Code signing error"
**Solution**:
- Verify your Team ID matches the original app
- Ensure your Distribution certificate is valid
- Try "Automatically manage signing" in Xcode

### Issue: "App appears as new app, not update"
**Solution**:
- Double-check bundle ID is exactly `com.xschatapp.app` (no typos)
- Verify you're using the same Apple Developer account
- Check Team ID matches the original app

---

## 📝 Summary

**To replace your app in App Store Connect:**

1. ✅ Use bundle ID: `com.xschatapp.app`
2. ✅ Use app name: `Riingr`
3. ✅ Increment version/build number
4. ✅ Use same Apple Developer account/team
5. ✅ Include all required Info.plist entries
6. ✅ Archive and upload to App Store Connect

**Result**: The new project will be recognized as an **update** to the existing app, preserving your TestFlight testers, App Store listing, and user base.

---

## 📞 Support

If you encounter issues:
1. Check App Store Connect → Activity for error messages
2. Verify all checklist items above
3. Check Xcode → Window → Organizer for archive details
4. Review Apple Developer Portal for certificate/profile status

---

**Last Updated**: Based on current project configuration (Version 1.0.0, Bundle ID: com.xschatapp.app)
