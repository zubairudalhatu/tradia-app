export type BusinessSummary = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  address?: string;
  averageRating: number | string;
  reviewCount?: number;
  verificationStatus: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  category: {
    name: string;
    slug?: string;
  };
  location: {
    name: string;
    slug?: string;
    state?: string | null;
    type?: string;
  };
  plan?: {
    name?: string;
    canBeFeatured?: boolean;
  } | null;
  featuredPlacements?: unknown[];
};

export type BusinessMedia = {
  id: string;
  type: "LOGO" | "COVER" | "GALLERY" | "DOCUMENT" | "MENU" | "BROCHURE";
  url: string;
  createdAt?: string;
};

export type BusinessReview = {
  id: string;
  rating: number;
  title?: string | null;
  body: string;
  ownerResponse?: string | null;
  userName: string;
  createdAt?: string;
};

export type BusinessHour = {
  dayOfWeek: number;
  opensAt?: string | null;
  closesAt?: string | null;
  isClosed: boolean;
};

export type BusinessDetail = BusinessSummary & {
  address: string;
  media: BusinessMedia[];
  hours: BusinessHour[];
  reviews: BusinessReview[];
  createdAt?: string;
  updatedAt?: string;
};
