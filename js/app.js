// App Logic for The Harmony - Booking Villa Đà Lạt (Customer Facing)

document.addEventListener('DOMContentLoaded', () => {
    // Header styling on scroll
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Detect active page and execute corresponding functions
    const path = window.location.pathname;
    if (path.includes('detail.html')) {
        initDetailPage();
    } else {
        // Default to Home page (index.html or root)
        initHomePage();
    }
});

// ==========================================
// HOME PAGE FUNCTIONS
// ==========================================

let allVillas = [];
let currentCategoryFilter = 'all';
let loadedDestinationsList = [];
let currentDestinationsLimit = 9;
let currentSlideIndex = 0;
let slideInterval;

function initHomePage() {
    // Load villas
    if (window.harmonyDB) {
        allVillas = window.harmonyDB.getAllVillas();
    }
    
    // Render Hero Product
    renderHeroProduct(allVillas);

    // Initial render
    renderVillas(allVillas);
    updateFilterCountBadge(allVillas.length);

    // Load and render destinations (Toplist)
    if (window.harmonyDB) {
        loadedDestinationsList = window.harmonyDB.getAllDestinations();
        // Sort destinations so that newer items appear first
        loadedDestinationsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        renderDestinationsPage();
    }

    // Setup Load More button event listener
    const loadMoreBtn = document.getElementById('btn-load-more-dest');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentDestinationsLimit += 9;
            renderDestinationsPage();
        });
    }

    // Setup real-time event listeners for filters
    const searchKeyword = document.getElementById('search-keyword');
    if (searchKeyword) {
        searchKeyword.addEventListener('input', applyFilters);
    }

    const filterCategory = document.getElementById('filter-category');
    if (filterCategory) {
        filterCategory.addEventListener('change', (e) => {
            currentCategoryFilter = e.target.value;
            // Sync tabs selection
            updateActiveTab(currentCategoryFilter);
            applyFilters();
        });
    }

    const filterBedrooms = document.getElementById('filter-bedrooms');
    if (filterBedrooms) {
        filterBedrooms.addEventListener('change', applyFilters);
    }

    const filterCapacity = document.getElementById('filter-capacity');
    if (filterCapacity) {
        filterCapacity.addEventListener('change', applyFilters);
    }

    const amenitiesList = document.getElementById('filter-amenities-list');
    if (amenitiesList) {
        amenitiesList.addEventListener('change', (e) => {
            if (e.target.classList.contains('amenity-filter-cb')) {
                applyFilters();
            }
        });
    }

    // Toggle advanced mode button logic
    const btnToggleAdvanced = document.getElementById('btn-toggle-advanced');
    const advancedPanel = document.querySelector('.filter-amenities-row');
    if (btnToggleAdvanced && advancedPanel) {
        btnToggleAdvanced.addEventListener('click', () => {
            const isCollapsed = advancedPanel.classList.contains('collapsed');
            if (isCollapsed) {
                advancedPanel.classList.remove('collapsed');
                btnToggleAdvanced.innerHTML = '<i class="fa-solid fa-angle-up"></i> Ẩn bộ lọc nâng cao';
                btnToggleAdvanced.classList.add('active');
            } else {
                advancedPanel.classList.add('collapsed');
                btnToggleAdvanced.innerHTML = '<i class="fa-solid fa-sliders"></i> Bộ lọc nâng cao';
                btnToggleAdvanced.classList.remove('active');
                
                // Clear amenities selection when advanced filters are collapsed
                const checkboxes = document.querySelectorAll('.amenity-filter-cb');
                checkboxes.forEach(cb => cb.checked = false);
                applyFilters();
            }
        });
    }

    // Set filters based on URL hash if clicking nav links
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
}

function updateFilterCountBadge(count) {
    const badge = document.getElementById('filter-count-msg');
    if (badge) {
        badge.innerText = `Tìm thấy: ${count} villa`;
    }
}

function updateActiveTab(category) {
    const tabs = ['all', 'family', 'luxury'];
    tabs.forEach(tab => {
        const tabEl = document.getElementById(`tab-${tab}`);
        if (tabEl) {
            if (tab === category) {
                tabEl.classList.add('active');
            } else {
                tabEl.classList.remove('active');
            }
        }
    });
}

function handleHashChange() {
    const hash = window.location.hash;
    if (hash === '#villas-section') {
        // Check if there was a category click
        // Filter tabs might need to update
    }
}

