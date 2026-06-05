export type WalletProductCode = "homepage_feature_30" | "business_starter_kit" | "verified_business_kit";

export type WalletProduct = {
  code: WalletProductCode;
  name: string;
  price: number;
  durationDays?: number;
  requiresVerified?: boolean;
  description: string;
  benefits: string[];
};

export const walletProducts: WalletProduct[] = [
  {
    code: "homepage_feature_30",
    name: "Homepage Feature Boost",
    price: 10000,
    durationDays: 30,
    description: "Place a strong business profile in the rotating homepage featured section for 30 days.",
    benefits: [
      "30-day homepage featured placement",
      "Priority visibility on the public landing page",
      "Useful for launches, offers, and seasonal campaigns"
    ]
  },
  {
    code: "business_starter_kit",
    name: "Business Starter Kit",
    price: 15000,
    description: "A practical launch pack for businesses that want visible Tradia proof at their counter or shopfront.",
    benefits: [
      "Window sticker",
      "QR counter card",
      "Small flyer pack"
    ]
  },
  {
    code: "verified_business_kit",
    name: "Verified Business Kit",
    price: 20000,
    requiresVerified: true,
    description: "A trust pack for verified businesses that want customers to see their verification offline too.",
    benefits: [
      "Verified business sticker",
      "Framed certificate",
      "QR plaque"
    ]
  }
];

export function getWalletProduct(code: string) {
  return walletProducts.find((product) => product.code === code);
}

export function formatNaira(amount: number) {
  if (amount === 0) return "Free";

  return `NGN ${amount.toLocaleString("en-NG")}`;
}
