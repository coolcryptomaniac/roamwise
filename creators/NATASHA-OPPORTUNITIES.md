# Natasha's opportunities feed

`creators/natasha-opportunities.json` feeds the "Art opportunities" section of `creators/natasha.html`.
Order is nearby (Dharamshala, Chandigarh), then India (Delhi NCR, Bengaluru, Mumbai), then abroad.

Rules for every entry (enforced by `tests/natasha-opportunities.test.js`):
- tier is `himachal`, `national` or `international`; `url` is https or null; `checked` is a date.
- Information only. No promise that RoamWise applies, sponsors or guarantees anything.
- Add only facts found on an organiser or reputable source page. Never guess a deadline; say "call expected" instead.
- Drop entries whose date has passed unless the event is annual (then say "Annual" or the last edition).

A weekly scheduled task researches new calls, edits the JSON and opens a PR. The founder reviews and merges; nothing auto-merges.
