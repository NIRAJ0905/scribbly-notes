# Scribbly Notes — QA & Offline Verification Checklist

1. **Local Fonts Check**
   - Verify the three bundled fonts and their SIL Open Font License files are present in `assets/fonts/`.
   - Open DevTools -> Network -> Filter by `Font`: verify all fonts load from local paths (`200 OK`) with zero external requests.
2. **Readability & Variation Bounds**
   - Slide "Natural Hand Variation" from `0%` to `100%` across all 3 handwriting styles and 6 ink colours.
   - Verify words never overlap vertically or clip past the right margin.
3. **Pagination Integrity**
   - Paste 1,500+ words of study notes.
   - Confirm no line is sliced horizontally across the bottom/top of consecutive pages.
4. **Canvas PNG & Multi-Page PDF Export**
   - Click **Export Current Page (PNG)** and verify high-DPI crispness, matching paper style, and ink colour.
   - Click **Export All Pages (PDF)** and verify the downloaded `.pdf` opens cleanly with the exact page count.
5. **Offline Mode**
   - Enable **Offline** in DevTools Network tab (or disconnect Wi-Fi) and reload.
   - Confirm editing, previewing, PNG export, and PDF export work identically without internet access.