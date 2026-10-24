const prisma = require('../db');
const { parsePagination } = require('../utils/pagination');

const userSummary = { id: true, username: true, fullname: true };

async function listPosts(query) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  if (query.location) where.location = { equals: query.location, mode: 'insensitive' };
  if (query.search) where.caption = { contains: query.search, mode: 'insensitive' };
  if (query.from || query.to) {
    const fromDate = query.from ? new Date(query.from) : null;
    const toDate = query.to ? new Date(query.to) : null;
    if ((query.from && isNaN(fromDate)) || (query.to && isNaN(toDate))) {
      const err = new Error('bad date'); err.status = 400; err.body = { error: 'from and to must be valid dates' }; throw err;
    }
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) where.createdAt.lt = toDate;
  }
  const sortBy = query.sortBy || 'createdAt';
  const order = query.order === 'asc' ? 'asc' : 'desc';
  let orderBy;
  if (sortBy === 'likes') {
    orderBy = [{ likes: { _count: order } }, { createdAt: 'desc' }];
  } else {
    if (!['createdAt', 'updatedAt'].includes(sortBy)) {
      const err = new Error('bad sort'); err.status = 400; err.body = { error: 'sortBy must be one of: createdAt, updatedAt, likes' }; throw err;
    }
    orderBy = { [sortBy]: order };
  }
  const include = { author: { select: userSummary }, _count: { select: { likes: true } } };
  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({ where, orderBy, skip, take: limit, include }),
    prisma.post.count({ where })
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getPost(id) {
  const post = await prisma.post.findUnique({ where: { id: Number(id) }, include: { author: { select: userSummary }, _count: { select: { likes: true } } } });
  if (!post) { const err = new Error('Post not found'); err.status = 404; err.body = { error: 'Post not found' }; throw err; }
  return post;
}

async function createPost(data) {
  const { imageUrl, authorId, caption, location } = data;
  if (!imageUrl || !authorId) {
    const err = new Error('required'); err.status = 400; err.body = { error: 'imageUrl and authorId are required' }; throw err;
  }
  const user = await prisma.user.findUnique({ where: { id: Number(authorId) } });
  if (!user) { const err = new Error('User not found'); err.status = 404; err.body = { error: 'User not found' }; throw err; }
  return prisma.post.create({ data: { imageUrl, authorId: Number(authorId), caption, location } });
}

async function updatePost(id, data) {
  const { imageUrl, caption, location } = data;
  const updateData = {};
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (caption !== undefined) updateData.caption = caption;
  if (location !== undefined) updateData.location = location;
  try {
    return await prisma.post.update({ where: { id: Number(id) }, data: updateData });
  } catch (e) {
    const err = new Error('Post not found'); err.status = 404; err.body = { error: 'Post not found' }; throw err;
  }
}

async function deletePost(id) {
  try { await prisma.post.delete({ where: { id: Number(id) } }); }
  catch (e) { const err = new Error('Post not found'); err.status = 404; err.body = { error: 'Post not found' }; throw err; }
}

async function postLikes(postId) {
  const post = await prisma.post.findUnique({ where: { id: Number(postId) } });
  if (!post) { const err = new Error('Post not found'); err.status = 404; err.body = { error: 'Post not found' }; throw err; }
  const likes = await prisma.like.findMany({ where: { postId: Number(postId) }, include: { user: { select: userSummary } }, orderBy: { user: { username: 'asc' } } });
  return likes.map(l => l.user);
}

module.exports = { listPosts, getPost, createPost, updatePost, deletePost, postLikes };
