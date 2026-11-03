// In-memory TTL cache. TTL can be configured with CACHE_TTL_MS.
const DEFAULT_TTL_MS=Number(process.env.CACHE_TTL_MS||15000);
const store=new Map(); let hits=0,misses=0;
const cache={
 get(key){const x=store.get(key);if(!x){misses++;return null;}if(Date.now()>=x.expiresAt){store.delete(key);misses++;return null;}hits++;return x.value;},
 set(key,value,ttlMs=DEFAULT_TTL_MS){store.set(key,{value:structuredClone(value),expiresAt:Date.now()+ttlMs});},
 delete(key){store.delete(key);},
 deletePrefix(prefix){for(const key of store.keys())if(key.startsWith(prefix))store.delete(key);},
 clear(){store.clear();hits=0;misses=0;},
 stats(){return {hits,misses,hitRatio:(hits+misses)?hits/(hits+misses):0,entries:store.size,defaultTtlMs:DEFAULT_TTL_MS};}
};
module.exports={cache};
