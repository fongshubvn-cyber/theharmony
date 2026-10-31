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
  const INFO_RE = /\d\s*(?:pn|wc|vs)\b|phòng\s*(?:ngủ|đơn|đôi)|\b(?:đơn|đôi)\b.*\b(?:wc|vs|toilet)|tiêu chuẩn|sức chứa|max\s*\d|tối đa|phụ thu|đậu|📍|địa chỉ|cơ cấu|kết cấu/i;

  /* ---------- Đọc thông tin căn từ đoạn mô tả của chủ nhà ---------- */
  const NUMW = { "một": 1, "mot": 1, "hai": 2, "ba": 3, "bốn": 4, "bon": 4, "tư": 4, "năm": 5, "nam": 5, "sáu": 6, "sau": 6, "bảy": 7, "bay": 7, "tám": 8, "tam": 8, "chín": 9, "chin": 9, "mười": 10, "muoi": 10 };
  const numOf = s => /^\d+$/.test(s) ? +s : (NUMW[s] || null);
  const NUM = "(\\d{1,2}|một|hai|ba|bốn|tư|năm|sáu|bảy|tám|chín|mười)";
  /** text → { bedrooms, toilets, std_guests, max_guests, surcharge, parking, address, rules:[] } (chỉ có trường đọc được) */
  SS.extractFacts = raw => {
    const text = String(raw || "").normalize("NFKC"), l = text.toLowerCase().replace(/\s+/g, " ");
    const f = {}; let m;
    // phòng ngủ: "Tổng 3 phòng ngủ" > "4PN" / "3 phòng ngủ" > đếm "2 đơn 1 đôi"
    if ((m = l.match(new RegExp("tổng\\s*(?:cộng\\s*)?" + NUM + "\\s*(?:pn|phòng ngủ|phòng)\\b")))) f.bedrooms = numOf(m[1]);
    else if ((m = l.match(new RegExp(NUM + "\\s*(?:pn|phòng ngủ)(?!\\s*(?:đơn|đôi))\\b")))) f.bedrooms = numOf(m[1]);
    else {
      let n = 0, hit = false;
      for (const x of l.matchAll(new RegExp(NUM + "\\s*(?:phòng\\s*(?:ngủ\\s*)?)?(?:đơn|đôi)\\b", "g"))) { const v = numOf(x[1]); if (v && v < 20) { n += v; hit = true; } }
      if (hit) f.bedrooms = n;
    }
    // WC: "Tổng … 2 WC" > lần ghi đầu tiên
    if ((m = l.match(new RegExp("tổng[^.]{0,30}?" + NUM + "\\s*(?:wc|vs|toilet|nhà vệ sinh)\\b")))) f.toilets = numOf(m[1]);
    else if ((m = l.match(new RegExp(NUM + "\\s*(?:wc|vs|toilet|nhà vệ sinh|phòng tắm)\\b")))) f.toilets = numOf(m[1]);
    // tiêu chuẩn / tối đa
    if ((m = l.match(/tiêu chuẩn\s*:?\s*(\d{1,2})(?:\s*(?:-|–|đến)\s*(\d{1,2}))?\s*(?:pax|khách|kh|người|ng)?(?:\s*(?:-|–)\s*(\d{1,2})\s*(?:pax|khách|kh|người))?/))) {
      f.std_guests = +m[1]; if (m[2] || m[3]) f.max_guests = +(m[3] || m[2]); }
    if ((m = l.match(/(?:max|tối đa|sức chứa)[^\d]{0,14}(\d{1,2})\s*(?:-\s*(\d{1,2})\s*)?(?:pax|khách|kh|người|nl|ng)/))) f.max_guests = Math.max(f.max_guests || 0, +(m[2] || m[1]));
    if (f.max_guests && f.std_guests && f.max_guests < f.std_guests) delete f.max_guests;
    // phụ thu mỗi người
    if ((m = l.match(/phụ thu[^\d]{0,20}(\d{2,3}(?:[.,]\d{3})?)\s*(k|đ|vnd|000)?\s*\/\s*(?:1\s*)?(?:người|khách|kh|pax|ng)/))) {
      let v = +m[1].replace(/[.,]/g, ""); if (v < 1000) v *= 1000; if (v >= 20000 && v <= 2000000) f.surcharge = v; }
    // đậu xe
    const sent = text.split(/[\n.;🌼🔥•⁃]+/).map(s => s.trim()).filter(Boolean);
    const CAR = /(ô ?tô|oto|xe hơi|xe \d+\s*(?:chỗ|c)\b|\d+\s*-\s*\d+\s*(?:chỗ|c)\b|đậu xe|đỗ xe)/i;
    const park = sent.find(s => CAR.test(s) && /đậu|đỗ|bãi/i.test(s));
    if (park) { const part = park.split(/,(?![^(]*\))/).map(s => s.trim()).filter(s => CAR.test(s) || /^(và|hoặc|hay)\b|bãi/i.test(s));
      f.parking = (part.join(", ") || park).replace(/^[-–+*\s]+/, "").replace(/^(có\s+)/i, "Có ").slice(0, 90); f.parking = f.parking[0].toUpperCase() + f.parking.slice(1); }
    // địa chỉ
    if ((m = text.match(/📍\s*([^\n"]{6,100})/)) || (m = text.match(/(?:địa chỉ|đ\/c)\s*:?\s*([^\n"]{6,100})/i))) f.address = m[1].replace(/\s+/g, " ").trim().replace(/[,.\s]+$/, "");
    // quy định: câu có "không …" về ồn / karaoke / hút thuốc / thú cưng / giờ
    const rules = sent.filter(s => /(không|ko|cấm)\s*(nhận|hát|gây ồn|hút|mang|cho|sử dụng|tổ chức|được)|karaoke|loa kéo|giờ yên tĩnh|sau\s*\d{1,2}h/i.test(s) && s.length <= 140)
      .map(s => s.replace(/^[-–+*"\s]+|["\s]+$/g, "").replace(/^(lưu ý|note|ghi chú)\s*:?\s*/i, "")).map(s => s[0].toUpperCase() + s.slice(1));
    if (rules.length) f.rules = [...new Set(rules)].slice(0, 4);
    return f;
  };

  /** Tab thông tin (VD "Thông Tin Căn"): mỗi dòng 1 căn – cột "Tên" + các cột mô tả → [{name, text}] */
  SS.parseInfoTab = grid => {
    const out = [];
    const hr = grid.findIndex(row => (row || []).some(c => c && /^(tên|tên căn|tên villa|tên home|căn)\s*:?$/i.test(c.t.trim())));
    if (hr < 0) return out;
    const head = grid[hr].map(c => (c && c.t || "").trim());
    const nc = head.findIndex(h => /^(tên|tên căn|tên villa|tên home|căn)\s*:?$/i.test(h));
    for (let r = hr + 1; r < grid.length; r++) {
      const row = grid[r] || []; const name = row[nc] && !row[nc].span ? row[nc].t.replace(/\s+/g, " ").trim() : "";
      if (!name) continue;
      const text = row.map((c, i) => i !== nc && c && !c.span && c.t.trim() ? (head[i] && !/hình|ảnh|định vị|link|map/i.test(head[i]) ? head[i] + ": " : "") + c.t.trim() : "")
        .filter(x => x && !/^https?:/.test(x.split(": ").pop())).join("\n");
      if (text) out.push({ name, text: text.slice(0, 2000) });
    }
    return out;
  };
  const slug = s => norm(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "");

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
    const usefulCol = (blk, c) => { const vals = blk.rows.map(({ r }) => grid[r] && grid[r][c]).filter(Boolean);
      if (vals.filter(x => x.span).length >= blk.rows.length * 0.7) return false;
      return vals.filter(x => SS.parsePrice(x.t) || isBookedBg(x.bg) || words.some(w => norm(x.t).includes(w))).length >= blk.rows.length * 0.5; };
    const dataColsIn = blk => { const nb = dateCols.filter(d => d.col > blk.col).map(d => d.col).sort((a, b) => a - b)[0] ?? W; let n = 0; for (let c = blk.col + 1; c < nb; c++) if (usefulCol(blk, c)) n++; return n; };
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
      // đoạn mô tả căn (số phòng, WC, tiêu chuẩn…): ô phía trên cột này trước, rồi phần tiêu đề của cả khối
      const info = [];
      const addInfo = tx => { tx = String(tx || "").replace(/[ \t]+/g, " ").trim(); if (tx.length >= 12 && INFO_RE.test(tx) && !info.includes(tx)) info.push(tx.slice(0, 1200)); };
      const rEnd = blk.rows[blk.rows.length - 1].r, below = [];
      for (let r = rEnd + 1; r <= rEnd + 25 && r < grid.length; r++) below.push(r);
      const zone = [...Array(r0).keys(), ...below];
      zone.forEach(r => { const cell = grid[r] && grid[r][c]; if (cell) addInfo(cell.t); });
      if (columns.filter(x => x.dateCol === blk.col).length === 0 && dataColsIn(blk) === 1)
        zone.forEach(r => { for (let cc = blk.col; cc < nextBlk; cc++) { const cell = grid[r] && grid[r][cc]; if (cell && !cell.span) addInfo(cell.t); } });
      columns.push({ key, label, col: c, dateCol: blk.col, info });
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
      labels[c.key] = labels[c.key] || { key: c.key, label: c.label, months: [], info: [] };
      labels[c.key].months.push(t.month);
      (c.info || []).forEach(x => { if (!labels[c.key].info.includes(x) && labels[c.key].info.length < 6) labels[c.key].info.push(x); });
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
    const results = [], infoRows = [];
    for (const t of tabs.filter(t => !picked.includes(t) && /thông tin|thong tin|info|giới thiệu|cơ cấu|danh sách căn/i.test(t.name)).slice(0, 2)) {
      try { infoRows.push(...SS.parseInfoTab(SS.parseGrid(await fetchText(`${base}/sheet?headers=false&gid=${t.gid}`)))); } catch (e) { /* bỏ qua */ }
    }
    for (const t of picked) {
      const html = await fetchText(`${base}/sheet?headers=false&gid=${t.gid}`);
      const r = SS.analyze(SS.parseGrid(html), t.month || cur, src);
      results.push({ tab: t.name, gid: t.gid, ...r });
    }
    const today = now.toISOString().slice(0, 10);
    const merged = SS.merge(results, today);
    SS.attachInfo(merged.labels, infoRows);
    return { id, tabs: results.map(r => ({ tab: r.tab, month: r.month, columns: (r.columns || []).length, keys: (r.columns || []).map(c => c.key), error: r.error || ((r.columns || []).length ? "" : "Tab chưa có dữ liệu (chủ nhà chưa cập nhật)") })), ...merged };
  };
  /** Gắn dòng của tab thông tin vào cột cùng tên, rồi tính facts cho mỗi căn */
  SS.attachInfo = (labels, infoRows = []) => {
    labels.forEach(l => {
      const ls = slug(l.label), first = slug(l.label.split("›")[0]);
      const row = infoRows.find(x => { const s = slug(x.name); return s && (ls.includes(s) || s.includes(first) || first.includes(s)); });
      l.info = l.info || [];
      if (row && !l.info.includes(row.text)) l.info.unshift(row.text);
      // đoạn ghi được nhiều thông tin nhất lên trước (chủ nhà hay sửa mô tả ở tab tháng mới)
      const score = tx => Object.keys(SS.extractFacts(tx)).length;
      l.info = l.info.map((tx, i) => ({ tx, i, s: score(tx) })).sort((a, b) => b.s - a.s || b.i - a.i).map(x => x.tx);
      const facts = {};
      l.info.forEach(tx => { const f = SS.extractFacts(tx); Object.entries(f).forEach(([k, v]) => { if (facts[k] == null) facts[k] = v; }); });
      if (!facts.std_guests && l.stats && l.stats.pax) facts.std_guests = l.stats.pax;
      l.facts = facts;
    });
    return labels;
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
