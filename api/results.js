const {requireAdmin,fetchAllResponses,stats}=require('../lib/admin-data');
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({error:'Método no permitido.'});
  const auth=requireAdmin(req);if(!auth.ok)return res.status(auth.status).json({error:auth.error});
  try{const rows=await fetchAllResponses();return res.status(200).json({generatedAt:new Date().toISOString(),stats:stats(rows)});}
  catch(e){console.error('Results error',e);return res.status(500).json({error:'No pudimos cargar los resultados.'})}
};
