# Local business x creator collab email (all campaigns)

Sent in the founder's name (Mohit Pandey, Founder, RoamWise) from the RoamWise Gmail account, to one creator at a time (never CC/BCC), at most 3 a day, nearest ring first.
Fill {first}, {business}, {category}, {city_area}, {pitch}, {whatsapp}, {phrase} (all from outreach/campaigns.json) and {platform} and {specific} from the creator's own public page. {specific} must be a real, named thing
(a video or dish they posted). If you cannot name one, do not send.

**Subject:** Collab with {business}, {city_area} (via RoamWise)

Hi {first},

I'm Mohit from RoamWise (roamwise.co.in), a travel-planning platform built in Almora. We are partnering with {business},
a {category} in {city_area}, and we are looking for creators who would like to explore {pitch}.

I came across your {platform}, especially {specific}, and thought it could be a good fit.

If you are interested, message the {business} team on WhatsApp at {whatsapp} and write "{phrase}". The details are agreed directly with them.

You can also register your profile with RoamWise here: https://www.roamwise.co.in/creators/match.html?role=creator&invite=founding

If this isn't relevant, just reply "no" and I won't write again.

Regards,
Mohit Pandey
Founder, RoamWise
roamwise.co.in | support@roamwise.co.in
Almora, Uttarakhand, India

## Before every send (mandatory)

1. Write the final subject and body, with every placeholder filled, to a JSON file: `{ "to": ["<creator address>"], "subject": "...", "body": "..." }`.
2. Run `node tools/outreach/mail-guard.mjs outreach <file> <campaign-id>`.
3. Exit 0 means send. Any other result means do NOT send: fix the cause or skip this creator and report why. Never edit the guard or the rules to get a message through.
4. Never include anything about money, funding, investors, revenue, salaries, other creators, other businesses' details, or any phone number or address except the campaign's own WhatsApp and support@roamwise.co.in.
5. Only the founder (Mohit Pandey) can change these rules, the template or a campaign's `maxKm`.
