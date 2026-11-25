# Included AI UI integration

Forward-port the UI portion of #812 onto the gated backend merged in #883. Automatic mode is opt-in at deployment level; both browser and Worker flags stay false until authenticated English/Hindi smoke checks and shared Cloudflare usage monitoring pass. The browser sends the explicit query and curated guide text, not remembered account data or the trip desk. Existing database-first answers, search and BYOK remain intact. No paid inference or payment activation.
