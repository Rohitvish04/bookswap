import { PrismaClient, type User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

const CATEGORIES = [
  'Fiction', 'Non-Fiction', 'Programming', 'Business', 'Self Help', 'Finance', 'Science', 'History', 'Biography', 'Education',
  // India-specific student categories — the most exchanged books in the country.
  'Competitive Exams', 'Engineering', 'Medical', 'School & NCERT',
];

const CITIES = [
  { city: 'Mumbai', state: 'Maharashtra', pincode: '400001', latitude: 19.076, longitude: 72.8777 },
  { city: 'Pune', state: 'Maharashtra', pincode: '411001', latitude: 18.5204, longitude: 73.8567 },
  { city: 'Bengaluru', state: 'Karnataka', pincode: '560001', latitude: 12.9716, longitude: 77.5946 },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function main() {
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 10);
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@bookswap.in' },
    update: {},
    create: {
      fullName: 'BookSwap Admin',
      email: process.env.ADMIN_EMAIL || 'admin@bookswap.in',
      phone: '9000000000',
      passwordHash,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
      profile: { create: {} },
    },
  });
  console.log(`Admin ready: ${admin.email}`);

  const categories = await Promise.all(
    CATEGORIES.map((name) =>
      prisma.category.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: { name, slug: slugify(name) },
      }),
    ),
  );

  await prisma.platformSetting.upsert({
    where: { key: 'fee_settings' },
    update: {},
    create: { key: 'fee_settings', value: JSON.stringify({ feeType: 'FIXED', feeFixedPaise: 4900, feePercent: 5, feeMinPaise: 1900, exchangeExpiryDays: 7 }) },
  });

  const demoUserSeeds = [
    { fullName: 'Rohit Sharma', email: 'rohit@example.com', city: CITIES[0] },
    { fullName: 'Ananya Rao', email: 'ananya@example.com', city: CITIES[1] },
    { fullName: 'Meera Kapoor', email: 'meera@example.com', city: CITIES[2] },
  ];

  const demoPasswordHash = await bcrypt.hash('Demo@12345', 10);
  const users: User[] = [];
  for (const seed of demoUserSeeds) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: {
        fullName: seed.fullName,
        email: seed.email,
        phone: '9' + String(Math.floor(100000000 + Math.random() * 899999999)),
        passwordHash: demoPasswordHash,
        emailVerifiedAt: new Date(),
        profile: { create: {} },
        addresses: {
          create: {
            fullName: seed.fullName,
            phone: '9876543210',
            addressLine: '12 Book Lane',
            area: 'Central Area',
            city: seed.city.city,
            state: seed.city.state,
            pincode: seed.city.pincode,
            latitude: seed.city.latitude,
            longitude: seed.city.longitude,
            isDefault: true,
          },
        },
      },
    });
    users.push(user);
  }
  console.log(`Demo users ready: ${users.map((u) => u.email).join(', ')} (password: Demo@12345)`);

  const [rohit, ananya, meera] = users;
  const catByName = (n: string) => categories.find((c) => c.name === n)!.id;

  async function upsertBook(owner: (typeof users)[number], title: string, author: string, category: string, wants: string[], isbn?: string) {
    const slug = slugify(title) + '-' + owner.id.slice(0, 6);
    return prisma.book.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        ownerId: owner.id,
        title,
        author,
        isbn: isbn ?? null,
        coverUrl: isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null,
        description: `A well-loved copy of "${title}" by ${author}, ready for its next reader.`,
        categoryId: catByName(category),
        condition: 'VERY_GOOD',
        language: 'English',
        publishYear: 2018,
        wantedBy: { create: wants.map((w) => ({ title: w })) },
      },
    });
  }

  // Direct match: Rohit owns Atomic Habits & wants Rich Dad Poor Dad;
  // Ananya owns Rich Dad Poor Dad & wants Atomic Habits.
  const atomicHabits = await upsertBook(rohit, 'Atomic Habits', 'James Clear', 'Self Help', ['Rich Dad Poor Dad'], '9780735211292');
  const richDad = await upsertBook(ananya, 'Rich Dad Poor Dad', 'Robert Kiyosaki', 'Finance', ['Atomic Habits'], '9781612680194');
  await upsertBook(meera, 'The Psychology of Money', 'Morgan Housel', 'Finance', ['The Alchemist'], '9780857197689');
  await upsertBook(rohit, 'The Alchemist', 'Paulo Coelho', 'Fiction', ['The Psychology of Money'], '9780061122415');
  await upsertBook(ananya, 'Sapiens', 'Yuval Noah Harari', 'History', ['Educated'], '9780062316097');
  await upsertBook(meera, 'Educated', 'Tara Westover', 'Biography', ['Sapiens'], '9780399590504');

  // 30 famous books spread across the demo users and categories.
  const famousBooks: [title: string, author: string, category: string, isbn: string][] = [
    ['To Kill a Mockingbird', 'Harper Lee', 'Fiction', '9780060935467'],
    ['1984', 'George Orwell', 'Fiction', '9780451524935'],
    ['Pride and Prejudice', 'Jane Austen', 'Fiction', '9780141439518'],
    ['The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', '9780743273565'],
    ['One Hundred Years of Solitude', 'Gabriel García Márquez', 'Fiction', '9780060883287'],
    ['The Kite Runner', 'Khaled Hosseini', 'Fiction', '9781594631931'],
    ['Life of Pi', 'Yann Martel', 'Fiction', '9780156027328'],
    ['The Book Thief', 'Markus Zusak', 'Fiction', '9780375842207'],
    ['Animal Farm', 'George Orwell', 'Fiction', '9780451526342'],
    ['The Catcher in the Rye', 'J.D. Salinger', 'Fiction', '9780316769488'],
    ['Harry Potter and the Sorcerer\'s Stone', 'J.K. Rowling', 'Fiction', '9780590353427'],
    ['The Hobbit', 'J.R.R. Tolkien', 'Fiction', '9780547928227'],
    ['The Da Vinci Code', 'Dan Brown', 'Fiction', '9780307474278'],
    ['The Midnight Library', 'Matt Haig', 'Fiction', '9780525559474'],
    ['Thinking, Fast and Slow', 'Daniel Kahneman', 'Non-Fiction', '9780374533557'],
    ['Outliers', 'Malcolm Gladwell', 'Non-Fiction', '9780316017930'],
    ['Freakonomics', 'Steven D. Levitt', 'Non-Fiction', '9780060731335'],
    ['Clean Code', 'Robert C. Martin', 'Programming', '9780132350884'],
    ['The Pragmatic Programmer', 'Andrew Hunt', 'Programming', '9780201616224'],
    ['Cracking the Coding Interview', 'Gayle Laakmann McDowell', 'Programming', '9780984782857'],
    ['Zero to One', 'Peter Thiel', 'Business', '9780804139298'],
    ['The Lean Startup', 'Eric Ries', 'Business', '9780307887894'],
    ['Good to Great', 'Jim Collins', 'Business', '9780066620992'],
    ['The 7 Habits of Highly Effective People', 'Stephen R. Covey', 'Self Help', '9780743269513'],
    ['How to Win Friends and Influence People', 'Dale Carnegie', 'Self Help', '9780671027032'],
    ['Ikigai', 'Héctor García', 'Self Help', '9780143130727'],
    ['The Intelligent Investor', 'Benjamin Graham', 'Finance', '9780060555665'],
    ['A Brief History of Time', 'Stephen Hawking', 'Science', '9780553380163'],
    ['Cosmos', 'Carl Sagan', 'Science', '9780345539434'],
    ['The Diary of a Young Girl', 'Anne Frank', 'Biography', '9780553296983'],
  ];

  for (let i = 0; i < famousBooks.length; i++) {
    const [title, author, category, isbn] = famousBooks[i];
    const owner = users[i % users.length];
    // Each book "wants" the next one in the list, so the matching engine has plenty to chew on.
    const wants = [famousBooks[(i + 1) % famousBooks.length][0]];
    await upsertBook(owner, title, author, category, wants, isbn);
  }
  console.log(`${famousBooks.length} famous books seeded.`);

  // A demo completed exchange between Rohit and Ananya, with a review.
  const existingExchange = await prisma.exchange.findFirst({ where: { code: 'EX-DEMO01' } });
  if (!existingExchange) {
    const exchange = await prisma.exchange.create({
      data: {
        code: 'EX-DEMO01',
        requesterId: rohit.id,
        responderId: ananya.id,
        offeredBookId: atomicHabits.id,
        requestedBookId: richDad.id,
        status: 'COMPLETED',
        matchScore: 98,
        distanceKm: 148,
        feeAmount: 4900,
        feeType: 'FIXED',
        requesterCompleted: true,
        responderCompleted: true,
        acceptedAt: new Date(),
        paidAt: new Date(),
        confirmedAt: new Date(),
        completedAt: new Date(),
        items: {
          create: [
            { bookId: atomicHabits.id, fromRole: 'REQUESTER', titleSnapshot: 'Atomic Habits' },
            { bookId: richDad.id, fromRole: 'RESPONDER', titleSnapshot: 'Rich Dad Poor Dad' },
          ],
        },
        events: { create: { type: 'CREATED', detail: 'Demo exchange seeded as completed.' } },
      },
    });

    await prisma.payment.create({
      data: {
        exchangeId: exchange.id,
        userId: rohit.id,
        razorpayOrderId: `order_demo_${randomUUID().slice(0, 12)}`,
        razorpayPaymentId: `pay_demo_${randomUUID().slice(0, 12)}`,
        amount: 4900,
        status: 'PAID',
      },
    });

    await prisma.review.createMany({
      data: [
        { exchangeId: exchange.id, authorId: rohit.id, subjectId: ananya.id, rating: 5, comment: 'Smooth handover, book was in great condition!' },
        { exchangeId: exchange.id, authorId: ananya.id, subjectId: rohit.id, rating: 5, comment: 'Great communication, would exchange again.' },
      ],
    });

    for (const subjectId of [ananya.id, rohit.id]) {
      const agg = await prisma.review.aggregate({ where: { subjectId }, _avg: { rating: true }, _count: true });
      await prisma.profile.upsert({
        where: { userId: subjectId },
        create: { userId: subjectId, ratingAvg: agg._avg.rating ?? 5, ratingCount: agg._count },
        update: { ratingAvg: agg._avg.rating ?? 5, ratingCount: agg._count },
      });
    }

    console.log('Demo completed exchange + reviews seeded.');
  }

  console.log('\nSeed complete!');
  console.log(`Admin login:  ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);
  console.log('Demo users:   rohit@example.com / ananya@example.com / meera@example.com — password: Demo@12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
