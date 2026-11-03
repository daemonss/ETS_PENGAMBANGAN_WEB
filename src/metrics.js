const metrics={totalRequests:0,totalLatencyMs:0,maxLatencyMs:0,statusCounts:{},endpointCache:{catalog:{hits:0,misses:0},detail:{hits:0,misses:0}}};
function recordRequest(endpoint,hit){const x=metrics.endpointCache[endpoint];if(x)x[hit?'hits':'misses']++;}
function resetMetrics(){metrics.totalRequests=0;metrics.totalLatencyMs=0;metrics.maxLatencyMs=0;metrics.statusCounts={};metrics.endpointCache={catalog:{hits:0,misses:0},detail:{hits:0,misses:0}};}
module.exports={metrics,resetMetrics,recordRequest};
