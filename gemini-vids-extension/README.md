# Gemini Vids Button — Chrome Extension

Adds a **"Vids"** button to the left sidebar of [gemini.google.com](https://gemini.google.com/), styled like the existing native buttons. Currently the button does nothing except log a message to the console.

## Install (Developer Mode)

1. Open Chrome and go to `chrome://extensions/`.
2. Toggle **Developer mode** (top-right corner).
3. Click **Load unpacked**.
4. Select this folder: `gemini-vids-extension/`.
5. Visit/open https://gemini.google.com/ — the "Vids" button should appear in the left panel below the other action buttons.

## Files

- `manifest.json` — Manifest V3 config, injects scripts only into `gemini.google.com`.
- `content.js` — finds the sidebar's action-button container, clones the style of an existing button, and inserts the new "Vids" button after the last one. Uses a `MutationObserver` to wait for Angular to render the sidebar.
- `content.css` — fallback styles used if no native reference button could be cloned.

## Notes

- The click handler is intentionally a no-op (console log only) as requested.
- If Google changes their DOM structure, adjust the selectors in `findCandidateContainers()` inside `content.js`.
