import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('rules_patch', Path(__file__).resolve().parents[1] / 'tools' / 'prepare-auth-referral-rules.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

FIXTURE = '''// STABLE BUILD v17.0 / Platform V5
function isRedeemedByCaller(code) {
        && get(/databases/$(database)/documents/partnerClaims/$(code)).data.redeemedUid == request.auth.uid;
}
match /paymentDestinations/{id} {}
'operationsLocked'
request.resource.data.userUID == request.auth.uid
request.resource.data.at == request.time
request.resource.data.refRate <= 0.30
    match /partnerClaims/{id} {
      allow get: if true;
      allow list: if isAdmin();
      allow create: if request.resource.data.name is string
                    && request.resource.data.name.size() <= 120
                    && id == request.resource.data.code;
      // Redemption flip
      allow update: if isAdmin() || (
        && request.resource.data.redeemedUid == request.auth.uid
        && (!('expiresAt' in resource.data) || resource.data.expiresAt > request.time)
      );
      allow delete: if isAdmin();
    }
    // ---- PARTNER CLAIM EMAIL INDEX
    match /partnerClaimEmails/{emailKey} {
      allow get: if true;
      allow list: if isAdmin();
      allow create: if request.resource.data.code is string
                    && request.resource.data.code.size() <= 64
                    && request.resource.data.partnership is string;
      allow update, delete: if isAdmin();
    }
    // ---- PARTNERSHIPS
    match /partnerships/{id} {
      allow read: if true;
      allow create: if isAdmin();
      allow update: if isAdmin() || (
           resource.data.claimed is int
           && request.resource.data.claimed == resource.data.claimed + 1
      );
      allow delete: if isAdmin();
    }
    // ---- REFERRAL SIGNUP LOG
'''

class CandidateTests(unittest.TestCase):
    def test_blocks_forged_claims_and_preserves_latest_feature_guards(self):
        candidate = mod.candidate(FIXTURE)
        self.assertIn('allow create: if isAdmin();', candidate)
        self.assertIn('resource.data.email == request.auth.token.email', candidate)
        self.assertIn('request.resource.data.userUID == request.auth.uid', candidate)
        self.assertIn('match /paymentDestinations/{id}', candidate)
        self.assertIn("'operationsLocked'", candidate)
        self.assertNotIn('allow get: if true;', candidate)
        self.assertNotIn('allow update: if isAdmin() || (\n           resource.data.claimed', candidate)

    def test_aborts_if_new_referral_rule_missing(self):
        with self.assertRaises(mod.RuleDriftError):
            mod.candidate(FIXTURE.replace('request.resource.data.userUID == request.auth.uid', ''))

    def test_aborts_if_source_has_drifted(self):
        with self.assertRaises(mod.RuleDriftError):
            mod.candidate(FIXTURE.replace('request.resource.data.redeemedUid == request.auth.uid', 'uid == request.auth.uid'))

    def test_aborts_on_repeat_run(self):
        with self.assertRaises(mod.RuleDriftError):
            mod.candidate(mod.candidate(FIXTURE))

if __name__ == '__main__':
    unittest.main()