// Function triggered by clicking category tabs
window.filterByTab = function(category) {
    currentCategoryFilter = category;
    
    // Update active tab styling
    const tabs = ['all', 'family', 'luxury'];
    tabs.forEach(tab => {
        const tabEl = document.getElementById(`tab-${tab}`);
        if (tabEl) {
            if (tab === category) {
                tabEl.classList.add('active');
            } else {
                tabEl.classList.remove('active');
            }
        }
    });

    // Sync select dropdown in search bar
    const filterSelect = document.getElementById('filter-category');
    if (filterSelect) {
        filterSelect.value = category;
    }

    applyFilters();
};

// Function triggered by navbar category links
window.filterByCategory = function(category) {
    window.filterByTab(category);
    // Smooth scroll to the villas section
    const villasSec = document.getElementById('villas-section');
    if (villasSec) {
        villasSec.scrollIntoView({ behavior: 'smooth' });
    }
};

function handleSearchAndFilter() {
    const filterSelect = document.getElementById('filter-category');
    if (filterSelect) {
        currentCategoryFilter = filterSelect.value;
        // Sync segment tab styling
        const tabs = ['all', 'family', 'luxury'];
        tabs.forEach(tab => {
            const tabEl = document.getElementById(`tab-${tab}`);
            if (tabEl) {
                if (tab === currentCategoryFilter) {
                    tabEl.classList.add('active');
                } else {
                    tabEl.classList.remove('active');
                }
            }
        });
    }
    applyFilters();
}

function applyFilters() {
    const searchKeywordInput = document.getElementById('search-keyword');
    const searchKeyword = searchKeywordInput ? searchKeywordInput.value.toLowerCase().trim() : '';

    const bedroomFilterSelect = document.getElementById('filter-bedrooms');
    const bedroomFilter = bedroomFilterSelect ? bedroomFilterSelect.value : 'all';

    const capacityFilterSelect = document.getElementById('filter-capacity');
    const capacityFilter = capacityFilterSelect ? capacityFilterSelect.value : 'all';

    let filtered = allVillas;

    // 1. Filter by category tab/dropdown
    if (currentCategoryFilter !== 'all') {
        filtered = filtered.filter(v => v.category === currentCategoryFilter);
    }

    // 2. Filter by search keyword (name, description, address, or amenities)
    if (searchKeyword) {
        filtered = filtered.filter(v => 
            v.name.toLowerCase().includes(searchKeyword) || 
            v.address.toLowerCase().includes(searchKeyword) ||
            v.shortDescription.toLowerCase().includes(searchKeyword) ||
            (v.amenities && v.amenities.some(a => a.toLowerCase().includes(searchKeyword)))
        );
    }

    // 3. Filter by bedrooms (minimum)
    if (bedroomFilter !== 'all') {
        const minBeds = parseInt(bedroomFilter);
        filtered = filtered.filter(v => v.bedrooms >= minBeds);
    }

    // 4. Filter by guest capacity
    if (capacityFilter !== 'all') {
        if (capacityFilter === 'under10') {
            filtered = filtered.filter(v => v.capacity < 10);
        } else if (capacityFilter === '10-15') {
            filtered = filtered.filter(v => v.capacity >= 10 && v.capacity <= 15);
        } else if (capacityFilter === 'over15') {
            filtered = filtered.filter(v => v.capacity > 15);
        }
    }

    // 5. Filter by checked amenities
    const checkedAmenities = Array.from(document.querySelectorAll('.amenity-filter-cb:checked')).map(cb => cb.value.toLowerCase());
    if (checkedAmenities.length > 0) {
        filtered = filtered.filter(v => {
            if (!v.amenities) return false;
            return checkedAmenities.every(keyword => 
                v.amenities.some(a => a.toLowerCase().includes(keyword))
            );
        });
    }

    // Update count badge
    updateFilterCountBadge(filtered.length);

    // Render output
    renderVillas(filtered);
}

