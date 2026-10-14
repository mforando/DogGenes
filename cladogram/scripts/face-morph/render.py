"""Wolf -> dog -> wolf evolution morph, rendered to video.
Landmark Delaunay warp + a frequency-staggered Laplacian blend: coarse shape and colour
change first, fine fur detail follows, and mid-frequency detail is briefly boosted so the
in-between faces look like plausible animals rather than a double exposure."""
import sys, json, subprocess, cv2, numpy as np
from scipy.spatial import Delaunay
sys.path.insert(0, sys.argv[1]); from lm import LM
FACES, OUT, FFMPEG = sys.argv[2], sys.argv[3], sys.argv[4]
PREVIEW = len(sys.argv) > 5
N = 360; FPS = 24
HOLD_WOLF, MORPH, HOLD_DOG = 1.0, 2.0, 1.6
DOGS = ["golden-retriever","german-shepherd","siberian-husky","beagle","pug","border-collie",
        "boxer","pembroke-welsh-corgi","rottweiler","bernese-mountain-dog"]

def img(k): return cv2.imread(f"{FACES}/{k}.jpg").astype(np.float32)
B = [(0,0),(N/2,0),(N-1,0),(N-1,N/2),(N-1,N-1),(N/2,N-1),(0,N-1),(0,N/2),
     (N/4,0),(3*N/4,0),(N-1,N/4),(N-1,3*N/4),(3*N/4,N-1),(N/4,N-1),(0,3*N/4),(0,N/4)]
def pts(k): return np.array(LM[k] + B, np.float32)

def warp(src, sp, dp, tris):
    out = np.zeros_like(src)
    for t in tris:
        s, d = sp[t], dp[t]
        x, y, w, h = cv2.boundingRect(d)
        if w == 0 or h == 0: continue
        M = cv2.getAffineTransform(s, (d - [x, y]).astype(np.float32))
        patch = cv2.warpAffine(src, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101)
        mask = np.zeros((h, w, 1), np.float32)
        cv2.fillConvexPoly(mask, np.int32(d - [x, y]), 1.0, cv2.LINE_AA)
        x2, y2 = min(x + w, N), min(y + h, N)
        patch, mask = patch[:y2-y, :x2-x], mask[:y2-y, :x2-x]
        roi = out[y:y2, x:x2]
        out[y:y2, x:x2] = roi * (1 - mask) + patch * mask
    return out

LEVELS = 5
def lap(im):
    g = [im]
    for _ in range(LEVELS - 1): g.append(cv2.pyrDown(g[-1]))
    L = [g[i] - cv2.pyrUp(g[i+1], dstsize=g[i].shape[1::-1]) for i in range(LEVELS - 1)]
    return L + [g[-1]]
def unlap(L):
    im = L[-1]
    for l in reversed(L[:-1]): im = cv2.pyrUp(im, dstsize=l.shape[1::-1]) + l
    return im
def smooth(x): x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)

def frame(A, B, pa, pb, tris, t):
    s = smooth(t)
    p = (1 - s) * pa + s * pb
    wa, wb = warp(A, pa, p, tris), warp(B, pb, p, tris)
    La, Lb = lap(wa), lap(wb)
    out = []
    for k in range(LEVELS):
        # k = 0 finest ... LEVELS-1 coarsest: coarse leads, fine lags
        lead = (LEVELS - 1 - k) / (LEVELS - 1)          # 1 for finest, 0 for coarsest
        a = smooth((t - 0.28 * lead) / 0.72)
        lvl = (1 - a) * La[k] + a * Lb[k]
        if 0 < k < LEVELS - 1:                            # dreamlike detail in the middle
            lvl *= 1 + 0.55 * np.sin(np.pi * t)
        out.append(lvl)
    return np.clip(unlap(out), 0, 255).astype(np.uint8)

wolf = img("grey-wolf"); pw = pts("grey-wolf")
frames_meta = []; tcur = 0.0
cmd = [FFMPEG, "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{N}x{N}", "-r", str(FPS), "-i", "-"]
procs = [subprocess.Popen(cmd + ["-c:v","libx264","-preset","slow","-crf","26","-pix_fmt","yuv420p","-movflags","+faststart", OUT + ".mp4"], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)]
if not PREVIEW:
    procs.append(subprocess.Popen(cmd + ["-c:v","libvpx-vp9","-b:v","0","-crf","38","-row-mt","1", OUT + ".webm"], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL))
def emit(im, n=1):
    b = im.tobytes()
    for _ in range(n):
        for p in procs: p.stdin.write(b)
segs = []
def seg(name, sec, kind): 
    global tcur; segs.append({"name": name, "start": round(tcur, 3), "kind": kind}); tcur += sec
dogs = DOGS[:2] if PREVIEW else DOGS
for d in dogs:
    dog = img(d); pd = pts(d)
    tris = Delaunay((pw + pd) / 2).simplices
    nm = int(MORPH * FPS)
    emit(wolf.astype(np.uint8), int(HOLD_WOLF * FPS)); seg("grey-wolf", HOLD_WOLF, "hold")
    for i in range(nm): emit(frame(wolf, dog, pw, pd, tris, (i + 1) / nm))
    seg(d, MORPH, "morph")
    emit(dog.astype(np.uint8), int(HOLD_DOG * FPS)); seg(d, HOLD_DOG, "hold")
    for i in range(nm): emit(frame(dog, wolf, pd, pw, tris, (i + 1) / nm))
    seg("grey-wolf", MORPH, "morph")
for p in procs: p.stdin.close(); p.wait()
json.dump({"duration": round(tcur, 3), "segments": segs}, open(OUT + ".json", "w"), indent=1)
print("done", tcur)
