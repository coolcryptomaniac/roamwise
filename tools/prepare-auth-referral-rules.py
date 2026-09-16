#!/usr/bin/env python3
"""Build a review-only Firestore rules candidate from the current canonical file.

This deliberately DOES NOT deploy or overwrite firestore.rules. It closes the
self-issued partner code -> permanent Pro path by requiring administrative code
issuance and verified email ownership. This temporarily stops anonymous NMIMS
claim creation: migrate that page to a trusted, verified claim service before
merging/publishing the candidate. Run emulator integration tests first.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import re

class RuleDriftError(RuntimeError):
    pass


def one(s: str, old: str, new: str, label: str) -> str:
    found = s.count(old)
    if found != 1:
        raise RuleDriftError(f"{label}: expected one exact source match, found {found}; aborting")
    return s.replace(old, new, 1)


def sub_one(s: str, pattern: str, new: str, label: str) -> str:
    out, n = re.subn(pattern, lambda _: new, s, count=2, flags=re.S)
    if n != 1:
        raise RuleDriftError(f"{label}: expected one regex match, found {n}; aborting")
    return out


def between(s: str, start: str, end: str) -> tuple[str, str, str]:
    if s.count(start) != 1 or s.count(end) != 1:
        raise RuleDriftError(f"Cannot uniquely locate {start!r} / {end!r}")
    left, rest = s.split(start, 1)
    inner, right = rest.split(end, 1)
    return left + start, inner, end + right


def candidate(src: str) -> str:
    # The candidate MUST retain the latest marketplace + September 14 auth rules.
    for label, snippet in {
        'referral UID binding': 'request.resource.data.userUID == request.auth.uid',
        'referral timestamp binding': 'request.resource.data.at == request.time',
        'payment price/claim ref-rate cap': 'request.resource.data.refRate <= 0.30',
        'partner payment destinations': 'match /paymentDestinations/{id}',
        'partner operations lock': "'operationsLocked'",
        'platform invariant': 'STABLE BUILD v17.0 / Platform V5',
    }.items():
        if snippet not in src:
            raise RuleDriftError(f"Missing {label}; not safe to generate candidate")

    # A verified claimant may only redeem a claim issued to their own Auth email.
    src = one(src,
        '        && get(/databases/$(database)/documents/partnerClaims/$(code)).data.redeemedUid == request.auth.uid;',
        '        && get(/databases/$(database)/documents/partnerClaims/$(code)).data.redeemedUid == request.auth.uid\n'
        '        && request.auth.token.email_verified == true\n'
        '        && get(/databases/$(database)/documents/partnerClaims/$(code)).data.email == request.auth.token.email;',
        'partner-grant ownership')

    before, body, after = between(src,
        '    match /partnerClaims/{id} {',
        '    // ---- PARTNER CLAIM EMAIL INDEX')
    body = one(body,
        '      allow get: if true;',
        '      // Code possession alone must not expose the claimant\'s personal data.\n'
        '      allow get: if isAdmin() || (request.auth != null\n'
        '        && request.auth.token.email_verified == true\n'
        '        && resource.data.email == request.auth.token.email);',
        'private partner claim read')
    body = sub_one(body,
        r'      allow create: if request\.resource\.data\.name is string[\s\S]*?;',
        '      // SECURITY HOLD: only a trusted founder/server issues real codes.\n'
        '      // The anonymous NMIMS form must be migrated BEFORE publishing.\n'
        '      allow create: if isAdmin();',
        'admin-issued partner claim')
    body = one(body,
        '        && request.resource.data.redeemedUid == request.auth.uid\n',
        '        && request.resource.data.redeemedUid == request.auth.uid\n'
        '        && request.auth.token.email_verified == true\n'
        '        && resource.data.email == request.auth.token.email\n',
        'partner redemption email ownership')
    src = before + body + after

    before, body, after = between(src,
        '    match /partnerClaimEmails/{emailKey} {',
        '    // ---- PARTNERSHIPS')
    body = one(body, '      allow get: if true;', '      allow get: if isAdmin();',
               'disable public email-code index enumeration')
    body = sub_one(body,
        r'      allow create: if request\.resource\.data\.code is string[\s\S]*?;',
        '      allow create: if isAdmin();',
        'disable attacker-created email-code index')
    src = before + body + after

    before, body, after = between(src,
        '    match /partnerships/{id} {',
        '    // ---- REFERRAL SIGNUP LOG')
    body = sub_one(body, r'      allow update: if isAdmin\(\) \|\| \([\s\S]*?\n      \);',
                   '      // Updates must be written by the trusted claim-issuance service.\n'
                   '      allow update: if isAdmin();',
                   'disable public partner-seat increments')
    src = before + body + after

    header = ('// REVIEW CANDIDATE ONLY (2026-09-16): do not publish until the anonymous\n'
              '// NMIMS issuance flow has moved to verified server-side issuance,\n'
              '// and Firestore Emulator + web/Android regression tests pass.\n')
    if src.startswith('// REVIEW CANDIDATE ONLY'):
        raise RuleDriftError('Input is already a review candidate')
    return header + src


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, default=Path('firestore.rules'))
    parser.add_argument('--output', type=Path, default=Path('firestore-review.rules'))
    args = parser.parse_args()
    if args.input.resolve() == args.output.resolve():
        parser.error('Refusing to overwrite the canonical rules; choose a separate output path')
    output = candidate(args.input.read_text(encoding='utf-8'))
    args.output.write_text(output, encoding='utf-8')
    print(f'Created review candidate: {args.output} ({len(output.splitlines())} lines)')
    print('NOT DEPLOYED. Anonymous NMIMS claims will be blocked by this candidate.')

if __name__ == '__main__':
    main()
