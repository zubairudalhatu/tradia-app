type BusinessProfileInput = {
  name: string;
  description: string;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  verificationStatus: string;
  categoryId?: string;
  locationId?: string;
  media?: Array<unknown>;
};

const checks = [
  {
    label: "Add a clear business description",
    isComplete: (business: BusinessProfileInput) => business.description.trim().length >= 80
  },
  {
    label: "Choose category and area",
    isComplete: (business: BusinessProfileInput) => Boolean(business.categoryId && business.locationId)
  },
  {
    label: "Add full address",
    isComplete: (business: BusinessProfileInput) => business.address.trim().length >= 5
  },
  {
    label: "Add phone or WhatsApp",
    isComplete: (business: BusinessProfileInput) => Boolean(business.phone || business.whatsapp)
  },
  {
    label: "Add email or website",
    isComplete: (business: BusinessProfileInput) => Boolean(business.email || business.website)
  },
  {
    label: "Upload business logo",
    isComplete: (business: BusinessProfileInput) => Boolean(business.logoUrl)
  },
  {
    label: "Upload cover image",
    isComplete: (business: BusinessProfileInput) => Boolean(business.coverUrl)
  },
  {
    label: "Upload at least 3 media items",
    isComplete: (business: BusinessProfileInput) => (business.media?.length ?? 0) >= 3
  },
  {
    label: "Submit and pass verification",
    isComplete: (business: BusinessProfileInput) => business.verificationStatus === "VERIFIED"
  }
];

export function getBusinessProfileCompleteness(business: BusinessProfileInput) {
  const completed = checks.filter((check) => check.isComplete(business));
  const missing = checks.filter((check) => !check.isComplete(business)).map((check) => check.label);

  return {
    completed: completed.length,
    total: checks.length,
    percentage: Math.round((completed.length / checks.length) * 100),
    missing
  };
}
