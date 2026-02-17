# Toggle Limit Form (Static Site)

This is a static website with:
- Text input + toggle rows.
- 3 rows by default.
- Add/remove rows between 3 and 7.
- Rule: not all toggles can be ON at once (`max ON = rows - 1`).
- If a click would exceed the max, one ON toggle is turned OFF randomly.
- Shareable output links via URL addendum (`?state=...`).

## Files
- `index.html`
- `styles.css`
- `script.js`

## Local Preview
Open `index.html` directly in a browser.

## Deploy (Netlify / Vercel drag-and-drop)
1. In your deploy dashboard, create a new project/site using drag-and-drop upload.
2. Upload the contents of this folder (`index.html`, `styles.css`, `script.js`).
3. Publish.

No build command or install step is required.

## Shareable Links
- Use **Generate Share Link** or **Copy Link** in the app.
- The link includes row text and toggle states in `?state=...`.
- Opening that link restores the same output in a shared view that shows only toggles.
- Shared view includes a **Make your own** link back to the full creator page.
