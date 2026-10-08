import type { Metadata } from "next";
import MembersView from "@/components/views/MembersView";

export const metadata: Metadata = {
  title: "Members",
  description: "Alguns drops não chegam para todo mundo. Early access, drops secretos e níveis.",
  alternates: { canonical: "/members" },

};

export default function Page() {
  return <MembersView />;
}
