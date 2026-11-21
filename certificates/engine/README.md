# RoamWise certificate engine

Supported templates: event participation, internship, employment experience and course completion. A recipient's name, role, programme/event and duration are issuer-supplied facts. Use explicit date ranges in duration when known. No emails or telephone numbers belong in public records.

## Issue a batch

1. Prepare a CSV using `example.csv`, or use `/certificates/engine/` to build one. Each ID must be unique and include `-YYYY-`. Use a local photo path only with the local generator; never upload a résumé. Name/role/programme fields are public when published.
2. Install Python dependencies: `python3 -m pip install -r certificates/engine/requirements.txt`. Linux also requires DejaVu TrueType fonts (`fonts-dejavu-core`).
3. Run `python3 certificates/engine/issue.py batch.csv --issue --output /tmp/certificate-batch`. Without `--issue`, nothing is generated. Review every PDF/image before publication. The issue date is not an attendance date.
4. Run `python3 certificates/engine/publish.py /tmp/certificate-batch` in a repository checkout. This validates signatures and PDF hashes and refuses existing IDs. Commit the resulting files to a reviewed PR; merge to publish through the existing site deployment.
5. Open each public verification URL and test a registered PDF and a modified PDF before distributing.

For no-photo batches, the manually triggered **Certificate batch generator** GitHub Action creates a downloadable artifact. It never publishes or emails. Photo certificates use local file inputs so no full source photos or résumés are committed. Both workflows produce identical output.

## Outputs

A4 portrait and landscape PDFs/PNGs/JPGs, plus 1080×1350 LinkedIn PNG/JPG. Each record has a unique ID, QR verification URL, issue date, PDF SHA-256 hashes and an Ed25519 signature. Public verification offers downloads and LinkedIn profile entry. A LinkedIn post can attach the PNG or PDF; a profile credential should use the ID and verification URL.

## Trust, corrections and revocation

Each batch has an ephemeral Ed25519 signing key; its private part is discarded after signing. The public key is pinned in `certificates/keys.json` by the reviewed repository change. There is no private key in browser code or stored in Git. Trust ultimately rests on control of the RoamWise HTTPS domain and repository, not an external CA or blockchain. This does not stop the issuer/site owner replacing the entire registry.

To revoke or supersede a record, add its ID and a public explanation to `certificates/revocations.json` in a reviewed commit. The verifier checks that file before showing validity. Do not overwrite issued PDFs/records. A corrected certificate gets a new ID and the old ID points to its replacement via the revocation explanation. Existing internship records keep their original verification path and signatures.

## Capacity

CSV batches and per-ID/per-year records support thousands of recipients without embedding every record in the verifier. The directory searches a compact metadata index and renders at most 50 matches. Start with batches of 100–250 for visual review and manageable downloads. For larger archives move generated media to object storage while keeping stable verification URLs. This engine is repository-admin operated; the public CSV builder cannot issue or modify any record. It is not an authenticated HR database or an automatic employment/completion assessor.
