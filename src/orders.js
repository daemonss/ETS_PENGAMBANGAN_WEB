const {products}=require('./data');const orders=[];const idempotencyStore=new Map();let nextId=1;
function createOrder(key,body){
 // TODO Problem 5: idempotency key is intentionally ignored in starter.
 if(!body.productId||!Number.isInteger(Number(body.quantity))||Number(body.quantity)<1)return {status:400,body:{error:'productId and positive integer quantity are required'}};
 const p=products.find(x=>x.id===body.productId);if(!p)return {status:404,body:{error:'Product not found'}};
 const q=Number(body.quantity);if(p.stock<q)return {status:409,body:{error:'Insufficient stock'}};
 p.stock-=q;const order={id:`ORD-${String(nextId++).padStart(4,'0')}`,productId:p.id,quantity:q,unitPrice:p.price,total:p.price*q,status:'confirmed'};orders.push(order);
 return {status:201,body:{message:'Order created',data:order}};
}
function listOrders(){return orders.map(o=>({...o}));}function resetOrders(){orders.splice(0,orders.length);idempotencyStore.clear();nextId=1;}
module.exports={createOrder,listOrders,resetOrders};
