import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  StatusBar as NativeStatusBar,
  View
} from "react-native";
import { WebView } from "react-native-webview";
import { accountUrl, addBusinessUrl, businessUrl, getBusiness, listBusinesses } from "./src/api";
import type { BusinessDetail as BusinessDetailData, BusinessMedia, BusinessSummary } from "./src/types";

const brandLogo = require("./assets/tradia-logo.png");

type WebScreenState = {
  title: string;
  url: string;
};

export default function App() {
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [query, setQuery] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessSummary | null>(null);
  const [webScreen, setWebScreen] = useState<WebScreenState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBusinesses(nextQuery = query, refreshing = false) {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const items = await listBusinesses(nextQuery);
      setBusinesses(items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadBusinesses("");
  }, []);

  const featuredCount = useMemo(() => businesses.filter(isFeatured).length, [businesses]);

  if (webScreen) {
    return (
      <InAppWebScreen
        screen={webScreen}
        onBack={() => setWebScreen(null)}
      />
    );
  }

  if (selectedBusiness) {
    return (
      <BusinessDetailScreen
        business={selectedBusiness}
        onBack={() => setSelectedBusiness(null)}
        onOpenInApp={(screen) => setWebScreen(screen)}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, styles.androidSafeArea]}>
      <ExpoStatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
      <View style={styles.header}>
        <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
        <Pressable style={styles.headerButton} onPress={() => setWebScreen({ title: "Account", url: accountUrl() })}>
          <Text style={styles.headerButtonText}>Account</Text>
        </Pressable>
      </View>

      <FlatList
        data={businesses}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadBusinesses(query, true)} />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>Discover. Connect. Grow.</Text>
            <Text style={styles.title}>Grow your visibility on Tradia.</Text>
            <Text style={styles.subtitle}>
              Find verified businesses across Nigeria, compare profiles, and contact owners directly.
            </Text>

            <View style={styles.searchBox}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Hotels, schools, clinics, fashion..."
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={() => loadBusinesses(query)}
              />
              <Pressable style={styles.searchButton} onPress={() => loadBusinesses(query)}>
                <Text style={styles.searchButtonText}>Search</Text>
              </Pressable>
            </View>

            <View style={styles.quickStats}>
              <Stat label="Listings" value={String(businesses.length)} />
              <Stat label="Featured" value={String(featuredCount)} />
              <Stat label="Verified" value={String(businesses.filter((item) => item.verificationStatus === "VERIFIED").length)} />
            </View>

            <Pressable style={styles.addBusinessButton} onPress={() => setWebScreen({ title: "Add Business", url: addBusinessUrl() })}>
              <Text style={styles.addBusinessButtonText}>Add Business</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {isLoading ? <ActivityIndicator color="#0b7f55" style={styles.loader} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <BusinessCard business={item} onPress={() => setSelectedBusiness(item)} />
        )}
        ListEmptyComponent={!isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No businesses found</Text>
            <Text style={styles.emptyText}>Try another search term or refresh the directory.</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

function InAppWebScreen({ screen, onBack }: { screen: WebScreenState; onBack: () => void }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <SafeAreaView style={[styles.safeArea, styles.androidSafeArea]}>
      <ExpoStatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
      <View style={styles.webHeader}>
        <Pressable onPress={onBack} style={styles.webBackButton}>
          <Text style={styles.webBackButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.webTitle} numberOfLines={1}>{screen.title}</Text>
        <Pressable onPress={() => openUrl(screen.url)} style={styles.webOpenButton}>
          <Text style={styles.webOpenButtonText}>Open</Text>
        </Pressable>
      </View>
      {isLoading ? (
        <View style={styles.webLoader}>
          <ActivityIndicator color="#0b7f55" />
        </View>
      ) : null}
      <WebView
        source={{ uri: screen.url }}
        style={styles.webView}
        startInLoadingState
        onLoadEnd={() => setIsLoading(false)}
      />
    </SafeAreaView>
  );
}

