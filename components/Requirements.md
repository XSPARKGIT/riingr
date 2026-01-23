# iOS App Icon Conversion Guide for App Store Connect

This guide explains how to convert and prepare app icons for iOS App Store Connect submission. It covers the complete process from source image to Xcode asset catalog.

---

## 📋 Overview

iOS apps require multiple icon sizes for different devices and contexts. App Store Connect validation will **fail** if required icons are missing or incorrectly sized. This guide shows you how to:

1. Prepare your source icon
2. Generate all required sizes
3. Place them in the correct Xcode asset catalog location
4. Configure `Contents.json` properly
5. Verify everything is correct

---

## 🎨 Step 1: Prepare Your Source Icon

### Requirements for Master Icon

- **Size**: 1024x1024 pixels (square)
- **Format**: PNG (no transparency for App Store icon)
- **Design**: 
  - Square design with padding (iOS will add rounded corners automatically)
  - High resolution, crisp edges
  - No text that's too small (will be unreadable at small sizes)
  - Simple, recognizable design

### Source Icon Location

For Cordova/PhoneGap projects:
```
PROJECT_ROOT/resources/ios/icon/
```

For React Native projects:
```
PROJECT_ROOT/assets/icon.png
```

For Native iOS projects:
```
PROJECT_ROOT/Assets.xcassets/AppIcon.appiconset/
```

**Example**: `/Users/xspark2/Desktop/DESKTOP/X-Lite/x-lite-mobile/resources/ios/icon/appstore.png`

---

## 📐 Step 2: Required Icon Sizes

iOS requires these specific icon sizes. **All of them must be present** for App Store Connect validation to pass:

### Critical Icons (App Store Connect Will Fail Without These)

| Size | Filename | Device/Context | Scale |
|------|----------|----------------|-------|
| **1024x1024** | `icon-1024.png` | App Store | 1x |
| **120x120** | `icon-60@2x.png` | iPhone (iOS 7+) | 2x |
| **180x180** | `icon-60@3x.png` | iPhone (iOS 7+) | 3x |

### iPhone Icons

| Size | Filename | Device | Scale |
|------|----------|--------|-------|
| 20x20 | `icon-20.png` | Settings (iOS 7+) | 1x |
| 40x40 | `icon-20@2x.png` | Settings (iOS 7+) | 2x |
| 60x60 | `icon-20@3x.png` | Settings (iOS 7+) | 3x |
| 29x29 | `icon-29.png` | Settings (iOS 5-6) | 1x |
| 58x58 | `icon-29@2x.png` | Settings (iOS 7+) | 2x |
| 87x87 | `icon-29@3x.png` | Settings (iOS 7+) | 3x |
| 40x40 | `icon-40.png` | Spotlight (iOS 7+) | 1x |
| 80x80 | `icon-40@2x.png` | Spotlight (iOS 7+) | 2x |
| 120x120 | `icon-40@3x.png` | Spotlight (iOS 7+) | 3x |
| 57x57 | `icon.png` | App (iOS 6 and earlier) | 1x |
| 114x114 | `icon@2x.png` | App (iOS 6 and earlier) | 2x |
| 120x120 | `icon-60@2x.png` | App (iOS 7+) | 2x |
| 180x180 | `icon-60@3x.png` | App (iOS 7+) | 3x |

### iPad Icons

| Size | Filename | Device | Scale |
|------|----------|--------|-------|
| 20x20 | `icon-20.png` | Settings | 1x |
| 40x40 | `icon-20@2x.png` | Settings | 2x |
| 29x29 | `icon-29.png` | Settings | 1x |
| 58x58 | `icon-29@2x.png` | Settings | 2x |
| 40x40 | `icon-40.png` | Spotlight | 1x |
| 80x80 | `icon-40@2x.png` | Spotlight | 2x |
| 50x50 | `icon-50.png` | Spotlight | 1x |
| 100x100 | `icon-50@2x.png` | Spotlight | 2x |
| 72x72 | `icon-72.png` | App (iOS 6 and earlier) | 1x |
| 144x144 | `icon-72@2x.png` | App (iOS 6 and earlier) | 2x |
| 76x76 | `icon-76.png` | App (iOS 7+) | 1x |
| 152x152 | `icon-76@2x.png` | App (iOS 7+) | 2x |
| 167x167 | `icon-83.5@2x.png` | App (iPad Pro) | 2x |

