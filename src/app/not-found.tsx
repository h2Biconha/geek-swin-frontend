import type { Metadata } from "next";
import NotFoundView from "@/components/views/NotFoundView";

export const metadata: Metadata = { title: "Player not found", robots: { index: false } };

export default function NotFound() {
  return <NotFoundView />;
}
