"""Pack the survey into independent offline terrain tiles."""

import base64
import math

import numpy as np

TILE_SIZE = 2048


# Build-time dependency only. The standalone HTML embeds a block decoder.
import ctypes
from ctypes.util import find_library

_lz4 = ctypes.CDLL(find_library("lz4") or "liblz4.so.1")
_lz4.LZ4_compress_HC.argtypes = [ctypes.c_char_p, ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_int]


def compact_tile(vertices, indices, colors, wide):
    # Transpose byte planes so repeated coordinate and palette bytes are adjacent.
    parts = []
    for data, stride in ((vertices, 12 if wide else 6), (indices, 2), (colors, 3)):
        parts.extend(data[lane::stride] for lane in range(stride))
    raw = b"".join(parts)
    dest = ctypes.create_string_buffer(_lz4.LZ4_compressBound(len(raw)))
    size = _lz4.LZ4_compress_HC(raw, dest, len(raw), len(dest), 12)
    if size <= 0:
        raise ValueError("Terrain compression failed")
    return [len(vertices) * (-1 if wide else 1), len(indices), base64.b64encode(dest.raw[:size]).decode()]


def pack_tiles(xy, heights, triangles):
    # Keep the original quantization and triangle order for collision.
    tiles = {}
    for index, row in enumerate(triangles):
        points = xy[row] / 20
        owner = tuple(np.floor(points.mean(axis=0) / TILE_SIZE).astype(int))
        west, south = np.floor(points.min(axis=0) / TILE_SIZE).astype(int)
        east, north = np.floor(points.max(axis=0) / TILE_SIZE).astype(int)
        for i in range(west, east + 1):
            for j in range(south, north + 1):
                tiles.setdefault((i, j), []).append((index, (i, j) == owner))

    result = {}
    for (i, j), entries in sorted(tiles.items()):
        ids = triangles[[index for index, _ in entries]]
        unique, local = np.unique(ids, return_inverse=True)
        if len(unique) > 65536:
            raise ValueError(f"Too many vertices in tile {i},{j}")
        offsets = xy[unique] - np.array([i, j]) * (TILE_SIZE * 20)
        offsets -= TILE_SIZE * 20 // 2
        wide = np.min(offsets) < -32768 or np.max(offsets) > 32767

        # Store shades only for render owners. Adjacent tiles have the exact
        # same boundary vertices, but submit the triangle to the GPU once.
        colors = []
        for index, render in entries:
            if not render:
                colors.extend((0, 0, 0))
                continue
            a, b, c = triangles[index]
            bx, bz = (xy[b] - xy[a]) / 20
            cx, cz = (xy[c] - xy[a]) / 20
            dy, ey = (heights[[b, c]] - heights[a]) / 20
            den = bx * cz - bz * cx
            if den == 0:
                colors.extend((127, 140, 94))
                continue
            sx = (dy * cz - ey * bz) / den
            sz = (bx * ey - cx * dy) / den
            elev = heights[[a, b, c]].sum() / 60
            rock = min(1, max(0, (elev - 135) / 260) + math.hypot(sx, sz) * .7)
            beach = elev < 5 and max(heights[[a, b, c]]) < 180
            shade = math.floor(22 * max(-1, min(1, sx * .95 + sz * .55)) + .5)
            rgb = (184, 165, 125) if beach else (127 + 39 * rock, 140 - 4 * rock, 94 + 34 * rock)
            colors.extend(math.floor(v + shade + .5) for v in rgb)
        vertices = np.column_stack((offsets, heights[unique]))
        result[f"{i},{j}"] = compact_tile(
            vertices.astype("<i4" if wide else "<i2").tobytes(),
            local.astype("<u2").tobytes(), bytes(colors), wide
        )
    return result
