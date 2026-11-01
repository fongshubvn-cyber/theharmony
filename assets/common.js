/* Tiện ích giao diện dùng chung */
const CFG = window.HARMONY_CONFIG || {};
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const vnd = n => (+n || 0).toLocaleString("vi-VN") + " đ";
const short = n => { n = +n; if (n >= 1e6) return (Math.round(n / 1e5) / 10).toLocaleString("vi-VN") + "tr"; return Math.round(n / 1e3) + "k"; };
const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const dmy = s => s ? s.slice(8, 10) + "/" + s.slice(5, 7) + "/" + s.slice(0, 4) : "";
const dm = s => s.slice(8, 10) + "/" + s.slice(5, 7);
const dow = s => DOW[new Date(s + "T00:00:00").getDay()];
const today = () => api.iso(new Date());

function toast(t) { let e = $("#toast"); if (!e) { e = document.createElement("div"); e.id = "toast"; e.className = "toast"; document.body.appendChild(e); }
  e.textContent = t; e.style.display = "block"; clearTimeout(e._t); e._t = setTimeout(() => (e.style.display = "none"), 2600); }

function header(tag, right = "") {
  const logo = CFG.LOGO_URL ? `<img src="${esc(CFG.LOGO_URL)}" alt="${esc(CFG.BRAND)}">`
    : `<span class="mark">H</span><span><span class="name">${esc(CFG.BRAND || "The Harmony")}</span><br><span class="tag">${esc(tag)}</span></span>`;
  return `<header class="top"><div class="wrap"><a class="logo" href="villa.html">${logo}</a>${CFG.LOGO_URL ? `<span class="tag" style="font-weight:600">${esc(tag)}</span>` : ""}<span class="sp"></span><span id="roleSw"></span>${right}</div></header>`;
}
function demoNote(extra = "") {
  return api.demo ? `<div class="demo"><b>Chế độ demo</b> – dữ liệu mẫu (4 căn), chỉ lưu trên trình duyệt này. ${extra} Khi nối Supabase, dữ liệu sẽ là thật và dùng chung.</div>` : "";
}

/* modal */
function modal(html) {
  let ov = $("#ov");
  if (!ov) { ov = document.createElement("div"); ov.id = "ov"; ov.className = "ov"; ov.innerHTML = `<div class="modal"></div>`; document.body.appendChild(ov);
    ov.addEventListener("click", e => { if (e.target === ov) closeModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); }); }
  ov.firstChild.innerHTML = `<button class="x" aria-label="Đóng">×</button>` + html;
  $(".x", ov).onclick = closeModal; ov.classList.add("show"); ov.scrollTop = 0; return ov.firstChild;
}
function closeModal() { const ov = $("#ov"); if (ov) ov.classList.remove("show"); }

function photo(v, i = 0) { return (v.photos && v.photos[i]) || ""; }
function bgImg(url) { return url ? `style="background-image:url('${String(url).replace(/'/g, "%27")}')"` : ""; }

