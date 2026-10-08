const allowedParticipation=new Set(['regularmente','a_veces','no']);
const allowedPlanIds=new Set(['Q02','Q06']);
const allowedPreference=new Set(['A','B','either','neither']);
const validRating=v=>Number.isInteger(v)&&v>=1&&v<=5;

function validate(p){
  if(p.honeypot)return 'Automated submission rejected.';
  if(!allowedParticipation.has(p.participation))return 'Participación inválida.';
  if(typeof p.country!=='string'||p.country.trim().length<2||p.country.length>80)return 'País inválido.';
  if(p.screenedOut)return null;
  if(!Array.isArray(p.planOrder)||p.planOrder.length!==2||!p.planOrder.every(x=>allowedPlanIds.has(x))||new Set(p.planOrder).size!==p.planOrder.length)return 'Asignación de planes inválida: los dos planes deben ser distintos.';
  if(!p.planAnswers||typeof p.planAnswers!=='object')return 'Faltan respuestas de los planes.';
  for(const id of ['Q02','Q06']){
    const a=p.planAnswers[id];if(!a)return `Faltan respuestas para ${id}.`;
    for(const k of ['likelihood','variety','effort','shopping','realism'])if(!validRating(a[k]))return `Valoración inválida en ${id}.`;
    if(!Array.isArray(a.issues)||a.issues.length>7)return `Problemas inválidos en ${id}.`;
    if(typeof a.change!=='string'||a.change.length>400)return `Comentario inválido en ${id}.`;
  }
  if(!p.planLabels||p.planLabels.A!==p.planOrder[0]||p.planLabels.B!==p.planOrder[1])return 'Etiquetas de planes inválidas.';
  if(!allowedPreference.has(p.preferredPlan))return 'Preferencia final inválida.';
  if(!Array.isArray(p.trustFactors)||p.trustFactors.length<1||p.trustFactors.length>9)return 'Factores de confianza inválidos.';
  if((p.trustOther||'').length>200)return 'Texto adicional demasiado largo.';
  return null;
}

async function saveSupabase(record){
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)return false;
  const r=await fetch(`${url.replace(/\/$/,'')}/rest/v1/survey_responses`,{method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:`Bearer ${key}`,Prefer:'return=minimal'},body:JSON.stringify(record)});
  if(!r.ok){const body=await r.text();throw new Error(`Supabase ${r.status}: ${body.slice(0,300)}`)}
  return true;
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Método no permitido.'});
  const length=Number(req.headers['content-length']||0);if(length>30000)return res.status(413).json({error:'Payload demasiado grande.'});
  const p=req.body||{},error=validate(p);if(error)return res.status(400).json({error});
  const id=crypto.randomUUID(),now=new Date().toISOString();
  const record={id,created_at:now,survey_version:p.version||'v1.0',screened_out:Boolean(p.screenedOut),participation:p.participation,country:p.country.trim(),plan_order:p.screenedOut?null:p.planOrder,plan_labels:p.screenedOut?null:p.planLabels,plan_answers:p.screenedOut?null:p.planAnswers,preferred_plan:p.screenedOut?null:p.preferredPlan,trust_factors:p.screenedOut?null:p.trustFactors,trust_other:p.screenedOut?null:(p.trustOther||'').trim(),duration_seconds:Math.min(Math.max(Number(p.durationSeconds||0),0),7200),source:String(p.source||'direct').slice(0,80),campaign:String(p.campaign||'').slice(0,120)};
  try{
    const stored=await saveSupabase(record);
    if(!stored)return res.status(503).json({error:'La encuesta todavía no tiene almacenamiento configurado. Inténtalo de nuevo más tarde.'});
    return res.status(200).json({ok:true,id,completionUrl:process.env.SURVEYSWAP_COMPLETION_URL||''});
  }catch(e){console.error('Survey persistence error',e);return res.status(500).json({error:'No pudimos guardar la respuesta. Inténtalo nuevamente.'})}
}
