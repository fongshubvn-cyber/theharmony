/* Lớp dữ liệu: Supabase (thật) hoặc DEMO (dữ liệu mẫu lưu trên trình duyệt). */
(function () {
  const C = window.HARMONY_CONFIG || {};
  const DEMO = !C.SUPABASE_URL || !C.SUPABASE_ANON_KEY;
  const api = { demo: DEMO };
  window.api = api;

  /* ---------------- helpers ---------------- */
  const iso = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); };
  api.iso = iso;
  api.addDays = (s, n) => { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return iso(d); };
  api.isWeekend = s => [5, 6, 0].includes(new Date(s + "T00:00:00").getDay()); // T6, T7, CN
  api.dateRange = (from, toExcl) => { const out = []; for (let d = from; d < toExcl; d = api.addDays(d, 1)) out.push(d); return out; };
  /** Mã link đối tác nằm sau dấu # (VD: doi-tac.html#a1b2c3...) */
  api.token = () => { const h = decodeURIComponent((location.hash || "").slice(1)).trim(); return /^[A-Za-z0-9-]{8,64}$/.test(h) ? h : ""; };
  api.linkUrl = token => new URL("doi-tac.html#" + token, location.href).href;

  /** Giá & trạng thái thực tế của 1 căn trong 1 ngày */
  api.effective = (villaId, date, rates, cal) => {
    const o = cal[villaId + "|" + date];
    if (o && o.status !== "open") return { s: o.status, color: o.color || "", by: o.booked_by || "" };
    const r = rates[villaId];
    if (o && o.price) return { s: "open", p: +o.price, special: !!(r && (r.weekday || r.weekend)) };
    if (!r || (r.open_until && date > r.open_until) || !(r.weekday || r.weekend)) return { s: "na" };
    return { s: "open", p: +(api.isWeekend(date) ? (r.weekend || r.weekday) : (r.weekday || r.weekend)) };
  };
  /** Lịch trống công khai: free | busy | unknown (không có giá) */
  api.availStatus = (av, vid, d) => {
    if (av.busy.has(vid + "|" + d)) return "busy";
    if (av.ok.has(vid + "|" + d)) return "free";
    const r = av.open[vid];
    if (!r || !r.rate || (r.until && d > r.until)) return "unknown";
    return "free";
  };
  /** Trạng thái cả kỳ lưu trú: free (trống hết) | busy (có đêm kín) | unknown */
  api.stayStatus = (av, vid, nights) => {
    const s = nights.map(d => api.availStatus(av, vid, d));
    return s.includes("busy") ? "busy" : s.includes("unknown") ? "unknown" : "free";
  };
  const toAvail = (busy, ok, open) => ({ busy: new Set(busy.map(x => x.v + "|" + x.d)), color: Object.fromEntries(busy.map(x => [x.v + "|" + x.d, x.c || ""])), ok: new Set(ok.map(x => x.v + "|" + x.d)), open: open || {} });
  api.availColor = (av, vid, d) => (av.color || {})[vid + "|" + d] || "";
  api.DEFAULT_COLOR = "#e5484d";
  const byVilla = rows => Object.fromEntries(rows.map(r => [r.villa_id, r]));
  const byCell = rows => Object.fromEntries(rows.map(r => [r.villa_id + "|" + r.date, r]));

  /* ======================================================================
     SUPABASE
     ====================================================================== */
  if (!DEMO) {
    let sb, me;
    const ready = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload = () => { sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY); res(); };
      s.onerror = () => rej(new Error("Không tải được thư viện Supabase"));
      document.head.appendChild(s);
    });
    const ok = ({ data, error }) => { if (error) throw new Error(/LINK_INVALID/.test(error.message) ? "LINK_INVALID" : error.message); return data; };
    const all = async q => { let out = [], from = 0;
      for (;;) { const rows = ok(await q().range(from, from + 999)); out = out.concat(rows); if (rows.length < 1000) return out; from += 1000; } };

    api.init = () => ready;
    /** Admin đang đăng nhập (hoặc null) */
    api.me = async () => {
      if (me !== undefined) return me;
      await ready;
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return (me = null);
      const { data } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      return (me = { id: session.user.id, email: session.user.email, ...(data || {}), role: data?.role || "pending" });
    };
    api.signIn = async (email, password) => { await ready; ok(await sb.auth.signInWithPassword({ email, password })); me = undefined; return api.me(); };
    api.signUp = async (email, password, meta) => { await ready; const d = ok(await sb.auth.signUp({ email, password, options: { data: meta } })); me = undefined; return d.session ? api.me() : null; };
    api.signOut = async () => { await ready; await sb.auth.signOut(); me = null; };
    api.changePassword = async pw => { await ready; ok(await sb.auth.updateUser({ password: pw })); };

    /* căn (công khai) */
    api.listVillas = async () => { await ready; return all(() => sb.from("villas").select("*").order("sort").order("name")); };
    api.saveVilla = async v => { await ready; const row = { ...v }; delete row.created_at; if (!row.id) delete row.id;
      return ok(await sb.from("villas").upsert(row).select().single()); };
    api.deleteVilla = async id => { await ready; ok(await sb.from("villas").delete().eq("id", id)); };
    api.uploadPhoto = async (villaId, file) => { await ready;
      const path = `${villaId || "new"}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      ok(await sb.storage.from("villa-photos").upload(path, file, { upsert: false }));
      return sb.storage.from("villa-photos").getPublicUrl(path).data.publicUrl; };

    api.availability = async (from, to) => { await ready;
      const d = ok(await sb.rpc("public_availability", { p_from: from, p_to: to }));
      return toAvail(d.busy || [], d.ok || [], d.open || {}); };
    /* giá & lịch – admin */
    api.getRates = async () => { await ready; return byVilla(await all(() => sb.from("villa_rates").select("*"))); };
    api.saveRate = async r => { await ready; ok(await sb.from("villa_rates").upsert(r)); };
    api.getCalendar = async (from, to) => { await ready; return byCell(await all(() => sb.from("calendar").select("*").gte("date", from).lt("date", to))); };
    api.setCalendar = async (ids, dates, p) => { await ready;
      const rows = []; ids.forEach(v => dates.forEach(d => rows.push({ villa_id: v, date: d, price: p.price ?? null, status: p.status || "open", color: p.status === "booked" ? (p.color || api.DEFAULT_COLOR) : null, booked_by: p.status === "booked" ? (p.booked_by || null) : null })));
      for (let i = 0; i < rows.length; i += 500) ok(await sb.from("calendar").upsert(rows.slice(i, i + 500))); };
    api.clearCalendar = async (ids, dates) => { await ready; ok(await sb.from("calendar").delete().in("villa_id", ids).in("date", dates)); };

    /* trang đối tác: theo mã link, hoặc admin xem thử */
    api.partnerData = async (from, to) => {
      await ready; const t = api.token();
      if (t) { const d = ok(await sb.rpc("partner_get", { p_token: t, p_from: from, p_to: to }));
        return { link: d.link, rates: byVilla(d.rates || []), cal: byCell(d.calendar || []) }; }
      const m = await api.me(); if (m?.role !== "admin") throw new Error("LINK_INVALID");
      const [rates, cal] = await Promise.all([api.getRates(), api.getCalendar(from, to)]);
      return { link: { name: "Quản trị" }, rates, cal, preview: true };
    };
    api.createRequest = async r => { await ready; const t = api.token();
      if (t) return ok(await sb.rpc("partner_request", { p_token: t, p_villa: r.villa_id, p_in: r.check_in, p_out: r.check_out,
        p_guests: r.guests, p_total: r.total, p_contact: r.contact, p_note: r.note, p_color: r.color || null }));
      return ok(await sb.from("booking_requests").insert(r).select().single()); };
    api.myRequests = async () => { await ready; const t = api.token();
      if (t) return ok(await sb.rpc("partner_requests", { p_token: t }));
      return (await api.listRequests()).filter(r => !r.link_id); };

    /* yêu cầu & link – admin */
    api.listRequests = async () => { await ready; return all(() => sb.from("booking_requests").select("*, villas(name), share_links(name,phone)").order("created_at", { ascending: false })); };
    api.updateRequest = async (id, status) => { await ready; ok(await sb.from("booking_requests").update({ status }).eq("id", id)); };
    api.listLinks = async () => { await ready; return all(() => sb.from("share_links").select("*").order("created_at", { ascending: false })); };
    api.saveLink = async l => { await ready; const row = { ...l }; if (!row.id) delete row.id; return ok(await sb.from("share_links").upsert(row).select().single()); };
    api.deleteLink = async id => { await ready; ok(await sb.from("share_links").delete().eq("id", id)); };
    /* nguồn Google Sheet */
    const fn = async body => { await ready; const { data, error } = await sb.functions.invoke("sync-sheets", { body });
      if (error) { let m = error.message; try { m = (await error.context.json()).error || m; } catch (e) {} throw new Error(m); } if (data?.error) throw new Error(data.error); return data; };
    api.listSources = async () => { await ready; return all(() => sb.from("sheet_sources").select("*").order("created_at")); };
    api.saveSource = async s => { await ready; const row = { ...s }; if (!row.id) delete row.id; return ok(await sb.from("sheet_sources").upsert(row).select().single()); };
    api.deleteSource = async id => { await ready; ok(await sb.from("sheet_sources").delete().eq("id", id)); };
    api.previewSource = (sheet_url, config) => fn({ action: "preview", sheet_url, config });
    api.syncSource = async id => (await fn({ action: "sync", source_id: id })).results?.[0];
    return;
  }

  /* ======================================================================
     DEMO – dữ liệu mẫu, lưu trong trình duyệt (localStorage)
     ====================================================================== */
  const KEY = "harmony-demo-v5", SESSION = "harmony-demo-admin";
  const DEMO_ADMIN = { email: "admin@theharmony.vn", password: "Harmony@2026" };
  api.demoAdmin = DEMO_ADMIN;
  let S;
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
               set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };
  const save = () => ls.set(KEY, JSON.stringify(S));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const tok = () => Array.from({ length: 24 }, () => "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 32)]).join("");

  function seed() {
    const AREAS = ["Trung tâm Đà Lạt", "Hồ Tuyền Lâm", "Đồi Robin", "Trại Mát", "Hồ Xuân Hương", "Lạc Dương", "Cam Ly", "Phường 8"];
    const PAL = ["dong-da", "nam-ho", "trieu-viet-vuong", "hoang-hoa-tham"];
    const pics = i => [`demo/ext${i % 6 + 1}.jpg`, `demo/liv${(i + 1) % 5 + 1}.jpg`, `demo/bed${(i + 2) % 5 + 1}.jpg`, `demo/gar${(i + 3) % 5 + 1}.jpg`];
    const AM = ["BBQ sân vườn", "Phòng karaoke", "Bếp đầy đủ", "Chỗ đậu ô tô", "Wifi tốc độ cao", "View đồi thông", "Lò sưởi", "Bể sục", "Sân lửa trại"];
    const RULES = ["Nhận phòng 14:00 – Trả phòng 12:00", "Không hút thuốc trong nhà", "Giữ yên lặng sau 22:00", "Phụ thu khách vượt tiêu chuẩn", "Đặt cọc 50% để giữ căn"];
    const real = [
      ["MV-DD", "My Villa Đống Đa", "Trung tâm Đà Lạt", "Đường Đống Đa", 5, 5, 12, 16, 5500000, 7500000],
      ["MV-NH", "My Villa Nam Hồ", "Phường 8", "Đường Nam Hồ", 4, 4, 10, 12, 5000000, 6000000],
      ["MV-TVV", "My Villa Triệu Việt Vương", "Trung tâm Đà Lạt", "Đường Triệu Việt Vương", 5, 5, 12, 15, 5000000, 7000000],
      ["MV-HHT", "My Villa Hoàng Hoa Thám", "Đồi Robin", "Đường Hoàng Hoa Thám", 8, 8, 20, 25, 9000000, 11000000],
    ];
    const villas = [], rates = {}, calendar = {};
    real.forEach((r, i) => {
      const id = uid();
      villas.push({ id, code: r[0], name: r[1], area: r[2], address: r[3] + ", Đà Lạt", bedrooms: r[4], toilets: r[5], std_guests: r[6], max_guests: r[7],
        amenities: AM.slice(i, i + 4), rules: RULES, description: "Villa nguyên căn, phù hợp nhóm bạn và gia đình.", photos: [`demo/ext${i + 1}.jpg`, `demo/liv${i + 1}.jpg`, `demo/bed${i + 1}.jpg`, `demo/gar${i + 1}.jpg`], active: true, sort: i });
      rates[id] = { villa_id: id, weekday: r[8], weekend: r[9], open_until: "2027-02-28" };
    });
    const SP = { "2027-01-01": [9.5, 8, 9, 13], "2027-01-02": [9.5, 8, 9, 13], "2027-01-03": [9.5, 8, 9, 13],
      "2027-02-06": [0, 12, 14, 22], "2027-02-07": [0, 12, 14, 22], "2027-02-08": [0, 10, 10, 18], "2027-02-09": [0, 10, 10, 18],
      "2027-02-10": [11, 10, 10, 18], "2027-02-11": [11, 10, 10, 18], "2027-02-12": [15, 12, 14, 22], "2027-02-13": [15, 12, 14, 22],
      "2027-02-14": [15, 12, 14, 22], "2027-02-15": [11, 10, 10, 18] };
    Object.entries(SP).forEach(([d, arr]) => arr.forEach((p, i) => {
      calendar[villas[i].id + "|" + d] = p ? { villa_id: villas[i].id, date: d, price: p * 1e6, status: "open" } : { villa_id: villas[i].id, date: d, status: "booked", color: "#e5484d", booked_by: "Phong" };
    }));
    let rnd = 7; const R = n => (rnd = (rnd * 9301 + 49297) % 233280, Math.floor(rnd / 233280 * n));
    const NAMES = ["Pine Hill", "Mây Chiều", "Sương Sớm", "Hoa Dã Quỳ", "Đồi Thông", "Lavender", "Moc Garden", "Gió Núi", "Hồ Mây", "Cỏ Hồng", "Tùng Lâm", "Mimosa"];
    const today = iso(new Date());
    for (let i = 0; i < 0; i++) {
      const id = uid(), br = 3 + R(8), pal = PAL[i % 4];
      villas.push({ id, code: "TH-" + String(i + 1).padStart(3, "0"), name: `Villa ${NAMES[i % NAMES.length]} ${Math.floor(i / NAMES.length) + 1}`,
        area: AREAS[R(AREAS.length)], address: "Đà Lạt", bedrooms: br, toilets: Math.max(2, br - R(2)), std_guests: br * 2, max_guests: br * 2 + 2 + R(4),
        amenities: [AM[R(9)], AM[R(9)], "Bếp đầy đủ"].filter((v, k, a) => a.indexOf(v) === k), rules: RULES, description: "Căn mẫu để thử giao diện.",
        photos: pics(i + 4), active: true, sort: 10 + i });
      const wd = (2 + br * 0.8 + R(3)) * 1e6;
      rates[id] = { villa_id: id, weekday: Math.round(wd / 5e5) * 5e5, weekend: Math.round(wd * 1.3 / 5e5) * 5e5, open_until: "2027-02-28" };
      for (let k = 0; k < 6; k++) { const d = api.addDays(today, R(120));
        const who = [["#e5484d", "Phong"], ["#2f6fed", "Đà Lạt Travel"], ["#f5a524", "Sale Bình"], ["#30a46c", "Thiên"]][R(4)];
        calendar[id + "|" + d] = { villa_id: id, date: d, status: "booked", color: who[0], booked_by: who[1] };
        calendar[id + "|" + api.addDays(d, 1)] = { villa_id: id, date: api.addDays(d, 1), status: "booked", color: who[0], booked_by: who[1] }; }
    }
    const links = [
      { id: uid(), token: "dalattravel-demo", name: "Đà Lạt Travel", phone: "0901 111 222", note: "Đối tác lâu năm", color: "#2f6fed", active: true, created_at: new Date().toISOString(), last_used_at: null },
      { id: uid(), token: "salebinh-" + tok().slice(0, 12), name: "Sale Bình", phone: "0902 333 444", note: "", color: "#f5a524", active: false, created_at: new Date().toISOString(), last_used_at: null },
    ];
    seedBookings(villas, calendar);
    return { villas, rates, calendar, requests: [], links };
  }
  function seedBookings(villas, calendar) {
    let rnd = 11; const R = n => (rnd = (rnd * 9301 + 49297) % 233280, Math.floor(rnd / 233280 * n));
    const WHO = [["#e5484d", "Phong"], ["#2f6fed", "Đà Lạt Travel"], ["#f5a524", "Sale Bình"], ["#30a46c", "Thiên"]];
    const today = iso(new Date());
    villas.forEach((v, i) => { for (let k = 0; k < 5; k++) {
      const d = api.addDays(today, 2 + R(75)), who = WHO[(i + k) % 4], n = 1 + R(2);
      for (let j = 0; j < n; j++) { const dd = api.addDays(d, j), key = v.id + "|" + dd;
        if (!calendar[key]) calendar[key] = { villa_id: v.id, date: dd, status: "booked", color: who[0], booked_by: who[1] }; } } });
  }
  try { S = JSON.parse(ls.get(KEY) || "null"); } catch (e) {}
  if (!S) { S = seed(); save(); }
  // Rút gọn còn 4 căn mẫu (giữ nguyên căn anh tự tạo / đồng bộ từ Sheet)
  if (!S.trim4c) {
    const drop = new Set(S.villas.filter(v => /^TH-\d{3}$/.test(v.code || "") && !v.source_id).map(v => v.id));
    S.villas = S.villas.filter(v => !drop.has(v.id));
    drop.forEach(id => delete S.rates[id]);
    Object.keys(S.calendar).forEach(k => { if (drop.has(k.split("|")[0])) delete S.calendar[k]; });
    S.requests = (S.requests || []).filter(r => !drop.has(r.villa_id));
    const t0 = iso(new Date()), t1 = api.addDays(t0, 60);
    const mv = S.villas.filter(v => /^MV-/.test(v.code || "") && !Object.values(S.calendar).some(r => r.villa_id === v.id && r.status === "booked" && r.date >= t0 && r.date <= t1));
    if (mv.length) seedBookings(mv, S.calendar);
    const dl = S.links.find(l => l.name === "Đà Lạt Travel") || S.links[0];
    if (dl && !S.links.some(l => l.token === "dalattravel-demo")) { dl.token = "dalattravel-demo"; dl.active = true; }
    S.links.forEach(l => { if (l.token === "dalattravel-demo") l.color_locked = false; });
    S.trim4c = true; save();
  }
  (S.villas || []).forEach(v => { if (/^Lịch đồng bộ từ Google Sheet/.test(v.description || "")) v.description = ""; });

  const clone = x => JSON.parse(JSON.stringify(x));
  const wait = v => new Promise(r => setTimeout(() => r(clone(v)), 50));
  const isAdmin = () => ls.get(SESSION) === "1";
  const linkOf = t => S.links.find(l => l.token === t && l.active);

  api.init = async () => {};
  api.resetDemo = () => { S = seed(); save(); };
  api.me = async () => isAdmin() ? { id: "admin", email: DEMO_ADMIN.email, full_name: "Phong", role: "admin" } : null;
  api.signIn = async (email, password) => {
    if (email.trim().toLowerCase() !== DEMO_ADMIN.email || password !== DEMO_ADMIN.password) throw new Error("Sai email hoặc mật khẩu");
    ls.set(SESSION, "1"); return api.me();
  };
  api.signUp = async () => { throw new Error("Bản demo chỉ có 1 tài khoản quản trị"); };
  api.signOut = async () => ls.set(SESSION, null);
  api.changePassword = async () => { throw new Error("Bản demo không đổi được mật khẩu"); };

  api.listVillas = () => wait([...S.villas].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)));
  api.saveVilla = async v => {
    if (!v.id) { v = { ...v, id: uid() }; S.villas.push(v); } else { const i = S.villas.findIndex(x => x.id === v.id); S.villas[i] = { ...S.villas[i], ...v }; }
    save(); return wait(v);
  };
  api.deleteVilla = async id => { S.villas = S.villas.filter(v => v.id !== id); delete S.rates[id]; save(); };
  api.uploadPhoto = (vid, file) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); });
  api.getRates = () => wait(S.rates);
  api.saveRate = async r => { S.rates[r.villa_id] = r; save(); };
  api.getCalendar = async (from, to) => wait(Object.fromEntries(Object.entries(S.calendar).filter(([, r]) => r.date >= from && r.date < to)));
  api.setCalendar = async (ids, dates, p) => { ids.forEach(v => dates.forEach(d => (S.calendar[v + "|" + d] = { villa_id: v, date: d, price: p.price ?? null, status: p.status || "open", color: p.status === "booked" ? (p.color || api.DEFAULT_COLOR) : null, booked_by: p.status === "booked" ? (p.booked_by || null) : null }))); save(); };
  api.clearCalendar = async (ids, dates) => { ids.forEach(v => dates.forEach(d => delete S.calendar[v + "|" + d])); save(); };

  api.availability = async (from, to) => {
    const rows = Object.values(S.calendar).filter(r => r.date >= from && r.date < to);
    const open = Object.fromEntries(Object.values(S.rates).map(r => [r.villa_id, { until: r.open_until, rate: !!(r.weekday || r.weekend) }]));
    return toAvail(rows.filter(r => r.status !== "open").map(r => ({ v: r.villa_id, d: r.date, c: r.color || "" })), rows.filter(r => r.status === "open" && r.price).map(r => ({ v: r.villa_id, d: r.date })), open);
  };
  api.partnerData = async (from, to) => {
    const t = api.token(), l = t && linkOf(t);
    if (!l) { if (isAdmin()) return { link: { name: "Quản trị" }, rates: clone(S.rates), cal: await api.getCalendar(from, to), preview: true };
      throw new Error("LINK_INVALID"); }
    l.last_used_at = new Date().toISOString(); save();
    const cal = await api.getCalendar(from, to); Object.values(cal).forEach(r => delete r.booked_by);
    return { link: { name: l.name, phone: l.phone, color: l.color || "#2f6fed", color_locked: !!l.color_locked }, rates: clone(S.rates), cal };
  };
  api.createRequest = async r => { const l = linkOf(api.token());
    if (l) { if (l.color_locked) r = { ...r, color: l.color }; else if (/^#[0-9a-f]{6}$/i.test(r.color || "")) { l.color = r.color.toLowerCase(); l.color_locked = true; } }
    const x = { ...r, color: r.color || (l && l.color) || api.DEFAULT_COLOR, id: uid(), link_id: l ? l.id : null, status: "new", created_at: new Date().toISOString() }; S.requests.unshift(x); save(); return x.id; };
  const withJoin = r => ({ ...r, villas: { name: (S.villas.find(v => v.id === r.villa_id) || {}).name }, share_links: S.links.find(l => l.id === r.link_id) || null });
  api.myRequests = async () => { const l = linkOf(api.token()); return wait(S.requests.filter(r => l ? r.link_id === l.id : !r.link_id).map(withJoin)); };
  api.listRequests = async () => wait(S.requests.map(withJoin));
  api.updateRequest = async (id, status) => { const r = S.requests.find(x => x.id === id); if (r) r.status = status; save(); };
  api.listLinks = () => wait(S.links);
  api.saveLink = async l => {
    if (!l.id) { l = { token: tok(), active: true, color: "#2f6fed", created_at: new Date().toISOString(), last_used_at: null, ...l, id: uid() }; S.links.unshift(l); }
    else { const i = S.links.findIndex(x => x.id === l.id); if (S.links[i].color_locked) delete l.color; S.links[i] = { ...S.links[i], ...l }; l = S.links[i]; }
    save(); return wait(l);
  };
  api.deleteLink = async id => { S.links = S.links.filter(l => l.id !== id); save(); };

  /* nguồn Google Sheet – bản demo dùng ảnh chụp dữ liệu THẬT của 2 Sheet mẫu */
  const snap = () => window.HARMONY_SHEET_SNAPSHOT || {};
  /** Dữ liệu dán từ nút "Đọc Sheet cho The Harmony" (giả lập máy chủ Supabase) */
  api.importSheetData = text => {
    const t = String(text || "").trim(); const i = t.indexOf("HARMONY-SHEET:");
    if (i < 0) throw new Error("Chưa đúng dữ liệu. Hãy bấm nút “Đọc Sheet cho The Harmony” trên trang Google Sheet rồi dán lại.");
    let r; try { r = JSON.parse(t.slice(i + 14)); } catch (e) { throw new Error("Dữ liệu dán bị thiếu – hãy sao chép lại toàn bộ."); }
    if (!r.id || !r.labels || !r.data) throw new Error("Dữ liệu không hợp lệ.");
    S.sheetData = S.sheetData || {}; S.sheetData[r.id] = r; save(); return clone(r);
  };
  const snapOf = url => { const id = window.SheetSync ? SheetSync.sheetId(url) : ""; const s = (S.sheetData || {})[id] || snap()[id];
    if (!s) { const e = new Error("NEED_BOOKMARKLET"); e.need = true; throw e; } return clone(s); };
  S.sources = S.sources || [];
  api.listSources = () => wait(S.sources);
  api.saveSource = async s => {
    if (!s.id) { s = { active: true, created_at: new Date().toISOString(), last_status: null, ...s, id: uid() }; S.sources.push(s); }
    else { const i = S.sources.findIndex(x => x.id === s.id); S.sources[i] = { ...S.sources[i], ...s }; s = S.sources[i]; }
    save(); return wait(s);
  };
  api.deleteSource = async id => { S.sources = S.sources.filter(s => s.id !== id); save(); };
  api.previewSource = async url => { await new Promise(r => setTimeout(r, 500)); return snapOf(url); };
  api.syncSource = async id => {
    const src = S.sources.find(s => s.id === id); const cfg = src.config || {};
    let read; try { read = snapOf(src.sheet_url); } catch (e) { const msg = e.need ? "Giả lập: chưa có dữ liệu Sheet – bấm “Sửa ghép cột” → “Đọc lại bằng nút trên Chrome”." : e.message; src.last_status = "error"; src.last_message = msg; save(); return { status: "error", message: msg }; }
    const found = new Set(read.labels.map(l => l.key)), map = cfg.mapping || {};
    const okMap = Object.fromEntries(Object.entries(map).filter(([k, v]) => v && found.has(k) && S.villas.some(x => x.id === v)));
    Object.entries(okMap).forEach(([k, vid]) => { const ds = Object.keys(read.data[k] || {}).sort(); if (!ds.length) return;
      Object.keys(S.calendar).forEach(key => { const [v, d] = key.split("|"); if (v === vid && d >= ds[0] && d <= ds[ds.length - 1]) delete S.calendar[key]; });
      S.rates[vid] = { villa_id: vid, weekday: null, weekend: null, open_until: ds[ds.length - 1] }; });
    const rows = SheetSync.toCalendarRows(read, okMap, cfg.markup, { color: cfg.booked_color, by: src.name });
    rows.forEach(r => (S.calendar[r.villa_id + "|" + r.date] = r));
    const newCols = read.labels.filter(l => !(l.key in map)).map(l => l.label), empty = read.tabs.filter(t => t.error).map(t => t.tab);
    const tm = SheetSync.missingByTab(read, okMap);
    src.last_sync_at = new Date().toISOString(); src.last_status = tm.length ? "warning" : "ok";
    src.last_message = [`${rows.length} ngày đã cập nhật cho ${Object.keys(okMap).length} căn`, ...tm.map(t => `Tab “${t.tab}” thiếu cột: ${t.miss.join(", ")}`), newCols.length ? `Cột mới chưa ghép: ${newCols.join(", ")}` : "", empty.length ? `Tab chưa có dữ liệu: ${empty.join(", ")}` : "", "(giả lập: dữ liệu đọc lúc " + new Date(read.snapshot_at).toLocaleString("vi-VN") + " – bấm lại nút Đọc Sheet & Dán để cập nhật)"].filter(Boolean).join(" · ");
    save(); return { status: "ok", message: src.last_message, rows: rows.length };
  };
})();
