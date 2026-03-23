---
name: play
description: Start a local dev server for testing GUMP on iPhone
disable-model-invocation: true
---

Start a local HTTPS dev server so James can test GUMP on his iPhone 15.

Steps:
1. Find the local IP address (en0 interface).
2. Start `python3 -m http.server 8000` or `npx serve .` in the music2.0 directory.
3. Print the URL James should open on his iPhone: `http://<local-ip>:8000`
4. Remind him:
   - Open in Safari (not Chrome — motion permissions work better)
   - Same WiFi network as the Mac Mini
   - `clearLog()` to reset, `copy(dump())` to capture session data
   - `GUMP_BUILD` in console to verify the right build is loaded

Note: For HTTPS (required for DeviceMotion on some browsers), use `npx serve . --ssl` if available, or test via GitHub Pages (begump.com) after pushing.
