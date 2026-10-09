import type { Metadata } from "next";
import { Suspense } from "react";
import UnsubscribeView from "@/components/views/UnsubscribeView";

export const metadata: Metadata = { title: "Sair da lista", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense>
      <UnsubscribeView />
    </Suspense>
  );
}
