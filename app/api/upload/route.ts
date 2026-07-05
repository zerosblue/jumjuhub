import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (e) {
    console.error("[upload] formData parse error:", e);
    return NextResponse.json({ error: "파일 파싱 실패 (파일이 너무 클 수 있습니다)" }, { status: 400 });
  }

  const files = formData.getAll("files") as File[];
  console.log("[upload] files received:", files.map((f) => `${f.name} (${(f.size / 1024).toFixed(1)}KB)`));

  if (files.length === 0) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (files.length > 5) {
    return NextResponse.json({ error: "최대 5장까지 업로드 가능합니다." }, { status: 400 });
  }

  const urls: string[] = [];

  for (const file of files) {
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const filename = `uploads/${session.user.id}-${Date.now()}.${ext}`;
      const blob = await put(filename, file, { access: "public" });
      console.log("[upload] blob url:", blob.url);
      urls.push(blob.url);
    } catch (e) {
      console.error("[upload] put error:", e);
      return NextResponse.json({ error: `업로드 실패: ${(e as Error).message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ urls });
}
