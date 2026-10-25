const prisma = require('../db');

async function likePost(postId, userId) {
  if (userId === undefined || userId === null) {
    const err = new Error('userId required'); err.status = 400; err.body = { error: 'userId is required' }; throw err;
  }
  const post = await prisma.post.findUnique({ where: { id: Number(postId) } });
  if (!post) { const err = new Error('Post not found'); err.status = 404; err.body = { error: 'Post not found' }; throw err; }
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) { const err = new Error('User not found'); err.status = 404; err.body = { error: 'User not found' }; throw err; }
  try {
    return await prisma.like.create({ data: { userId: Number(userId), postId: Number(postId) } });
  } catch (e) {
    if (e.code === 'P2002') { const err = new Error('Already liked'); err.status = 409; err.body = { error: 'Already liked' }; throw err; }
    throw e;
  }
}

async function unlikePost(postId, userId) {
  try {
    await prisma.like.delete({ where: { userId_postId: { userId: Number(userId), postId: Number(postId) } } });
  } catch (e) {
    const err = new Error('Like not found'); err.status = 404; err.body = { error: 'Like not found' }; throw err;
  }
}

module.exports = { likePost, unlikePost };
