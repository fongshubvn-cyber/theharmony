/* =========================================================================
   The Harmony – danh sách villa dùng chung + tìm kiếm + mini menu
   Thêm villa mới: thêm 1 mục vào HARMONY_VILLAS (mọi trang tự cập nhật).
   ========================================================================= */
(function () {
    var VILLAS = [
        {
            id: "deli-an-son", name: "Deli Villa An Sơn",
            area: "An Sơn, gần Hồ Xuân Hương", bedrooms: 5, min: 10, max: 16,
            img: "img/menu-deli-an-son.jpg", card: "img/card-deli-an-son.jpg",
            features: {
                "wc-rieng": "Phòng nào cũng có WC riêng",
                "nguoi-lon-tuoi": "2 phòng ngủ ở tầng trệt",
                "tre-nho": "2 phòng tầng trệt, có bếp, BBQ",
                "bbq": "Khu BBQ có mái che",
                "dau-xe": "Đậu được xe 7 và 16 chỗ",
                "xe-16": "Đậu được xe 16 chỗ",
                "bep": "Bếp, bàn ăn dài cho cả đoàn",
                "piano": "Có đàn piano",
                "trung-tam": "7 phút tới chợ đêm, Hồ Xuân Hương",
                "tuyen-lam": "4–5 km tới Hồ Tuyền Lâm",
                "dinh-3": "Gần Dinh III"
            }
        },
        {
            id: "the-mins-house", name: "The Min's House",
            area: "Đường 3 Tháng 4, gần chợ Đà Lạt", bedrooms: 2, min: 4, max: 6,
            img: "img/menu-the-mins-house.jpg", card: "img/card-the-mins-house.jpg",
            features: {
                "san-vuon": "Sân vườn riêng",
                "bbq": "Sân BBQ ngoài trời",
                "karaoke": "Có karaoke",
                "may-chieu": "Máy chiếu phim",
                "dau-xe": "Ô tô đậu trước nhà",
                "giat-say": "Máy giặt, máy sấy",
                "bep": "Bếp, bàn ăn đầy đủ",
                "trung-tam": "1,5 km tới chợ Đà Lạt, 5 phút tới chợ đêm",
                "tre-nho": "Căn nhỏ, sân vườn cho bé chơi",
                "gia-dinh-nho": "2 phòng ngủ cho gia đình nhỏ"
            }
        },
        {
            id: "pham-hong-thai", name: "Villa Phạm Hồng Thái",
            area: "Gần Ga Đà Lạt, 500 m tới Hồ Xuân Hương", bedrooms: 5, min: 12, max: 16,
            img: "img/menu-villa-pham-hong-thai.jpg", card: "img/card-pham-hong-thai.jpg",
            features: {
                "thang-may": "Có thang máy",
                "nguoi-lon-tuoi": "Có thang máy, không phải leo cầu thang",
                "bida": "Bàn bida",
                "karaoke": "Dàn loa karaoke (phụ thu)",
                "xong-hoi": "Phòng xông hơi (phụ thu)",
                "bon-tam": "2 phòng có bồn tắm nằm",
                "wc-rieng": "Phòng nào cũng có WC riêng",
                "tv": "Smart TV mọi phòng",
                "dau-xe": "Gara ô tô riêng",
                "bep": "Bếp rộng, bàn ăn dài",
                "trung-tam": "500 m tới Hồ Xuân Hương",
                "gan-ga": "Gần, nhìn ra Ga Đà Lạt",
                "sang-trong": "Nội thất nhập khẩu Ý"
            }
        },
        {
            id: "nguyen-chi-thanh", name: "Home Nguyễn Chí Thanh",
            area: "Phố đi bộ, 200 m tới chợ Đà Lạt", bedrooms: 3, min: 8, max: 10,
            img: "img/menu-nguyen-chi-thanh.jpg", card: "img/card-nguyen-chi-thanh.jpg",
            features: {
                "bon-tam": "2 phòng đơn có bồn tắm, toilet riêng",
                "may-lanh": "Máy lạnh trong từng phòng",
                "bbq": "Sân BBQ và lò nướng trước nhà",
                "giat-say": "Máy giặt, máy lọc nước",
                "bep": "Bếp hiện đại, bàn ăn cho cả nhóm",
                "dau-xe": "Đậu 1 ô tô trước nhà, xe thứ 2 gửi bãi 70 m",
                "trung-tam": "200 m tới chợ Đà Lạt, ngay phố đi bộ",
                "sang-trong": "Nhà mới xây, nội thất hiện đại",
                "gia-dinh-nho": "3 phòng ngủ cho nhóm 8–10 người"
            }
        },
        {
            id: "to-hien-thanh", name: "Home Tô Hiến Thành",
            area: "Trung tâm, ~2 km tới chợ đêm", bedrooms: 2, min: 6, max: 8,
            img: "img/menu-to-hien-thanh.jpg", card: "img/card-to-hien-thanh.jpg",
            features: {
                "bbq": "Bếp nướng BBQ ngoài sân",
                "san-vuon": "Sân có mái che, bàn ăn ngoài trời",
                "view": "Sân nhìn ra thành phố",
                "bep": "Bếp đầy đủ dụng cụ, gia vị cơ bản",
                "giat-say": "Máy giặt miễn phí, khu phơi đồ",
                "dau-xe": "Ô tô, xe máy tới tận nơi, chỗ để xe rộng",
                "tv": "TV, tủ lạnh",
                "trung-tam": "Ngay trung tâm, ~2 km tới chợ đêm",
                "tre-nho": "Phòng nệm sàn cho bé nằm chung",
                "gia-dinh-nho": "2 phòng ngủ cho nhóm 6–8 người"
            }
        }
    ];

    // Từ khoá khách hay gõ (viết không dấu) → mã tiện ích
    var KEYWORDS = {
        "karaoke": ["karaoke", "hat ", "hat karaoke", "loa"],
        "bbq": ["bbq", "nuong", "lau", "tiec ngoai troi", "barbecue"],
        "bida": ["bida", "bi a", "bi-a", "billiard", "bia da"],
        "thang-may": ["thang may", "elevator"],
        "nguoi-lon-tuoi": ["nguoi gia", "nguoi lon tuoi", "ong ba", "bo me gia", "cao tuoi", "tang tret"],
        "tre-nho": ["tre nho", "tre em", "em be", "be nho", "con nho"],
        "xong-hoi": ["xong hoi", "sauna"],
        "bon-tam": ["bon tam", "tam bon", "bathtub"],
        "may-chieu": ["may chieu", "chieu phim", "xem phim", "projector"],
        "san-vuon": ["san vuon", "vuon", "san rong", "ngoai troi"],
        "dau-xe": ["dau xe", "o to", "oto", "xe hoi", "gara", "garage", "do xe", "dau oto"],
        "xe-16": ["xe 16", "16 cho", "xe khach", "xe lon", "xe 29"],
        "wc-rieng": ["wc rieng", "toilet rieng", "ve sinh rieng", "phong tam rieng", "wc"],
        "giat-say": ["may giat", "giat do", "say do", "may say"],
        "bep": ["bep", "nau an", "tu nau"],
        "may-lanh": ["may lanh", "dieu hoa", "may dieu hoa"],
        "view": ["view", "ngam pho", "nhin ra thanh pho", "ngam thanh pho", "canh dep"],
        "trung-tam": ["trung tam", "gan cho", "cho dem", "ho xuan huong", "di bo", "gan pho"],
        "gan-ga": ["ga da lat", "nha ga", "gan ga"],
        "tuyen-lam": ["tuyen lam"],
        "dinh-3": ["dinh 3", "dinh iii", "dinh ba"],
        "piano": ["piano", "dan"],
        "tv": ["smart tv", "tivi", " tv"],
        "sang-trong": ["sang trong", "cao cap", "luxury"],
        "gia-dinh-nho": ["gia dinh nho", "cap doi", "it nguoi"]
    };

    var LABELS = {
        "karaoke": "Karaoke", "bbq": "BBQ", "bida": "Bida", "thang-may": "Thang máy",
        "nguoi-lon-tuoi": "Người lớn tuổi", "tre-nho": "Trẻ nhỏ", "xong-hoi": "Xông hơi",
        "bon-tam": "Bồn tắm", "may-chieu": "Máy chiếu", "san-vuon": "Sân vườn", "dau-xe": "Đậu ô tô",
        "xe-16": "Xe 16 chỗ", "wc-rieng": "WC riêng", "giat-say": "Máy giặt", "bep": "Bếp",
        "trung-tam": "Gần trung tâm", "gan-ga": "Gần Ga Đà Lạt", "tuyen-lam": "Gần Tuyền Lâm",
        "dinh-3": "Gần Dinh III", "piano": "Piano", "tv": "Smart TV", "sang-trong": "Sang trọng",
        "gia-dinh-nho": "Gia đình nhỏ", "may-lanh": "Máy lạnh", "view": "View thành phố"
    };

    function plain(s) {
        return " " + String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
            .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, " ").trim() + " ";
    }

    // Đọc câu khách gõ: số người, số phòng, các tiện ích
    function parse(q) {
        var t = plain(q), guests = null, rooms = null;
        // "xe 16 cho" là loại xe, không phải số khách
        var forGuests = t.replace(/xe \d+( cho)?/g, " ").replace(/\d+ cho/g, " ").replace(/dinh \d+/g, " ").replace(/\d+ thang \d+/g, " ").replace(/\d+ (km|m|phut)\b/g, " ");
        var m = forGuests.match(/(\d+)\s*(phong|pn)\b/);
        if (m) { rooms = parseInt(m[1], 10); forGuests = forGuests.replace(m[0], " "); }
        m = forGuests.match(/(\d+)\s*(nguoi|khach|ng|pax|mem|ban)?\b/);
        if (m && +m[1] > 0 && +m[1] <= 60) guests = parseInt(m[1], 10);
        var feats = [];
        Object.keys(KEYWORDS).forEach(function (f) {
            if (KEYWORDS[f].some(function (k) { k = k.trim(); return t.indexOf(" " + k + " ") !== -1 || (k.length > 3 && t.indexOf(" " + k) !== -1); })) feats.push(f);
        });
        // "người lớn tuổi" đã bao phủ "thang máy"/"tầng trệt"; "xe 16" bao phủ "đậu xe"
        if (feats.indexOf("xe-16") !== -1) feats = feats.filter(function (f) { return f !== "dau-xe"; });
        return { text: t, guests: guests, rooms: rooms, feats: feats };
    }

    // Trả về danh sách căn phù hợp, mỗi căn kèm lý do
    function search(q) {
        var p = parse(q), hasQuery = plain(q).trim().length > 0;
        var results = VILLAS.map(function (v) {
            var why = [], ok = true, score = 0;
            if (p.guests) {
                if (p.guests > v.max) ok = false;
                else if (p.guests >= v.min) { why.push("Vừa " + p.guests + " khách (" + v.min + "–" + v.max + ")"); score += 3; }
                else { why.push("Rộng rãi cho " + p.guests + " khách"); score += 1; }
            }
            if (p.rooms) {
                if (v.bedrooms < p.rooms) ok = false; else why.push(v.bedrooms + " phòng ngủ");
            }
            p.feats.forEach(function (f) {
                if (v.features[f]) { why.push(v.features[f]); score += 2; } else ok = false;
            });
            // Không nhận ra số người hay tiện ích nào: tìm theo tên, khu vực
            if (hasQuery && !p.guests && !p.rooms && !p.feats.length) {
                var hay = plain(v.name + " " + v.area + " " + Object.keys(v.features).map(function (k) { return v.features[k]; }).join(" "));
                var words = p.text.trim().split(" ").filter(function (w) { return w.length > 1; });
                ok = words.length > 0 && words.every(function (w) { return hay.indexOf(w) !== -1; });
            }
            return { villa: v, ok: ok, why: why, score: score };
        }).filter(function (r) { return r.ok; });
        results.sort(function (a, b) { return b.score - a.score || a.villa.max - b.villa.max; });
        return { query: p, results: results };
    }

    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

    function describe(p) {
        var parts = [];
        if (p.guests) parts.push(p.guests + " khách");
        if (p.rooms) parts.push(p.rooms + "+ phòng ngủ");
        p.feats.forEach(function (f) { parts.push(LABELS[f] || f); });
        return parts.join(" · ");
    }

    function zaloLink() { return "https://zalo.me/0854604339"; }

    // ---------- Mini menu "Villa nguyên căn" (có ô tìm nhanh) ----------
    function initMenu(opts) {
        var base = opts.base || "", current = opts.current || "";
        var vbtn = document.getElementById("vmenu-btn"), vpanel = document.getElementById("vpanel"), vlist = document.getElementById("vlist");
        var input = document.getElementById("vsearch");
        if (!vbtn || !vpanel || !vlist) return;

        function render(q) {
            var r = q ? search(q) : { results: VILLAS.map(function (v) { return { villa: v, why: [] }; }), query: null };
            if (!r.results.length) {
                vlist.innerHTML = '<li class="vempty">Chưa có căn khớp "' + esc(q) + '".<br><a href="' + zaloLink() + '" target="_blank" rel="noopener">Nhắn Zalo, chúng tôi tìm giúp</a></li>';
                return;
            }
            vlist.innerHTML = r.results.map(function (x) {
                var v = x.villa, here = v.id === current;
                return '<li><a class="vitem" href="' + esc(base + "villa/" + v.id + "/") + '"' + (here ? ' aria-current="page"' : '') + '>' +
                    '<img src="' + esc(base + v.img) + '" alt="">' +
                    '<span><b>' + esc(v.name) + '</b><small>' + esc(v.area) + '</small><small>' + v.bedrooms + ' phòng ngủ · ' + v.min + '–' + v.max + ' khách</small>' +
                    (x.why.length ? '<small class="vwhy">' + esc(x.why.join(" · ")) + '</small>' : '') +
                    (here ? '<span class="here">Đang xem</span>' : '') + '</span></a></li>';
            }).join("");
        }
        render("");
        document.getElementById("vmenu-count").textContent = VILLAS.length;
        document.getElementById("vpanel-sub").textContent = VILLAS.length + " căn";
        if (input) input.addEventListener("input", function () { render(input.value.trim()); });

        function setMenu(open) {
            vpanel.classList.toggle("open", open);
            vbtn.setAttribute("aria-expanded", open ? "true" : "false");
            if (open && input && window.matchMedia("(min-width: 641px)").matches) setTimeout(function () { input.focus(); }, 30);
        }
        vbtn.addEventListener("click", function (e) { e.stopPropagation(); setMenu(!vpanel.classList.contains("open")); });
        vpanel.addEventListener("click", function (e) { if (e.target.closest(".vitem")) setMenu(false); e.stopPropagation(); });
        document.addEventListener("click", function () { setMenu(false); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape" && vpanel.classList.contains("open")) { setMenu(false); vbtn.focus(); } });
    }

    // ---------- Thanh tìm kiếm ở trang chủ ----------
    function initHub() {
        var form = document.getElementById("hub-search"), input = document.getElementById("hub-q");
        var grid = document.getElementById("cards"), status = document.getElementById("search-status");
        if (!form || !input || !grid) return;
        var cards = {};
        var order = [];
        Array.prototype.forEach.call(grid.querySelectorAll(".card[data-villa]"), function (c) { cards[c.getAttribute("data-villa")] = c; order.push(c.getAttribute("data-villa")); });

        // Nút "Xem thêm căn": hiện trước PER căn, bấm để mở thêm
        var PER = 3, showing = PER, more = document.getElementById("cards-more");
        function page() {
            order.forEach(function (id, i) { cards[id].hidden = i >= showing; });
            if (!more) return;
            var left = order.length - showing;
            more.hidden = left <= 0;
            if (left > 0) more.textContent = left <= PER ? "Xem thêm " + left + " căn" : "Xem thêm căn (còn " + left + " căn)";
        }
        if (more) more.addEventListener("click", function () {
            var first = order[showing];
            showing += PER; page();
            if (first && cards[first]) cards[first].focus();
        });
        page();

        function apply(q, scroll) {
            Object.keys(cards).forEach(function (id) {
                var c = cards[id]; c.hidden = false;
                var w = c.querySelector(".card-why"); if (w) w.remove();
            });
            var empty = document.getElementById("cards-empty"); if (empty) empty.hidden = true;
            if (!q) { status.textContent = ""; order.forEach(function (id) { grid.appendChild(cards[id]); }); page(); return; }
            if (more) more.hidden = true;

            var r = search(q), shown = {};
            r.results.forEach(function (x) {
                var c = cards[x.villa.id]; if (!c) return;
                shown[x.villa.id] = true; grid.appendChild(c);
                if (x.why.length) {
                    var w = document.createElement("div"); w.className = "card-why";
                    w.innerHTML = '<b>Phù hợp vì</b>' + x.why.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("");
                    c.querySelector(".card-body").insertBefore(w, c.querySelector(".card-cta"));
                }
            });
            Object.keys(cards).forEach(function (id) { if (!shown[id]) cards[id].hidden = true; });
            var d = describe(r.query);
            if (r.results.length) {
                status.innerHTML = "Có <b>" + r.results.length + " căn</b> phù hợp" + (d ? " với: " + esc(d) : "") + '. <button type="button" id="search-clear">Xem tất cả</button>';
            } else {
                status.innerHTML = 'Chưa có căn nào' + (d ? " có đủ: <b>" + esc(d) + "</b>" : ' khớp "' + esc(q) + '"') + '. <button type="button" id="search-clear">Xem tất cả</button>';
                if (empty) empty.hidden = false;
            }
            var clr = document.getElementById("search-clear");
            if (clr) clr.addEventListener("click", function () { input.value = ""; apply("", false); input.focus(); });
            if (scroll) document.getElementById("villa").scrollIntoView({ behavior: "smooth", block: "start" });
        }

        form.addEventListener("submit", function (e) { e.preventDefault(); apply(input.value.trim(), true); });
        input.addEventListener("input", function () { apply(input.value.trim(), false); });
        Array.prototype.forEach.call(document.querySelectorAll("[data-q]"), function (b) {
            b.addEventListener("click", function () {
                var add = b.getAttribute("data-q"), cur = input.value.trim();
                input.value = b.hasAttribute("data-replace") || !cur ? add : (cur + ", " + add);
                apply(input.value, true);
            });
        });
    }

    window.Harmony = { villas: VILLAS, search: search, initMenu: initMenu, initHub: initHub };
})();