---

## 🛠️ Step 3: Generate Icon Sizes

### Method 1: Using macOS `sips` Command (Recommended)

The `sips` command is built into macOS and can resize images quickly:

```bash
# Navigate to your source icon directory
cd /path/to/PROJECT/resources/ios/icon/

# Source icon (1024x1024)
SOURCE_ICON="appstore.png"

# Generate all required sizes
# iPhone Icons
sips -z 20 20 "$SOURCE_ICON" --out icon-20.png
sips -z 40 40 "$SOURCE_ICON" --out icon-20@2x.png
sips -z 60 60 "$SOURCE_ICON" --out icon-20@3x.png
sips -z 29 29 "$SOURCE_ICON" --out icon-29.png
sips -z 58 58 "$SOURCE_ICON" --out icon-29@2x.png
sips -z 87 87 "$SOURCE_ICON" --out icon-29@3x.png
sips -z 40 40 "$SOURCE_ICON" --out icon-40.png
sips -z 80 80 "$SOURCE_ICON" --out icon-40@2x.png
sips -z 120 120 "$SOURCE_ICON" --out icon-40@3x.png
sips -z 57 57 "$SOURCE_ICON" --out icon.png
sips -z 114 114 "$SOURCE_ICON" --out icon@2x.png
sips -z 120 120 "$SOURCE_ICON" --out icon-60@2x.png
sips -z 180 180 "$SOURCE_ICON" --out icon-60@3x.png

# iPad Icons
sips -z 50 50 "$SOURCE_ICON" --out icon-50.png
sips -z 100 100 "$SOURCE_ICON" --out icon-50@2x.png
sips -z 72 72 "$SOURCE_ICON" --out icon-72.png
sips -z 144 144 "$SOURCE_ICON" --out icon-72@2x.png
sips -z 76 76 "$SOURCE_ICON" --out icon-76.png
sips -z 152 152 "$SOURCE_ICON" --out icon-76@2x.png
sips -z 167 167 "$SOURCE_ICON" --out icon-83.5@2x.png

# App Store Icon (must be exactly 1024x1024)
cp "$SOURCE_ICON" icon-1024.png
```

### Method 2: Using Online Tools

