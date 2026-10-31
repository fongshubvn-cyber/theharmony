/* =====================================================================
   THE HARMONY – Bộ đọc lịch từ Google Sheet của chủ villa
   Dùng chung cho: Edge Function (Deno) và trình duyệt.
   Đọc trang "htmlview" công khai của Google Sheet → có cả CHỮ và MÀU NỀN ô.
   ===================================================================== */
(function (root) {
  const SS = {};

  /* ---------- tiện ích ---------- */
  const decode = s => s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, "&").trim();
  const norm = s => String(s || "").toLowerCase().normalize("NFC").replace(/\s+/g, " ").trim();
  SS.norm = norm;
  const validDate = d => { const x = new Date(d + "T00:00:00Z"); return !isNaN(x) && x.toISOString().slice(0, 10) === d; };

  /** Lấy ID sheet từ link */
  SS.sheetId = url => (String(url).match(/\/d\/([a-zA-Z0-9_-]{20,})/) || [])[1] || (/^[a-zA-Z0-9_-]{20,}$/.test(url) ? url : "");

  /** Danh sách tab {name,gid} từ trang htmlview gốc */
  SS.parseTabs = html => [...html.matchAll(/items\.push\(\{name: "((?:[^"\\]|\\.)*)", pageUrl: "[^"]*?gid=(\d+)/g)]
    .map(m => ({ name: m[1].replace(/\\\//g, "/").replace(/\\x([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\(.)/g, "$1").trim(), gid: m[2] }));

  /** Màu → {h,s,l}; đỏ = đánh dấu đã có khách (mặc định) */
  const hsl = hex => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return null;
    const n = parseInt(m[1], 16), r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    let h = 0, s = 0;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; }
    return { h, s, l };
  };
  SS.isRed = hex => { const c = hsl(hex); return !!c && c.s > 0.45 && c.l < 0.72 && c.l > 0.12 && (c.h >= 345 || c.h <= 12); };

  /** Dựng lưới ô (có colspan/rowspan, màu nền) từ trang htmlview của 1 tab */
  SS.parseGrid = html => {
    const bg = {};
    html.replace(/\.(s\d+)\s*\{([^}]*)\}/g, (_, k, body) => { const c = body.match(/background-color:\s*([^;]+)/); if (c) bg[k] = c[1].trim().toLowerCase(); });
    const tb = html.slice(html.indexOf("<tbody"), html.lastIndexOf("</tbody>"));
    const rows = tb.split(/<tr[^>]*>/).slice(1);
    const grid = [], taken = {};
    rows.forEach((tr, r) => {
      grid[r] = grid[r] || [];
      let c = 0;
      for (const m of tr.matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/g)) {
        while (taken[r + ":" + c]) c++;
        const a = m[1], cls = (a.match(/class="([^"]*)"/) || [])[1] || "";
        const sk = (cls.match(/\bs\d+\b/) || [])[0];
        const cs = +((a.match(/colspan="(\d+)"/) || [])[1] || 1), rs = +((a.match(/rowspan="(\d+)"/) || [])[1] || 1);
        const cell = { t: decode(m[2]), bg: (sk && bg[sk]) || "", cs, rs };
        for (let i = 0; i < rs; i++) for (let j = 0; j < cs; j++) {
          (grid[r + i] = grid[r + i] || [])[c + j] = i || j ? { ...cell, span: true } : cell; taken[(r + i) + ":" + (c + j)] = 1;
        }
        c += cs;
      }
    });
    return grid;
  };

  /** Tháng từ tên tab: "Tháng 10", "11/2026", "Tháng 01/2027", "5/2026" */
  SS.tabMonth = (name, now = new Date()) => {
    const s = norm(name).replace(/\\/g, "");
    let m = s.match(/(?:^|\D)(\d{1,2})\s*[\/\-.]\s*(\d{4})(?:\D|$)/), mo, y;
    if (m) { mo = +m[1]; y = +m[2]; }
    else { m = s.match(/(?:tháng|thang|t)\s*(\d{1,2})(?:\D|$)/) || s.match(/^(\d{1,2})$/); if (!m) return null; mo = +m[1];
      const cy = now.getFullYear(), cm = now.getMonth() + 1; y = cy;
      if (mo < cm - 2) y = cy + 1; else if (mo > cm + 9) y = cy - 1; }
    return mo >= 1 && mo <= 12 ? y + "-" + String(mo).padStart(2, "0") : null;
  };

  /** Giá kiểu Việt: "1tr5 (8k)", "750k/ 4 pax", "1.300/ 4 pax", "9.500.000 đ", "2tr" → {price, pax} */
  SS.parsePrice = raw => {
    let s = norm(raw).replace(/,/g, ".");
    if (!s) return null;
    let pax = null;
    const px = s.match(/\((\d+)\s*k\)/) || s.match(/\/\s*(\d+)\s*(?:pax|khách|kh|người|ng)/);
    if (px) pax = +px[1];
    s = s.replace(/\(\s*\d+\s*k\s*\)/g, " ").replace(/\/\s*\d+\s*(pax|khách|kh|người|ng)\b.*/, " ");
    let m, price = null;
    if ((m = s.match(/(\d+)\s*(?:tr|triệu|m)\s*(\d{0,3})/))) price = (+m[1] + (m[2] ? +("0." + m[2]) : 0)) * 1e6;
    else if ((m = s.match(/(\d{1,3}(?:\.\d{3})+)/))) { price = +m[1].replace(/\./g, ""); if (price < 100000) price *= 1000; }
    else if ((m = s.match(/(\d+(?:\.\d+)?)\s*k\b/))) price = +m[1] * 1000;
    else if ((m = s.match(/^(\d{3,8})\b/))) { price = +m[1]; if (price < 100000) price *= 1000; }
    if (!price || price < 100000 || price > 500e6) return null;
    return { price: Math.round(price), pax };
  };

  const DEFAULT_BOOKED_WORDS = ["đã book", "da book", "booked", "đã có khách", "có khách", "kín", "full", "hết phòng", "đã cọc", "đã đặt", "sold"];

  /** Ngày trong 1 ô: "15", "01/10", "1-10", "01/10/2026" → "YYYY-MM-DD" (theo tháng của tab) */
  const cellDate = (t, month) => {
    let m;
    if ((m = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/))) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    if (!month) return null;
    const [ty, tm] = month.split("-").map(Number);
    if ((m = t.match(/^(\d{1,2})[\/\-.](\d{1,2})$/))) { const mo = +m[2]; if (mo < 1 || mo > 12) return null;
      const y = mo < tm - 6 ? ty + 1 : mo > tm + 6 ? ty - 1 : ty; return `${y}-${String(mo).padStart(2, "0")}-${m[1].padStart(2, "0")}`; }
    if (/^\d{1,2}$/.test(t) && +t >= 1 && +t <= 31) return `${month}-${t.padStart(2, "0")}`;
    return null;
  };
  const NOTE_RE = /sale|lưu ý|zalo|giá|pax|khách|công khai|hình ảnh|liên hệ|sức chứa|note|ghi chú|thông tin|phụ thu|nâng max|\d{6,}|\d{3,4}[ .-]\d{3}[ .-]\d{3}/i;

  /** Phân tích 1 tab → { month, columns:[{key,label,col}], cells:{key:{date:{s,p,pax,raw,bg}}} }
      Hỗ trợ: 1 cột ngày cho nhiều căn, hoặc NHIỀU khối căn cạnh nhau, mỗi khối có cột ngày riêng. */
  SS.analyze = (grid, month, opt = {}) => {
    const words = (opt.bookedWords || DEFAULT_BOOKED_WORDS).map(norm);
    const colors = (opt.bookedColors || []).map(c => c.toLowerCase());
    const isBookedBg = bg => bg && (colors.length ? colors.includes(bg) : SS.isRed(bg));
    const W = Math.max(...grid.map(r => (r || []).length), 0);
    // 1) tìm TẤT CẢ cột ngày (chuỗi ngày tăng dần ≥ 7 dòng)
    const dateCols = [];
    for (let c = 0; c < W; c++) {
      const seq = [];
      grid.forEach((row, r) => { const cell = row && row[c]; if (!cell || cell.span) return;
        const d = cellDate(cell.t.trim(), month); if (d && validDate(d) && (!seq.length || d > seq[seq.length - 1].d)) seq.push({ r, d }); });
      if (seq.length >= 7) dateCols.push({ col: c, rows: seq });
    }
    // bỏ cột ngày "phụ" nằm sát cột ngày khác có cùng dòng (VD cột Thứ bị nhận nhầm)
    if (!dateCols.length) return { month, error: "Không tìm thấy cột ngày", columns: [], cells: {} };
    const blockOf = c => { let b = null; dateCols.forEach(dc => { if (dc.col < c && (!b || dc.col > b.col)) b = dc; }); return b; };
    // 2) cột dữ liệu: thuộc khối của cột ngày gần nhất bên trái
    const columns = [], cells = {}, used = {};
    for (let c = 0; c < W; c++) {
      if (dateCols.some(d => d.col === c)) continue;
      const blk = blockOf(c); if (!blk) continue;
      const vals = blk.rows.map(({ r }) => grid[r] && grid[r][c]).filter(Boolean);
      if (vals.filter(x => x.span).length >= blk.rows.length * 0.7) continue;            // ô gộp ngang từ cột bên trái
      const useful = vals.filter(x => SS.parsePrice(x.t) || isBookedBg(x.bg) || words.some(w => norm(x.t).includes(w))).length;
      if (useful < blk.rows.length * 0.5) continue;
      const r0 = blk.rows[0].r;
      // tên căn: ô bên phải ô "Tên"/"Tên căn" trong phần tiêu đề của khối
      const nextBlk = dateCols.filter(d => d.col > blk.col).map(d => d.col).sort((a, b) => a - b)[0] ?? W;
      let name = "";
      for (let r = 0; r < r0 && !name; r++) for (let cc = blk.col; cc < nextBlk && !name; cc++) {
        const cell = grid[r] && grid[r][cc];
        if (cell && !cell.span && /^(tên|tên căn|tên villa|tên home|tên nhà|căn|villa|homestay)\s*:?$/i.test(cell.t.trim())) {
          for (let k = cc + 1; k < nextBlk; k++) { const v = grid[r][k]; if (v && v.t.trim()) { name = v.t.replace(/\s+/g, " ").trim(); break; } }
        }
      }
      // nhãn phụ ngay trên cột (VD "Căn bên trái"), bỏ các dòng ghi chú
      const parts = [];
      for (let r = 0; r < r0; r++) { const cell = grid[r] && grid[r][c]; if (!cell) continue; const tx = cell.t.replace(/\s+/g, " ").trim();
        if (tx && tx.length <= 40 && tx !== name && !/^(ngày|thứ|date|day|tên)$/i.test(tx) && !parts.includes(tx) && !NOTE_RE.test(tx)) parts.push(tx); }
      let label = [name, ...parts].filter(Boolean).join(" › ") || `Cột ${String.fromCharCode(65 + c)}`;
      if (used[norm(label)]) label += ` (cột ${String.fromCharCode(65 + c)})`;
      used[norm(label)] = 1;
      const key = norm(label);
      columns.push({ key, label, col: c, dateCol: blk.col });
      cells[key] = {};
      blk.rows.forEach(({ r, d }) => {
        const cell = grid[r] && grid[r][c]; const tx = cell ? cell.t : "", bg = cell ? cell.bg : "";
        const p = SS.parsePrice(tx); let st;
        if (isBookedBg(bg) || words.some(w => norm(tx).includes(w))) st = "booked";
        else if (p) st = "open";
        else if (tx.trim()) st = "blocked";
        else st = "na";
        cells[key][d] = { s: st, p: p ? p.price : null, pax: p ? p.pax : null, raw: tx.slice(0, 40), bg };
      });
    }
    return { month, dateCols: dateCols.map(d => d.col), columns, cells };
  };

  /** Áp cộng giá cho đối tác */
  SS.markup = (price, mk) => {
    if (!price || !mk || !mk.value) return price;
    const v = mk.type === "percent" ? price * (1 + mk.value / 100) : price + +mk.value;
    return Math.round(v / 10000) * 10000;
  };

  /** Gộp nhiều tab → { labels:[{key,label,months,stats}], data:{key:{date:cell}} } (chỉ từ tháng hiện tại) */
  SS.merge = (tabResults, fromDate) => {
    const labels = {}, data = {};
    tabResults.forEach(t => (t.columns || []).forEach(c => {
      labels[c.key] = labels[c.key] || { key: c.key, label: c.label, months: [] };
      labels[c.key].months.push(t.month);
      data[c.key] = data[c.key] || {};
      Object.entries(t.cells[c.key] || {}).forEach(([d, v]) => { if (!fromDate || d >= fromDate) data[c.key][d] = v; });
    }));
    const colors = {};
    Object.values(data).forEach(m => Object.values(m).forEach(c => { if (c.bg && c.bg !== "#ffffff") colors[c.bg] = (colors[c.bg] || 0) + 1; }));
    Object.values(labels).forEach(l => {
      const v = Object.values(data[l.key] || {});
      const ps = v.map(x => x.p).filter(Boolean);
      const pax = v.map(x => x.pax).filter(Boolean);
      l.stats = { days: v.length, booked: v.filter(x => x.s === "booked").length, open: v.filter(x => x.s === "open").length,
        blocked: v.filter(x => x.s === "blocked").length, min: ps.length ? Math.min(...ps) : null, max: ps.length ? Math.max(...ps) : null, pax: pax.length ? Math.max(...pax) : null };
    });
    return { labels: Object.values(labels), data, colors: Object.entries(colors).sort((a, b) => b[1] - a[1]).map(([hex, n]) => ({ hex, n, red: SS.isRed(hex) })) };
  };

  /** Đọc cả 1 nguồn: fetchText(url) do môi trường cung cấp */
  SS.readSource = async (src, fetchText, now = new Date()) => {
    const id = SS.sheetId(src.sheet_url || src.sheet_id);
    if (!id) throw new Error("Link Google Sheet không hợp lệ");
    const base = `https://docs.google.com/spreadsheets/d/${id}/htmlview`;
    const rootHtml = await fetchText(base);
    if (/ServiceLogin|accounts\.google\.com\/v3\/signin/.test(rootHtml.slice(0, 5000))) throw new Error("Sheet chưa mở chế độ “Bất kỳ ai có đường liên kết đều xem được”");
    let tabs = SS.parseTabs(rootHtml);
    if (!tabs.length) throw new Error("Không đọc được danh sách tab");
    const cur = now.toISOString().slice(0, 7);
    const single = tabs.length === 1 || src.layout === "single";
    const picked = tabs.map(t => ({ ...t, month: SS.tabMonth(t.name, now) }))
      .filter(t => single || (t.month && t.month >= cur && (!src.months_ahead || t.month <= addMonths(cur, src.months_ahead))));
    const results = [];
    for (const t of picked) {
      const html = await fetchText(`${base}/sheet?headers=false&gid=${t.gid}`);
      const r = SS.analyze(SS.parseGrid(html), t.month || cur, src);
      results.push({ tab: t.name, gid: t.gid, ...r });
    }
    const today = now.toISOString().slice(0, 10);
    return { id, tabs: results.map(r => ({ tab: r.tab, month: r.month, columns: (r.columns || []).length, keys: (r.columns || []).map(c => c.key), error: r.error || ((r.columns || []).length ? "" : "Tab chưa có dữ liệu (chủ nhà chưa cập nhật)") })), ...SS.merge(results, today) };
  };
  const addMonths = (ym, n) => { const [y, m] = ym.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.toISOString().slice(0, 7); };

  /** Tab nào (đã có dữ liệu) thiếu cột đã ghép → cảnh báo (VD chủ nhà đổi tên cột ở tab tháng mới) */
  SS.missingByTab = (read, mapping) => {
    const want = Object.entries(mapping || {}).filter(([, v]) => v).map(([k]) => k), out = [];
    (read.tabs || []).forEach(t => { if (!t.columns) return; const miss = want.filter(k => !(t.keys || []).includes(k)); if (miss.length) out.push({ tab: t.tab, miss }); });
    return out;
  };

  /** Biến dữ liệu đã đọc → các dòng calendar cho từng căn đã ghép */
  SS.toCalendarRows = (read, mapping, markup, who = {}) => {
    const rows = [];
    Object.entries(mapping || {}).forEach(([key, villaId]) => {
      if (!villaId) return;
      Object.entries(read.data[key] || {}).forEach(([date, c]) => {
        if (c.s === "na") return;
        rows.push({ villa_id: villaId, date, status: c.s === "open" ? "open" : c.s, price: c.s === "open" ? SS.markup(c.p, markup) : null,
          color: c.s === "booked" ? (who.color || "#e5484d") : null, booked_by: c.s === "booked" ? (who.by || null) : null });
      });
    });
    return rows;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = SS;
  root.SheetSync = SS;
})(typeof globalThis !== "undefined" ? globalThis : this);
