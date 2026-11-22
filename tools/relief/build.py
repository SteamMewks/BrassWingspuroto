from pathlib import Path
import sys, json, math, heapq, base64

D = Path(sys.argv[1])
import numpy as np, shapely as sh, triangle
from shapely.geometry import Polygon, LineString, Point
from scipy.ndimage import (
    distance_transform_edt,
    gaussian_filter,
    gaussian_filter1d,
    map_coordinates,
    label,
)
from scipy.spatial import cKDTree

S = json.loads((D / "survey.json").read_text())
N = 401
step = 250
rings = S["coasts"]
landPoly = Polygon()
for r in rings:
    landPoly = landPoly.symmetric_difference(Polygon(r).buffer(0))
for ring in S["islands"]:
    landPoly = landPoly.union(Polygon(ring).buffer(0))
coord = np.arange(N) * step
X, Z = np.meshgrid(coord, coord)
land = sh.contains_xy(landPoly, X, Z)
distance = distance_transform_edt(land) * step
regions, _ = label(land)
continents = [
    regions[int(z / step), int(x / step)]
    for x, z in [(22000, 40000), (78700, 74000), (67000, 29000)]
]


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def interp(A, pts):
    return map_coordinates(A, np.asarray(pts).T[::-1] / step, order=1, mode="nearest")


def fb(sigma, seed):
    r = gaussian_filter(np.random.default_rng(seed).standard_normal((N, N)), sigma)
    return r / r.std()


broad = fb(12, 14)
medium = fb(4.2, 52)
fine = fb(1.4, 72)
H = np.zeros_like(X, dtype=float)
for i, angle in enumerate([0.57, -0.64, 0.95]):
    u = X * np.cos(angle) + Z * np.sin(angle)
    v = -X * np.sin(angle) + Z * np.cos(angle)
    axis = v + 2500 * np.sin(u / 6600) + 950 * broad
    spine = (0.5 + 0.5 * np.cos(axis / [1350, 1100, 1520][i])) ** 3.2
    chain = smooth((broad + 0.8) / 2) * (0.65 + 0.35 * smooth((medium + 2) / 4))
    height = (
        15
        + 20 * (1 + np.tanh(medium))
        + (95 + 360 * chain) * spine * (0.25 + 0.75 * chain)
        + 55 * smooth((medium + 0.2) / 0.8)
        + 17 * fine
    )
    H = np.where(regions == continents[i], np.maximum(8, height), H)
H = np.where(land, np.maximum(7, H), 0)
# Beach, stepped headland and rocky shore relief attenuate into the original shoreline.
coastWidth = 550 + 1200 * smooth((medium + 1) / 2)
H *= smooth(distance / coastWidth)
orig = np.array([[o["wx"], o["wz"]] for o in S["origins"]])
for i, (ox, oz) in enumerate(orig):
    # Keep the authored ridge and pass cross-sections; broader uplands meet their outskirts.
    dx = np.abs(X - ox)
    dz = np.abs(Z - (oz + (1800 if i == 1 else 0)))
    f = smooth(
        np.maximum(dx - (2300 if i == 1 else 5050), dz - (4350 if i == 1 else 4900))
        / 1800
    )
    H = H * f + 10 * (1 - f) * land
H = np.where(land, H, 0)
bases = S["bases"]
pads = []
for b in bases:
    x, z = b["wx"], b["wz"]
    rx, rz, buf = {
        "small": (127, 176, 115),
        "medium": (222, 181, 165),
        "large": (240, 190, 225),
    }[b["tier"]]
    h = (
        10
        if b["island"]
        else round(
            float(
                np.median(
                    interp(
                        H,
                        [
                            [x + a * rx * 0.8, z + c * rz * 0.8]
                            for a in [-1, 0, 1]
                            for c in [-1, 0, 1]
                        ],
                    )
                )
            )
            * 2
        )
        / 2
    )
    pads.append(
        dict(id=b["id"], x=x, z=z, rx=rx, rz=rz, buffer=buf, h=h, island=b["island"])
    )
