# firestore.rules — what each block does, and what changed

Line numbers refer to the current `firestore.rules` (141 lines) shipped in this zip.
Paste the **whole file** into Firebase Console → Firestore → Rules → Publish.
Replacing everything is safe: this file is the complete ruleset, not a fragment.

---

## How to tell if your published copy is out of date

In Firebase Console, open your published rules and search for the word `secrets`.

- **Not found** → your published copy predates v42. Config, CRM, Stats and the
  encrypted key backup will all fail with `permission-denied`.
- **Found** → your rules are current; any remaining failure is the `admins` doc
  (see below), not the rules.

The **Doctor tab** in the admin console (v1.6) now tests all of this for you and
prints the exact error per collection.

---

## The blocks, in file order

| Lines | Block | What it allows | Added in |
|---|---|---|---|
| 5–15 | helper functions | `isSelf()`, `isAdmin()` | original |
| 17–27 | `users/{uid}` | owner reads/writes own profile; **Pro fields locked** so nobody can grant themselves Pro from the client | original |
| 28–30 | `users/{uid}/devices/{deviceId}` | **Sync Circle** — the 3-device cap registry. Owner-only | original |
| 35–45 | `claims/{id}` | user submits a UPI UTR; only admin approves | original |
| 46–51 | `pulse/{id}` | **Travel Pulse** — public read, signed-in write, `count` must be an int | original |
| 52–60 | `requests/{id}` | feature requests; admin reads | original |
| 61–67 | `payments/{id}` | admin-read only; no client writes | original |
| 68–72 | `admins/{uid}` | read-your-own only; **never client-writable** | original |
| 73–80 | `stats/{day}` | admin reads, anonymous counters write | original |
| 81–93 | `ratings/{uid}` | public read for the testimonial wall; one doc per user | original |
| 94–106 | `squads/{squadId}` | trip squads | original |
| 107–115 | `reports/{reportId}` | abuse reports | original |
| **116–122** | **`secrets/{uid}`** | **encrypted API-key backup — owner-only, deliberately NOT admin-readable** | **v42 (new)** |
| **124–130** | **`config/{doc}`** | **remote config: public read, admin write** | **v35 (new)** |
| **131–135** | **`crm/{id}`** | **contact database: admin-only both ways** | **v34 (new)** |
| 136–140 | `meta/{doc}` | shared counters; public read, any signed-in write | original |

---

## The three blocks that were added after your first paste

If you published rules once and haven't since, these are the ones you're missing.

**1. `config/{doc}` — lines 124–130** (added v35)
Without it, the admin console's **Config tab** cannot save affiliate IDs,
Gumroad links, WhatsApp numbers or crypto wallets, and the app cannot read them.
Deliberately a separate collection rather than inside `meta`, because `meta` is
writable by any signed-in user — config must be admin-write only.

**2. `crm/{id}` — lines 131–135** (added v34)
Without it, the **CRM tab** shows a permission error on every read and save.
Admin-only in both directions because it holds real people's names and emails.

**3. `secrets/{uid}` — lines 116–122** (added v42)
Without it, **encrypted key backup** fails silently on Save.
Owner-only, with no admin read — there is no legitimate reason for the console
to touch a user's encrypted credentials.

---

## The other half: the `admins` document

Rules alone are not enough. `isAdmin()` checks for a document at:

```
admins/{your-uid}   →   field:  ok  (boolean)  =  true
```

If that document does not exist, **every admin-gated feature fails even with
perfect rules** — Config, CRM, Stats, Payments. This is the single most common
cause of "I published the rules and nothing changed".

To create it: Firebase Console → Firestore → Data → Start collection `admins`
→ Document ID = your UID (the Doctor tab shows it with a Copy button) → Add
field `ok`, type boolean, value `true` → Save.

The GitHub Actions agent keeps working throughout because it authenticates with
a **service account**, which bypasses security rules entirely. That is why the
daily email arrives while the console shows permission errors — the two use
completely different auth paths.

---

## Travel Pulse: working ≠ visible

`pulseBump()` writes on every search by a signed-in user. But `pulseShow()`
renders the "🔥 N travelers planned X" line **only when that destination+month
has 2 or more planners**.

So on a young database the writes succeed and nothing appears. That is by
design — a "1 traveler" badge is not social proof. The Doctor tab prints how
many `pulse` documents exist so you can tell the difference between *broken*
and *waiting for traffic*.


---

## What `isAdmin()` actually checks (lines 6–9)

```
function isAdmin() {
  return request.auth != null
    && exists(/databases/$(db)/documents/admins/$(request.auth.uid));
}
```

It checks **existence of the document only**. It never reads the `ok` field.

So:

- `ok: true` is harmless but **not required** — its type cannot be the problem.
- Document IDs in Firestore are **always strings**. That is correct and normal;
  there is no other type to choose.
- The only things that can fail are: the document ID does not equal the UID of
  the account you are signed in as, the rules are not published in this project,
  or the collection name is not exactly `admins`.

The most common cause when the doc "looks right": the UID belongs to a
**different sign-in method on the same person** — e.g. you copied the UID of
your phone-number login from the Auth tab, but the console is signed in with
Google, which has a completely different UID. One person with two sign-in
methods has two UIDs.

The Doctor tab prints the signed-in email, the project ID, and your UID wrapped
in ⟦brackets⟧ with a character count, so a mismatch or a stray space is visible
at a glance.
