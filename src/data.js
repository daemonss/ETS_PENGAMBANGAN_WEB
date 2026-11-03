const initialProducts = [
 {id:"P001",name:"Laptop A",category:"electronics",price:10000000,stock:5},
 {id:"P002",name:"Mouse B",category:"electronics",price:150000,stock:12},
 {id:"P003",name:"Buku C",category:"books",price:85000,stock:8},
 {id:"P004",name:"Buku D",category:"books",price:120000,stock:4},
 {id:"P005",name:"Headset E",category:"electronics",price:350000,stock:7},
 {id:"P006",name:"Novel F",category:"books",price:95000,stock:10},
 {id:"P007",name:"Kaos G",category:"clothing",price:125000,stock:15},
 {id:"P008",name:"Jaket H",category:"clothing",price:420000,stock:6},
 {id:"P009",name:"Lampu I",category:"home",price:80000,stock:20},
 {id:"P010",name:"Rak J",category:"home",price:275000,stock:9},
 {id:"P011",name:"Kopi K",category:"grocery",price:65000,stock:30},
 {id:"P012",name:"Teh L",category:"grocery",price:35000,stock:25},
 {id:"P013",name:"Bola M",category:"sports",price:180000,stock:11},
 {id:"P014",name:"Matras N",category:"sports",price:220000,stock:8}
];
const products = initialProducts.map(p=>({...p}));
function resetData(){products.splice(0,products.length,...initialProducts.map(p=>({...p})));}
module.exports={products,resetData};
