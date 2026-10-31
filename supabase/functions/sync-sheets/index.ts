// =====================================================================
//  THE HARMONY – Edge Function "sync-sheets"
//  Đọc Google Sheet của các chủ villa → cập nhật lịch (đã book / giá / khoá)
//  - action "preview": đọc thử 1 link (admin)        → trả nhãn cột, thống kê, màu
//  - action "sync"   : đồng bộ 1 nguồn hoặc tất cả   → ghi bảng calendar
//  Gọi bởi: trang quản trị (JWT admin) hoặc lịch tự động (pg_cron – KHÔNG cần khoá)
//  Deploy: npx supabase functions deploy sync-sheets --no-verify-jwt --use-api
//  Khoá quản trị đặt bằng: npx supabase secrets set HARMONY_SECRET_KEY=sb_secret_...
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "../_shared/sheet-sync.js";
// deno-lint-ignore no-explicit-any
const SS = (globalThis as any).SheetSync;

const URL_ = Deno.env.get("SUPABASE_URL")!;
// Ưu tiên khoá secret mới (sb_secret_…) đặt bằng "supabase secrets set"; không có thì dùng khoá cũ do Supabase cấp sẵn
const SERVICE = Deno.env.get("HARMONY_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const fetchText = async (u: string) => {
  const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (TheHarmonySync)", "Accept-Language": "vi" } });
  if (!r.ok) throw new Error(`Google trả lỗi ${r.status} khi đọc Sheet`);
  return await r.text();
};

// deno-lint-ignore no-explicit-any
async function syncOne(db: any, src: any) {
  const cfg = src.config || {};
  const mapping: Record<string, string> = cfg.mapping || {};
  try {
    const read = await SS.readSource({ ...cfg, sheet_url: src.sheet_url, bookedColors: cfg.booked_colors, bookedWords: cfg.booked_words }, fetchText);
    const found = new Set(read.labels.map((l: { key: string }) => l.key));
    const missing = Object.entries(mapping).filter(([k, v]) => v && !found.has(k)).map(([k]) => k);
    const okMap = Object.fromEntries(Object.entries(mapping).filter(([k, v]) => v && found.has(k)));
    const rows = SS.toCalendarRows(read, okMap, cfg.markup, { color: cfg.booked_color, by: src.name });
    // các ngày đã đọc của mỗi căn → xoá rồi ghi lại (để ô xoá đỏ trên Sheet thì web cũng mở lại)
    for (const [key, villaId] of Object.entries(okMap)) {
      const dates = Object.keys(read.data[key] || {}).sort();
      if (!dates.length) continue;
      const del = await db.from("calendar").delete().eq("villa_id", villaId).gte("date", dates[0]).lte("date", dates[dates.length - 1]);
      if (del.error) throw new Error(del.error.message);
      const r = await db.from("villa_rates").upsert({ villa_id: villaId, weekday: null, weekend: null, open_until: dates[dates.length - 1], note: "Đồng bộ từ Google Sheet" });
      if (r.error) throw new Error(r.error.message);
    }
    for (let i = 0; i < rows.length; i += 500) { const u = await db.from("calendar").upsert(rows.slice(i, i + 500)); if (u.error) throw new Error(u.error.message); }
    const newCols = read.labels.filter((l: { key: string }) => !(l.key in mapping)).map((l: { label: string }) => l.label);
    const emptyTabs = read.tabs.filter((t: { error: string }) => t.error).map((t: { tab: string }) => t.tab);
    const tabMiss = SS.missingByTab(read, mapping) as { tab: string; miss: string[] }[];
    const status = missing.length || tabMiss.length ? "warning" : "ok";
    const msg = [
      `${rows.length} ngày đã cập nhật cho ${Object.keys(okMap).length} căn`,
      missing.length ? `KHÔNG THẤY cột: ${missing.join(", ")} – Sheet có thể đã đổi bố cục, cần ghép lại` : "",
      tabMiss.length ? tabMiss.map(t => `Tab “${t.tab}” thiếu cột: ${t.miss.join(", ")} (chủ nhà đổi tên cột? ghép thêm cột mới vào cùng căn)`).join(" · ") : "",
      newCols.length ? `Cột mới chưa ghép: ${newCols.join(", ")}` : "",
      emptyTabs.length ? `Tab chưa có dữ liệu: ${emptyTabs.join(", ")}` : "",
    ].filter(Boolean).join(" · ");
    await db.from("sheet_sources").update({ last_sync_at: new Date().toISOString(), last_status: status, last_message: msg }).eq("id", src.id);
    await db.from("sheet_sync_runs").insert({ source_id: src.id, status, message: msg, rows: rows.length });
    return { id: src.id, status, message: msg, rows: rows.length };
  } catch (e) {
    const msg = (e as Error).message;
    await db.from("sheet_sources").update({ last_sync_at: new Date().toISOString(), last_status: "error", last_message: msg }).eq("id", src.id);
    await db.from("sheet_sync_runs").insert({ source_id: src.id, status: "error", message: msg, rows: 0 });
    return { id: src.id, status: "error", message: msg, rows: 0 };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body = await req.json().catch(() => ({}));
    const db = createClient(URL_, SERVICE, { auth: { persistSession: false } });
    // "Đồng bộ tất cả" không cần đăng nhập (chỉ đọc lại Sheet công khai rồi ghi lịch) – giới hạn tối đa 1 lần / 40 giây
    const publicSync = body.action === "sync" && !body.source_id && !body.sheet_url;
    let admin = false;
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (jwt.split(".").length === 3) {
      const { data: u } = await db.auth.getUser(jwt);
      if (u?.user) { const { data: pr } = await db.from("profiles").select("role").eq("id", u.user.id).maybeSingle(); admin = pr?.role === "admin"; }
    }
    if (!admin && !publicSync) return json({ error: "Chỉ tài khoản quản trị được dùng chức năng này" }, 403);
    if (!admin) {
      const { data: last } = await db.from("sheet_sync_runs").select("at").order("at", { ascending: false }).limit(1).maybeSingle();
      if (last && Date.now() - new Date(last.at).getTime() < 40000) return json({ results: [], skipped: "vừa đồng bộ" });
    }

    if (body.action === "preview") {
      const read = await SS.readSource({ sheet_url: body.sheet_url, bookedColors: body.config?.booked_colors, bookedWords: body.config?.booked_words }, fetchText);
      // gửi bản rút gọn
      for (const k in read.data) for (const d in read.data[k]) { const c = read.data[k][d]; read.data[k][d] = { s: c.s, p: c.p }; }
      return json(read);
    }
    if (body.action === "sync") {
      let q = db.from("sheet_sources").select("*").eq("active", true);
      if (body.source_id) q = db.from("sheet_sources").select("*").eq("id", body.source_id);
      const { data: sources, error } = await q;
      if (error) throw new Error(error.message);
      const results = [];
      for (const s of sources || []) results.push(await syncOne(db, s));
      return json({ results });
    }
    return json({ error: "action không hợp lệ" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
