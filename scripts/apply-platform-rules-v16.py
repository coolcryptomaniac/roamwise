from pathlib import Path
import re

RULES = Path('firestore.rules')
CREATOR_PATCH = Path('creators/CREATOR-STUDIO-RULES-PATCH.txt')

text = RULES.read_text()
creator = CREATOR_PATCH.read_text().strip()

begin = '    // ---- CREATOR STUDIO V4 BEGIN ---------------------------------------\n'
end = '    // ---- CREATOR STUDIO V4 END -----------------------------------------\n'

# Rules patch is authored at match-block indentation level; indent it to the
# service/database body used by firestore.rules.
creator_block = '\n'.join(('    ' + line if line else '') for line in creator.splitlines())
wrapped = begin + creator_block + '\n' + end

if begin in text:
    text = re.sub(
        re.escape(begin) + r'.*?' + re.escape(end),
        wrapped,
        text,
        count=1,
        flags=re.S,
    )
else:
    anchor = '    // ---- PARTNERS (hotel/hostel/operator accounts) ---------------------'
    if anchor not in text:
        raise SystemExit('Could not find PARTNERS anchor in canonical rules')
    text = text.replace(anchor, wrapped + '\n' + anchor, 1)

# Replace only the roomBookings create authorization branch. The surrounding
# read/update/delete rules remain untouched. This closes direct REST bypasses
# of the browser checks and binds the amount to the currently approved room.
booking_pattern = re.compile(
    r"      allow create: if request\.auth != null\n"
    r"                    && request\.resource\.data\.status in \['requested','paid-unverified','confirmed-pay-later'\]\n"
    r"                    && request\.resource\.data\.guestUid == request\.auth\.uid\n"
    r"                    && exists\(/databases/\$\(database\)/documents/partners/\$\(request\.resource\.data\.partnerUid\)\)\n"
    r"                    && get\(/databases/\$\(database\)/documents/partners/\$\(request\.resource\.data\.partnerUid\)\)\.data\.verified == true;"
)

booking_replacement = """      // v16: browser checks are UX only. Authorization also requires a fresh,
      // Firebase-verified identity and a currently approved room. Price/amount
      // are bound to the public room document so a direct REST write cannot
      // invent a cheaper booking or target a pending/unapproved host.
      allow create: if request.auth != null
                    && request.auth.token.email_verified == true
                    && request.resource.data.keys().hasOnly([
                         'ref','status','bookingVersion','partnerUid','propertyId','roomId',
                         'guestUid','guestName','guestEmail','guestPhone','note','property',
                         'room','zone','area','checkIn','checkOut','guests','nights','roomPrice',
                         'amount','commissionPctSnapshot','paymentMethod','paymentSnapshot',
                         'paymentStatus','createdAt','at'
                       ])
                    && request.resource.data.status == 'requested'
                    && request.resource.data.guestUid == request.auth.uid
                    && request.resource.data.partnerUid is string
                    && request.resource.data.roomId is string
                    && request.resource.data.nights is int
                    && request.resource.data.nights > 0
                    && request.resource.data.guests is int
                    && request.resource.data.guests > 0
                    && request.resource.data.roomPrice is number
                    && request.resource.data.amount is number
                    && exists(/databases/$(database)/documents/partners/$(request.resource.data.partnerUid))
                    && get(/databases/$(database)/documents/partners/$(request.resource.data.partnerUid)).data.verified == true
                    && exists(/databases/$(database)/documents/partners/$(request.resource.data.partnerUid)/rooms/$(request.resource.data.roomId))
                    && get(/databases/$(database)/documents/partners/$(request.resource.data.partnerUid)/rooms/$(request.resource.data.roomId)).data.marketplaceApproved == true
                    && get(/databases/$(database)/documents/partners/$(request.resource.data.partnerUid)/rooms/$(request.resource.data.roomId)).data.partnerUid == request.resource.data.partnerUid
                    && get(/databases/$(database)/documents/partners/$(request.resource.data.partnerUid)/rooms/$(request.resource.data.roomId)).data.open != false
                    && request.resource.data.roomPrice == get(/databases/$(database)/documents/partners/$(request.resource.data.partnerUid)/rooms/$(request.resource.data.roomId)).data.price
                    && request.resource.data.amount == request.resource.data.roomPrice * request.resource.data.nights;"""

if booking_pattern.search(text):
    text = booking_pattern.sub(booking_replacement, text, count=1)
elif 'v16: browser checks are UX only' not in text:
    raise SystemExit('Could not find expected roomBookings create rule; refusing unsafe broad edit')

# Bump the visible version header without rewriting history comments.
text = text.replace(
    'RoamWise - Firestore Security Rules   (STABLE BUILD v15.11 / vc80 - 2026-08-29)',
    'RoamWise - Firestore Security Rules   (STABLE BUILD v16.0 / creator+booking - 2026-08-31)',
    1,
)

RULES.write_text(text)
print('firestore.rules hardened for Creator Studio v4 and Partner booking authorization')