function renderVillas(villas) {
    const grid = document.getElementById('villa-list-grid');
    if (!grid) return;

    if (villas.length === 0) {
        grid.style.display = 'block';
        grid.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; padding: 60px 0; width: 100%;">
                <i class="fa-solid fa-hotel" style="font-size: 3rem; color: var(--color-border); margin-bottom: 16px; display: block;"></i>
                <p style="color: var(--color-text-muted); font-size: 1.1rem; font-weight: 500;">Không tìm thấy villa nào phù hợp với bộ lọc.</p>
                <button onclick="resetFilters()" class="btn-secondary" style="margin-top: 16px;">Xóa Bộ Lọc</button>
            </div>
        `;
        return;
    }

    grid.style.display = 'grid';
    grid.innerHTML = villas.map(villa => {
        const isLuxury = villa.category === 'luxury';
        const badgeLabel = isLuxury ? 'Villa Luxury' : 'Villa Gia Đình';
        const badgeClass = villa.category;
        const cardClass = isLuxury ? 'villa-card luxury-card' : 'villa-card';

        // Render features simply
        return `
            <article class="${cardClass}">
                <div class="villa-card-image">
                    <img src="${villa.image || 'asset/luxury_villa_1.png'}" alt="${villa.name}">
                    <span class="villa-card-badge ${badgeClass}">${badgeLabel}</span>
                </div>
                <div class="villa-card-content">
                    <h3 class="villa-card-title">${villa.name}</h3>
                    <p class="villa-card-address"><i class="fa-solid fa-location-dot"></i> ${villa.address}</p>
                    <div class="villa-card-specs">
                        <div class="villa-card-spec-item">
                            <i class="fa-solid fa-bed"></i> <span>${villa.bedrooms} PN</span>
                        </div>
                        <div class="villa-card-spec-item">
                            <i class="fa-solid fa-bath"></i> <span>${villa.bathrooms} WC</span>
                        </div>
                        <div class="villa-card-spec-item">
                            <i class="fa-solid fa-user-group"></i> <span>Max ${villa.capacity} khách</span>
                        </div>
                    </div>
                    <p class="villa-card-desc">${villa.shortDescription}</p>
                    <div class="villa-card-footer">
                        <div class="villa-card-price">
                            <span>Giá Thuê</span>
                            <span>${villa.price || 'Liên hệ'}</span>
                        </div>
                        <a href="detail.html?id=${villa.id}" class="villa-card-btn">Chi Tiết</a>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

window.resetFilters = function() {
    const searchKeyword = document.getElementById('search-keyword');
    if (searchKeyword) searchKeyword.value = '';
    
    const filterCategory = document.getElementById('filter-category');
    if (filterCategory) filterCategory.value = 'all';
    
    const filterBedrooms = document.getElementById('filter-bedrooms');
    if (filterBedrooms) filterBedrooms.value = 'all';
    
    const filterCapacity = document.getElementById('filter-capacity');
    if (filterCapacity) filterCapacity.value = 'all';
    
    const checkboxes = document.querySelectorAll('.amenity-filter-cb');
    checkboxes.forEach(cb => cb.checked = false);
    
    window.filterByTab('all');
};

// ==========================================
// DETAIL PAGE FUNCTIONS
// ==========================================

function initDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id || !window.harmonyDB) {
        showDetailError("Không tìm thấy thông tin biệt thự yêu cầu.");
        return;
    }

    const villa = window.harmonyDB.getVillaById(id);
    if (!villa) {
        showDetailError("Biệt thự không tồn tại hoặc đã bị xóa khỏi hệ thống.");
        return;
    }

    // Hide loading spinner and display content
    document.getElementById('detail-loading').style.display = 'none';
    document.getElementById('detail-content').style.display = 'block';

    // Populate data
    document.getElementById('detail-title').innerText = villa.name;
    document.title = `${villa.name} | The Harmony - Booking Villa Đà Lạt`;
    document.getElementById('detail-address').innerText = villa.address;
    document.getElementById('detail-price').innerText = villa.price || 'Liên hệ trực tiếp';
    document.getElementById('spec-bedrooms').innerText = `${villa.bedrooms} phòng ngủ`;
    document.getElementById('spec-bathrooms').innerText = `${villa.bathrooms} phòng vệ sinh`;
    document.getElementById('spec-capacity').innerText = `Tối đa ${villa.capacity} khách`;
    document.getElementById('detail-description').innerText = villa.description;

    // Badge styling
    const badge = document.getElementById('detail-category-badge');
    if (badge) {
        badge.innerText = villa.category === 'luxury' ? 'Villa Luxury' : 'Villa Gia Đình';
        badge.className = `detail-badge ${villa.category}-badge`;
        if (villa.category === 'luxury') {
            badge.style.backgroundColor = 'rgba(197, 160, 89, 0.9)';
            badge.style.color = '#111413';
        } else {
            badge.style.backgroundColor = 'rgba(18, 62, 48, 0.85)';
            badge.style.color = '#ffffff';
        }
    }

    // Media Slider Images Setup
    const mainImg = document.getElementById('gallery-main-img');
    mainImg.src = villa.image || 'asset/luxury_villa_1.png';
    mainImg.alt = villa.name;

    const thumbsList = document.getElementById('gallery-thumbs-list');
    if (thumbsList && villa.images && villa.images.length > 0) {
        thumbsList.innerHTML = villa.images.map((imgUrl, idx) => {
            const activeClass = idx === 0 ? 'active' : '';
            return `
                <div class="gallery-thumb ${activeClass}" onclick="switchGalleryImage(this, '${imgUrl}')">
                    <img src="${imgUrl}" alt="${villa.name} thumbnail">
                </div>
            `;
        }).join('');
    } else {
        // Fallback thumbnail using main image
        thumbsList.innerHTML = `
            <div class="gallery-thumb active" onclick="switchGalleryImage(this, '${villa.image}')">
                <img src="${villa.image}" alt="${villa.name} thumbnail">
            </div>
        `;
    }

    // Render amenities
    const amenitiesUl = document.getElementById('detail-amenities-list');
    if (amenitiesUl) {
        if (villa.amenities && villa.amenities.length > 0) {
            amenitiesUl.innerHTML = villa.amenities.map(amenity => `
                <li class="amenity-item">${amenity}</li>
            `).join('');
        } else {
            amenitiesUl.innerHTML = '<li class="amenity-item">Đầy đủ tiện ích cơ bản</li>';
        }
    }
}

