import { catalog } from "@/lib/practice-catalog";
const err = (error: string, status: number) =>
  Response.json({ error }, { status });
async function handle(req: Request) {
  const auth = req.headers.get("authorization"),
    base = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!auth?.startsWith("Bearer ")) return err("Sign in required", 401);
  if (!base || !key) return err("Preview database is not configured", 503);
  try {
    let path =
        "pv_packages?select=id,title,questions,pv_package_topics(topic_id),pv_attempts(id,question_version,answer,solution_seen,created_at)&order=title,id",
      data;
    if (req.method === "POST") {
      const b = await req.json();
      if (
        b.action === "create" &&
        Array.isArray(b.versions) &&
        b.versions.length > 0 &&
        b.versions.every((id: unknown) => catalog.some((q) => q.id === id))
      ) {
        path = "rpc/pv_create_practice";
        data = {
          pack: b.id,
          name: b.title,
          topic_ids: b.topics,
          versions: [...new Set(b.versions)],
        };
      } else if (
        b.action === "submit" &&
        catalog.some((q) => q.id === b.version) &&
        typeof b.seen === "boolean"
      ) {
        path = "rpc/pv_submit_practice";
        data = {
          attempt: b.id,
          pack: b.pack,
          version: b.version,
          response: b.answer,
          seen: b.seen,
        };
      } else return err("Invalid practice request", 400);
    }
    const r = await fetch(new URL("/rest/v1/" + path, base), {
      method: req.method,
      headers: {
        Authorization: auth,
        apikey: key,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
      cache: "no-store",
    });
    if (!r.ok) {
      const e = await r.json();
      return err(
        ["42703", "PGRST202", "PGRST204"].includes(e.code)
          ? "Apply the Preview practice migration 202611050005_practice.sql"
          : "Practice request rejected",
        r.status,
      );
    }
    return Response.json(await r.json(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return err("Practice service unavailable", 503);
  }
}
export const GET = handle,
  POST = handle;
