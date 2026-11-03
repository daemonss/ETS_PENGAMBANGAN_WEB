const http=require('http');const {URL}=require('url');const {products,resetData}=require('./src/data');const {cache}=require('./src/cache');const {metrics,resetMetrics,recordRequest}=require('./src/metrics');const {createOrder,resetOrders,listOrders}=require('./src/orders');
const PORT=Number(process.env.PORT||3000);
function send(res,status,body,headers={}){const payload=JSON.stringify(body);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(payload),...headers});res.end(payload);}
function readBody(req){return new Promise((resolve,reject)=>{let raw='';req.on('data',c=>raw+=c);req.on('end',()=>{if(!raw)return resolve({});try{resolve(JSON.parse(raw));}catch{reject(new Error('Invalid JSON body'));}});req.on('error',reject);});}
function catalogKey(url){ // Cache key harus membedakan hasil filter kategori.
 const category=url.searchParams.get('category')||'all';
 return `catalog:category:${category}`;
}
async function handle(req,res){const started=process.hrtime.bigint();let status=200;const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);const path=url.pathname;
 try{
  if(req.method==='GET'&&path==='/')return send(res,200,{service:'TokoKilat API',endpoints:['GET /api/products?category=electronics|books|clothing|home|grocery|sports','GET /api/products/:id','PATCH /api/products/:id','POST /api/orders','GET /api/orders','GET /api/metrics','POST /api/reset']});
  if(req.method==='GET'&&path==='/api/products'){const category=url.searchParams.get('category')||'';const key=catalogKey(url);const hit=cache.get(key);if(hit){recordRequest('catalog',true);return send(res,200,{source:'cache',data:hit});}recordRequest('catalog',false);const data=products.filter(p=>!category||p.category===category);cache.set(key,data);return send(res,200,{source:'origin',data});}
  const m=path.match(/^\/api\/products\/([^/]+)$/);
  if(req.method==='GET'&&m){const id=m[1],key=`product:${id}`;let p=cache.get(key);if(p)recordRequest('detail',true);else{recordRequest('detail',false);p=products.find(x=>x.id===id);if(!p)return send(res,404,{error:'Product not found'});cache.set(key,p);}const etag=`W/"${p.id}-${p.price}-${p.stock}"`;if(req.headers['if-none-match']===etag)return send(res,304,{}, {ETag:etag});return send(res,200,{source:'cache-or-origin',data:p},{ETag:etag});}
  if(req.method==='PATCH'&&m){const id=m[1],body=await readBody(req),p=products.find(x=>x.id===id);if(!p)return send(res,404,{error:'Product not found'});if(body.price!==undefined){if(!Number.isFinite(Number(body.price))||Number(body.price)<0)return send(res,400,{error:'price must be non-negative'});p.price=Number(body.price);}if(body.stock!==undefined){if(!Number.isInteger(Number(body.stock))||Number(body.stock)<0)return send(res,400,{error:'stock must be a non-negative integer'});p.stock=Number(body.stock);} // TODO Problem 3/4: invalidate related cache entries
 return send(res,200,{message:'Product updated',data:p});}
  if(req.method==='POST'&&path==='/api/orders'){const body=await readBody(req);const result=createOrder(req.headers['idempotency-key'],body);status=result.status;return send(res,result.status,result.body);}
  if(req.method==='GET'&&path==='/api/orders')return send(res,200,{data:listOrders()});
  if(req.method==='GET'&&path==='/api/metrics')return send(res,200,{...metrics,cache:cache.stats(),process:{memory:process.memoryUsage(),cpu:process.cpuUsage(),resource:process.resourceUsage()}});
  if(req.method==='POST'&&path==='/api/reset'){cache.clear();resetData();resetOrders();resetMetrics();return send(res,200,{message:'State reset'});}
  status=404;return send(res,404,{error:'Not found'});
 }catch(e){status=500;return send(res,500,{error:e.message||'Internal server error'});}finally{const ms=Number(process.hrtime.bigint()-started)/1e6;metrics.totalRequests++;metrics.totalLatencyMs+=ms;metrics.maxLatencyMs=Math.max(metrics.maxLatencyMs,ms);metrics.statusCounts[status]=(metrics.statusCounts[status]||0)+1;}}

// http.createServer(handle).listen(PORT,()=>console.log(`TokoKilat API listening at http://localhost:${PORT}`));
const HOST = '0.0.0.0';

http.createServer(handle).listen(PORT, HOST, () => {
  console.log(`TokoKilat API listening at http://${HOST}:${PORT}`);
});