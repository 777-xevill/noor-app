# Pre-render the misty canvas (linear fade + two radial glows) for each palette, so screens draw one image.
import numpy as np
from PIL import Image
W, H = 180, 390
def hexrgb(h): h=h.lstrip('#'); return np.array([int(h[i:i+2],16) for i in (0,2,4)], float)
def render(top, bottom, glow, a1, a2, name):
    y = np.linspace(0,1,H)[:,None,None]
    base = hexrgb(top)*(1-y) + hexrgb(bottom)*y
    base = np.broadcast_to(base,(H,W,3)).copy()
    xs = np.linspace(0,1,W)[None,:]; ys = np.linspace(0,1,H)[:,None]
    for cx,cy,rx,ry,a in ((0.18,0.0,0.85,0.45,a1),(1.0,0.78,0.70,0.40,a2)):
        d = np.sqrt(((xs-cx)/rx)**2 + ((ys-cy)/ry)**2)
        alpha = (np.clip(1-d,0,1)*a)[...,None]
        base = base*(1-alpha) + hexrgb(glow)*alpha
    rng = np.random.default_rng(1)
    base += rng.uniform(-0.35,0.35,base.shape)  # dither against banding
    Image.fromarray(np.clip(base+0.5,0,255).astype(np.uint8)).save(f'assets/images/canvas/{name}.png', optimize=True)
render('#F5F7F9','#E4E8EC','#FFFFFF',0.95,0.55,'light')
render('#33373E','#24272C','#4A515B',0.55,0.25,'dark')
render('#101113','#000000','#23262B',0.55,0.25,'midnight')
