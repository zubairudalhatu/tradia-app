import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("TradiaAdmin2026!", 12);
  const systemUser = await prisma.user.upsert({
    where: { email: "tradia@zamkah.com.ng" },
    update: {
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE"
    },
    create: {
      id: "system-seed-user",
      name: "Tradia Admin",
      email: "tradia@zamkah.com.ng",
      phone: "+2349055091300",
      role: "SUPER_ADMIN",
      passwordHash: adminPasswordHash
    }
  });

  const categories = [
    ["Hospitality", "hospitality"],
    ["Healthcare", "healthcare"],
    ["Education", "education"],
    ["Retail", "retail"],
    ["Services", "services"]
  ];

  for (const [name, slug] of categories) {
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug }
    });
  }

  const kano =
    (await prisma.location.findFirst({
      where: {
        type: "CITY",
        slug: "kano",
        parentId: null
      }
    })) ??
    (await prisma.location.create({
      data: {
        type: "CITY",
        name: "Kano",
        slug: "kano",
        state: "Kano"
      }
    }));

  for (const area of ["Kano Municipal", "Nassarawa", "Fagge", "Tarauni"]) {
    const slug = area.toLowerCase().replaceAll(" ", "-");
    const existingArea = await prisma.location.findFirst({
      where: {
        type: "AREA",
        slug,
        parentId: kano.id
      }
    });

    if (!existingArea) {
      await prisma.location.create({
        data: {
          type: "AREA",
          name: area,
          slug,
          state: "Kano",
          parentId: kano.id
        }
      });
    }
  }

  const plans = [
    ["Free", 0, 3, false, false],
    ["Silver", 5000, 8, false, true],
    ["Gold", 15000, 15, true, true],
    ["Platinum", 30000, 30, true, true]
  ] as const;

  for (const [name, annualPrice, maxPhotos, canBeFeatured, analyticsEnabled] of plans) {
    await prisma.plan.upsert({
      where: { name },
      update: {},
      create: {
        name,
        annualPrice,
        maxPhotos,
        canBeFeatured,
        analyticsEnabled,
        listingPriority: annualPrice === 0 ? 0 : annualPrice / 5000,
        features: {
          verification: name !== "Free",
          analytics: analyticsEnabled,
          featured: canBeFeatured
        }
      }
    });
  }

  const freePlan = await prisma.plan.findUniqueOrThrow({ where: { name: "Free" } });
  const categoryBySlug = Object.fromEntries(
    await Promise.all(
      categories.map(async ([, slug]) => [slug, await prisma.category.findUniqueOrThrow({ where: { slug } })])
    )
  );
  const areaBySlug = Object.fromEntries(
    await Promise.all(
      ["kano-municipal", "nassarawa", "fagge", "tarauni"].map(async (slug) => [
        slug,
        await prisma.location.findFirstOrThrow({ where: { slug, type: "AREA" } })
      ])
    )
  );

  const businesses = [
    {
      name: "Grand Sahel Hotel",
      slug: "grand-sahel-hotel",
      category: "hospitality",
      location: "kano-municipal",
      rating: "4.8",
      verified: true,
      address: "Kano Municipal, Kano",
      phone: "+2348000000000",
      description: "Rooms, conference halls, restaurant service, and airport pickup for business travelers."
    },
    {
      name: "PrimeCare Clinic",
      slug: "primecare-clinic",
      category: "healthcare",
      location: "nassarawa",
      rating: "4.6",
      verified: true,
      address: "Nassarawa, Kano",
      phone: "+2348011111111",
      description: "Private clinic offering consultations, diagnostics, maternal care, and pharmacy services."
    },
    {
      name: "Aisha Fashion House",
      slug: "aisha-fashion-house",
      category: "retail",
      location: "fagge",
      rating: "4.5",
      verified: false,
      address: "Fagge, Kano",
      phone: "+2348022222222",
      description: "Contemporary clothing, tailoring, bridal fabrics, and custom fittings in central Kano."
    },
    {
      name: "Huda International School",
      slug: "huda-international-school",
      category: "education",
      location: "tarauni",
      rating: "4.7",
      verified: true,
      address: "Tarauni, Kano",
      phone: "+2348033333333",
      description: "Nursery, primary, and secondary school with parent communication and event updates."
    }
  ];

  for (const business of businesses) {
    await prisma.business.upsert({
      where: { slug: business.slug },
      update: {},
      create: {
        ownerId: systemUser.id,
        name: business.name,
        slug: business.slug,
        description: business.description,
        categoryId: categoryBySlug[business.category].id,
        locationId: areaBySlug[business.location].id,
        address: business.address,
        phone: business.phone,
        whatsapp: business.phone,
        verificationStatus: business.verified ? "VERIFIED" : "UNVERIFIED",
        listingStatus: "PUBLISHED",
        planId: freePlan.id,
        averageRating: business.rating,
        reviewCount: 12,
        viewCount: 500,
        contactClickCount: 80
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
