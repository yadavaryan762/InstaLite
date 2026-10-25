const prisma = require('../src/db');
const { users, posts, likes } = require('./seed-data');

async function main() {
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const createdUsers = await prisma.user.createManyAndReturn({ data: users });
  const userMap = {};
  for (const u of createdUsers) userMap[u.username] = u.id;

  const postData = posts.map(p => ({
    imageUrl: p.imageUrl,
    caption: p.caption,
    location: p.location,
    createdAt: new Date(p.createdAt),
    authorId: userMap[p.author],
  }));
  const createdPosts = await prisma.post.createManyAndReturn({ data: postData });
  const postMap = {};
  for (const p of createdPosts) {
    const key = p.imageUrl.split('/')[4];
    postMap[key] = p.id;
  }

  const likeData = likes.map(l => ({ userId: userMap[l.user], postId: postMap[l.post] }));
  const createdLikes = await prisma.like.createManyAndReturn({ data: likeData });

  console.log(`🌱 Seeded ${createdUsers.length} users, ${createdPosts.length} posts and ${createdLikes.length} likes`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
