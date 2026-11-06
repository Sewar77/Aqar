import { createHash, randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

import { propertyPhotoService } from "@/modules/properties/property.service";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const MAX_FILE_BYTES = 8 * 1024 * 1024;

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: Context) {
  // Do not expose uploads publicly until
  // authenticated ADMIN sessions are implemented.
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      {
        success: false,
        message: "رفع الصور معطّل حتى تفعيل تسجيل الدخول والصلاحيات",
      },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return Response.json(
      {
        success: false,
        message: "معرّف العقار غير صالح",
      },
      { status: 400 },
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  const apiKey = process.env.CLOUDINARY_API_KEY;

  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (
    !cloudName ||
    !apiKey ||
    !apiSecret ||
    !/^[a-zA-Z0-9_-]+$/.test(cloudName)
  ) {
    return Response.json(
      {
        success: false,
        message: "إعدادات تخزين الصور غير مكتملة",
      },
      { status: 503 },
    );
  }

  try {
    const property = await prisma.property.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!property) {
      return Response.json(
        {
          success: false,
          message: "العقار غير موجود",
        },
        { status: 404 },
      );
    }

    const form = await request.formData();
    const file = form.get("file");

    if (
      !(file instanceof File) ||
      !allowedTypes.has(file.type) ||
      file.size === 0 ||
      file.size > MAX_FILE_BYTES
    ) {
      return Response.json(
        {
          success: false,
          message: "الصورة يجب أن تكون JPG أو PNG أو WebP وحجمها أقل من 8MB",
        },
        { status: 400 },
      );
    }

    const count = await prisma.propertyPhoto.count({
      where: {
        propertyId: id,
      },
    });

    if (count >= 30) {
      return Response.json(
        {
          success: false,
          message: "الحد الأعلى 30 صورة لكل عقار",
        },
        { status: 400 },
      );
    }

    const folder = `aqar/properties/${id}`;
    const publicId = randomUUID();

    const timestamp = Math.floor(Date.now() / 1000);

    const signBase =
      `folder=${folder}` +
      `&public_id=${publicId}` +
      `&timestamp=${timestamp}` +
      apiSecret;

    const signature = createHash("sha1").update(signBase).digest("hex");

    const cloudForm = new FormData();

    cloudForm.append("file", file, file.name);
    cloudForm.append("api_key", apiKey);
    cloudForm.append("timestamp", String(timestamp));
    cloudForm.append("folder", folder);
    cloudForm.append("public_id", publicId);
    cloudForm.append("signature", signature);

    const cloudResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: cloudForm,
        cache: "no-store",
      },
    );

    const cloudResult: unknown = await cloudResponse.json();

    if (
      !cloudResponse.ok ||
      !cloudResult ||
      typeof cloudResult !== "object" ||
      !("public_id" in cloudResult) ||
      typeof cloudResult.public_id !== "string"
    ) {
      console.error("Cloudinary upload failed:", cloudResult);

      return Response.json(
        {
          success: false,
          message: "فشل رفع الصورة للتخزين الخارجي",
        },
        { status: 502 },
      );
    }

    const photo = await propertyPhotoService.add(id, {
      storageKey: cloudResult.public_id,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      sortOrder: count,
      isPrimary: count === 0,
    });

    return Response.json(
      {
        success: true,
        data: photo,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Property image upload error:", error);

    return Response.json(
      {
        success: false,
        message: "تعذّر حفظ الصورة. تحققي من صور العقار قبل إعادة الرفع",
      },
      { status: 500 },
    );
  }
}