/** Chi tiết căn – extraTop: html (vd giá), cta: html nút */
function villaDetail(v, { extraTop = "", cta = "", extra = "" } = {}) {
  const ph = v.photos?.length ? v.photos : [""];
  const m = modal(`
    ${ph[0] ? `<img class="hero" id="hero" src="${esc(ph[0])}" alt="">` : `<div class="hero" style="display:grid;place-items:center;color:var(--muted)">Chưa có ảnh</div>`}
    ${ph.length > 1 ? `<div class="thumbs">${ph.map((p, i) => `<img src="${esc(p)}" data-i="${i}" class="${i ? "" : "on"}" alt="">`).join("")}</div>` : ""}
    <div class="bd">
      <div class="chips" style="margin-bottom:6px">${v.code ? `<span class="chip">${esc(v.code)}</span>` : ""}${v.area ? `<span class="chip warm">${esc(v.area)}</span>` : ""}</div>
      <h2 style="font-size:26px">${esc(v.name)}</h2>
      <div class="muted">${esc(v.address || "")}</div>
      ${extraTop}
      <div class="facts">
        <div class="fact"><b>${v.bedrooms || "–"}</b><small>Phòng ngủ</small></div>
        <div class="fact"><b>${v.toilets || "–"}</b><small>Toilet</small></div>
        <div class="fact"><b>${v.std_guests || "–"}</b><small>Khách tiêu chuẩn</small></div>
        <div class="fact"><b>${v.max_guests || "–"}</b><small>Khách tối đa</small></div>
      </div>
      ${v.description ? `<p style="margin:0">${esc(v.description)}</p>` : ""}
      ${v.amenities?.length ? `<h4>Tiện ích</h4><div class="chips">${v.amenities.map(a => `<span class="chip">${esc(a)}</span>`).join("")}</div>` : ""}
      ${v.rules?.length ? `<h4>Quy định căn</h4><ul>${v.rules.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
      ${extra}
      <div class="cta">${cta}</div>
    </div>`);
  $$(".thumbs img", m).forEach(t => (t.onclick = () => { $("#hero", m).src = ph[t.dataset.i]; $$(".thumbs img", m).forEach(x => x.classList.toggle("on", x === t)); }));
  return m;
}

function copyBox(title, text, intro) {
  const m = modal(`<div class="bd"><h2>${esc(title)}</h2><p class="muted">${intro}</p>
    <textarea id="msg" style="min-height:190px">${esc(text)}</textarea>
    <div class="cta"><button class="btn p" id="cp">Sao chép nội dung</button>
    <a class="btn s" href="https://zalo.me/${esc(CFG.ZALO)}" target="_blank" rel="noopener">Mở Zalo ${esc(CFG.HOTLINE)}</a></div></div>`);
  $("#cp", m).onclick = async () => { try { await navigator.clipboard.writeText($("#msg", m).value); toast("Đã sao chép – dán vào Zalo để gửi"); } catch { $("#msg", m).select(); toast("Bôi đen rồi sao chép thủ công"); } };
}

function monthOptions(n = 12, back = 1) {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - back);
  const out = []; for (let i = 0; i < n + back; i++) { out.push(api.iso(d).slice(0, 7)); d.setMonth(d.getMonth() + 1); } return out;
}
function monthDays(m) { const s = m + "-01"; const d = new Date(s + "T00:00:00"); d.setMonth(d.getMonth() + 1); return api.dateRange(s, api.iso(d)); }

function areasOf(villas) { return [...new Set(villas.map(v => v.area).filter(Boolean))].sort(); }
function filterVillas(villas, f) {
  const q = (f.q || "").trim().toLowerCase();
  return villas.filter(v => (!q || (v.name + " " + (v.code || "") + " " + (v.address || "")).toLowerCase().includes(q))
    && (!f.area || v.area === f.area) && (!f.br || v.bedrooms >= +f.br) && (!f.guests || v.max_guests >= +f.guests));
}
function filterBar(villas, f, extra = "") {
  const n = ["area", "br", "guests"].filter(k => f[k]).length;
  return `<div class="filters ${f._open ? "open" : ""}">
    <div class="f fsearch"><label>Tìm tên / mã căn</label><div class="fs-row"><input id="fq" type="search" value="${esc(f.q || "")}" placeholder="VD: Đống Đa, TH-012">
      <button type="button" class="btn s ftog" id="ftog">Bộ lọc${n ? ` (${n})` : ""}</button></div></div>
    <div class="fmore">
      <div class="f"><label>Khu vực</label><select id="farea"><option value="">Tất cả</option>${areasOf(villas).map(a => `<option ${a === f.area ? "selected" : ""}>${esc(a)}</option>`).join("")}</select></div>
      <div class="f"><label>Phòng ngủ từ</label><select id="fbr"><option value="">Bất kỳ</option>${[2, 3, 4, 5, 6, 8, 10].map(n => `<option value="${n}" ${+f.br === n ? "selected" : ""}>${n}+</option>`).join("")}</select></div>
      <div class="f"><label>Số khách</label><input id="fg" type="number" inputmode="numeric" min="1" value="${esc(f.guests || "")}" placeholder="VD: 15"></div>
    </div>
    ${extra ? `<div class="fextra">${extra}</div>` : ""}</div>`;
}
function bindFilters(f, onChange) {
  const tg = document.getElementById("ftog");
  if (tg) tg.onclick = () => { f._open = !f._open; tg.closest(".filters").classList.toggle("open", f._open); };
  const map = { fq: "q", farea: "area", fbr: "br", fg: "guests" };
  Object.entries(map).forEach(([id, k]) => { const el = $("#" + id); if (!el) return;
    el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => { f[k] = el.value; f.page = 1; clearTimeout(el._t); el._t = setTimeout(onChange, el.tagName === "INPUT" ? 250 : 0); }); });
}
function pager(total, per, page, onGo) {
  const n = Math.ceil(total / per); if (n <= 1) return "";
  setTimeout(() => $$("[data-pg]").forEach(b => (b.onclick = () => onGo(+b.dataset.pg))));
  return `<div class="pager">${Array.from({ length: n }, (_, i) => `<button class="tab ${i + 1 === page ? "on" : ""}" data-pg="${i + 1}">${i + 1}</button>`).join("")}</div>`;
}
/** focus giữ nguyên ô đang gõ khi render lại */
function keepFocus(fn) { const a = document.activeElement, id = a && a.id, pos = a && a.selectionStart; fn();
  if (id) { const e = document.getElementById(id); if (e) { e.focus(); try { e.setSelectionRange(pos, pos); } catch {} } } }

/** Header: khách thấy nút Đăng nhập; admin thấy thanh chuyển tới mọi trang + Đăng xuất */
/* ===== Nút Zalo nổi: bấm vào chọn 1 trong các số liên hệ (CFG.CONTACTS) ===== */
function contactList() {
  const list = (CFG.CONTACTS || []).filter(c => c && (c.zalo || c.phone));
  return list.length ? list : (CFG.ZALO ? [{ name: CFG.BRAND || "The Harmony", phone: CFG.HOTLINE, zalo: CFG.ZALO }] : []);
}
function zaloFab() {
  if (document.getElementById("zfab") || !contactList().length) return;
  const digits = s => String(s || "").replace(/[^\d+]/g, "");
  const wrap = document.createElement("div"); wrap.id = "zfab";
  wrap.innerHTML = `<div class="zpop" role="dialog" aria-label="Liên hệ Zalo"><div class="zh">Nhắn Zalo cho The Harmony</div>
    ${contactList().map((c, i) => `<div class="zc"><div class="zn"><b>${esc(c.name || "")}</b>${i === 0 && contactList().length > 1 ? ` <span class="zm">Số chính</span>` : ""}<div class="muted">${esc(c.phone || c.zalo)}${c.role && (i || contactList().length === 1) ? " · " + esc(c.role) : ""}</div></div>
      <a class="zbtn" data-zdirect href="https://zalo.me/${esc(digits(c.zalo || c.phone))}" target="_blank" rel="noopener">Zalo</a>
      <a class="zcall" href="tel:${esc(digits(c.phone || c.zalo))}" aria-label="Gọi ${esc(c.name || "")}">Gọi</a></div>`).join("")}</div>
    <button type="button" class="zbt" aria-label="Liên hệ Zalo"><span>Zalo</span></button>`;
  document.body.appendChild(wrap);
  const open = v => { wrap.classList.toggle("open", v ?? !wrap.classList.contains("open")); lift(); };
  wrap.querySelector(".zbt").onclick = e => { e.stopPropagation(); open(); };
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest('a[href^="https://zalo.me/"]');
    if (a && !a.hasAttribute("data-zdirect")) { e.preventDefault(); open(true); return; }
    if (!wrap.contains(e.target)) open(false);
  }, true);
  // nâng nút lên khi có thanh cố định ở đáy (nút đặt phòng trên điện thoại, thanh chọn ngày của đối tác)
  const lift = () => { let h = 0; document.querySelectorAll(".mcta, #bar").forEach(el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (cs.display !== "none" && cs.visibility !== "hidden" && r.height && r.top < innerHeight - 4 && r.bottom >= innerHeight - 4) h = Math.max(h, innerHeight - r.top); });
    wrap.style.bottom = (h + 16) + "px";
    // đang mở hộp thoại thì ẩn nút (tránh che nút Gửi), trừ khi đang chọn số Zalo
    const modalOpen = !!document.querySelector(".ov.show");
    wrap.style.display = modalOpen && !wrap.classList.contains("open") ? "none" : "";
    wrap.style.zIndex = modalOpen ? 58 : ""; };
  addEventListener("scroll", lift, { passive: true }); addEventListener("resize", lift); setInterval(lift, 600); lift();
}

async function mountSwitch(current) {
  if (current !== "admin") zaloFab();
  const el = document.getElementById("roleSw"); if (!el) return;
  let me = null; try { me = await api.me(); } catch (e) {}
  if (me?.role !== "admin") {
    if (["home", "guest"].includes(current)) el.innerHTML = (api.demo ? `<a class="pill ghost" href="doi-tac.html#dalattravel-demo" style="text-decoration:none;margin-right:6px">Xem thử vai đối tác</a>` : "")
      + `<a class="pill ghost" href="admin.html" style="text-decoration:none">Đăng nhập</a>`;
    return;
  }
  const R = [["guest", "Villa", "villa.html"], ["home", "Giới thiệu", "gioi-thieu.html"], ["partner", "Đối tác", "doi-tac.html"], ["admin", "Quản trị", "admin.html"]];
  el.innerHTML = `<span class="rsw"><span class="rsl">Admin</span>${R.map(([k, l, h]) => k === current ? `<b>${l}</b>` : `<a href="${h}">${l}</a>`).join("")}</span>`
    + `<span class="asp"><button class="pill" id="asPartner" type="button">Xem như đối tác ▾</button><div class="asm" id="asMenu" hidden></div></span>`
    + (current === "admin" ? "" : `<button class="pill ghost" id="rswOut" style="margin-left:8px">Đăng xuất</button>`);
  /* Admin: chọn 1 link đối tác để xem đúng màn hình đối tác đó thấy */
  const ab = document.getElementById("asPartner"), am = document.getElementById("asMenu");
  ab.onclick = async e => { e.stopPropagation();
    if (!am.hidden) { am.hidden = true; return; }
    am.hidden = false; am.innerHTML = `<div class="muted" style="padding:10px 12px">Đang tải…</div>`;
    let ls = []; try { ls = (await api.listLinks()).filter(l => l.active); } catch (err) {}
    const cur = api.token();
    am.innerHTML = `<div class="ah">Xem đúng màn hình mà đối tác thấy</div>`
      + (ls.length ? ls.map(l => `<a href="doi-tac.html#${encodeURIComponent(l.token)}" class="${l.token === cur ? "on" : ""}"><i class="cdot" style="background:${esc(l.color || "#2f6fed")}"></i>${esc(l.name)}</a>`).join("")
        : `<div class="muted" style="padding:8px 12px;font-size:13px">Chưa có link đối tác đang mở. Tạo ở <a href="admin.html#links">Quản trị → Link đối tác</a>.</div>`)
      + `<a href="doi-tac.html" class="pv ${current === "partner" && !cur ? "on" : ""}">Xem trước (chế độ quản trị, thấy tên người chốt)</a>`;
    am.querySelectorAll("a[href^='doi-tac.html']").forEach(a => (a.onclick = () => { if (current === "partner") setTimeout(() => location.reload(), 0); }));
  };
  document.addEventListener("click", e => { if (!e.target.closest(".asp")) am.hidden = true; });
  const o = document.getElementById("rswOut");
  if (o) o.onclick = async () => { await api.signOut(); location.href = "villa.html"; };
}

