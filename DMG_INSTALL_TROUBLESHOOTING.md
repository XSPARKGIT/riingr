# DMG install/run troubleshooting (macOS) — “Riingr can’t be opened”

This document captures the exact issue we hit (even though the DMG was **signed + notarized**) and the steps that resolved it, so you can repeat the fix quickly if it happens again.

## Symptoms

- On another Mac (Intel), launching `Riingr.app` shows a popup:
  - **“The application ‘Riingr’ can’t be opened.”**
- Terminal checks show:
  - `spctl: File created by an AppSandbox, exec/open not allowed`
  - Running the binary directly shows:
    - `zsh: operation not permitted: .../Contents/MacOS/Riingr`

## Root cause

The app bundle was **quarantined** by macOS because it was received via a sandboxed app (in our case: **Telegram**).

We confirmed this by inspecting extended attributes:

- `xattr -l "/Applications/Riingr.app"` showed:
  - `com.apple.quarantine: ...;Telegram;`

That quarantine flag caused macOS to block execution, producing the confusing “AppSandbox” message, even though the app was correctly signed and notarized.

## How we diagnosed it

### 1) Check Gatekeeper assessment for the installed app

```bash
spctl --assess --type exec --verbose "/Applications/Riingr.app"
```

If you see:

- `/Applications/Riingr.app: File created by an AppSandbox, exec/open not allowed`

…it often indicates a quarantine / sandbox-origin issue.

### 2) Check quarantine / extended attributes

```bash
xattr -l "/Applications/Riingr.app"
```

Look for `com.apple.quarantine` and especially the **origin**, e.g. `...;Telegram;`.

### 3) Try running the binary directly (optional)

```bash
"/Applications/Riingr.app/Contents/MacOS/Riingr"
```

If it prints `operation not permitted`, it’s another strong sign that quarantine / policy is blocking execution.

## The fix (what worked)

Remove the quarantine attribute recursively from the installed app bundle:

```bash
sudo xattr -r -d com.apple.quarantine "/Applications/Riingr.app"
```

Then re-check + run:

```bash

```

## Best practices to avoid this next time

- **Avoid distributing the DMG via Telegram/WhatsApp** if possible. These channels often preserve or apply quarantine metadata that triggers Gatekeeper restrictions.
- Prefer distribution via:
  - Your website / HTTPS download
  - GitHub Releases
  - S3 / CloudFront / similar
- If you must send via chat:
  - Consider sending a **zip** of the DMG (sometimes avoids the strictest handling), then download/unzip and install.

## If it still fails (extra validation)

If the quarantine fix doesn’t resolve it, validate signature integrity:

```bash
codesign -vvv --deep --strict "/Applications/Riingr.app"
```

And check DMG acceptance:

```bash
spctl --assess --type open --verbose "Riingr-0.0.0.dmg"
```

