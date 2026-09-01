RoamWise Opening Bundle
=======================

This is a standalone replacement bundle for the old/new conflicting opening loaders.

Files
-----
- assets/roamwise-opening-poster.png
- assets/roamwise-opening.mp4
- assets/roamwise-opening.gif
- roamwise-opening.css
- roamwise-opening.js

Integration
-----------
1. Copy `assets/` into the same public folder as the page that loads first.
2. Include in the page head:
   `<link rel="stylesheet" href="roamwise-opening.css">`
3. Include before `</body>`:
   `<script src="roamwise-opening.js"></script>`
4. Remove or disable the previous intro/loader code so only one opening animation runs.
5. If your repo previously used a different intro timeout, remove that old timeout.

Behavior
--------
- shows once per browser session
- 9:16 mobile-first composition that scales to desktop
- skips automatically after ~6.5 seconds
- skip button included
- uses MP4 when playable, otherwise shows animated UI over poster
