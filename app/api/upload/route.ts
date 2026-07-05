import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (files.length > 5) {
    return NextResponse.json({ error: "최대 5장까지 업로드 가능합니다." }, { status: 400 });
  }

  const urls: string[] = [];

  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "파일 크기는 5MB 이하여야 합니다." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `uploads/${session.user.id}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, { access: "public" });
    urls.push(blob.url);
  }

  return NextResponse.json({ urls });
}
