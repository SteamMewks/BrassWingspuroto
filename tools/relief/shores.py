"""Survey construction footprints and protected coast cross-sections in world metres."""
import numpy as np
import shapely as sh
from shapely.geometry import Point
from shapely.affinity import scale
from scipy.spatial import cKDTree


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


class Shores:
    def __init__(self, land, sites, paths, water, bases, origins):
        self.sites = sites
        self.land = land
        self.routes = cKDTree(np.vstack([np.asarray(p)[:, :2] for p in paths + water]))
        self.bases = cKDTree([[b['wx'], b['wz']] for b in bases])
        self.origins = cKDTree([[o['wx'], o['wz']] for o in origins])
        dock = next(s for s in sites if s['id'] == 'dock')
        # Two flooded cuts share a mouth, with a sheltered yard in the eastern arm.
        for dx, dz, rx, rz in [(0, -110, 187, 490), (-300, -240, 240, 375)]:
            cut = scale(Point(dock['x']+dx, dock['z']+dz).buffer(1), rx, rz)
            self.land = self.land.difference(cut)
        # A broad shallow inlet follows the sheltered shore opposite the central sea.
        self.cove = np.array([52033, 81340])
        cut = scale(Point(*self.cove).buffer(1), 355, 225)
        self.land = self.land.difference(cut)
        self.cuts = land.difference(self.land)
        self.edge = self.land.boundary

    def protection(self, p):
        return (smooth((self.routes.query(p)[0]-350)/250)
                * smooth((self.bases.query(p)[0]-640)/240)
                * smooth((self.origins.query(p)[0]-5500)/500))

    def distances(self, p):
        return sh.distance(sh.points(p), self.edge)

    def vertices(self, add, points):
        for dist in (0, 34, 100, 230):
            # Offset contours preserve steep scarps even in coarse inland triangles.
            for poly in sh.get_parts(self.land.buffer(-dist, quad_segs=2)):
                coords = np.asarray(poly.exterior.coords)
                if dist == 0 or len(coords) > 20:
                    add(coords)
        for s in self.sites:
            for f in (1, 1.55):
                p = scale(Point(s['x'], s['z']).buffer(1, quad_segs=10),
                          s['rx']*f, s['rz']*f)
                add(p.exterior.coords)
            points.append([s['x'], s['z']])
            if s['id']=='gauge':
                for dz in (-28,-16,24,62):
                    add([[s['x']+dx,s['z']+dz] for dx in (-240,-145,-95,0,95,145,240)])

    def shape(self, V, Y):
        ds = self.distances(V)
        x,z = V.T
        slope = np.clip(Y / np.maximum(40,ds),0,1)
        exposure = np.sin(x/2300+z/4100)*.35 + np.cos(z/3700)*.22 + 1.6*slope
        cliff = smooth((exposure-.05)/.55)
        rock = smooth((exposure+.35)/.4)
        gauge = next(s for s in self.sites if s['id']=='gauge')
        cliff = np.maximum(cliff, 1-smooth((np.hypot(x-gauge['x'],z-gauge['z'])-220)/350))
        dock = next(s for s in self.sites if s['id']=='dock')
        cliff = np.maximum(cliff,(1-smooth((np.hypot(x-dock['x'],z-dock['z'])-480)/320))*smooth((abs(x-dock['x'])-90)/100))
        width = 110+85*(1+np.sin(z/811+x/930))
        beach = ds*.032
        shelves = np.floor(ds/34)*4+2*np.sin(x/51)*np.sin(z/61)
        target = (beach*(1-rock)+shelves*rock)*(1-cliff)+(110+35*np.cos(x/580))*smooth(ds/35)*cliff
        sheltered = 1-smooth((np.hypot(x-self.cove[0],z-self.cove[1])-370)/320)
        target = target*(1-sheltered)+beach*sheltered
        weight = self.protection(V)*(1-smooth((ds-width)/250))
        Y = Y*(1-weight)+target*weight
        # The dial's back and pipes enter the same TIN scarp used by collisions.
        dx,dz=x-gauge['x'],z-gauge['z']
        w=(1-smooth((abs(dx)-145)/95))*(1-smooth((abs(dz)-70)/180))
        Y=Y*(1-w)+219*smooth((dz+24)/43)*w
        for s in self.sites:
            if s['id'] in ('dock','gauge'):continue
            dx,dz=x-s['x'],z-s['z']
            u=np.hypot(dx/s['rx'],dz/s['rz'])
            level=Y[np.argmin(dx*dx+dz*dz)]
            if s['id']=='chain':
                target=level+95*smooth(abs(dx)/520)
            elif s['id']=='orrery':
                target=level+155
            else:
                target=level
            w=1-smooth((u-1)/.55)
            Y=Y*(1-w)+target*w
        return Y

    def colors(self, centers):
        d=self.distances(centers)
        p=self.protection(centers)
        return (d<180)&(p>.75)
