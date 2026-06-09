import fs from "fs";
import path from "path";

export async function saveUploadedFile(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const ext = path.extname(fileName) || ".xlsx";
  const name = path.basename(fileName, ext).replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_");
  const uniqueName = `${name}_${Date.now()}${ext}`;
  
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, uniqueName);
  await fs.promises.writeFile(filePath, buffer);

  return `/uploads/${uniqueName}`;
}

export async function getFileBuffer(fileUrl: string): Promise<Buffer> {
  if (fileUrl.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", fileUrl);
    if (!fs.existsSync(filePath)) {
      throw new Error(`الملف غير موجود في المسار: ${filePath}`);
    }
    return await fs.promises.readFile(filePath);
  }
  throw new Error("نوع رابط الملف غير مدعوم محلياً");
}
