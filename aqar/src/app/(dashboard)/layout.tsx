import { Suspense } from "react";

import { AppSidebar } from "../../components/layout/app-sidebar";
import { AppHeader } from "../../components/layout/app-header";

// This placeholder keeps the sidebar's width reserved
// while Next.js resolves the active navigation route.
function SidebarFallback() {
  return (
    <aside
      aria-hidden="true"
      className="hidden min-h-screen w-64 shrink-0 border-l border-[#e3e8e4] bg-white p-5 md:block"
    >
      <div className="mb-10">
        <div className="h-8 w-20 rounded-lg bg-gray-100" />
        <div className="mt-3 h-3 w-36 rounded bg-gray-100" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-11 rounded-xl bg-gray-50" />
        ))}
      </div>
    </aside>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Only the sidebar depends on the current pathname.
          Keep the Suspense boundary small so the rest
          of the dashboard can render independently. */}
      <Suspense fallback={<SidebarFallback />}>
        <AppSidebar />
      </Suspense>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