window.switchGalleryImage = function(element, imgUrl) {
    // Update main image
    const mainImg = document.getElementById('gallery-main-img');
    if (mainImg) {
        mainImg.src = imgUrl;
    }

    // Update active state in thumbnails
    const thumbs = document.querySelectorAll('.gallery-thumb');
    thumbs.forEach(t => t.classList.remove('active'));
    element.classList.add('active');
};

function showDetailError(message) {
    const container = document.getElementById('detail-page-container');
    if (container) {
        container.innerHTML = `
            <div style="padding: 100px 0; text-align: center;">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
                <h2>Lỗi Tải Dữ Liệu</h2>
                <p style="color: var(--color-text-muted); margin: 12px 0 24px;">${message}</p>
                <a href="index.html" class="btn-primary" style="display: inline-block; padding: 10px 24px;">Quay Lại Trang Chủ</a>
            </div>
        `;
    }
}

// ==========================================
// DESTINATIONS (TOPLIST) FUNCTIONS
// ==========================================

function renderDestinationsPage() {
    const sliced = loadedDestinationsList.slice(0, currentDestinationsLimit);
    renderDestinations(sliced);

    const loadMoreBtn = document.getElementById('btn-load-more-dest');
    if (loadMoreBtn) {
        if (loadedDestinationsList.length > currentDestinationsLimit) {
            loadMoreBtn.style.display = 'inline-block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
}

function renderDestinations(destinations) {
    const grid = document.getElementById('destinations-list-grid');
    if (!grid) return;

    if (destinations.length === 0) {
        grid.style.display = 'block';
        grid.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; padding: 60px 0; width: 100%;">
                <i class="fa-solid fa-map-location-dot" style="font-size: 3rem; color: var(--color-border); margin-bottom: 16px; display: block;"></i>
                <p style="color: var(--color-text-muted); font-size: 1.1rem; font-weight: 500;">Chưa có gợi ý điểm check-in nào trong cẩm nang.</p>
            </div>
        `;
        return;
    }

    grid.style.display = 'grid';
    grid.innerHTML = destinations.map(dest => {
        let categoryLabel = "";
        if (dest.category === 'checkin') categoryLabel = "Điểm check-in";
        else if (dest.category === 'cafe') categoryLabel = "Cà phê lãng mạn";
        else if (dest.category === 'sightseeing') categoryLabel = "Điểm tham quan";
        else if (dest.category === 'food') categoryLabel = "Ẩm thực Đà Lạt";
        else categoryLabel = "Cẩm nang du lịch";

        return `
            <article class="destination-card">
                <div class="destination-card-img">
                    <img src="${dest.image || 'asset/dest_lake.png'}" alt="${dest.title}">
                </div>
                <div class="destination-card-content">
                    <span class="destination-card-tag ${dest.category || 'checkin'}">${categoryLabel}</span>
                    <h3 class="destination-card-title" style="font-size: 1.1rem; font-weight: 700; color: var(--color-primary); margin-bottom: 8px;">${dest.title}</h3>
                    <p class="destination-card-desc" style="margin-bottom: 16px;">${dest.shortDescription}</p>
                    
                    <div class="destination-card-footer" style="margin-top: auto; padding-top: 12px; border-top: 1px solid rgba(18, 62, 48, 0.08); display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                        <span class="destination-card-address" style="margin-bottom: 0; font-size: 0.8rem; color: var(--color-text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 60%;" title="${dest.address}">
                            <i class="fa-solid fa-location-dot"></i> ${dest.address}
                        </span>
                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest.title + ' ' + dest.address)}" target="_blank" class="destination-card-map-link" style="color: var(--color-primary); font-size: 0.78rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; text-decoration: none; white-space: nowrap; transition: var(--transition-smooth);">
                            <i class="fa-solid fa-map-marked-alt"></i> Bản Đồ
                        </a>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// ==========================================
// HERO PRODUCT FUNCTIONS
// ==========================================

function renderHeroProduct(villas) {
    const container = document.getElementById('hero-product-container');
    if (!container) return;

    if (villas.length === 0) {
        container.innerHTML = `
            <div class="container text-center">
                <h1 class="hero-product-title text-white">The Harmony - Booking Villa Đà Lạt</h1>
            </div>
        `;
        return;
    }

    // Filter to only show featured or all default villas as slides (up to 5 slides)
    const sliderVillas = villas.slice(0, 5);

    // Generate slides HTML
    const slidesHtml = sliderVillas.map((villa, idx) => {
        const activeClass = idx === 0 ? 'active' : '';
        const badgeText = villa.category === 'luxury' ? 'Luxury Villa' : 'Family Villa';
        
        return `
            <div class="hero-slide ${activeClass}" data-slide-index="${idx}">
                <div class="container hero-product-grid">
                    <div class="hero-product-info">
                        <span class="hero-product-badge"><i class="fa-solid fa-crown"></i> ${badgeText}</span>
                        <h1 class="hero-product-title text-white">${villa.name}</h1>
                        <p class="hero-product-tagline text-muted-light">${villa.shortDescription}</p>
                        <div class="hero-product-specs dark-specs">
                            <span><i class="fa-solid fa-bed"></i> ${villa.bedrooms} PN</span>
                            <span><i class="fa-solid fa-bath"></i> ${villa.bathrooms} WC</span>
                            <span><i class="fa-solid fa-user-group"></i> Max ${villa.capacity} Khách</span>
                        </div>
                        <div class="hero-product-cta">
                            <span class="hero-product-price text-accent">Giá: ${villa.price || 'Liên hệ'}</span>
                            <a href="detail.html?id=${villa.id}" class="hero-product-btn gold-btn">Khám Phá Ngay <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                    </div>
                    <div class="hero-product-media">
                        <div class="hero-product-img-wrapper dark-border">
                            <img src="${villa.image || 'asset/luxury_villa_1.png'}" alt="${villa.name}">
                            <span class="floating-discount-badge">${villa.category === 'luxury' ? 'View Thung Lũng' : 'View Đồi Thông'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Generate dots HTML
    const dotsHtml = sliderVillas.map((_, idx) => {
        const activeClass = idx === 0 ? 'active' : '';
        return `<button class="slider-dot ${activeClass}" onclick="goToSlide(${idx})" aria-label="Go to slide ${idx + 1}"></button>`;
    }).join('');

    container.innerHTML = `
        <div class="hero-slider-wrapper" id="hero-slider-wrapper">
            ${slidesHtml}
        </div>
        <!-- Slider Navigation -->
        <button class="slider-nav-btn prev" onclick="prevSlide()" aria-label="Previous slide"><i class="fa-solid fa-chevron-left"></i></button>
        <button class="slider-nav-btn next" onclick="nextSlide()" aria-label="Next slide"><i class="fa-solid fa-chevron-right"></i></button>
        <!-- Slider Dots -->
        <div class="slider-dots">
            ${dotsHtml}
        </div>
    `;

    // Start auto-scroll
    startSlideShow();
}

function startSlideShow() {
    clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        nextSlide();
    }, 6000); // Change slide every 6 seconds
}

window.goToSlide = function(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.slider-dot');
    if (slides.length === 0) return;

    // Normalize index
    if (index >= slides.length) currentSlideIndex = 0;
    else if (index < 0) currentSlideIndex = slides.length - 1;
    else currentSlideIndex = index;

    slides.forEach((slide, idx) => {
        if (idx === currentSlideIndex) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
        }
    });

    const activeSlide = slides[currentSlideIndex];
    if (activeSlide) {
        // Trigger animations by reflowing
        const info = activeSlide.querySelector('.hero-product-info');
        const media = activeSlide.querySelector('.hero-product-media');
        if (info && media) {
            info.style.animation = 'none';
            media.style.animation = 'none';
            void activeSlide.offsetWidth; // Reflow
            info.style.animation = 'fadeInLeft 0.8s ease-out';
            media.style.animation = 'fadeInRight 0.8s ease-out';
        }
    }

    dots.forEach((dot, idx) => {
        if (idx === currentSlideIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });

    // Reset timer
    startSlideShow();
};

window.nextSlide = function() {
    goToSlide(currentSlideIndex + 1);
};

window.prevSlide = function() {
    goToSlide(currentSlideIndex - 1);
};
