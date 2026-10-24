const prisma = require('../db');

const userSummary = { id: true, username: true, fullname: true };

async function listUsers(query) {
  const { page, limit, skip } = require('../utils/pagination').parsePagination(query);
  const where = {};
  if (query.isPrivate !== undefined) {
    if (query.isPrivate !== 'true' && query.isPrivate !== 'false') {
      const err = new Error('isPrivate must be true or false');
      err.status = 400; err.body = { error: 'isPrivate must be true or false' }; throw err;
    }
    where.isPrivate = query.isPrivate === 'true';
  }
  if (query.search) where.username = { contains: query.search, mode: 'insensitive' };
  if (query.hasPosts !== undefined) {
    if (query.hasPosts !== 'true' && query.hasPosts !== 'false') {
      const err = new Error('hasPosts must be true or false');
      err.status = 400; err.body = { error: 'hasPosts must be true or false' }; throw err;
    }
    where.posts = query.hasPosts === 'true' ? { some: {} } : { none: {} };
  }
  const sortBy = query.sortBy || 'createdAt';
  const order = query.order === 'asc' ? 'asc' : 'desc';
  const allowed = ['createdAt', 'updatedAt', 'username'];
  if (!allowed.includes(sortBy)) { const err=new Error('bad'); err.status=400; err.body={error:'sortBy must be one of: createdAt, updatedAt'}; throw err; }
  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({ where, orderBy: { [sortBy]: order }, skip, take: limit, include: { _count: { select: { posts: true, likes: true } } } }),
    prisma.user.count({ where })
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getUser(id) {
  const user = await prisma.user.findUnique({ where: { id: Number(id) }, include: { _count: { select: { posts: true, likes: true } } } });
  if (!user) { const err=new Error('User not found'); err.status=404; err.body={error:'User not found'}; throw err; }
  return user;
}

async function createUser(data) {
  const { username, email, fullname, bio } = data;
  if (!username || !email || !fullname) {
    const err=new Error('required'); err.status=400; err.body={error:'username, email and fullname are required'}; throw err;
  }
  try {
    return await prisma.user.create({ data: { username, email, fullname, bio } });
  } catch (e) {
    const err=new Error('taken'); err.status=409; err.body={error:'username or email already taken'}; throw err;
  }
}

async function updateUser(id, data) {
  const { username, email, fullname, bio } = data;
  try {
    return await prisma.user.update({ where: { id: Number(id) }, data: { username, email, fullname, bio } });
  } catch (e) {
    const err=new Error('not found'); err.status=404; err.body={error:'User not found'}; throw err;
  }
}

async function deleteUser(id) {
  try {
    await prisma.user.delete({ where: { id: Number(id) } });
  } catch (e) {
    const err=new Error('not found'); err.status=404; err.body={error:'User not found'}; throw err;
  }
}

async function userPosts(userId, query) {
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) { const err=new Error('User not found'); err.status=404; err.body={error:'User not found'}; throw err; }
  const { page, limit, skip } = require('../utils/pagination').parsePagination(query);
  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({ where: { authorId: Number(userId) }, orderBy: { createdAt: 'desc' }, skip, take: limit, include: { _count: { select: { likes: true } } } }),
    prisma.post.count({ where: { authorId: Number(userId) } })
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function likedPosts(userId, query) {
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) { const err=new Error('User not found'); err.status=404; err.body={error:'User not found'}; throw err; }
  const { page, limit, skip } = require('../utils/pagination').parsePagination(query);
  const where = { likes: { some: { userId: Number(userId) } } };
  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit, include: { author: { select: userSummary }, _count: { select: { likes: true } } } }),
    prisma.post.count({ where })
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

module.exports = { listUsers, getUser, createUser, updateUser, deleteUser, userPosts, likedPosts };
