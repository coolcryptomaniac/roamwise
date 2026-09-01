from pathlib import Path
import re, subprocess, sys

RULES = Path('firestore.rules')
V16 = Path('scripts/apply-platform-rules-v16.py')

# Re-apply the v16 foundation first. It is intentionally idempotent and keeps
# Creator Studio + fresh-room booking authorization in the same canonical file.
if V16.exists():
    subprocess.run([sys.executable, str(V16)], check=True)

text = RULES.read_text()
BEGIN = '    // ---- PLATFORM V5 PRIVACY / INVESTOR / CROWD BEGIN -------------------\n'
END   = '    // ---- PLATFORM V5 PRIVACY / INVESTOR / CROWD END ---------------------\n'

block = r'''    // ---- PLATFORM V5 PRIVACY / INVESTOR / CROWD BEGIN -------------------
    // Private-chat learning is explicit opt-in. The browser may create a sample
    // only for the currently authenticated user AND only while that user's
    // consent doc says enabled=true. Samples are write-only to the traveller;
    // only admins can inspect/delete them for the improvement pipeline.
    match /aiLearningConsents/{uid} {
      allow read: if isAdmin() || isSelf(uid);
      allow create, update: if isSelf(uid)
        && request.resource.data.keys().hasOnly(['uid','enabled','version','updatedAt'])
        && request.resource.data.uid == uid
        && request.resource.data.enabled is bool
        && request.resource.data.version is string
        && request.resource.data.version.size() <= 48;
      allow delete: if isAdmin() || isSelf(uid);
    }

    match /aiLearningSamples/{id} {
      allow create: if request.auth != null
        && request.resource.data.keys().hasOnly([
             'uid','channel','role','text','meta','clientAt','consentVersion','createdAt'
           ])
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.channel in ['ailon','trip_chat']
        && request.resource.data.role in ['user','assistant','feedback']
        && request.resource.data.text is string
        && request.resource.data.text.size() >= 2
        && request.resource.data.text.size() <= 1400
        && request.resource.data.meta is map
        && request.resource.data.clientAt is string
        && request.resource.data.clientAt.size() <= 40
        && request.resource.data.consentVersion is string
        && request.resource.data.consentVersion.size() <= 48
        && exists(/databases/$(database)/documents/aiLearningConsents/$(request.auth.uid))
        && get(/databases/$(database)/documents/aiLearningConsents/$(request.auth.uid)).data.enabled == true;
      allow read: if isAdmin();
      allow update: if false;
      allow delete: if isAdmin();
    }

    // Founder/private cap-table source of truth. Never public-readable. Public
    // investor interest continues to use the existing write-only /investors
    // collection; actual securities records live here only after review/KYC.
    match /capTable/{id} {
      allow read, create, update, delete: if isAdmin();
    }
    match /fundingRounds/{id} {
      allow read, create, update, delete: if isAdmin();
    }
    match /investorRelations/{id} {
      allow read, create, update, delete: if isAdmin();
    }

    // Aggregated crowd intelligence is safe to cache publicly. Raw traveller
    // reports remain protected by the existing crowdReports rule. Only an admin
    // or trusted server pipeline can publish a computed signal/alternative.
    match /crowdSignals/{id} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    match /crowdAlternatives/{id} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    // ---- PLATFORM V5 PRIVACY / INVESTOR / CROWD END ---------------------
'''

if BEGIN in text:
    text = re.sub(re.escape(BEGIN) + r'.*?' + re.escape(END), block, text, count=1, flags=re.S)
else:
    anchor = '    // ---- PARTNERS (hotel/hostel/operator accounts) ---------------------'
    if anchor not in text:
        # Stable fallback anchor present on older canonical files.
        anchor = '    // ---- INVESTOR SUBMISSIONS ----------------------------------------'
    if anchor not in text:
        raise SystemExit('Could not find a safe insertion anchor; refusing broad rules rewrite')
    text = text.replace(anchor, block + '\n' + anchor, 1)

text = re.sub(
    r'RoamWise - Firestore Security Rules\s+\(STABLE BUILD v16\.0 / creator\+booking - 2026-08-31\)',
    'RoamWise - Firestore Security Rules   (STABLE BUILD v17.0 / Platform V5 - 2026-09-01)',
    text, count=1
)

# The deploy instructions include a stale example. Keep it aligned so the
# founder can copy a single version string into meta/rulesVersion.
text = text.replace('e.g. "v15.11"', 'e.g. "v17.0"', 1)

# Cheap but important structural checks before overwriting the canonical file.
for required in [
    'match /aiLearningConsents/{uid}', 'match /aiLearningSamples/{id}',
    'match /capTable/{id}', 'match /crowdSignals/{id}',
    'v16: browser checks are UX only', 'CREATOR STUDIO V4 BEGIN'
]:
    if required not in text:
        raise SystemExit(f'Missing required rules block: {required}')

# Prevent accidental duplicate V5 blocks (which is precisely what full-replace
# deployment is designed to avoid).
if text.count('match /aiLearningSamples/{id}') != 1:
    raise SystemExit('Duplicate aiLearningSamples match block detected')
if text.count('match /capTable/{id}') != 1:
    raise SystemExit('Duplicate capTable match block detected')

RULES.write_text(text)
print('firestore.rules generated as canonical Platform V5 v17.0 full-replace file')
