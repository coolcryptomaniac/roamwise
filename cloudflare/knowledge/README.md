# Cloudflare knowledge setup for RoamWise

**Status:** schema and staging preparation only. No D1 database, R2 bucket, upload, domain or binding is provisioned or activated.

The canonical knowledge instructions are at:
[knowledge/CLOUDFLARE-KNOWLEDGE-SETUP.md](../../knowledge/CLOUDFLARE-KNOWLEDGE-SETUP.md)

The repository already had a mature and reviewed public-destination model; **do not create a competing `destinations` schema**.

Use these two SQL files **in order**, only after local rehearsal and approval:

1. [001_public_destination_d1.sql](../../knowledge/schema/001_public_destination_d1.sql) — canonical editorial destination, source, and revision schema.
2. [002_public_media_faq_itinerary.sql](../../knowledge/schema/002_public_media_faq_itinerary.sql) — rights-controlled R2 media metadata, FAQ and itinerary extensions.

For offline reviewable draft destination seeds and local asset rights check:

```sh
node knowledge/tools/build-cloudflare-seeds.cjs /tmp/roamwise-knowledge-seeds
```

This generates 49 destination **candidates**, not 49 new reviewed guides, images,
reservations or public D1 entries. All media rights remain pending until
explicitly reviewed. It does not upload or change any external service.

**Keep existing Firebase/Firestore authentication, orders, Cashfree payment
and real-time booking data unchanged.** Also keep GitHub Pages and Cloudflare
Pages separate until preview QA passes. No automatic failover is configured.