# Route drainage through connected land to a surveyed coastal outlet, excluding engineered sites.
blocked = np.zeros_like(land)
for b in pads:
    blocked |= (np.abs(X - b["x"]) < b["rx"] + 280) & (
        np.abs(Z - b["z"]) < b["rz"] + 280
    )
for x, z, *_ in S["sites"] + [[x, z] for x, z in S["towns"]]:
    blocked |= (X - x) ** 2 + (Z - z) ** 2 < 360**2
ox, oz = orig[1]
blocked |= (np.abs(X - ox) < 1150) & (Z > oz - 2100) & (Z < oz + 6400)
for x, z in S["towns"]:
    blocked |= (np.abs(X - x) < 1400) & (np.abs(Z - z) < 730)
from scipy.ndimage import binary_dilation

shore = land & binary_dilation(~land)
cost = np.full(H.shape, np.inf)
parent = np.full(H.shape, -1, int)
order = []
q = []
for j, i in zip(*np.where(shore & ~blocked)):
    cost[j, i] = 0
    heapq.heappush(q, (0, int(j * N + i)))
while q:
    c, p = heapq.heappop(q)
    j, i = divmod(p, N)
    if c != cost[j, i]:
        continue
    order.append(p)
    for dy, dx in [
        (-1, 0),
        (1, 0),
        (0, 1),
        (0, -1),
        (-1, 1),
        (1, -1),
        (1, 1),
        (-1, -1),
    ]:
        a, b = j + dy, i + dx
        if not (0 <= a < N and 0 <= b < N and land[a, b] and not blocked[a, b]):
            continue
        new = (
            c
            + (1.4142 if dx * dy else 1) * (1 + H[a, b] / 115)
            + max(0, H[j, i] - H[a, b]) * 0.65
        )
        if new < cost[a, b]:
            cost[a, b] = new
            parent[a, b] = p
            heapq.heappush(q, (new, a * N + b))
P = parent.ravel()
root = np.arange(N * N)
dist = np.zeros(N * N)
acc = np.ones(N * N)
for p in order:
    if P[p] >= 0:
        root[p] = root[P[p]]
        dist[p] = dist[P[p]] + step * (1.4142 if abs(P[p] - p) in [N + 1, N - 1] else 1)
for p in reversed(order):
    if P[p] >= 0:
        acc[P[p]] += acc[p]


