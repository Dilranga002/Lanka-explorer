LANKA EXPLORER - LEAFLET MAP HOTFIX
================================
Map symptom: only a few map tiles visible; large empty areas.

Root cause: Week-04 and Week-05 details.html / destinations.html used
an INCORRECT Subresource Integrity (SRI) hash for Leaflet 1.9.4 CSS.
The browser blocked the stylesheet, and Leaflet panes/tiles were
therefore incorrectly positioned. The Leaflet JS integrity was fine.

Fix: replaced the CSS hash with the official Leaflet 1.9.4 SHA-256:
sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=
Source: https://leafletjs.com/download.html

Only the incorrect CSS link was corrected in Week-04 and Week-05.
Week 01 to 03 are unchanged. Week 05 controls (fullscreen, reset,
location selector, Google Maps links), logo, photos, dark mode remain.

HOW TO RUN (SINHALA):
1. Extract this ZIP.
2. VS Code -> File -> Open Folder -> Week-05/lanka-explorer
3. index.html -> Right click -> Open with Live Server
4. Browser -> Ctrl+Shift+R (hard refresh); internet ON.
5. Destinations -> scroll to map -> choose location; try fullscreen.
6. Try a details page -> Location map.
7. If still broken: F12 -> Console/Network, ensure Leaflet CSS has status
   200, and the tile PNG requests are not 403 or 429.
8. If remote servers block map tiles, open Google Maps from its link.

Deploy only Week-05 website to Vercel. The cumulative ZIP is for LMS
submission with five week folders. Fill HOSTED_LINK.txt with your REAL
Vercel URL after deployment.

Photos currently use external sources; the site requires internet to
load external photos/maps/weather/currency.
