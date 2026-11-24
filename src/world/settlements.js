const settlements = Object.fromEntries([
 {"id": "brass-city", "name": "黄銅港市", "region": 0, "wx": 27656, "wz": 36649, "height": 10.73, "kind": "city", "industry": "works", "width": 36, "length": 300, "tier": "medium"},
 {"id": "west-city", "name": "西都鋳造廠", "region": 0, "wx": 20410, "wz": 68514, "height": 8, "kind": "city", "industry": "central", "width": 36, "length": 300, "tier": "medium"},
 {"id": "casting-town", "name": "鋳物師町", "region": 0, "wx": 21766, "wz": 65554, "height": 3, "kind": "town", "industry": "works", "width": 28, "length": 250, "tier": "small"},
 {"id": "smoke-city", "name": "紫煙の屈曲谷", "region": 1, "wx": 75238, "wz": 81627, "height": 10.39, "kind": "city", "industry": "works", "width": 36, "length": 300, "tier": "medium"},
 {"id": "windmill", "name": "風車村", "region": 1, "wx": 28368, "wz": 87483, "height": 8, "kind": "village", "industry": "farm", "width": 22, "length": 210, "tier": "small"},
 {"id": "mill-village", "name": "北原粉挽村", "region": 1, "wx": 40224, "wz": 84546, "height": 8, "kind": "village", "industry": "farm", "width": 22, "length": 210, "tier": "small"},
 {"id": "copper-city", "name": "赤棚鉱山市", "region": 1, "wx": 75246, "wz": 77079, "height": 10.05, "kind": "city", "industry": "mine", "width": 36, "length": 300, "tier": "medium"},
 {"id": "red-city", "name": "赤銅要塞群島", "region": 2, "wx": 81848, "wz": 44472, "height": 10, "kind": "city", "industry": "works", "width": 36, "length": 300, "tier": "medium"},
 {"id": "fortress-town", "name": "要塞鋳物町", "region": 2, "wx": 77899, "wz": 47800, "height": 10.07, "kind": "town", "industry": "works", "width": 28, "length": 250, "tier": "small"},
 {"id": "charcoal", "name": "炭焼村", "region": 2, "wx": 72584, "wz": 32873, "height": 8, "kind": "village", "industry": "timber", "width": 22, "length": 210, "tier": "small"},
 {"id": "smelter", "name": "南都精錬町", "region": 2, "wx": 65377, "wz": 34801, "height": 16.24, "kind": "city", "industry": "works", "width": 36, "length": 300, "tier": "medium"},
 {"id": "south-city", "name": "南銅都", "region": 2, "wx": 66397, "wz": 33039, "height": 29.61, "kind": "city", "industry": "central", "width": 36, "length": 300, "tier": "medium"},
 {"id": "kiln", "name": "登窯集落", "region": 2, "wx": 65122.12, "wz": 20947.1, "height": 195.99, "kind": "village", "industry": "works", "width": 22, "length": 210, "tier": "small"},
 {"id": "net-village", "name": "東岸網元村", "region": 2, "wx": 88012, "wz": 47094, "height": 10.1, "kind": "village", "industry": "works", "width": 22, "length": 210, "tier": "small"},
 {"id": "home", "name": "真鍮の翼工房", "region": 0, "wx": 28446, "wz": 41637, "height": 81.59, "kind": "home", "industry": "works", "width": 36, "length": 300, "tier": "large"}
].map(site => [site.id, site]));
