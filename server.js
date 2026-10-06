const express=require("express");
const cron=require("node-cron");
const fs=require("fs");
const path=require("path");
const app=express();
const PORT=process.env.PORT||3000;
const DATA=path.join(__dirname,"data.json");
const SOURCES=[
 ["GS25","GS25_INVENTORY_URL"],["EMART24","EMART24_INVENTORY_URL"],
 ["7-ELEVEN","SEVENELEVEN_INVENTORY_URL"],["CU","CU_INVENTORY_URL"]
];
function load(){try{return JSON.parse(fs.readFileSync(DATA,"utf8"))}catch{return {items:[],updatedAt:null}}}
function save(x){fs.writeFileSync(DATA,JSON.stringify(x,null,2))}
function qty(x){const n=Number(x?.quantity);return Number.isFinite(n)?n:null}
function normalize(name,x){if(!Array.isArray(x?.items))return[];return x.items.map(i=>({store:name,product:i.product||i.name||"Pokemon 30th Anniversary",storeName:i.storeName||i.store||"확인 필요",address:i.address||"",quantity:qty(i),status:i.status||((qty(i)||0)>0?"in_stock":"unknown"),checkedAt:i.checkedAt||new Date().toISOString()}))}
async function fetchJson(url){const r=await fetch(url,{headers:{"User-Agent":"Pokemon30-Stock-Radar/1.0"}});if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}
async function notify(items){const token=process.env.TELEGRAM_BOT_TOKEN,chat=process.env.TELEGRAM_CHAT_ID;if(!token||!chat||!items.length)return;const min=Number(process.env.TELEGRAM_MIN_QTY||1);for(const i of items)if(qty(i)>=min){const msg="🎉 포켓몬 30주년 재고 감지\n\n🏪 "+i.store+"\n📍 "+i.storeName+"\n📦 "+i.product+"\n🔢 재고: "+i.quantity+"\n"+(i.address?"📌 "+i.address:"");await fetch("https://api.telegram.org/bot"+token+"/sendMessage",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({chat_id:chat,text:msg})}).catch(()=>{})}}
async function refresh(){const old=load();const oldPositive=new Set((old.items||[]).filter(i=>qty(i)>0).map(i=>i.store+"|"+i.storeName+"|"+i.product));let all=[],sources=[];for(const[name,key]of SOURCES){const url=process.env[key];if(!url){sources.push({name,connected:false});continue}try{const got=normalize(name,await fetchJson(url));all.push(...got);sources.push({name,connected:true,count:got.length})}catch(e){sources.push({name,connected:false,error:e.message})}}if(all.length)save({items:all,updatedAt:new Date().toISOString(),sources});const cur=load();const fresh=cur.items.filter(i=>qty(i)>0&&!oldPositive.has(i.store+"|"+i.storeName+"|"+i.product));await notify(fresh);return {...cur,sources:cur.sources||sources,newStock:fresh.length}}
app.use(express.static(path.join(__dirname,"public")));
app.get("/api/health",(req,res)=>res.json({ok:true,time:new Date().toISOString()}));
app.get("/api/sources",(req,res)=>res.json(SOURCES.map(([name,key])=>({name,connected:!!process.env[key]}))));
app.get("/api/inventory",(req,res)=>res.json(load()));
app.post("/api/refresh",async(req,res)=>{try{res.json(await refresh())}catch(e){res.status(500).json({error:e.message})}});
cron.schedule(process.env.POLL_CRON||"*/5 * * * *",()=>refresh().catch(console.error));
app.listen(PORT,"0.0.0.0",()=>console.log("Pokemon30 radar listening on "+PORT));