const svc = require('../services/users.service');
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
  list: wrap(async (req, res) => svc.listUsers(req.query)),
  get: wrap(async (req, res) => svc.getUser(req.params.id)),
  create: wrap(async (req, res) => { const r = await svc.createUser(req.body); res.status(201).json(r); }),
  update: wrap(async (req, res) => svc.updateUser(req.params.id, req.body)),
  remove: wrap(async (req, res) => { await svc.deleteUser(req.params.id); res.status(204).send(); }),
  posts: wrap(async (req, res) => svc.userPosts(req.params.id, req.query)),
  likedPosts: wrap(async (req, res) => svc.likedPosts(req.params.id, req.query)),
};
