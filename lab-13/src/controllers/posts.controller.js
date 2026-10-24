const svc = require('../services/posts.service');
function wrap(fn){return async(req,res)=>{try{const r=await fn(req,res); if(r!==undefined) res.json(r);}catch(e){res.status(e.status||500).json(e.body||{error:e.message});}}};}
module.exports = {
  list: wrap(async (req,res)=>svc.listPosts(req.query)),
  get: wrap(async (req,res)=>svc.getPost(req.params.id)),
  create: wrap(async (req,res)=>{const r=await svc.createPost(req.body); res.status(201).json(r); return undefined;}),
  update: wrap(async (req,res)=>svc.updatePost(req.params.id,req.body)),
  remove: wrap(async (req,res)=>{await svc.deletePost(req.params.id); res.status(204).send(); return undefined;}),
  likes: wrap(async (req,res)=>svc.postLikes(req.params.id)),
};
