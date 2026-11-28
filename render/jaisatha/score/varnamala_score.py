# Original score for Jaisa Tha #3 (varnamala): synthesised in code, no samples, no library music.
# Usage: python3 varnamala_score.py out.wav DURATION
import numpy as np, wave, sys
SR=44100; DUR=float(sys.argv[2]); BPM=88.0; beat=60/BPM; bar=4*beat
rng=np.random.default_rng(34)
N=int(SR*DUR); out=np.zeros(N)
def midi(m): return 440*2**((m-69)/12)
def ks(freq, dur, bright=0.5, decay=0.996):
    n=int(SR*dur); p=max(2,int(SR/freq)); buf=rng.uniform(-1,1,p)*bright; y=np.zeros(n)
    for i in range(n):
        y[i]=buf[i%p]; buf[i%p]=decay*0.5*(buf[i%p]+buf[(i+1)%p])
    return y
def add(sig,t,g=1.0):
    i=int(t*SR); j=min(N,i+len(sig)); 
    if i<N: out[i:j]+=g*sig[:j-i]
def env(n,a,r):
    e=np.ones(n); A=int(a*SR); R=int(r*SR)
    e[:A]=np.linspace(0,1,A) if A>0 else 1
    if R>0: e[-R:]*=np.linspace(1,0,R)
    return e
def bowed(freqs,dur,g=0.12):
    n=int(SR*dur); t=np.arange(n)/SR; s=np.zeros(n)
    for f in freqs:
        vib=1+0.004*np.sin(2*np.pi*5.2*t)
        for h in range(1,6): s+=np.sin(2*np.pi*f*h*vib*t)/h**1.3
    return g*s*env(n,0.35,0.6)/len(freqs)
def tak(g=0.5):
    n=int(0.12*SR); t=np.arange(n)/SR
    body=np.sin(2*np.pi*(220*np.exp(-t*18)+160)*t)*np.exp(-t*35)
    noise=rng.normal(0,1,n)*np.exp(-t*60)
    return g*(0.7*body+0.25*noise)
def dhum(g=0.6):
    n=int(0.5*SR); t=np.arange(n)/SR
    return g*np.sin(2*np.pi*(130*np.exp(-t*4)+105)*t)*np.exp(-t*7)
# D dorian progression, one chord per bar
prog=[[57,60,64],[53,57,60],[55,59,62],[52,55,59],[57,60,64],[50,53,57],[53,57,60],[52,56,59]]
nbars=int(np.ceil(DUR/bar))
for b in range(nbars):
    t0=b*bar; ch=prog[b%len(prog)]
    end_card = t0 >= DUR-6
    layer = 1 + min(3, b//4)          # one layer added every few bars
    if end_card: layer=1
    # arpeggio, eighth notes
    pat=[0,1,2,1,0,2,1,2]
    for k in range(8):
        t=t0+k*beat/2
        if t>DUR-1.2: break
        m=ch[pat[k]]+12*(1 if (k%4==3 and layer>=2) else 0)
        add(ks(midi(m),1.4,bright=0.45+0.1*(k==0)),t,0.32 if k==0 else 0.22)
    # low strings from layer 2
    if layer>=2 and t0<DUR-2: add(bowed([midi(ch[0]-12),midi(ch[2]-12)],min(bar,DUR-t0)),t0,0.9)
    # frame drum: hit on every bar line (cue hits), groove from layer 3
    if t0<DUR-1: add(dhum(0.55),t0)
    if layer>=3:
        for k in (3,6): add(tak(0.35),t0+k*beat/2)
        add(dhum(0.35),t0+2*beat)
    if layer>=4:
        for k in (1,5,7): add(tak(0.22),t0+k*beat/2)
# hook: strong pluck + hit at 0; resolution: final D chord ringing over the end card
for m in (45,52,57,60,64): add(ks(midi(m),5.0,0.5,0.998),DUR-5.2,0.25)
add(dhum(0.7),DUR-5.2)
# high-pass ~110 Hz (one-pole x2) to keep bass share low
def hp(x,fc):
    a=1/(1+2*np.pi*fc/SR); y=np.zeros_like(x); prev_x=prev_y=0.0
    for i in range(len(x)):
        y[i]=a*(prev_y+x[i]-prev_x); prev_x=x[i]; prev_y=y[i]
    return y
out=hp(hp(out,110),110)
out[-int(1.5*SR):]*=np.linspace(1,0,int(1.5*SR))
out/=np.max(np.abs(out))+1e-9; out*=0.8
with wave.open(sys.argv[1],'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype(np.int16).tobytes())
