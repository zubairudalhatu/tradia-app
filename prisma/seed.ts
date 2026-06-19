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
    ["Hotels & Hospitality", "hospitality", "Hotels, guest houses, resorts, bars, lounges, and tourism services."],
    ["Restaurants & Food Services", "restaurants-food-services", "Restaurants, cafes, bakeries, caterers, grills, and prepared food services."],
    ["Healthcare", "healthcare", "Clinics, hospitals, pharmacies, diagnostics, wellness, and medical services."],
    ["Education", "education", "Schools, training centres, tutors, academies, and learning services."],
    ["Retail", "retail", "Shops, supermarkets, boutiques, ecommerce sellers, and general trading."],
    ["Professional Services", "professional-services", "Consultants, legal, accounting, business support, and agencies."],
    ["Printing Services", "printing-services", "Commercial printing, signage, photocopying, packaging print, and related services."],
    ["Home & Construction", "home-construction", "Builders, interior designers, furniture businesses, repairs, and artisans."],
    ["Real Estate & Property", "real-estate-property", "Estate agents, property developers, property managers, valuers, and facility services."],
    ["Automotive & Transport", "automotive-transport", "Car dealers, mechanics, vehicle services, and passenger transport."],
    ["Logistics & Delivery", "logistics-delivery", "Courier, dispatch, haulage, freight, warehousing, and delivery companies."],
    ["Technology", "technology", "Software, ICT services, gadgets, cybersecurity, and digital products."],
    ["Beauty & Fashion", "beauty-fashion", "Salons, cosmetics, tailoring, fashion stores, and grooming services."],
    ["Agriculture & Agro Services", "agriculture-food", "Farms, food processing, agro suppliers, livestock, and produce businesses."],
    ["Finance & Insurance", "finance-insurance", "Banks, fintechs, cooperative societies, insurance, and financial advisors."],
    ["Manufacturing & Industrial", "manufacturing-industrial", "Factories, industrial suppliers, equipment, production, and fabrication."],
    ["Media & Entertainment", "media-entertainment", "Studios, creators, photography, production, and entertainment services."],
    ["Events & Event Services", "events-event-services", "Event planners, venues, decorators, rentals, and celebration services."],
    ["Public & Community Services", "public-community-services", "NGOs, associations, religious centres, and public-facing services."],
    ["Services", "services", "General services that do not fit neatly into another category."]
  ];

  for (const [index, [name, slug, description]] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug },
      update: {
        name,
        description,
        sortOrder: index + 1,
        isActive: true
      },
      create: {
        name,
        slug,
        description,
        sortOrder: index + 1
      }
    });
  }

  const nigeria =
    (await prisma.location.findFirst({
      where: {
        type: "COUNTRY",
        slug: "nigeria",
        parentId: null
      }
    })) ??
    (await prisma.location.create({
      data: {
        type: "COUNTRY",
        name: "Nigeria",
        slug: "nigeria",
        country: "Nigeria"
      }
    }));

  const nigerianStates = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "Federal Capital Territory",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara"
  ];

  const stateBySlug: Record<string, { id: string }> = {};

  for (const stateName of nigerianStates) {
    const slug = slugify(stateName);
    const existingState = await prisma.location.findFirst({
      where: {
        type: "STATE",
        slug,
        parentId: nigeria.id
      }
    });
    const state =
      existingState ??
      (await prisma.location.create({
        data: {
          type: "STATE",
          name: stateName,
          slug,
          state: stateName,
          country: "Nigeria",
          parentId: nigeria.id
        }
      }));
    stateBySlug[slug] = state;

    const statewideSlug = `${slug}-statewide`;
    const existingStatewideArea = await prisma.location.findFirst({
      where: {
        type: "AREA",
        slug: statewideSlug,
        parentId: state.id
      }
    });

    if (!existingStatewideArea) {
      await prisma.location.create({
        data: {
          type: "AREA",
          name: `${stateName} Statewide`,
          slug: statewideSlug,
          state: stateName,
          country: "Nigeria",
          parentId: state.id
        }
      });
    }
  }

  const kano =
    (await prisma.location.findFirst({
      where: {
        type: "STATE",
        slug: "kano",
        parentId: nigeria.id
      }
    })) ??
    (await prisma.location.create({
      data: {
        type: "STATE",
        name: "Kano",
        slug: "kano",
        state: "Kano",
        parentId: nigeria.id
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
        profilePdfEnabled: name === "Platinum",
        features: {
          verification: name !== "Free",
          analytics: analyticsEnabled,
          featured: canBeFeatured,
          profilePdf: name === "Platinum"
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
