import { NextResponse } from "next/server";
import { listActiveStateAreaGroups } from "@/lib/queries/locations";

export async function GET() {
  const states = await listActiveStateAreaGroups();

  return NextResponse.json({
    data: states.map((state) => ({
      id: state.id,
      name: state.name,
      slug: state.slug,
      type: state.type,
      children: state.children.map((area) => ({
        id: area.id,
        name: area.name,
        slug: area.slug,
        type: area.type,
        state: area.state
      }))
    }))
  });
}
