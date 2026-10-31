import { Suspense } from "react";
import CityPropertiesPage from "@/components/dashboard/locations/city-properties-page";

async function CityPropertiesContent({
  params,
}: {
  params: Promise<{ cityId: string }>;
}) {
  const { cityId } = await params;

  return <CityPropertiesPage cityId={cityId} />;
}

export default function Page({
  params,
}: {
  params: Promise<{ cityId: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-6">جاري تحميل الصفحة...</div>}>
      <CityPropertiesContent params={params} />
    </Suspense>
  );
}
