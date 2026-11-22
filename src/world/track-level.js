function trackLevel(index,d,length){
 const a=trackProfiles[index],i=Math.min(a.length-2,Math.floor(d/42)),fraction=(d-i*42)/Math.max(.001,Math.min(42,length-i*42));
 return a[i]+(a[i+1]-a[i])*fraction
}
