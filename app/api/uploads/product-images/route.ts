import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

const ALLOWED_FOLDERS = ["products", "teams", "categories", "featured", "seo", "reviews"] as const;

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderParam = searchParams.get("folder") || "products";
    const folder = ALLOWED_FOLDERS.includes(folderParam as (typeof ALLOWED_FOLDERS)[number])
      ? folderParam
      : "products";

    const session = await auth();
    const role = (session?.user as { role?: string })?.role || "customer";

    if (folder === "reviews") {
      if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;
    const filesToUpload = files?.length ? files : singleFile ? [singleFile] : [];

    if (!filesToUpload.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const subfolder = process.env.CLOUDINARY_FOLDER || "tawi-shop";
    const cloudinaryFolder = `${subfolder}/${folder}`;

    const urls: string[] = [];

    for (const file of filesToUpload) {
      if (!(file instanceof File)) continue;
      if (!file.type.startsWith("image/")) continue;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await uploadToCloudinary(buffer, file.type, { folder: cloudinaryFolder });

      if (result) {
        urls.push(result.secure_url);
      }
    }

    if (urls.length === 0) {
      return NextResponse.json(
        { error: "Upload failed. Check Cloudinary env vars (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET) or ensure files are valid images." },
        { status: 400 }
      );
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}
