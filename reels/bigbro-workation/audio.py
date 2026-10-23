"""Original soundtrack + SFX for the Big Bro workation reel. Pure numpy; no samples, no film audio.
Run: python3 audio.py out.wav   (duration from TIMELINE below, 44.1 kHz stereo)"""
import sys, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter
SR = 44100
DUR = 36.0
BPM = 108
BEAT = 60 / BPM
rng = np.random.default_rng(7)

def t_(d): return np.arange(int(d * SR)) / SR
def env(n, a=.005, r=.2):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr) if nr < n else 1; return e
def bp(x, lo, hi):
    b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def lp(x, f):
    b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)

def kick(v=1.0):
    t = t_(.28); f = 52 + 120 * np.exp(-t * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    return v * np.sin(ph) * np.exp(-t * 11)
def dhol_hi(v=1.0):  # sharp stick: band noise + short tone
    t = t_(.12); n = bp(rng.standard_normal(len(t)), 1500, 5500)
    return v * (n * np.exp(-t * 38) * .9 + np.sin(2 * np.pi * 330 * t) * np.exp(-t * 30) * .4)
def tabla(v=1.0, f=210):
    t = t_(.22); fr = f * (1 + .35 * np.exp(-t * 25)); ph = 2 * np.pi * np.cumsum(fr) / SR
    return v * (np.sin(ph) + .4 * np.sin(2.3 * ph)) * np.exp(-t * 16)
def pluck(freq, d=.35, v=1.0):
    t = t_(d); s = sum(np.sin(2 * np.pi * freq * k * t) / k for k in (1, 2, 3, 4)) * np.exp(-t * 7)
    vib = 1 + .004 * np.sin(2 * np.pi * 5.5 * t); return v * s * .35 * vib
def flute(freq, d=.5, v=1.0):  # bansuri-ish: sine + breath, vibrato
    t = t_(d); vib = 1 + .006 * np.sin(2 * np.pi * 5.8 * t)
    ph = 2 * np.pi * np.cumsum(freq * vib) / SR
    s = np.sin(ph) + .25 * np.sin(2 * ph) + .08 * np.sin(3 * ph)
    br = bp(rng.standard_normal(len(t)), 2200, 5200) * .08
    return v * (s + br) * env(len(t), .05, .12) * .5
def boom(v=1.0):
    t = t_(1.2); f = 70 * np.exp(-t * 1.6) + 28; ph = 2 * np.pi * np.cumsum(f) / SR
    return v * (np.sin(ph) * np.exp(-t * 2.4) + lp(rng.standard_normal(len(t)), 300) * np.exp(-t * 6) * .6)
def whoosh(d=.7, v=1.0, up=True):
    n = rng.standard_normal(int(d * SR)); t = t_(d); out = np.zeros_like(n)
    for k in range(12):
        lo = 300 + k * 350; seg = bp(n, lo, lo + 500)
        w = np.exp(-((t - (d * (k / 12) if up else d * (1 - k / 12))) ** 2) / (2 * (d * .22) ** 2)); out += seg * w
    return v * out * .25 * env(len(t), .05, .2)
def pop(v=1.0, f=620):
    t = t_(.14); fr = f * (1 + 1.4 * np.exp(-t * 40)); ph = 2 * np.pi * np.cumsum(fr) / SR
    return v * np.sin(ph) * np.exp(-t * 26)
def ding(v=1.0, f=1568):
    t = t_(1.0); return v * (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 4.5) * .5
def scratch(v=1.0):
    d = .55; t = t_(d); f = 900 * np.exp(-t * 4.2) + 80; ph = 2 * np.pi * np.cumsum(f) / SR
    s = (2 * ((ph / (2 * np.pi)) % 1) - 1) * .5 + bp(rng.standard_normal(len(t)), 600, 4000) * .5
    return v * s * np.exp(-t * 2.6) * .7
def sparkle(v=1.0):
    out = np.zeros(int(1.0 * SR))
    for i, f in enumerate((1976, 2349, 2637, 3136, 3951)):
        tt = t_(.5); x = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9) * .3; o = int(i * .06 * SR); out[o:o + len(x)] += x[:len(out) - o]
    return v * out
def thud(v=1.0):
    t = t_(.5); return v * np.sin(2 * np.pi * 48 * t) * np.exp(-t * 7) * 1.2

mix_l = np.zeros(int(DUR * SR)); mix_r = np.zeros_like(mix_l)
def put(x, at, pan=0.0, gain=1.0):
    i = int(at * SR)
    if i >= len(mix_l): return
    x = x[:len(mix_l) - i] * gain
    mix_l[i:i + len(x)] += x * (1 - max(0, pan)); mix_r[i:i + len(x)] += x * (1 + min(0, pan))

