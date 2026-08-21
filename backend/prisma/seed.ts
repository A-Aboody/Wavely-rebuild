import { PrismaClient, WaveType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEV_PASSWORD = 'password123';

const USERS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'alice@wavely.dev',
    username: 'alice',
    displayName: 'Alice Rivera',
    bio: 'Coffee, coastlines, and long walks through bad architecture.',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'bob@wavely.dev',
    username: 'bob',
    displayName: 'Bob Chen',
    bio: 'Amateur cook. Professional opinion-haver.',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'carol@wavely.dev',
    username: 'carol',
    displayName: 'Carol Nwosu',
    bio: 'Reading everything, finishing some of it.',
  },
];

const WAVES = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    userId: USERS[0].id,
    title: 'Sunrise at Point Reyes',
    content: 'Woke up at 4am for this and would absolutely do it again.',
    category: 'travel',
    location: 'Point Reyes, CA',
    waveType: WaveType.PERSONAL,
    personalRating: 4.5,
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    userId: USERS[1].id,
    title: 'The best ramen in the city',
    content: 'Twelve bowls in, here is the ranking nobody asked for.',
    category: 'food',
    location: 'San Francisco, CA',
    waveType: WaveType.COMMUNITY,
    communityRatingScale: 10,
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    userId: USERS[2].id,
    title: 'On rereading old books',
    content: 'Some books change. Mostly you do.',
    category: 'books',
    waveType: WaveType.PERSONAL,
    personalRating: 5,
  },
];

async function main() {
  const password = await bcrypt.hash(DEV_PASSWORD, 10);

  for (const user of USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { ...user, password, emailVerified: true },
    });
  }

  for (const wave of WAVES) {
    await prisma.wave.upsert({ where: { id: wave.id }, update: {}, create: wave });
  }

  const comment = await prisma.comment.upsert({
    where: { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1' },
    update: {},
    create: {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      content: 'Adding this to my list immediately.',
      userId: USERS[2].id,
      waveId: WAVES[1].id,
    },
  });

  await prisma.comment.upsert({
    where: { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2' },
    update: {},
    create: {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      content: 'Report back after number three.',
      userId: USERS[1].id,
      waveId: WAVES[1].id,
      parentCommentId: comment.id,
    },
  });

  await prisma.like.upsert({
    where: { userId_waveId: { userId: USERS[1].id, waveId: WAVES[0].id } },
    update: {},
    create: { userId: USERS[1].id, waveId: WAVES[0].id },
  });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: USERS[1].id, followingId: USERS[0].id } },
    update: {},
    create: { followerId: USERS[1].id, followingId: USERS[0].id },
  });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: USERS[2].id, followingId: USERS[0].id } },
    update: {},
    create: { followerId: USERS[2].id, followingId: USERS[0].id },
  });

  await prisma.wave.update({ where: { id: WAVES[0].id }, data: { likesCount: 1 } });
  await prisma.wave.update({ where: { id: WAVES[1].id }, data: { commentsCount: 2 } });

  console.log(`Seeded ${USERS.length} users, ${WAVES.length} waves, 2 comments.`);
  console.log(`Log in with any of: ${USERS.map((u) => u.email).join(', ')}`);
  console.log(`Password: ${DEV_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
