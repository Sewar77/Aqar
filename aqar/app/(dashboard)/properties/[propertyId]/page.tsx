import { Suspense } from "react";
import PropertyDetailsPage from "@/components/dashboard/properties/property-details-page";

type PageProps = {
  params: Promise<{ propertyId: string }>;
};

async function PropertyDetailsContent({ params }: PageProps) {
  const { propertyId } = await params;

  return <PropertyDetailsPage propertyId={propertyId} />;
}

export default function Page({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="p-6">جاري تحميل العقار...</div>}>
      <PropertyDetailsContent params={params} />
    </Suspense>
  );
}
