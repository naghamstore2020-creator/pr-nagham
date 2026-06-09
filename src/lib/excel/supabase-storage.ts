import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const BUCKET = "uploads";

export async function uploadToStorage(
  buffer: Buffer,
  fileName: string
): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType:
        fileName.endsWith(".xlsx")
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/octet-stream",
      upsert: true,
    });
  if (error) {
    console.warn("Supabase storage upload failed:", error.message);
    return null;
  }
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function ensureBucket(): Promise<string | null> {
  if (!supabase) return "Supabase client not initialized";
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) return `Bucket '${BUCKET}' does not exist. Create it in Supabase Dashboard → Storage.`;
  return null;
}

export async function downloadFromStorage(
  fileUrl: string
): Promise<Buffer | null> {
  if (!supabase) return null;
  const path = extractPath(fileUrl);
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) {
    console.warn("Supabase storage download failed:", error.message);
    return null;
  }
  return Buffer.from(await data.arrayBuffer());
}

function extractPath(url: string): string | null {
  if (!supabaseUrl) return null;
  const prefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/`;
  if (url.startsWith(prefix)) return url.slice(prefix.length);
  return null;
}
