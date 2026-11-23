const airbases=Object.freeze(Object.fromEntries([
 {"id":"western-plain","name":"西域平原飛行場","region":0,"wx":22000,"wz":40000,"tier":"large","island":false},
 {"id":"port-plain","name":"港北平原飛行場","region":0,"wx":30587.240829346098,"wz":32245.7735247209,"tier":"medium","island":false},
 {"id":"east-fields","name":"東野飛行場","region":0,"wx":31787.240829346098,"wz":33445.7735247209,"tier":"small","island":false},
 {"id":"west-foundry","name":"西都鋳造廠","region":0,"wx":19520,"wz":72000,"tier":"large","island":false},
 {"id":"north-grain","name":"北穀倉飛行場","region":0,"wx":34000,"wz":86480,"tier":"medium","island":false},
 {"id":"pine-yard","name":"松林材木廠","region":0,"wx":13600,"wz":58000,"tier":"medium","island":false},
 {"id":"amber-bay","name":"琥珀湾飛行場","region":0,"wx":34480,"wz":70480,"tier":"medium","island":false},
 {"id":"moor-watch","name":"泥炭原監視所","region":0,"wx":11520,"wz":44960,"tier":"small","island":false},
 {"id":"west-cape","name":"西岬飛行場","region":0,"wx":7760,"wz":64000,"tier":"small","island":false},
 {"id":"silver-ridge","name":"銀丘飛行場","region":0,"wx":24880,"wz":82960,"tier":"small","island":false},
 {"id":"reed-bank","name":"葦岸飛行場","region":0,"wx":15120,"wz":29520,"tier":"small","island":false},
 {"id":"north-firth","name":"北入江飛行場","region":0,"wx":44000,"wz":79200,"tier":"small","island":false},
 {"id":"smoke-highlands","name":"紫煙高地航空基地","region":1,"wx":78702.47208931421,"wz":73979.10685805423,"tier":"large","island":false},
 {"id":"valley-east","name":"紫煙東麓飛行場","region":1,"wx":86240,"wz":84800,"tier":"medium","island":false},
 {"id":"copper-works","name":"赤棚鉱山東飛行場","region":1,"wx":78852.47208931421,"wz":78879.10685805423,"tier":"medium","island":false},
 {"id":"high-firth","name":"北峡湾飛行場","region":1,"wx":66480,"wz":83120,"tier":"small","island":false},
 {"id":"slate-bay","name":"粘板岩港飛行場","region":1,"wx":89360,"wz":62560,"tier":"small","island":false},
 {"id":"south-foundry","name":"南銅都航空基地","region":2,"wx":66560,"wz":29680,"tier":"large","island":false},
 {"id":"coal-quay","name":"炭積港飛行場","region":2,"wx":77520,"wz":36480,"tier":"medium","island":false},
 {"id":"south-grain","name":"南穀倉飛行場","region":2,"wx":52720,"wz":20320,"tier":"medium","island":false},
 {"id":"red-cape","name":"赤岬前哨地","region":2,"wx":91680,"wz":42000,"tier":"small","island":false},
 {"id":"clay-works","name":"陶土丘飛行場","region":2,"wx":64000,"wz":15360,"tier":"small","island":false},
 {"id":"brass-port","name":"黄銅港航空基地","region":0,"wx":29987.240829346098,"wz":30845.7735247209,"tier":"small","island":true},
 {"id":"red-strait","name":"赤銅海峡航空基地","region":2,"wx":82775.11961722489,"wz":49505.10366826157,"tier":"small","island":true}
].map(b=>[b.id,Object.freeze({...b,height:gradingSites[b.id].h,width:runwayWidth,length:runwayLength,islandOrigin:b.island?regionOrigins[b.region]:null})])));
const carriers=Object.freeze(Object.fromEntries([
 {"id":"harbour-tender","name":"黄銅港補給母艦","wx":34604,"wz":28649,"heading":0,"region":0,"deck":true,"height":13},
 {"id":"strait-guard","name":"赤銅海峡警備母艦","wx":86065,"wz":53417,"heading":0,"region":2,"deck":true,"height":13},
 {"id":"pelagic","name":"遠洋母艦アホウドリ","wx":50000,"wz":50000,"heading":0.663225,"region":0,"deck":true,"height":13},
 {"id":"west-wind","name":"西風","wx":39000,"wz":56500,"heading":-0.488692,"region":0,"deck":true,"height":13},
 {"id":"sea-lark","name":"海雲雀","wx":63400,"wz":45800,"heading":2.094395,"region":2,"deck":true,"height":13},
 {"id":"north-star","name":"北極星","wx":53800,"wz":83200,"heading":0.314159,"region":1,"deck":true,"height":13},
 {"id":"south-cross","name":"南十字","wx":79000,"wz":14200,"heading":2.879793,"region":2,"deck":true,"height":13},
 {"id":"reef-watch","name":"礁嶺","wx":12200,"wz":20100,"heading":1.22173,"region":0,"deck":true,"height":13}
].map(b=>[b.id,Object.freeze(b)])));
const outposts=Object.freeze({...airbases,...carriers,...settlements});
