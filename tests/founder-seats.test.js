const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function loadModule() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(read('js/pricing/founder-seats.js'), context);
  return context.RWFounderSeats;
}

// Fake Firestore DocumentSnapshot: { exists, data() }
function snap(exists, data) {
  return { exists, data: () => data };
}

test('computeSeatsLeft: 0 claimed, NMIMS unsigned -> full 1000 left', () => {
  const RWFounderSeats = loadModule();
  assert.equal(RWFounderSeats.computeSeatsLeft(0, false), 1000);
});

test('computeSeatsLeft: 5 claimed, NMIMS unsigned -> 995 left (the reported bug\'s expected fix)', () => {
  const RWFounderSeats = loadModule();
  assert.equal(RWFounderSeats.computeSeatsLeft(5, false), 995);
});

test('computeSeatsLeft: 5 claimed, NMIMS signed -> 495 left (500-seat reservation applied)', () => {
  const RWFounderSeats = loadModule();
  assert.equal(RWFounderSeats.computeSeatsLeft(5, true), 495);
});

test('computeSeatsLeft: never goes negative even if claimed exceeds the cap', () => {
  const RWFounderSeats = loadModule();
  assert.equal(RWFounderSeats.computeSeatsLeft(1000, true), 0);
  assert.equal(RWFounderSeats.computeSeatsLeft(1500, false), 0);
});

test('computeSeatsLeft: defends against bad input (NaN/negative/non-number) instead of crashing', () => {
  const RWFounderSeats = loadModule();
  assert.equal(RWFounderSeats.computeSeatsLeft(NaN, false), 1000);
  assert.equal(RWFounderSeats.computeSeatsLeft(-5, false), 1000);
  assert.equal(RWFounderSeats.computeSeatsLeft(undefined, false), 1000);
  assert.equal(RWFounderSeats.computeSeatsLeft('5', false), 1000); // non-number ignored, not coerced
});

test('computeFromSnapshots: 0 claimed / unsigned (doc exists with count 0)', () => {
  const RWFounderSeats = loadModule();
  const result = RWFounderSeats.computeFromSnapshots(snap(true, { count: 0 }), snap(true, { officialConfirmed: false }));
  assert.equal(result.ok, true);
  assert.equal(result.left, 1000);
});

test('computeFromSnapshots: 5 claimed / unsigned -> 995', () => {
  const RWFounderSeats = loadModule();
  const result = RWFounderSeats.computeFromSnapshots(snap(true, { count: 5 }), snap(true, { officialConfirmed: false }));
  assert.equal(result.ok, true);
  assert.equal(result.left, 995);
});

test('computeFromSnapshots: 5 claimed / signed -> 495', () => {
  const RWFounderSeats = loadModule();
  const result = RWFounderSeats.computeFromSnapshots(snap(true, { count: 5 }), snap(true, { officialConfirmed: true }));
  assert.equal(result.ok, true);
  assert.equal(result.left, 495);
});

test('computeFromSnapshots: missing pricing/founder doc (never created yet) treated as 0 claimed, not an error', () => {
  const RWFounderSeats = loadModule();
  const result = RWFounderSeats.computeFromSnapshots(snap(false, {}), snap(true, { officialConfirmed: false }));
  assert.equal(result.ok, true);
  assert.equal(result.left, 1000);
});

test('computeFromSnapshots: missing/failed NMIMS-flag read defaults to "not signed" (conservative), keeps the real claimed count', () => {
  const RWFounderSeats = loadModule();
  const result = RWFounderSeats.computeFromSnapshots(snap(true, { count: 5 }), null);
  assert.equal(result.ok, true);
  assert.equal(result.left, 995);
});

test('computeFromSnapshots: failed/missing claimed-count read -> safe fallback, never a fabricated number', () => {
  const RWFounderSeats = loadModule();
  const result = RWFounderSeats.computeFromSnapshots(null, snap(true, { officialConfirmed: false }));
  assert.equal(result.ok, false);
  assert.equal(result.left, null);
});

test('computeFromSnapshots: never throws even given malformed snapshot-like objects', () => {
  const RWFounderSeats = loadModule();
  assert.doesNotThrow(() => RWFounderSeats.computeFromSnapshots({ exists: true, data: () => { throw new Error('boom'); } }, null));
  const result = RWFounderSeats.computeFromSnapshots({ exists: true, data: () => { throw new Error('boom'); } }, null);
  assert.equal(result.ok, false);
  assert.equal(result.left, null);
});

// ---- loadPublicSeatsLeft: exercises the real async Firestore-shaped call
// pattern (Promise-returning db.collection().doc().get()), mocked end to end.
function fakeDb({ founderCount, founderExists = true, founderRejects = false, nmimsSigned, nmimsExists = true, nmimsRejects = false }) {
  return {
    collection(name) {
      return {
        doc(id) {
          return {
            get() {
              if (name === 'pricing' && id === 'founder') {
                return founderRejects
                  ? Promise.reject(new Error('permission-denied'))
                  : Promise.resolve(snap(founderExists, { count: founderCount }));
              }
              if (name === 'partnerships' && id === 'nmims2026') {
                return nmimsRejects
                  ? Promise.reject(new Error('permission-denied'))
                  : Promise.resolve(snap(nmimsExists, { officialConfirmed: nmimsSigned }));
              }
              throw new Error('unexpected path in test: ' + name + '/' + id);
            }
          };
        }
      };
    }
  };
}

test('loadPublicSeatsLeft: 0 claimed, unsigned -> 1000 (mocked reads)', async () => {
  const RWFounderSeats = loadModule();
  const result = await RWFounderSeats.loadPublicSeatsLeft(fakeDb({ founderCount: 0, nmimsSigned: false }));
  assert.equal(result.ok, true);
  assert.equal(result.left, 1000);
});

test('loadPublicSeatsLeft: 5 claimed, unsigned -> 995 (mocked reads, the exact reported-bug scenario)', async () => {
  const RWFounderSeats = loadModule();
  const result = await RWFounderSeats.loadPublicSeatsLeft(fakeDb({ founderCount: 5, nmimsSigned: false }));
  assert.equal(result.ok, true);
  assert.equal(result.left, 995);
});

test('loadPublicSeatsLeft: 5 claimed, signed -> 495 (mocked reads)', async () => {
  const RWFounderSeats = loadModule();
  const result = await RWFounderSeats.loadPublicSeatsLeft(fakeDb({ founderCount: 5, nmimsSigned: true }));
  assert.equal(result.ok, true);
  assert.equal(result.left, 495);
});

test('loadPublicSeatsLeft: claimed-count read rejects -> safe fallback, no fabricated count, no crash', async () => {
  const RWFounderSeats = loadModule();
  const result = await RWFounderSeats.loadPublicSeatsLeft(fakeDb({ founderCount: 5, founderRejects: true, nmimsSigned: false }));
  assert.equal(result.ok, false);
  assert.equal(result.left, null);
});

test('loadPublicSeatsLeft: NMIMS-flag read rejects -> still shows the real claimed count, treated as unsigned', async () => {
  const RWFounderSeats = loadModule();
  const result = await RWFounderSeats.loadPublicSeatsLeft(fakeDb({ founderCount: 5, nmimsSigned: true, nmimsRejects: true }));
  assert.equal(result.ok, true);
  assert.equal(result.left, 995);
});

test('loadPublicSeatsLeft: no db available at all -> safe fallback, never throws', async () => {
  const RWFounderSeats = loadModule();
  const result = await RWFounderSeats.loadPublicSeatsLeft(null);
  assert.equal(result.ok, false);
  assert.equal(result.left, null);
});