function BusinessDetailScreen({
  business,
  onBack,
  onOpenInApp
}: {
  business: BusinessSummary;
  onBack: () => void;
  onOpenInApp: (screen: WebScreenState) => void;
}) {
  const [detail, setDetail] = useState<BusinessDetailData | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const displayBusiness = detail ?? business;
  const rating = Number(displayBusiness.averageRating || 0).toFixed(1);
  const locationLabel = displayBusiness.location.state
    ? `${displayBusiness.location.name}, ${displayBusiness.location.state}`
    : displayBusiness.location.name;
  const imageMedia = detail?.media.filter((item) => isImageMediaType(item.type)).slice(0, 8) ?? [];
  const reviewCount = detail?.reviewCount ?? displayBusiness.reviewCount ?? detail?.reviews.length ?? 0;
  const contactCount = [
    displayBusiness.phone,
    displayBusiness.whatsapp,
    displayBusiness.email,
    displayBusiness.website
  ].filter(Boolean).length;

  useEffect(() => {
    let isActive = true;
    setIsDetailLoading(true);
    setDetailError(null);

    getBusiness(business.slug)
      .then((nextDetail) => {
        if (isActive) setDetail(nextDetail);
      })
      .catch((loadError) => {
        if (isActive) {
          setDetailError(loadError instanceof Error ? loadError.message : "Unable to load this business.");
        }
      })
      .finally(() => {
        if (isActive) setIsDetailLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [business.slug]);

  const coverUrl = displayBusiness.coverUrl || imageMedia.find((item) => item.type === "COVER")?.url;
  const logoUrl = displayBusiness.logoUrl || imageMedia.find((item) => item.type === "LOGO")?.url;

  return (
    <SafeAreaView style={[styles.safeArea, styles.androidSafeArea]}>
      <ExpoStatusBar style="dark" backgroundColor="#fbfbf8" translucent={false} />
      <ScrollView contentContainerStyle={styles.detailContent}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to directory</Text>
        </Pressable>

        {coverUrl ? (
          <Image source={{ uri: cropImageUrl(coverUrl, "cover") }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverFallback} />
        )}

        <View style={styles.detailCard}>
          {logoUrl ? (
            <Image source={{ uri: cropImageUrl(logoUrl, "logo") }} style={styles.detailLogo} resizeMode="contain" />
          ) : (
            <View style={styles.detailLogoFallback}>
              <Text style={styles.detailLogoFallbackText}>{displayBusiness.name.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.detailName}>{displayBusiness.name}</Text>
          <Text style={styles.detailMeta}>{displayBusiness.category.name} in {locationLabel}</Text>

          <View style={styles.badgeRow}>
            <Badge label={displayBusiness.verificationStatus === "VERIFIED" ? "Verified" : "Pending verification"} tone={displayBusiness.verificationStatus === "VERIFIED" ? "success" : "neutral"} />
            <Badge label={`${rating} rating`} tone="neutral" />
            <Badge label={`${reviewCount} review${reviewCount === 1 ? "" : "s"}`} tone="neutral" />
            {isFeatured(displayBusiness) ? <Badge label="Featured" tone="accent" /> : null}
          </View>

          {isDetailLoading ? (
            <View style={styles.inlineLoader}>
              <ActivityIndicator color="#0b7f55" />
              <Text style={styles.inlineLoaderText}>Loading full profile...</Text>
            </View>
          ) : null}
          {detailError ? <Text style={styles.detailError}>{detailError}</Text> : null}

          <Text style={styles.detailDescription}>{displayBusiness.description}</Text>

          <View style={styles.infoPanel}>
            <Text style={styles.infoPanelTitle}>Business information</Text>
            {displayBusiness.address ? <DetailInfo label="Address" value={displayBusiness.address} /> : null}
            <DetailInfo label="Contact channels" value={`${contactCount || "Limited"} available`} />
            <DetailInfo label="Category" value={displayBusiness.category.name} />
            <DetailInfo label="Location" value={locationLabel} />
          </View>

          {imageMedia.length ? (
            <View style={styles.mediaSection}>
              <Text style={styles.infoPanelTitle}>Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaStrip}>
                {imageMedia.map((item) => (
                  <Image key={item.id} source={{ uri: cropImageUrl(item.url, item.type === "COVER" ? "cover" : "logo") }} style={styles.mediaThumb} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {detail?.reviews.length ? (
            <View style={styles.reviewsSection}>
              <Text style={styles.infoPanelTitle}>Recent reviews</Text>
              {detail.reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewTitle}>{review.title ?? "Customer review"}</Text>
                    <Text style={styles.reviewRating}>{review.rating}/5</Text>
                  </View>
                  <Text style={styles.reviewAuthor}>By {review.userName}</Text>
                  <Text style={styles.reviewBody} numberOfLines={4}>{review.body}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.actionGrid}>
            {displayBusiness.phone ? <ActionButton label="Call" onPress={() => openUrl(`tel:${displayBusiness.phone}`)} /> : null}
            {displayBusiness.whatsapp || displayBusiness.phone ? (
              <ActionButton label="WhatsApp" onPress={() => openUrl(`https://wa.me/${cleanPhone(displayBusiness.whatsapp ?? displayBusiness.phone ?? "")}`)} />
            ) : null}
            {displayBusiness.email ? <ActionButton label="Email" onPress={() => openUrl(`mailto:${displayBusiness.email}`)} /> : null}
            {displayBusiness.website ? <ActionButton label="Website" onPress={() => openUrl(displayBusiness.website ?? "")} /> : null}
          </View>

          <Pressable style={styles.profileButton} onPress={() => onOpenInApp({ title: displayBusiness.name, url: businessUrl(displayBusiness.slug) })}>
            <Text style={styles.profileButtonText}>Open Full Profile</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailInfo({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailInfoRow}>
      <Text style={styles.detailInfoLabel}>{label}</Text>
      <Text style={styles.detailInfoValue}>{value}</Text>
    </View>
  );
}

function BusinessCard({ business, onPress }: { business: BusinessSummary; onPress: () => void }) {
  return (
    <Pressable style={styles.businessCard} onPress={onPress}>
      <View style={styles.cardHeader}>
        {business.logoUrl ? (
          <Image source={{ uri: cropImageUrl(business.logoUrl, "logo") }} style={styles.cardLogo} resizeMode="contain" />
        ) : (
          <View style={styles.cardLogoFallback}>
            <Text style={styles.cardLogoFallbackText}>{business.name.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{business.name}</Text>
          <Text style={styles.cardMeta}>{business.category.name} in {business.location.name}</Text>
        </View>
      </View>
      <Text style={styles.cardDescription} numberOfLines={3}>{business.description}</Text>
      <View style={styles.badgeRow}>
        <Badge label={business.verificationStatus === "VERIFIED" ? "Verified" : "Pending"} tone={business.verificationStatus === "VERIFIED" ? "success" : "neutral"} />
        <Badge label={`${Number(business.averageRating || 0).toFixed(1)} rating`} tone="neutral" />
        {isFeatured(business) ? <Badge label="Featured" tone="accent" /> : null}
      </View>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Badge({ label, tone }: { label: string; tone: "success" | "accent" | "neutral" }) {
  const badgeStyle = tone === "success" ? styles.badgeSuccess : tone === "accent" ? styles.badgeAccent : styles.badgeNeutral;
  const textStyle = tone === "success" ? styles.badgeSuccessText : tone === "accent" ? styles.badgeAccentText : styles.badgeNeutralText;

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.badgeText, textStyle]}>{label}</Text>
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.actionButton} onPress={onPress}>
      <Text style={styles.actionButtonText}>{label}</Text>
    </Pressable>
  );
}

function isFeatured(business: BusinessSummary) {
  return Boolean(business.featuredPlacements?.length || business.plan?.canBeFeatured);
}

function openUrl(url: string) {
  if (!url) return;
  void Linking.openURL(url);
}

function cleanPhone(value: string) {
  return value.replace(/\D/g, "");
}

function isImageMediaType(type: BusinessMedia["type"]) {
  return ["LOGO", "COVER", "GALLERY"].includes(type);
}

function cropImageUrl(url: string, mode: "cover" | "logo") {
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }

  const transformation = mode === "cover"
    ? "c_fill,g_auto,w_1200,h_600,q_auto,f_auto"
    : "c_fit,w_400,h_400,q_auto,f_auto";

  return url.replace("/image/upload/", `/image/upload/${transformation}/`);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fbfbf8"
  },
  androidSafeArea: {
    paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight ?? 0 : 0
  },
  header: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  logo: {
    height: 40,
    width: 150
  },
  headerButton: {
    backgroundColor: "#eff6f3",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  headerButtonText: {
    color: "#082441",
    fontWeight: "800"
  },
  webHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  webBackButton: {
    backgroundColor: "#eff6f3",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  webBackButtonText: {
    color: "#0b7f55",
    fontWeight: "900"
  },
  webTitle: {
    color: "#082441",
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center"
  },
  webOpenButton: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  webOpenButtonText: {
    color: "#082441",
    fontWeight: "900"
  },
  webView: {
    flex: 1
  },
  webLoader: {
    alignItems: "center",
    backgroundColor: "#fbfbf8",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 72,
    zIndex: 2
  },
  content: {
    padding: 20,
    paddingBottom: 40
  },
  eyebrow: {
    color: "#f05a28",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: "#082441",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 44,
    marginTop: 8
  },
  subtitle: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12
  },
  searchBox: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe4ef",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    marginTop: 22,
    padding: 10
  },
  searchInput: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    color: "#082441",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: "#0b7f55",
    borderRadius: 8,
    paddingVertical: 13
  },
  searchButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900"
  },
  quickStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16
  },
  stat: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 14
  },
  statValue: {
    color: "#0b7f55",
    fontSize: 24,
    fontWeight: "900"
  },
  statLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  addBusinessButton: {
    alignItems: "center",
    backgroundColor: "#082441",
    borderRadius: 8,
    marginTop: 14,
    paddingVertical: 14
  },
  addBusinessButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
  },
  loader: {
    marginVertical: 20
  },
  error: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    color: "#b91c1c",
    fontWeight: "800",
    marginTop: 14,
    padding: 12
  },
  businessCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe4ef",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 16
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  cardLogo: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    height: 52,
    width: 52
  },
  cardLogoFallback: {
    alignItems: "center",
    backgroundColor: "#eff6f3",
    borderRadius: 8,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  cardLogoFallbackText: {
    color: "#0b7f55",
    fontSize: 22,
    fontWeight: "900"
  },
  cardText: {
    flex: 1
  },
  cardTitle: {
    color: "#082441",
    fontSize: 18,
    fontWeight: "900"
  },
  cardMeta: {
    color: "#475569",
    fontSize: 13,
    marginTop: 3
  },
  cardDescription: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "900"
  },
  badgeSuccess: {
    backgroundColor: "#ecfdf5"
  },
  badgeSuccessText: {
    color: "#0b7f55"
  },
  badgeAccent: {
    backgroundColor: "#fff7ed"
  },
  badgeAccentText: {
    color: "#f05a28"
  },
  badgeNeutral: {
    backgroundColor: "#f1f5f9"
  },
  badgeNeutralText: {
    color: "#475569"
  },
  emptyState: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 18,
    padding: 18
  },
  emptyTitle: {
    color: "#082441",
    fontSize: 18,
    fontWeight: "900"
  },
  emptyText: {
    color: "#64748b",
    marginTop: 6
  },
  detailContent: {
    padding: 20,
    paddingBottom: 40
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  backButtonText: {
    color: "#082441",
    fontWeight: "900"
  },
  coverImage: {
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    height: 190,
    width: "100%"
  },
  coverFallback: {
    backgroundColor: "#082441",
    borderRadius: 8,
    height: 190
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe4ef",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: -34,
    padding: 18
  },
  detailLogo: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    height: 82,
    width: 82
  },
  detailLogoFallback: {
    alignItems: "center",
    backgroundColor: "#eff6f3",
    borderRadius: 8,
    height: 82,
    justifyContent: "center",
    width: 82
  },
  detailLogoFallbackText: {
    color: "#0b7f55",
    fontSize: 34,
    fontWeight: "900"
  },
  detailName: {
    color: "#082441",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
    marginTop: 14
  },
  detailMeta: {
    color: "#475569",
    fontSize: 15,
    marginTop: 6
  },
  detailDescription: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 25,
    marginTop: 18
  },
  inlineLoader: {
    alignItems: "center",
    backgroundColor: "#eff6f3",
    borderRadius: 8,
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    padding: 12
  },
  inlineLoaderText: {
    color: "#0b7f55",
    fontSize: 13,
    fontWeight: "800"
  },
  detailError: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 14,
    padding: 12
  },
  infoPanel: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 18,
    padding: 14
  },
  infoPanelTitle: {
    color: "#082441",
    fontSize: 17,
    fontWeight: "900"
  },
  detailInfoRow: {
    borderTopColor: "#e2e8f0",
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12
  },
  detailInfoLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  detailInfoValue: {
    color: "#082441",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: 4
  },
  mediaSection: {
    marginTop: 18
  },
  mediaStrip: {
    gap: 10,
    paddingTop: 12
  },
  mediaThumb: {
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    height: 112,
    width: 150
  },
  reviewsSection: {
    marginTop: 18
  },
  reviewCard: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12
  },
  reviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  reviewTitle: {
    color: "#082441",
    flex: 1,
    fontSize: 15,
    fontWeight: "900"
  },
  reviewRating: {
    color: "#0b7f55",
    fontSize: 13,
    fontWeight: "900"
  },
  reviewAuthor: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4
  },
  reviewBody: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18
  },
  actionButton: {
    backgroundColor: "#eff6f3",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  actionButtonText: {
    color: "#0b7f55",
    fontWeight: "900"
  },
  profileButton: {
    alignItems: "center",
    backgroundColor: "#0b7f55",
    borderRadius: 8,
    marginTop: 18,
    paddingVertical: 14
  },
  profileButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
  }
});
