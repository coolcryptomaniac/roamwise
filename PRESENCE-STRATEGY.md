# Where RoamWise should be present (checked 2026-10-07)

Short, honest version. Only figures I could read at a source are stated as facts; everything else is marked as a judgement.

## What the evidence says

| Finding | Source | Confidence |
|---|---|---|
| 886 million active internet users in India in 2024, forecast above 900 million in 2025, growing about 8% a year | [IAMAI-Kantar Internet in India 2024](https://india.entrepreneur.com/news-and-trends/internet-users-in-india-set-to-cross-900-mn-led-by-indic/485634) | secondary report of the survey |
| Rural India is 488 million users and grows about twice as fast as urban | same | same |
| 98% of users access content in Indic languages; 57% of urban users prefer regional-language content | same | same |
| Nine in ten users have used apps with embedded AI | same | same |
| Indian users use AI chatbots (mostly ChatGPT) to find what search engines make hard, but distrust AI accuracy and resist paying | [Statista, India internet usage](https://www.statista.com/topics/2157) | summary page, no figures readable |
| Smartphone is the main device; knowledge-seeking is the top activity | Statista (same) | summary page |

I did **not** find a reliable, readable figure for WhatsApp, Telegram, Instagram or YouTube share of time in India in 2026, so none is quoted here. Do not put those numbers in a pitch deck until someone fetches them from the primary report (Meta, Google, or a Kantar/Meltwater release).

## What follows (judgement, not data)

1. **Messaging first.** Travel decisions in India are made in family and friend groups, and the property side already works through WhatsApp. The bots (below) meet people where those chats already are.
2. **Mobile, Indic, rural-growing.** Hindi (and later Tamil, Telugu, Malayalam, the three the report calls most popular) matter more than a polished English desktop site. Hindi copy for the Stay & do pages is the cheapest reach gain.
3. **AI answers are now a discovery channel.** The site already allows GPTBot, OAI-SearchBot and Claude-SearchBot in `robots.txt` and ships `llms.txt`. Keep property pages factual and structured (name, place, how to book, what is verified): AI assistants quote what they can verify and skip what they cannot.
4. **Video and image discovery.** Short video (YouTube Shorts, Instagram Reels) is where creators already work; the creator-match engine is how RoamWise gets that content from properties without paying for ads. Always link back to the property page with its booking route.
5. **Search still matters** for "homestay in <town>" queries. Keep the sitemap current and one clean page per verified property.

## Presence plan, in order of effort

| Step | Effort | Status |
|---|---|---|
| WhatsApp + Telegram bot on the Worker (`/stays`, `/enquire`, `/stayed`, `/split`) | built, off until secrets are set | see `COMPLIANCE-FIRST-BUSINESS-MODEL.md`, "Bots" |
| Hindi version of the Stay & do pages and bot replies | small | not built |
| One Instagram + YouTube Shorts post per verified property via creator match | ongoing, no cash | engine exists |
| Google Business Profile for RoamWise and claim help for partners | founder, one-off | not done |
| Keep `llms.txt`, `sitemap.xml`, structured data current when a property goes live | small | partly automatic |
| Measure: which channel each enquiry code came from (`source: bot` vs web) | small | bot rows carry `source` and `channel`; web rows do not yet |

## Predictions

I will not give numeric predictions: the sources above support "more users, more rural, more Indic, more AI" and nothing finer. Revisit with the yearly GST review each October and replace this page with primary figures when you have them.
