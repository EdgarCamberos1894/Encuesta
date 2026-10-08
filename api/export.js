const {requireAdmin,fetchAllResponses,normalize,stats}=require('../lib/admin-data');
function csvCell(v){const s=v==null?'':String(v);return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function toCsv(rows){
  const headers=['id','createdAt','surveyVersion','screenedOut','participation','country','planA','planB','preferredLabel','preferredRealPlan','Q02_likelihood','Q02_variety','Q02_effort','Q02_shopping','Q02_realism','Q02_issues','Q02_change','Q06_likelihood','Q06_variety','Q06_effort','Q06_shopping','Q06_realism','Q06_issues','Q06_change','trustFactors','trustOther','durationSeconds','source','campaign'];
  const lines=[headers.join(',')];
  for(const r of rows){const a=r.planAnswers||{},q02=a.Q02||{},q06=a.Q06||{};const vals=[r.id,r.createdAt,r.surveyVersion,r.screenedOut,r.participation,r.country,r.planLabels?.A,r.planLabels?.B,r.preferredLabel,r.preferredRealPlan,q02.likelihood,q02.variety,q02.effort,q02.shopping,q02.realism,(q02.issues||[]).join('|'),q02.change,q06.likelihood,q06.variety,q06.effort,q06.shopping,q06.realism,(q06.issues||[]).join('|'),q06.change,(r.trustFactors||[]).join('|'),r.trustOther,r.durationSeconds,r.source,r.campaign];lines.push(vals.map(csvCell).join(','))}
  return lines.join('\n');
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({error:'Método no permitido.'});
  const auth=requireAdmin(req);if(!auth.ok)return res.status(auth.status).json({error:auth.error});
  try{
    const raw=await fetchAllResponses(),responses=raw.map(normalize),format=String(req.query?.format||'json').toLowerCase();
    if(format==='csv'){
      res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="food-planning-survey-${new Date().toISOString().slice(0,10)}.csv"`);
      return res.status(200).send('\ufeff'+toCsv(responses));
    }
    const bundle={schema:'food-planning-survey-export/v1',generatedAt:new Date().toISOString(),purpose:'Portable survey dataset for product analysis and ChatGPT continuity.',planCatalog:{Q02:{id:'Q02'},Q06:{id:'Q06'}},stats:stats(raw),responses};
    res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="food-planning-survey-${new Date().toISOString().slice(0,10)}.json"`);
    return res.status(200).send(JSON.stringify(bundle,null,2));
  }catch(e){console.error('Export error',e);return res.status(500).json({error:'No pudimos exportar los resultados.'})}
};
