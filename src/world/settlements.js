const settlements = Object.fromEntries([
 {"id": "brass-city", "name": "黄銅港市", "region": 0, "wx": 30487.24, "wz": 34591.77, "height": 10, "kind": "city", "industry": "works", "width": 36, "length": 300, "tier": "medium"},
 {"id": "west-city", "name": "西都鋳造廠", "region": 0, "wx": 18480.24, "wz": 72300.77, "height": 20.23, "kind": "city", "industry": "central", "width": 36, "length": 300, "tier": "medium"},
 {"id": "casting-town", "name": "鋳物師町", "region": 0, "wx": 21766.24, "wz": 69803.77, "height": 8.14, "kind": "town", "industry": "works", "width": 28, "length": 250, "tier": "small"},
 {"id": "home", "name": "真鍮の翼工房", "region": 0, "wx": 31437.24, "wz": 34051.77, "height": 10, "kind": "home", "industry": "works", "width": 36, "length": 300, "tier": "large"},
 {"id": "smoke-city", "name": "紫煙の屈曲谷", "region": 1, "wx": 75902.47, "wz": 77429.11, "height": 10, "kind": "city", "industry": "works", "width": 36, "length": 300, "tier": "medium"},
 {"id": "windmill", "name": "風車村", "region": 1, "wx": 30278.47, "wz": 84854.11, "height": 137.11, "kind": "village", "industry": "farm", "width": 22, "length": 210, "tier": "small"},
 {"id": "mill-village", "name": "北原粉挽村", "region": 1, "wx": 36026.47, "wz": 85211.11, "height": 8, "kind": "village", "industry": "farm", "width": 22, "length": 210, "tier": "small"},
 {"id": "copper-city", "name": "赤棚鉱山市", "region": 1, "wx": 78684.47, "wz": 79577.11, "height": 10, "kind": "city", "industry": "mine", "width": 36, "length": 300, "tier": "medium"},
 {"id": "red-city", "name": "赤銅要塞群島", "region": 2, "wx": 82775.12, "wz": 47325.1, "height": 10, "kind": "city", "industry": "works", "width": 36, "length": 300, "tier": "medium"},
 {"id": "fortress-town", "name": "要塞鋳物町", "region": 2, "wx": 79801.12, "wz": 47182.1, "height": 10, "kind": "town", "industry": "works", "width": 28, "length": 250, "tier": "small"},
 {"id": "charcoal", "name": "炭焼村", "region": 2, "wx": 74788.12, "wz": 35907.1, "height": 17.62, "kind": "village", "industry": "timber", "width": 22, "length": 210, "tier": "small"},
 {"id": "smelter", "name": "南都精錬町", "region": 2, "wx": 66398.12, "wz": 32796.1, "height": 28.56, "kind": "city", "industry": "works", "width": 36, "length": 300, "tier": "medium"},
 {"id": "south-city", "name": "南銅都", "region": 2, "wx": 65513.12, "wz": 32155.1, "height": 8, "kind": "city", "industry": "central", "width": 36, "length": 300, "tier": "medium"},
 {"id": "kiln", "name": "登窯集落", "region": 2, "wx": 65122.12, "wz": 20947.1, "height": 195.99, "kind": "village", "industry": "works", "width": 22, "length": 210, "tier": "small"},
 {"id": "net-village", "name": "東岸網元村", "region": 2, "wx": 85790.12, "wz": 47446.1, "height": 10, "kind": "village", "industry": "works", "width": 22, "length": 210, "tier": "small"}
].map(site => [site.id, site]));
