import { NextResponse } from "next/server";
import { listActiveCategories } from "@/lib/queries/categories";

export async function GET() {
  const categories = await listActiveCategories();

  return NextResponse.json({
    data: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon
    }))
  });
}
