import { NextResponse } from "next/server";
import { isUserAccountVerified } from "@/lib/account-verification";
import { getCurrentUser } from "@/lib/auth/session";
import { findPotentialBusinessDuplicates } from "@/lib/queries/businesses";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || !isUserAccountVerified(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: privateHeaders });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (query.length < 3) return NextResponse.json({ data: [] }, { headers: privateHeaders });

  const matches = await findPotentialBusinessDuplicates(query, 6);
  return NextResponse.json({
    data: matches.map((match) => ({
      id: match.id,
      name: match.name,
      slug: match.listingStatus === "PUBLISHED" ? match.slug : null,
      status: match.listingStatus,
      category: match.category.name,
      location: match.location.state || match.location.name,
      similarity: Math.round(match.score * 100)
    }))
  }, { headers: privateHeaders });
}

const privateHeaders = { "Cache-Control": "private, no-store" };