def wp(p):
    return np.array([p % N * step, p // N * step], float)


def mouth(pt):
    edge = landPoly.boundary
    q = edge.interpolate(edge.project(Point(pt)))
    return np.array(q.coords[0])


basins = []
reaches = []
fallIDs = []
names = [
    ["西嶺川", "榛の川", "琥珀川"],
    ["北峡川", "霧杉川"],
    ["銅峰川", "南棚川", "麦穂川"],
]
legacy = np.array(S["oldRiver"])[::-1]
last = legacy[-1]
endCandidates = [
    p for p in order if math.dist(wp(p), last) < 1600 and wp(p)[1] < last[1]
]
end = min(endCandidates, key=lambda p: math.dist(wp(p), last))
legacyRoot = root[end]
planned = []
for reg, region in enumerate(continents):
    candidates = [
        p
        for p in order
        if P[p] < 0 and regions.ravel()[p] == region and acc[p] > 60 and p != legacyRoot
    ]
    chosen = []
    for p in sorted(candidates, key=lambda p: -acc[p]):
        if all(math.dist(wp(p), wp(q)) > 6500 for q in chosen):
            chosen.append(p)
        if len(chosen) == len(names[reg]):
            break
    if reg == 1:
        chosen.append(legacyRoot)
    for bi, r in enumerate(chosen):
        basinName = "紫煙谷川" if r == legacyRoot else names[reg][bi]
        planned.append((reg, r, basinName, 5 if reg == 0 else 4))

# Score distinct natural drainage trees by the gap to existing channels, the
# length and relief of their headwaters and their contributing area.
secondary_names = [
    ["榛丘川", "小麦沢", "西岬川", "緑台川", "泥炭川", "薄荷沢", "葦野川"],
    ["石楠沢", "黒杉川", "片岩川", "霞沢"],
    ["赤土川", "南岬沢", "陶土川", "石炭沢"],
]
charted = {r for _, r, _, _ in planned}
occupied = np.isin(root, list(charted)).reshape(N, N)
facilities = cKDTree(np.array(S["lots"]))
authored = np.asarray(S["legacy"]).reshape(-1, 3)
authoredHeight = cKDTree(authored[authored[:, 2] > 10.2, :2])
from shapely.ops import unary_union

roads_shape = unary_union([LineString(q) for q in S["roads"] if len(q) > 1])
groups = {}
for cell in order:
    groups.setdefault(root[cell], []).append(cell)
for reg, region in enumerate(continents):
    options = []
    for outlet, cells in groups.items():
        if (
            outlet in charted
            or regions.ravel()[outlet] != region
            or not 45 <= acc[outlet] <= 1500
        ):
            continue
        cells = np.asarray(cells)
        head = cells[np.argmax(dist[cells])]
        if dist[head] < 2000 or H.ravel()[head] < 25:
            continue
        # An entire selected catchment clears minor roads and station/building footprints.
        locations = np.column_stack((cells % N, cells // N)) * step
        if (
            facilities.query(locations)[0].min() < 220
            or authoredHeight.query(locations)[0].min() < 500
        ):
            continue
        if (
            not roads_shape.is_empty
            and sh.distance(sh.multipoints(locations), roads_shape) < 250
        ):
            continue
        options.append((outlet, cells, head))
    for name in secondary_names[reg]:
        gap = distance_transform_edt(~occupied).ravel() * step

        def score(option):
            outlet, cells, head = option
            return (
                min(15000, gap[outlet] * 0.4 + np.mean(gap[cells]) * 0.6)
                * min(1, dist[head] / 5500)
                * min(1.25, (acc[outlet] / 150) ** 0.32)
            )

        if not options:
            break
        best = max(range(len(options)), key=lambda i: score(options[i]))
        outlet, cells, head = options.pop(best)
        planned.append((reg, outlet, name, 2 if acc[outlet] > 150 else 1))
        occupied.ravel()[cells] = True
for reg, r, basinName, branches in planned:
    pool = np.array([p for p in order if root[p] == r])
    used = {r}
    target = branches
    if r == legacyRoot:
        p = end
        while p not in used:
            used.add(p)
            p = P[p]
    for _ in range(target):
        # Choose separated headwaters by unshared upstream length and source elevation.
        lengths = {}
        for p in pool:
            lengths[p] = 0 if p in used else lengths[P[p]] + math.dist(wp(p), wp(P[p]))
        p = max(pool, key=lambda p: lengths[p] * (0.8 + min(1, H.ravel()[p] / 280)))
        if lengths[p] < 1700:
            break
        while p not in used:
            used.add(p)
            p = P[p]
    children = {p: [] for p in used}
    for p in used:
        if p != r:
            children[P[p]].append(p)
    terminals = {p for p in used if len(children[p]) != 1} | {r}
    starts = terminals - {r}
    contribution = {}
    for p in reversed(pool):
        if p in used:
            contribution[p] = max(1, sum(contribution[k] for k in children[p]))
    ids = {p: len(reaches) + i for i, p in enumerate(sorted(starts))}
    # A separate short estuary below the last junction also handles a junction on the coast.
    outletID = len(reaches) + len(ids)
    basin = len(basins)
    for p in sorted(starts):
        trail = [p]
        v = P[p]
        while v not in terminals:
            trail.append(v)
            v = P[v]
        trail.append(v)
        pts = np.array([wp(n) for n in trail])
        if len(pts) > 2:
            ss = gaussian_filter1d(pts, 0.78, axis=0)
            ss[0] = pts[0]
            ss[-1] = pts[-1]
            pts = ss
        if r == legacyRoot and p == end:
            pts = np.vstack([legacy, pts])
        reaches.append(
            dict(
                id=ids[p],
                basin=basin,
                down=ids.get(v, outletID),
                rank=contribution[p],
                points=pts.tolist(),
                legacy=bool(r == legacyRoot and p == end),
            )
        )
    pt = wp(r)
    out = mouth(pt)
    if math.dist(out, pt) < 1:
        pt = pt + 0.01
    reaches.append(
        dict(
            id=outletID,
            basin=basin,
            down=-1,
            rank=contribution[r],
            points=[pt.tolist(), out.tolist()],
            legacy=False,
        )
    )
    basins.append(
        dict(
            name=basinName,
            region=reg,
            outlet=outletID,
            areaKm2=round(acc[r] * step**2 / 1e6, 2),
        )
    )
# Choose one steep reach in each mountainous district, away from legacy cliffs, stations and tracks.
tracks = np.vstack([np.asarray(p)[:, :2] for p in S["paths"]])
trackTree = cKDTree(tracks)
for b in [0, 3, 7]:
    candidates = []
    for reach in reaches:
        if reach["basin"] != b or reach["legacy"]:
            continue
        pts = np.array(reach["points"])
        z = interp(H, pts)
        for j in range(2, len(pts) - 2):
            clearance = trackTree.query(pts[j])[0]
            drop = z[j - 1] - z[j + 1]
            if clearance > 430 and drop > 12:
                candidates.append((drop, reach["id"], j))
    if candidates:
        _, idx, j = max(candidates)
        r = reaches[idx]
        pts = np.array(r["points"])
        unit = pts[j + 1] - pts[j]
        unit /= np.linalg.norm(unit)
        r["points"][j : j + 1] = [pts[j].tolist(), (pts[j] + 4 * unit).tolist()]
        r["fall"] = j
        fallIDs.append(idx)


# Solve water profiles downstream first, matching the confluence exactly.
def profile(r):
    if "samples" in r:
        return
    down = r["down"]
    pts = np.array(r["points"])
    length = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    h = np.zeros(len(pts))
    if down >= 0:
        profile(reaches[down])
        h[-1] = reaches[down]["samples"][0][2]
    nat = interp(H, pts)
    legacyB = basins[r["basin"]]["name"] == "紫煙谷川"
    for j in reversed(range(len(length))):
        if j == r.get("fall"):
            h[j] = h[j + 1] + min(31, max(14, nat[j] * 0.12))
        else:
            slope = 0.00018 if legacyB else 0.0013 if r["rank"] >= 3 else 0.003
            h[j] = max(
                h[j + 1] + length[j] * slope,
                min(
                    nat[j] * 0.83, h[j + 1] + length[j] * (0.0008 if legacyB else 0.066)
                ),
            )
    width = 5 + 5 * np.sqrt(r["rank"])
    widths = np.linspace(width, width * 1.1, len(pts))
    if down < 0:
        widths = np.linspace(width, width * 1.8, len(pts))
    elif down >= 0:
        widths[-1] = min(reaches[down]["samples"][0][3], width * 1.2)
    if r["legacy"]:
        widths[: len(legacy)] = 18
    r["samples"] = [
        [round(x, 2), round(z, 2), round(y, 3), round(w, 2)]
        for (x, z), y, w in zip(pts, h, widths)
    ]


for r in reaches:
    profile(r)
print(
    "basins",
    [(b["name"], b["outlet"]) for b in basins],
    "reaches",
    len(reaches),
    "falls",
    fallIDs,
    flush=True,
)
# Constrained triangulation carries coastlines, graded footprints and channel cross sections.
lines = []
points = []


def add(a):
    a = np.array(a)[:, :2]
    if len(a) > 1:
        lines.append(LineString(a))


def frame(x, z, rx, rz):
    add(
        [
            [x - rx, z - rz],
            [x + rx, z - rz],
            [x + rx, z + rz],
            [x - rx, z + rz],
            [x - rx, z - rz],
        ]
    )


for ring in rings:
    add(ring + [ring[0]])
for tri in S["legacy"]:
    add(tri + [tri[0]])
gridpts = np.column_stack([X[::2, ::2].ravel(), Z[::2, ::2].ravel()])
points.extend(gridpts[sh.contains_xy(landPoly, *gridpts.T)])
# A low-pass rail profile sets a bounded ruling grade through the foothills.
datum = gaussian_filter(H, 3)
for _ in range(45):
    for axis in (0, 1):
        datum = np.minimum(
            datum, np.minimum(np.roll(datum, -1, axis), np.roll(datum, 1, axis)) + 3.0
        )


def grade(pts):
    h = interp(datum, pts)
    for ox, oz in orig:
        w = smooth(
            (
                np.maximum(
                    np.abs(pts[:, 0] - ox) - 4800, np.abs(pts[:, 1] - oz - 800) - 5500
                )
            )
            / 1400
        )
        h = w * h + (1 - w) * 10
    return h


# Match the nearby yard and runway datum where an industrial siding serves the base.
for b in pads:
    if not b["island"] and trackTree.query([b["x"], b["z"]])[0] < 760:
        b["h"] = round(grade(np.array([[b["x"], b["z"]]]))[0] * 2) / 2
    for d in [0, 35, b["buffer"]]:
        frame(b["x"], b["z"], b["rx"] + d, b["rz"] + d)


def normals(pts):
    tang = np.gradient(pts, axis=0)
    return (
        np.column_stack((tang[:, 1], -tang[:, 0]))
        / np.maximum(0.001, np.linalg.norm(tang, axis=1))[:, None]
    )


def densify(rows, spacing):
    rows = np.array(rows)
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(rows[:, :2], axis=0), axis=1))]
    qs = np.unique(np.r_[d, np.arange(0, d[-1], spacing)])
    return np.column_stack([np.interp(qs, d, v) for v in rows.T])


# Bound channel profiles by the surrounding terrain and the surveyed railway crossing levels.
# Upstream ceilings propagate through confluences before the final longitudinal profiles are solved.
incoming = {r["id"]: [] for r in reaches}
for r in reaches:
    if r["down"] >= 0:
        incoming[r["down"]].append(r)


def lower_profile(r):
    for upstream in incoming[r["id"]]:
        lower_profile(upstream)
    a = np.array(r["samples"])
    pts = a[:, :2]
    railDist = trackTree.query(pts)[0]
    limit = np.maximum(0.05, interp(H, pts) - 1.8)
    limit = np.minimum(limit, grade(pts) - 5.5 + np.maximum(0, railDist - 125) * 0.032)
    if r["down"] < 0:
        limit[-1] = 0
        limit[0] = min(limit[0], 0.005 * np.linalg.norm(pts[-1] - pts[0]))
    a[:, 2] = np.minimum(a[:, 2], np.maximum(0, limit))
    if incoming[r["id"]]:
        a[0, 2] = min(a[0, 2], *(u["samples"][-1][2] for u in incoming[r["id"]]))
    for j in range(1, len(a)):
        a[j, 2] = min(
            a[j, 2], max(0, a[j - 1, 2] - 0.0001 * np.linalg.norm(pts[j] - pts[j - 1]))
        )
    for u in incoming[r["id"]]:
        u["samples"][-1][2] = round(a[0, 2], 3)
    r["samples"] = np.round(a, 3).tolist()


for b in basins:
    lower_profile(reaches[b["outlet"]])
for r in reaches:
    r.pop("fall", None)
# Concentrate an existing drop at a rock lip. Preserve both endpoints and the confluence levels.
for reg, secondary in [(i, False) for i in range(3)] + [(1, True)]:
    candidate = []
    for r in reaches:
        if (
            basins[r["basin"]]["region"] != reg
            or r["legacy"]
            or (r["basin"] >= 9) != secondary
        ):
            continue
        a = np.array(r["samples"])
        for j in range(1, len(a) - 2):
            drop = a[j, 2] - a[j + 1, 2]
            if drop > 13 and trackTree.query((a[j, :2] + a[j + 1, :2]) / 2)[0] > 500:
                candidate.append((drop, r["id"], j))
    if candidate:
        drop, idx, j = max(candidate)
        r = reaches[idx]
        a, b = np.array(r["samples"][j : j + 2])
        length = np.linalg.norm(a[:2] - b[:2])
        pts = []
        for t, z in [
            (0.5, a[2] - drop * 0.12),
            (0.5 + min(0.06, 5 / length), b[2] + drop * 0.12),
            (0.60, b[2] + drop * 0.06),
        ]:
            v = a + t * (b - a)
            v[2] = z
            pts.append(np.round(v, 3).tolist())
        r["samples"][j + 1 : j + 1] = pts
        r["fall"] = j + 1
        r["fallId"] = f"falls-{idx}"

# Taper independent headwaters through their first kilometre. Keep the historic gorge section.
pools = []
for r in reaches:
    a = np.asarray(r["samples"])
    if not incoming[r["id"]] and not r["legacy"]:
        distance_from_spring = np.r_[
            0, np.cumsum(np.linalg.norm(np.diff(a[:, :2], axis=0), axis=1))
        ]
        taper = smooth(distance_from_spring / min(950, distance_from_spring[-1]))
        a[:, 3] = 3 + (a[:, 3] - 3) * taper
    if "fall" in r:
        j = r["fall"] + 1
        # Survey a wider pool and a short downstream tail after the rock lip.
        center = a[j, :2].copy()
        pools.append((center.copy(), a[j, 3]))
        a[j, 3] *= 1.30
        tail = j + 1
        while tail < len(a) - 1 and np.linalg.norm(a[tail, :2] - center) < 12:
            tail += 1
        offset = a[tail, :2] - center
        length = np.linalg.norm(offset)
        if length > 30:
            previous = a[tail - 1]
            start = np.linalg.norm(previous[:2] - center)
            sample = previous + (a[tail] - previous) * ((16 - start) / (length - start))
            sample[3] = a[j, 3] * 1.12
            a = np.insert(a, tail, sample, axis=0)
    r["samples"] = np.round(a, 3).tolist()

(D / "hydro.json").write_text(
    json.dumps(
        dict(
            basins=basins,
            reaches=[{k: v for k, v in r.items() if k != "points"} for r in reaches],
        )
    )
)
rrows = []
for r in reaches:
    pts = np.array(r["samples"])
    n = normals(pts[:, :2])
    width = pts[:, 3:4]
    for ratio in [-5, -1.16, -0.66, 0, 0.66, 1.16, 5]:
        add(pts[:, :2] + ratio * n * width)
    if "fall" in r:
        for j in [r["fall"], r["fall"] + 1]:
            add([pts[j, :2] - 5 * width[j] * n[j], pts[j, :2] + 5 * width[j] * n[j]])
    for a, b in zip(pts, pts[1:]):
        length = math.dist(a[:2], b[:2])
        count = max(1, math.ceil(length / 10))
        for t in np.arange(count) / count:
            rrows.append([*(a + (b - a) * t), *a, *b])
    rrows.append([*pts[-1], *pts[-2], *pts[-1]])
rr = np.array(rrows)
rtree = cKDTree(rr[:, :2])


def river_at(pts):
    # Nearest distance to the actual segment, not to its survey samples.
    _, idx = rtree.query(pts, k=3)
    a = rr[idx, 4:8]
    b = rr[idx, 8:12]
    dr = b - a
    u = np.clip(
        np.sum((pts[:, None, :] - a[:, :, :2]) * dr[:, :, :2], axis=2)
        / np.maximum(0.00001, np.sum(dr[:, :, :2] ** 2, axis=2)),
        0,
        1,
    )
    v = a + u[:, :, None] * dr
    ds = np.linalg.norm(pts[:, None, :] - v[:, :, :2], axis=2)
    k = np.argmin(ds, axis=1)
    i = np.arange(len(pts))
    return ds[i, k], v[i, k, 2], v[i, k, 3]


stations = np.array([[s[0], s[1]] for s in S["sites"]])
stationHeights = grade(stations)
stationTree = cKDTree(stations)
for x, z in stations:
    frame(x, z, 150, 150)
railrows = []
profiles = []
for path in S["paths"]:
    pts = np.array(path)
    base = grade(pts[:, :2])
    sd, si = stationTree.query(pts[:, :2])
    a = smooth((sd - 155) / 240)
    base = stationHeights[si] * (1 - a) + base * a
    rd, rh, rw = river_at(pts[:, :2])
    base = np.maximum(base, np.where(rd < rw + 65, rh + 5.3, -10))
    for rng in [range(1, len(pts)), range(len(pts) - 2, -1, -1)]:
        for j in rng:
            k = j - 1 if rng.step == 1 else j + 1
            base[j] = max(base[j], base[k] - abs(pts[j, 2] - pts[k, 2]) * 0.018)
    profiles.append(np.round(base, 3).tolist())
    railrows.extend(densify(np.c_[pts[:, :2], base], 5))
    p = pts[::2, :2]
    p = np.vstack([p, pts[-1, :2]]) if len(pts) % 2 == 0 else p
    n = normals(p)
    for offset in [-19, 0, 19]:
        add(p + n * offset)
for id, curve in S["spurs"]:
    b = next(b for b in pads if b["id"] == id)
    c = np.array(curve)
    h = grade(c)
    d = np.linspace(0, 1, len(c))
    h = h[0] * (1 - d) + b["h"] * d
    railrows.extend(densify(np.c_[c, h], 10))
    n = normals(c)
    for side in [-15, 15]:
        add(c + n * side)
railrows = np.array(railrows)
railTree = cKDTree(railrows[:, :2])
# Split shared edges and all crossings before handing the planar graph to Triangle.
merged = sh.union_all(lines, grid_size=0.05)
segs = []
for ln in sh.get_parts(merged):
    ar = np.asarray(ln.coords)
    segs.extend(np.stack([ar[:-1], ar[1:]], axis=1))
segs = np.array(segs)
vert, inds = np.unique(
    np.round(np.vstack([segs.reshape(-1, 2), points]) * 20).astype("int32"),
    axis=0,
    return_inverse=True,
)
edges = inds[: segs.size // 2].reshape(-1, 2)
edges = edges[edges[:, 0] != edges[:, 1]]
mesh = triangle.triangulate(dict(vertices=vert / 20, segments=edges), "pQc")
V = mesh["vertices"]
T = mesh["triangles"]
centers = V[T].mean(axis=1)
T = T[sh.contains_xy(landPoly, *centers.T)]
print("TIN", len(V), len(T), flush=True)
Y = interp(H, V)
for ring in S["islands"]:
    mask = sh.intersects_xy(Polygon(ring).buffer(0.06), *V.T)
    Y[mask] = 10
# Exact legacy triangles preserve the geometry of saddles, cliffs and quarry benches.
old = np.array(S["legacy"])
polys = sh.polygons(old[:, :, :2])
tree = sh.STRtree(polys)
i, k = tree.query(sh.points(V), predicate="intersects")
if len(i):
    a, b, c = old[k, 0], old[k, 1], old[k, 2]
    ab = b - a
    ac = c - a
    q = V[i] - a[:, :2]
    den = ab[:, 0] * ac[:, 1] - ab[:, 1] * ac[:, 0]
    h = a[:, 2] + (
        (q[:, 0] * ac[:, 1] - q[:, 1] * ac[:, 0]) * ab[:, 2]
        + (ab[:, 0] * q[:, 1] - ab[:, 1] * q[:, 0]) * ac[:, 2]
    ) / np.where(abs(den) > 1e-8, den, 1)
    np.maximum.at(Y, i, h)
# Snap legacy vertices displaced by sub-decimetre intersection quantization.
tree = cKDTree(old[:, :, :2].reshape(-1, 2))
d, ii = tree.query(V)
sel = d < 0.09
Y[sel] = old[:, :, 2].ravel()[ii[sel]]
legacyY = Y.copy()
sd, si = stationTree.query(V)
blend = smooth((sd - 180) / 180)
Y = Y * blend + stationHeights[si] * (1 - blend)
d, k = railTree.query(V)
h = railrows[k, 2]
blend = smooth((d - 22) / 230)
Y = Y * blend + h * (1 - blend)
# Bed, marginal shoals, banks and valley shoulders follow one longitudinal profile.
distRiver, water, width = river_at(V)
u = distRiver / width
depth = 1.0 + 0.058 * width
for center, radius in pools:
    depth += 2.3 * np.exp(-np.sum((V - center) ** 2, axis=1) / (2 * radius**2))
section = (
    water
    - depth
    + depth * np.clip((u - 0.55) / 0.45, 0, 1)
    + np.maximum(0, u - 1) * width * 0.26
)
blend = smooth((u - 1.16) / 4)
Y = np.where(u < 1.16, section, np.minimum(Y, section * (1 - blend) + Y * blend))
# Rail formation constrains the banks outside the wetted crossing.
rd, rk = railTree.query(V)
railBlend = smooth((rd - 12) / 15)
safe = distRiver > width + 6
Y = np.where(safe, Y * railBlend + railrows[rk, 2] * (1 - railBlend), Y)
for b in pads:
    x, z, rx, rz, buf, h = (b[k] for k in ["x", "z", "rx", "rz", "buffer", "h"])
    d = np.maximum(np.abs(V[:, 0] - x) - rx, np.abs(V[:, 1] - z) - rz)
    blend = smooth(d / buf)
    Y = h * (1 - blend) + Y * blend
# Retain the authored mountain cross sections outside actual earthwork footprints.
oldPt = sh.points(V)
onOld = np.zeros(len(V), bool)
oi, _ = sh.STRtree(polys).query(oldPt, predicate="intersects")
onOld[oi] = True
keep = (
    onOld & (legacyY > 10.2) & (distRiver > width * 2.5) & (railTree.query(V)[0] > 26)
)
for b in pads:
    keep &= ~(
        (abs(V[:, 0] - b["x"]) < b["rx"] + b["buffer"])
        & (abs(V[:, 1] - b["z"]) < b["rz"] + b["buffer"])
    )
Y[keep] = legacyY[keep]
# Shoreline vertices are sea-level, except for the submerged bed at estuaries.
islandShore = cKDTree(np.vstack(S["islands"])).query(V)[0] < 0.09
Y[islandShore] = 0
coastTree = cKDTree(np.vstack(rings))
d, _ = coastTree.query(V)
Y[d < 0.1] = np.minimum(Y[d < 0.1], 0)
Y = np.round(Y, 3)


# Store checked world-space positions, elevations and triangle indices with little-endian typed arrays.
def encode(a, typ):
    return base64.b64encode(np.asarray(a, dtype=typ).tobytes()).decode()


data = {
    "xy": encode(np.round(V * 20), "<i4"),
    "h": encode(np.round(Y * 20), "<i2"),
    "tri": encode(T, "<u4" if len(V) > 65535 else "<u2"),
    "wide": len(V) > 65535,
}
(D / "mesh.json").write_text(json.dumps(data, separators=(",", ":")))
(D / "pads.json").write_text(json.dumps(pads))
(D / "profiles.json").write_text(json.dumps(profiles))
np.savez(D / "tin.npz", V=V, Y=Y, T=T)

# Replace only the chart data in the game source. Preview is copied after validation.
import re

source = Path(__file__).resolve().parents[2] / "Brass_Wings_Homeward (5).html"
html = source.read_text()


def replace_chart(name, value):
    global html
    html, count = re.subn(
        r"^const " + name + r"=.*?;$",
        lambda m: "const " + name + "=" + value + ";",
        html,
        count=1,
        flags=re.M,
    )
    if count != 1:
        raise ValueError("Missing world chart " + name)


compact = lambda obj: json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
replace_chart("gradingSites", compact({p["id"]: p for p in pads}))
replace_chart("watersheds", compact(json.loads((D / "hydro.json").read_text())))
replace_chart("trackProfiles", compact(profiles))
from terrain_tiles import pack_tiles

replace_chart("terrainArchive", compact(pack_tiles(
    np.round(V * 20).astype("<i4"), np.round(Y * 20).astype("<i2"), T
)))
# Refresh the rail elevation samples with bake-rail.cjs after rebuilding the TIN.
replace_chart("railElevationArchive", "[]")
replace_chart("townLayoutArchive", "[]")
source.write_text(html)
