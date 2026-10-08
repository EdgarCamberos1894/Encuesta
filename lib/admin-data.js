const PLAN_IDS=['Q02','Q06'];

function requireAdmin(req){
  const configured=process.env.ADMIN_DASHBOARD_KEY;
  if(!configured)return {ok:false,status:503,error:'ADMIN_DASHBOARD_KEY no está configurada.'};
  const auth=String(req.headers.authorization||'');
  const supplied=auth.startsWith('Bearer ')?auth.slice(7):'';
  if(!supplied||supplied!==configured)return {ok:false,status:401,error:'Acceso no autorizado.'};
  return {ok:true};
}

async function fetchAllResponses(){
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)throw new Error('Supabase no está configurado.');
  const base=`${url.replace(/\/$/,'')}/rest/v1/survey_responses?select=*&order=created_at.desc`;
  const pageSize=1000, all=[];
  for(let start=0;start<10000;start+=pageSize){
    const end=start+pageSize-1;
    const r=await fetch(base,{headers:{apikey:key,Authorization:`Bearer ${key}`,Range:`${start}-${end}`}});
    if(!r.ok)throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0,240)}`);
    const rows=await r.json();
    all.push(...rows);
    if(rows.length<pageSize)break;
  }
  return all;
}

function preferredRealPlan(row){
  if(row.preferred_plan==='A')return row.plan_labels?.A||row.plan_order?.[0]||null;
  if(row.preferred_plan==='B')return row.plan_labels?.B||row.plan_order?.[1]||null;
  return row.preferred_plan||null;
}

function normalize(row){
  return {
    id:row.id,createdAt:row.created_at,surveyVersion:row.survey_version,screenedOut:row.screened_out,
    participation:row.participation,country:row.country,planOrder:row.plan_order,planLabels:row.plan_labels,
    planAnswers:row.plan_answers,preferredLabel:row.preferred_plan,preferredRealPlan:preferredRealPlan(row),
    trustFactors:row.trust_factors||[],trustOther:row.trust_other||'',durationSeconds:row.duration_seconds,
    source:row.source,campaign:row.campaign
  };
}

function average(values){const nums=values.filter(Number.isFinite);return nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:null}

function stats(rows){
  const valid=rows.filter(r=>!r.screened_out);
  const ratings={};
  for(const id of PLAN_IDS){
    const answers=valid.map(r=>r.plan_answers?.[id]).filter(Boolean);
    ratings[id]={responses:answers.length};
    for(const k of ['likelihood','variety','effort','shopping','realism'])ratings[id][k]=average(answers.map(a=>Number(a[k])));
  }
  const preferred={Q02:0,Q06:0,either:0,neither:0,unknown:0};
  valid.forEach(r=>{const p=preferredRealPlan(r);if(p in preferred)preferred[p]++;else preferred.unknown++});
  const trust={};
  valid.forEach(r=>(r.trust_factors||[]).forEach(k=>trust[k]=(trust[k]||0)+1));
  const issueCounts={Q02:{},Q06:{}};
  for(const id of PLAN_IDS)valid.forEach(r=>(r.plan_answers?.[id]?.issues||[]).forEach(k=>issueCounts[id][k]=(issueCounts[id][k]||0)+1));
  const countries={};rows.forEach(r=>countries[r.country]=(countries[r.country]||0)+1);
  const orderCounts={};valid.forEach(r=>{const k=(r.plan_order||[]).join('→');orderCounts[k]=(orderCounts[k]||0)+1});
  return {totalResponses:rows.length,eligibleResponses:valid.length,screenedOut:rows.length-valid.length,preferred,ratings,trustFactors:trust,issues:issueCounts,countries,orderCounts,averageDurationSeconds:average(valid.map(r=>Number(r.duration_seconds)))};
}

module.exports={PLAN_IDS,requireAdmin,fetchAllResponses,preferredRealPlan,normalize,stats};
