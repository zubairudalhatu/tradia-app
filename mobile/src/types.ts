export type BusinessSummary = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  averageRating: number | string;
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