/* Trên điện thoại: bảng danh sách tự chuyển thành thẻ (gắn nhãn cột cho từng ô) */
(function () {
  const label = root => root.querySelectorAll("table.list").forEach(t => {
    const head = t.querySelector("tr"); if (!head || !head.querySelector("th")) return;
    const names = [...head.children].map(th => th.textContent.trim());
    t.querySelectorAll("tr").forEach(tr => { if (tr === head) return; [...tr.children].forEach((td, i) => { if (td.tagName === "TD" && !td.dataset.l) td.dataset.l = names[i] || ""; }); });
  });
  new MutationObserver(() => label(document)).observe(document.documentElement, { childList: true, subtree: true });
})();

/* ===== Màu người chốt ===== */
const BOOK_COLORS = [["#e5484d", "Đỏ"], ["#2f6fed", "Xanh dương"], ["#f5a524", "Vàng"], ["#30a46c", "Xanh lá"], ["#8e4ec6", "Tím"], ["#f76b15", "Cam"], ["#e93d82", "Hồng"], ["#12a594", "Xanh ngọc"], ["#6b7280", "Xám"]];
const colorName = c => (BOOK_COLORS.find(x => x[0] === c) || [, "Màu riêng"])[1];
/** Vòng tròn màu có dấu ✕ cho ngày đã book */
const xMark = (color, title = "Đã book", size = "") => `<span class="xm ${size}" style="background:${esc(color || "#e5484d")}" title="${esc(title)}">✕</span>`;
/** Hàng chọn màu: trả về HTML; gắn sự kiện bằng bindSwatches */
const swatches = (id, sel) => { const own = sel && !BOOK_COLORS.some(x => x[0] === sel);
  return `<div class="swr" id="${id}">${BOOK_COLORS.map(([c, n]) => `<button type="button" class="sw ${c === sel ? "on" : ""}" data-c="${c}" title="${n}" style="background:${c}" aria-label="${n}"></button>`).join("")}`
    + `<label class="sw wheel ${own ? "on" : ""}" title="Chọn màu khác (vòng màu)" aria-label="Chọn màu khác"><i style="${own ? "background:" + esc(sel) : ""}"></i><input type="color" value="${own ? esc(sel) : "#8e4ec6"}"></label></div>`; };
function bindSwatches(root, id, onPick) {
  const box = (root.querySelector ? root : document).querySelector("#" + id); if (!box) return;
  const mark = el => box.querySelectorAll(".sw").forEach(x => x.classList.toggle("on", x === el));
  box.querySelectorAll("button.sw").forEach(b => (b.onclick = () => { mark(b); onPick(b.dataset.c); }));
  const wh = box.querySelector(".wheel"), inp = wh && wh.querySelector("input");
  if (inp) inp.addEventListener("input", () => { const c = inp.value.toLowerCase(); mark(wh); wh.querySelector("i").style.background = c; onPick(c); });
}

/** Tháng mặc định khi mở lịch: nếu tháng này còn < 7 ngày thì mở tháng sau */
function defaultMonth() { const t = today(), d = new Date(t + "T00:00:00"), last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  if (last - d.getDate() + 1 >= 7) return t.slice(0, 7); const n = new Date(d.getFullYear(), d.getMonth() + 1, 1); return api.iso(n).slice(0, 7); }