1. **Icon Kitchen** (https://icon.kitchen)
   - Upload your 1024x1024 source icon
   - Select "iOS" platform
   - Download the generated icon pack
   - Extract and copy to your project

2. **AppIcon.co** (https://appicon.co)
   - Upload source icon
   - Select iOS platform
   - Download generated icons

### Method 3: Using ImageMagick

If you have ImageMagick installed:

```bash
# Install ImageMagick (if not installed)
brew install imagemagick

# Generate icons
convert appstore.png -resize 20x20 icon-20.png
convert appstore.png -resize 40x40 icon-20@2x.png
# ... repeat for all sizes
```

### Method 4: Using Xcode Asset Catalog (Automatic)

1. Open your Xcode project
2. Navigate to `Assets.xcassets` → `AppIcon`
3. Drag your 1024x1024 source icon into the App Store slot
4. Xcode will automatically generate all other sizes (if you have the source icon in the right place)

---

## 📁 Step 4: Copy Icons to Xcode Asset Catalog

### Location

The icons must be placed in the Xcode asset catalog:

**Cordova/PhoneGap:**
```
platforms/ios/PROJECT_NAME/Assets.xcassets/AppIcon.appiconset/
```

**React Native:**
```
ios/PROJECT_NAME/Images.xcassets/AppIcon.appiconset/
```

**Native iOS:**
```
PROJECT_NAME/Assets.xcassets/AppIcon.appiconset/
```

### Copy Command

```bash
# Example for Cordova project
SOURCE_DIR="/path/to/PROJECT/resources/ios/icon"
TARGET_DIR="/path/to/PROJECT/platforms/ios/PROJECT_NAME/Assets.xcassets/AppIcon.appiconset"

# Copy all icons
cp "$SOURCE_DIR"/*.png "$TARGET_DIR/"
```

**Example from this project:**
```bash
cd /Users/xspark2/Desktop/DESKTOP/X-Lite/x-lite-mobile
cp resources/ios/icon/*.png platforms/ios/Riingr/Assets.xcassets/AppIcon.appiconset/
```

---

## ⚙️ Step 5: Configure Contents.json

The `Contents.json` file tells Xcode which icon files correspond to which sizes. It must be correctly configured.

### Location

```
Assets.xcassets/AppIcon.appiconset/Contents.json
```

### Structure

The `Contents.json` file is a JSON array of icon definitions. Each entry specifies:
- `filename`: The icon file name
- `idiom`: Device type (`iphone`, `ipad`, `ios-marketing`, `watch`)
- `scale`: Scale factor (`1x`, `2x`, `3x`)
- `size`: Base size in points (e.g., `20x20`, `60x60`)

### Critical Entries (Must Have)

These three entries are **required** for App Store Connect validation:

```json
{
  "filename": "icon-1024.png",
  "idiom": "ios-marketing",
  "scale": "1x",
  "size": "1024x1024"
},
{
  "filename": "icon-60@2x.png",
  "idiom": "iphone",
  "scale": "2x",
  "size": "60x60"
},
{
  "filename": "icon-60@3x.png",
  "idiom": "iphone",
  "scale": "3x",
  "size": "60x60"
}
```

### Complete Contents.json Example

See the full example in:
```
platforms/ios/Riingr/Assets.xcassets/AppIcon.appiconset/Contents.json
```

### Common Issues

1. **Duplicate entries**: Each icon size should appear only once
2. **Incorrect scale/size combinations**: 
   - `60x60` @ `2x` = `120x120` pixels
   - `60x60` @ `3x` = `180x180` pixels
3. **Missing filename**: Every entry must have a `filename` (unless it's optional)
4. **Wrong idiom**: App Store icon must use `ios-marketing`, not `iphone` or `ipad`

---

## ✅ Step 6: Verify Icon Dimensions

Before uploading to App Store Connect, verify all icons have the correct dimensions:

### Using `sips` (macOS)

```bash
# Check dimensions of all icons
cd platforms/ios/PROJECT_NAME/Assets.xcassets/AppIcon.appiconset/

for icon in *.png; do
    echo "$icon:"
    sips -g pixelWidth -g pixelHeight "$icon"
done
```

### Using `identify` (ImageMagick)

```bash
# Install ImageMagick if needed
brew install imagemagick

# Check all icons
identify *.png
```

### Expected Output

```
icon-1024.png: 1024x1024
icon-60@2x.png: 120x120
icon-60@3x.png: 180x180
icon-40@3x.png: 120x120
...
```

---

## 🔍 Step 7: Verify in Xcode

1. **Open Xcode project/workspace**
2. **Navigate to**: `Assets.xcassets` → `AppIcon`
3. **Check**:
   - All required slots are filled (no empty slots)
   - No yellow warning triangles
   - App Store icon (1024x1024) is present
   - Icons look correct (not stretched or pixelated)

### Visual Verification

- Icons should appear crisp and clear
- No stretching or distortion
- Colors match your source icon
- No transparency (for App Store icon)

---

## 🚨 Common Errors & Fixes

### Error: "Missing 1024x1024 app icon"

**Cause**: App Store icon is missing or incorrectly sized.

**Fix**:
```bash
# Ensure icon-1024.png exists and is exactly 1024x1024
sips -g pixelWidth -g pixelHeight icon-1024.png

# If wrong size, resize it
sips -z 1024 1024 source-icon.png --out icon-1024.png

# Verify Contents.json has this entry:
# {
#   "filename": "icon-1024.png",
#   "idiom": "ios-marketing",
#   "scale": "1x",
#   "size": "1024x1024"
# }
```

### Error: "Missing 120x120 icon for iPhone/iPod Touch"

**Cause**: `icon-60@2x.png` is missing or wrong size.

**Fix**:
```bash
# Generate correct size
sips -z 120 120 source-icon.png --out icon-60@2x.png

# Verify Contents.json has:
# {
#   "filename": "icon-60@2x.png",
#   "idiom": "iphone",
#   "scale": "2x",
#   "size": "60x60"
# }
```

### Error: "Invalid icon dimensions"

**Cause**: Icon file dimensions don't match the `Contents.json` specification.

**Fix**:
1. Check actual file dimensions: `sips -g pixelWidth -g pixelHeight icon-60@2x.png`
2. Verify it matches the expected size (e.g., `icon-60@2x.png` should be 120x120)
3. If wrong, regenerate: `sips -z 120 120 source.png --out icon-60@2x.png`

### Error: "Duplicate icon entry"

**Cause**: `Contents.json` has duplicate entries for the same size/scale.

**Fix**:
1. Open `Contents.json`
2. Find duplicate entries (same `size`, `scale`, `idiom`)
3. Remove duplicates, keeping only one

### Error: "Icon appears stretched in simulator"

**Cause**: Icon dimensions are incorrect or aspect ratio is wrong.

**Fix**:
1. Ensure source icon is square (1:1 aspect ratio)
2. Regenerate all icons from square source
3. Verify no icons are stretched: `sips -g pixelWidth -g pixelHeight icon-60@2x.png`

---

## 📝 Complete Workflow Example

Here's the complete workflow used for this project:

```bash
# 1. Navigate to project
cd /Users/xspark2/Desktop/DESKTOP/X-Lite/x-lite-mobile

# 2. Source icon location
SOURCE_ICON="resources/ios/icon/appstore.png"

# 3. Generate all required sizes (if not already generated)
cd resources/ios/icon/
sips -z 120 120 "$SOURCE_ICON" --out icon-60@2x.png
sips -z 180 180 "$SOURCE_ICON" --out icon-60@3x.png
sips -z 120 120 "$SOURCE_ICON" --out icon-40@3x.png
# ... generate all other sizes

# 4. Copy to Xcode asset catalog
cp resources/ios/icon/*.png platforms/ios/Riingr/Assets.xcassets/AppIcon.appiconset/

# 5. Verify Contents.json is correct
cat platforms/ios/Riingr/Assets.xcassets/AppIcon.appiconset/Contents.json

# 6. Verify icon dimensions
cd platforms/ios/Riingr/Assets.xcassets/AppIcon.appiconset/
sips -g pixelWidth -g pixelHeight icon-1024.png
sips -g pixelWidth -g pixelHeight icon-60@2x.png
sips -g pixelWidth -g pixelHeight icon-60@3x.png

# 7. Open in Xcode to verify visually
open platforms/ios/Riingr.xcworkspace
```

---

## 🎯 Quick Reference Checklist

Before uploading to App Store Connect, verify:

- [ ] `icon-1024.png` exists and is exactly 1024x1024 pixels
- [ ] `icon-60@2x.png` exists and is exactly 120x120 pixels
- [ ] `icon-60@3x.png` exists and is exactly 180x180 pixels
- [ ] All icons are in `Assets.xcassets/AppIcon.appiconset/`
- [ ] `Contents.json` has correct entries for all icons
- [ ] No duplicate entries in `Contents.json`
- [ ] App Store icon uses `idiom: "ios-marketing"` in `Contents.json`
- [ ] Icons appear correctly in Xcode asset catalog (no warnings)
- [ ] Icons are square (1:1 aspect ratio)
- [ ] Icons have no transparency (for App Store icon)

---

## 🔄 For Cordova/PhoneGap Projects

### Automatic Icon Generation

Cordova can automatically generate icons from a source image:

1. **Place source icon**:
   ```
   resources/icon.png  (1024x1024)
   ```

2. **Configure in config.xml**:
   ```xml
   <platform name="ios">
     <icon src="resources/icon.png" />
   </platform>
   ```

3. **Run Cordova prepare**:
   ```bash
   cordova prepare ios
   ```

This will automatically generate and place icons in the correct location.

### Manual Override

If automatic generation doesn't work or you need custom icons:

1. Generate icons manually (see Step 3)
2. Place in `resources/ios/icon/`
3. Copy to `platforms/ios/PROJECT_NAME/Assets.xcassets/AppIcon.appiconset/`
4. Verify `Contents.json` is correct

---

## 📚 Additional Resources

- **Apple's Icon Guidelines**: https://developer.apple.com/design/human-interface-guidelines/app-icons
- **App Store Connect Requirements**: https://developer.apple.com/app-store/review/guidelines/
- **Xcode Asset Catalog Guide**: https://developer.apple.com/documentation/xcode/adding-app-icons-and-launch-screens

---

## 💡 Tips

1. **Start with a high-quality 1024x1024 source icon** - All other sizes are generated from this
2. **Use square icons** - iOS will add rounded corners automatically
3. **Test in simulator** - Verify icons look good at all sizes
4. **Keep source icon** - You'll need it for future updates
5. **Version control** - Commit your `Contents.json` and source icons to git
6. **Automate** - Create a script to generate all sizes from source icon

---

**Last Updated**: Based on iOS 13.0+ requirements and App Store Connect validation rules
