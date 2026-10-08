import type { Metadata } from "next";
import AboutView from "@/components/views/AboutView";

export const metadata: Metadata = {
  title: "About",
  description: "Manifesto",
  alternates: { canonical: "/about" },

};

export default function Page() {
  return <AboutView />;
}
