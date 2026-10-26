const svc = require('../services/likes.service');
function wrap(fn) {
  return async (req, res) => {
    try {
      const r = await fn(req, res);
      if (r !== undefined) res.json(r);
    } catch (e) {
      res.status(e.status || 500).json(e.body || { error: e.message });
    }
  };
}
module.exports = {
  like: wrap(async (req, res) => { const r = await svc.likePost(req.params.id, req.body.userId); res.status(201).json(r); }),
  unlike: wrap(async (req, res) => { await svc.unlikePost(req.params.id, req.params.userId); res.status(204).send(); }),
};