# D phrygian-dominant: D Eb F# G A Bb C
D = 146.83
scale = [D, D * 2 ** (1 / 12), D * 2 ** (4 / 12), D * 2 ** (5 / 12), D * 2 ** (7 / 12), D * 2 ** (8 / 12), D * 2 ** (10 / 12)]
def deg(i, octv=1): return scale[i % 7] * 2 ** (i // 7 + octv - 1)

# ---- scene map (seconds) must match build_frames.py ----
S = dict(hook=(0, 3.0), chaos=(3.0, 8.0), freeze=(8.0, 9.5), big=(9.5, 16.0), setup=(16.0, 23.0), price=(23.0, 30.0), meal=(30.0, 33.0), cta=(33.0, 36.0))

def groove(a, b, intensity=1.0, drive=True):
    t = a
    step = BEAT / 2; k = 0
    while t < b - 1e-3:
        s = k % 16
        if s in (0, 6, 10) and drive: put(kick(.9 * intensity), t, 0, .8)
        if s in (4, 12): put(dhol_hi(.9 * intensity), t, .2, .6)
        if s % 2 == 0: put(tabla(.5 * intensity, 200 + 30 * ((s // 2) % 3)), t, -.2, .5)
        if s in (3, 7, 11, 14, 15): put(dhol_hi(.5 * intensity), t, -.3, .45)
        t += step; k += 1

def riff(a, b, intensity=1.0, octv=2):
    pats = [[0, 1, 2, 1, 0, -1, 0, 0], [2, 3, 4, 3, 2, 1, 2, 2], [4, 5, 4, 3, 2, 1, 0, 1], [0, 2, 1, 0, -1, 0, 1, 0]]
    t = a; bar = 0
    while t < b - .1:
        pat = pats[bar % 4]
        for i, d in enumerate(pat):
            tt = t + i * BEAT / 2
            if tt >= b: break
            put(pluck(deg(d, octv), .3, intensity), tt, .1, .5)
        t += BEAT * 4; bar += 1

def drone(a, b, v=.4):
    t = t_(b - a); x = (np.sin(2 * np.pi * D / 2 * t) + .5 * np.sin(2 * np.pi * D * t)) * env(len(t), .5, .8) * v
    put(x, a, 0, .5)

# HOOK
put(boom(1.0), 0.0, 0, .9); put(dhol_hi(1), .02, 0, .8)
for i in range(3): put(thud(.9), 0.9 + i * .45, 0, .7)
put(whoosh(.4, 1, True), 2.7, 0, .6)
# CHAOS
drone(*S['chaos'], .35); groove(*S['chaos'], 1.0); riff(*S['chaos'], .9, 2)
for i, tt in enumerate((3.3, 4.1, 4.9, 5.6, 6.3, 7.0)): put(pop(.9, 520 + 40 * (i % 4)), tt, (-1) ** i * .5, .8)
# FREEZE
put(scratch(1.0), 8.0, 0, .9); put(boom(.9), 8.85, 0, .7)
# BIG BRO reveal: relaxed flute over soft groove
put(whoosh(.8, 1, True), 9.25, 0, .7)
groove(*S['big'], .9); riff(*S['big'], .8, 2)
t = S['big'][0]
for i, d in enumerate([4, 5, 6, 7, 6, 5, 4, 2]): put(flute(deg(d, 2), BEAT * 1.9, .9), t + i * BEAT * 2, 0, .45)
put(sparkle(1), 9.6, 0, .6)
# SETUP: a ding per checklist item
groove(*S['setup'], .85); riff(*S['setup'], .8, 2); put(whoosh(.5, 1, True), 15.8, 0, .6)
for tt in (16.5, 17.3, 18.1, 18.9, 19.7): put(ding(1, 1568 + 0), tt, 0, .5)
put(pop(.9, 700), 21.0, 0, .8)
# PRICE: dhol stamps
groove(*S['price'], 1.1); riff(*S['price'], .9, 2); put(whoosh(.5, 1, True), 22.8, 0, .6)
for tt in (23.6, 24.6, 25.6): put(boom(.8), tt, 0, .6); put(ding(1, 2093), tt + .05, 0, .5)
put(sparkle(1), 26.5, 0, .5)
# MEAL
groove(*S['meal'], .8); riff(*S['meal'], .8, 2); put(whoosh(.5, 1, True), 29.8, 0, .6); put(ding(1), 31.6, 0, .5)
# CTA
put(whoosh(.6, 1, True), 32.8, 0, .6); groove(33.0, 35.0, 1.1); put(boom(1), 33.0, 0, .9)
for i in range(4): put(kick(1.0), 34.0 + i * .24, 0, .8)
put(boom(1), 35.0, 0, 1.0); put(sparkle(1), 35.05, 0, .8)

L, R = mix_l, mix_r
peak = max(np.abs(L).max(), np.abs(R).max()) or 1
L = np.tanh(L / peak * 1.8) * .85; R = np.tanh(R / peak * 1.8) * .85
fade = np.ones_like(L); n = int(.4 * SR); fade[-n:] = np.linspace(1, 0, n)
out = np.stack([L * fade, R * fade], 1)
wavfile.write(sys.argv[1] if len(sys.argv) > 1 else 'reel.wav', SR, (out * 32767).astype(np.int16))
print('ok', len(L) / SR, 's')
