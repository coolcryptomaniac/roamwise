# Qikink print-file candidate handoff (22 Nov 2026)

This workflow builds candidate high-resolution transparent PNGs from the **actual approved-for-review SVG designs in Git**, with no Qikink account login and no charged order.

## Download from Actions
Open **Actions → Merchandise print-file candidates** and select the latest successful run. Download its `qikink-upload-candidates-review-required` artifact. The ZIP holds the 300-DPI back/front/sleeve Rave to Rise × Buransh candidates and Myar Pahad back candidate plus pixel/dimensions manifests. It is **not** an automatic Qikink product listing.

The workflows use GitHub-hosted computation only. They do not spend on AI subscriptions, upload files to Qikink or change payment state. All generated files are retained for a limited period and can be regenerated from the original SVGs in Git.

## Qikink specifications / hard limits
As published by Qikink: source files should be PNG or JPEG, recommended 150–300 DPI (prefer 300), below 25 MB, dimensions at most 25,000 × 25,000px and file names under 25 characters. Upload via **Qikink Dashboard → Designs → Add Design**, then **Products → Create product → Choose blank / colours / sizes / print placement → Add Design → Save Products**. Copy the final **My Products** SKU(s) into the private server catalogue only after cost and physical quality review.

Sources: https://qikink.com/help/getting-started/using-design-library/ and https://qikink.com/help/integrations/push-products-to-your-shopify-or-woo-commerce-store/.

Output dimensions (templates, not Qikink-approved garment print areas):
- Back: 4500 × 5400px, equivalent to 15 × 18in at 300 DPI.
- Chest: 1500 × 1500px, equivalent to 5 × 5in at 300 DPI.
- Sleeve: 900 × 4200px, equivalent to 3 × 14in at 300 DPI.

**Important**: Qikink size-safe areas vary by blank garment, garment size, printing method and placement; verify these before upload or adjust the master export. RGB PNG with alpha/transparency is a candidate, not proof of production acceptance. Do not use auto-upscaled low-res bitmap as a substitute for vector-quality source.

## Automation status
- The existing GitHub Actions workflow proposes exactly **one new review-only concept per day** at 10:20 IST (GitHub scheduling may be delayed).
- It now exports a date-scoped, high-resolution **back artwork candidate** as a short-lived Actions artifact.
- GitHub PR creation requires repository Settings → Actions → General → **Allow GitHub Actions to create and approve pull requests**. If this permission is off, the run can create its draft files but cannot open the review PR; inspect Actions logs.
- No live Qikink My Products SKU is invented. Qikink product creation is done in its authenticated dashboard; documented Open API supports order placement and custom designs for orders, not a verified generic "create product listing" operation for this custom site.

## Follow-through to sell
For each vetted concept, confirm genuine blank clothing, current Qikink cost + printing placements + packaging + taxes + shipping + return policy, set a sustainable RoamWise retail price, approve paid sampling explicitly, inspect garment photos/quality, capture real Qikink My Products SKU(s), and add only those SKUs to `worker/lib/shop-catalogue.js` via code review plus Cashfree sandbox testing. No automated customer charging from daily concepts.
