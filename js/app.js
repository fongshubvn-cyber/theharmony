// App Logic for The Harmony - Booking Villa Đà Lạt (Customer Facing)

document.addEventListener('DOMContentLoaded', async () => {
    // Header styling on scroll
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Hamburger menu toggle
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = navToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });

        // Close menu when clicking link (handling mobile dropdowns)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.classList.contains('dropdown-toggle') && window.innerWidth <= 992) {
                    e.preventDefault();
                    link.parentElement.classList.toggle('active');
                } else {
                    navLinks.classList.remove('active');
                    const icon = navToggle.querySelector('i');
                    if (icon) icon.className = 'fa-solid fa-bars';
                }
            });
        });
    }

    // Partner file input listener
    const partnerImageInput = document.getElementById('partner-image-file');
    if (partnerImageInput) {
        partnerImageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file || !window.harmonyDB) return;

            const url = await window.harmonyDB.uploadVillaImage(file);
            if (!url) {
                alert("Tải ảnh lên thất bại, vui lòng thử lại.");
                partnerImageInput.value = "";
                return;
            }
            partnerImageUrl = url;
            const prevDiv = document.getElementById('partner-image-preview');
            const prevEl = document.getElementById('partner-img-prev-el');
            if (prevDiv && prevEl) {
                prevEl.src = partnerImageUrl;
                prevDiv.style.display = 'block';
            }
        });
    }

    // Detect active page and execute corresponding functions
    const path = window.location.pathname;
    if (path.includes('detail.html')) {
        await initDetailPage();
    } else {
        // Default to Home page (index.html or root)
        await initHomePage();
        if (typeof checkPartnerDeepLink === 'function') {
            checkPartnerDeepLink();
        }
    }
});

// ==========================================
// HOME PAGE FUNCTIONS
// ==========================================

let allVillas = [];
let currentCategoryFilter = 'all';
let loadedDestinationsList = [];
let currentDestinationsLimit = 9;
let currentVillasLimit = 9;
let currentSlideIndex = 0;
let slideInterval;

async function initHomePage() {
    // Load villas (exclude pending partner consignments)
    if (window.harmonyDB) {
        const rawVillas = await window.harmonyDB.getAllVillas();
        allVillas = rawVillas.filter(v => v.approvalStatus !== 'pending');
    }

    // Render Hero Product
    await renderHeroProduct(allVillas);

    // Initial render
    renderVillas(allVillas);
    updateFilterCountBadge(allVillas.length);

    // Load and render destinations (Toplist)
    if (window.harmonyDB) {
        loadedDestinationsList = await window.harmonyDB.getAllDestinations();
        // Sort destinations so that newer items appear first
        loadedDestinationsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        renderDestinationsPage();
    }

    // Setup Load More button event listener for destinations
    const loadMoreBtn = document.getElementById('btn-load-more-dest');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentDestinationsLimit += 9;
            renderDestinationsPage();
        });
    }

    // Setup Load More button event listener for villas
    const loadMoreVillasBtn = document.getElementById('btn-load-more-villas');
    if (loadMoreVillasBtn) {
        loadMoreVillasBtn.addEventListener('click', () => {
            currentVillasLimit += 9;
            applyFilters(true); // keep current limit and expand
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

    // Search button submission scroll behavior
    const btnSearchSubmit = document.getElementById('btn-search-submit');
    if (btnSearchSubmit) {
        btnSearchSubmit.addEventListener('click', () => {
            applyFilters();
            const villasSection = document.getElementById('villas-section');
            if (villasSection) {
                villasSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Support pressing Enter key in search keyword field
    if (searchKeyword) {
        searchKeyword.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (btnSearchSubmit) {
                    btnSearchSubmit.click();
                } else {
                    applyFilters();
                    const villasSection = document.getElementById('villas-section');
                    if (villasSection) {
                        villasSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }
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

    // Setup FAQ Accordion Toggles
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            const answer = question.nextElementSibling;
            const isOpen = item.classList.contains('active');
            
            // Close other FAQ items
            document.querySelectorAll('.faq-item').forEach(faqItem => {
                faqItem.classList.remove('active');
                const otherAnswer = faqItem.querySelector('.faq-answer');
                if (otherAnswer) otherAnswer.style.maxHeight = null;
            });
            
            if (!isOpen) {
                item.classList.add('active');
                if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    // Simple scroll reveal observer
    if ('IntersectionObserver' in window) {
        const revealSections = document.querySelectorAll('.benefits-section, .testimonials-section, .faq-section, .final-cta-section, .destinations-section, .segment-section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-active');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });
        
        revealSections.forEach(section => {
            section.classList.add('reveal-section');
            observer.observe(section);
        });
    }

    // Setup homepage form submit handler
    const homeContactForm = document.getElementById('homepage-contact-form');
    if (homeContactForm) {
        homeContactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!window.harmonyDB || !window.harmonyDB.saveBooking) {
                alert("Lỗi hệ thống lưu trữ!");
                return;
            }

            const submitBtn = homeContactForm.querySelector('button[type="submit"]');
            const restoreBtn = setSubmitLoading(submitBtn, 'Đang gửi...');

            const bookingData = {
                villaId: document.getElementById('form-villa-id').value,
                villaName: document.getElementById('form-villa-name').value,
                customerName: homeContactForm.querySelector('#form-name').value.trim(),
                customerPhone: homeContactForm.querySelector('#form-phone').value.trim(),
                checkIn: homeContactForm.querySelector('#form-date').value || null,
                guests: parseInt(homeContactForm.querySelector('#form-guests').value) || null,
                note: homeContactForm.querySelector('#form-note').value.trim(),
                status: 'pending'
            };

            await window.harmonyDB.saveBooking(bookingData);

            // Show success message
            const successMsg = homeContactForm.querySelector('#form-success-msg');
            if (successMsg) {
                successMsg.style.display = 'block';
                successMsg.style.color = '#10b981';
                successMsg.style.fontWeight = 'bold';
                successMsg.style.marginTop = '16px';

                // Reset form fields
                homeContactForm.reset();

                // Auto hide after 5 seconds
                setTimeout(() => {
                    successMsg.style.display = 'none';
                    restoreBtn();
                }, 5000);
            } else {
                restoreBtn();
            }
        });
    }

    // Check URL parameters for category filter
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
        setTimeout(() => {
            window.filterByCategory(categoryParam);
        }, 200);
    }
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

// Function triggered by clicking category tabs
window.filterByTab = function(category) {
    currentCategoryFilter = category;
    updateActiveTab(category);

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

function applyFilters(keepLimit = false) {
    if (!keepLimit) {
        currentVillasLimit = 9;
    }

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

// Category -> .villa-card-badge modifier class (villa-caocap = luxury, home-* = home-badge, rest = family)
function getVillaCardBadgeClass(category) {
    if (category === 'villa-caocap') return 'luxury';
    if (category && category.startsWith('home-')) return 'home-badge';
    return 'family';
}

function renderVillas(villas) {
    const grid = document.getElementById('villa-list-grid');
    if (!grid) return;

    const loadMoreContainer = document.getElementById('load-more-villas-container');

    if (villas.length === 0) {
        grid.style.display = 'block';
        grid.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; padding: 60px 0; width: 100%;">
                <i class="fa-solid fa-hotel" style="font-size: 3rem; color: var(--color-border); margin-bottom: 16px; display: block;"></i>
                <p style="color: var(--color-text-muted); font-size: 1.1rem; font-weight: 500;">Không tìm thấy villa nào phù hợp với bộ lọc.</p>
                <button onclick="resetFilters()" class="btn-secondary" style="margin-top: 16px;">Xóa Bộ Lọc</button>
            </div>
        `;
        if (loadMoreContainer) {
            loadMoreContainer.style.display = 'none';
        }
        return;
    }

    // Apply maximum display limit (9 items per click/load)
    const visibleVillas = villas.slice(0, currentVillasLimit);

    if (loadMoreContainer) {
        if (villas.length > currentVillasLimit) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }

    grid.style.display = 'grid';
    grid.innerHTML = visibleVillas.map(villa => {
        let badgeLabel = 'Chỗ Nghỉ';
        if (villa.category === 'villa-giadinh') badgeLabel = 'Villa Gia Đình';
        else if (villa.category === 'villa-tamtrung') badgeLabel = 'Villa Tầm Trung';
        else if (villa.category === 'villa-caocap') badgeLabel = 'Villa Cao Cấp';
        else if (villa.category === 'home-giadinh') badgeLabel = 'Home Gia Đình';
        else if (villa.category === 'home-nhomban') badgeLabel = 'Home Nhóm Bạn';
        
        const badgeClass = getVillaCardBadgeClass(villa.category);
        const cardClass = villa.category === 'villa-caocap' ? 'villa-card luxury-card' : 'villa-card';
        const hotBadgeHtml = villa.featured ? '<span class="hot-badge"><i class="fa-solid fa-fire"></i> Hot</span>' : '';

        return `
            <article class="${cardClass}">
                <div class="villa-card-image" onclick="openQuickView('${villa.id}')" style="cursor: pointer;" title="Nhấn để xem chi tiết nhanh không cần chuyển trang">
                    <img src="${villa.image || 'asset/luxury_villa_1.png'}" alt="${villa.name}">
                    <span class="villa-card-badge ${badgeClass}">${badgeLabel}</span>
                    ${hotBadgeHtml}
                    <div class="quick-view-overlay">
                        <span><i class="fa-solid fa-expand"></i> Xem Nhanh</span>
                    </div>
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

async function initDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id || !window.harmonyDB) {
        showDetailError("Không tìm thấy thông tin chỗ nghỉ yêu cầu.");
        return;
    }

    const villa = await window.harmonyDB.getVillaById(id);
    if (!villa) {
        showDetailError("Villa/Homestay không tồn tại hoặc đã bị xóa khỏi hệ thống.");
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
        let badgeLabel = 'Chỗ Nghỉ';
        if (villa.category === 'villa-giadinh') badgeLabel = 'Villa Gia Đình';
        else if (villa.category === 'villa-tamtrung') badgeLabel = 'Villa Tầm Trung';
        else if (villa.category === 'villa-caocap') badgeLabel = 'Villa Cao Cấp';
        else if (villa.category === 'home-giadinh') badgeLabel = 'Home Gia Đình';
        else if (villa.category === 'home-nhomban') badgeLabel = 'Home Nhóm Bạn';
        
        badge.innerText = badgeLabel;
        badge.className = `detail-badge ${villa.category}-badge`;
        if (villa.category === 'villa-caocap') {
            badge.style.backgroundColor = 'rgba(197, 160, 89, 0.9)';
            badge.style.color = '#111413';
        } else {
            badge.style.backgroundColor = 'var(--color-primary)';
            badge.style.color = '#ffffff';
        }

        const existingHotBadge = document.getElementById('detail-hot-badge');
        if (existingHotBadge) existingHotBadge.remove();
        if (villa.featured) {
            badge.insertAdjacentHTML('afterend', '<span id="detail-hot-badge" class="hot-badge-inline"><i class="fa-solid fa-fire"></i> Hot</span>');
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
                <li class="amenity-item">
                    <span class="amenity-icon-wrapper">
                        ${getAmenityIcon(amenity)}
                    </span>
                    <span class="amenity-text">${amenity}</span>
                </li>
            `).join('');
        } else {
            amenitiesUl.innerHTML = '<li class="amenity-item">Đầy đủ tiện ích cơ bản</li>';
        }
    }

    // Render reviews
    await renderReviews(villa.id);

    // Populate form hidden fields
    const formVillaId = document.getElementById('form-villa-id');
    const formVillaName = document.getElementById('form-villa-name');
    if (formVillaId) formVillaId.value = villa.id;
    if (formVillaName) formVillaName.value = villa.name;

    // Setup form submit handler
    const contactForm = document.getElementById('villa-contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!window.harmonyDB || !window.harmonyDB.saveBooking) {
                alert("Lỗi hệ thống lưu trữ!");
                return;
            }

            const restoreBtn = setSubmitLoading(contactForm.querySelector('button[type="submit"]'), 'Đang gửi...');

            const bookingData = {
                villaId: document.getElementById('form-villa-id').value,
                villaName: document.getElementById('form-villa-name').value,
                customerName: document.getElementById('form-name').value.trim(),
                customerPhone: document.getElementById('form-phone').value.trim(),
                checkIn: document.getElementById('form-date').value || null,
                guests: parseInt(document.getElementById('form-guests').value) || null,
                note: document.getElementById('form-note').value.trim(),
                status: 'pending'
            };

            await window.harmonyDB.saveBooking(bookingData);

            // Show success message
            const successMsg = document.getElementById('form-success-msg');
            if (successMsg) {
                successMsg.style.display = 'block';
                successMsg.style.color = '#10b981';
                successMsg.style.fontWeight = 'bold';
                successMsg.style.marginTop = '16px';

                // Reset form fields except hidden ones
                contactForm.reset();
                if (formVillaId) formVillaId.value = villa.id;
                if (formVillaName) formVillaName.value = villa.name;

                // Auto hide after 5 seconds
                setTimeout(() => {
                    successMsg.style.display = 'none';
                    restoreBtn();
                }, 5000);
            } else {
                restoreBtn();
            }
        });
    }

    // Setup review form submit handler (Allowing user to add review without login)
    const addReviewForm = document.getElementById('add-review-form');
    if (addReviewForm) {
        addReviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!window.harmonyDB || !window.harmonyDB.saveReview) {
                alert("Lỗi hệ thống lưu trữ đánh giá!");
                return;
            }

            const restoreBtn = setSubmitLoading(addReviewForm.querySelector('button[type="submit"]'), 'Đang gửi...');

            const reviewData = {
                villaId: villa.id,
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop",
                name: document.getElementById('review-name').value.trim(),
                date: new Date().toLocaleDateString('vi-VN'),
                rating: parseInt(document.getElementById('review-rating').value),
                content: document.getElementById('review-content').value.trim()
            };

            await window.harmonyDB.saveReview(reviewData);

            const successMsg = document.getElementById('review-success-msg');
            if (successMsg) {
                successMsg.style.display = 'block';

                addReviewForm.reset();

                await renderReviews(villa.id);

                setTimeout(() => {
                    successMsg.style.display = 'none';
                    restoreBtn();
                }, 5000);
            } else {
                restoreBtn();
            }
        });
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
                    <h3 class="destination-card-title">${dest.title}</h3>
                    <p class="destination-card-desc">${dest.shortDescription}</p>

                    <div class="destination-card-footer">
                        <span class="destination-card-address" title="${dest.address}">
                            <i class="fa-solid fa-location-dot"></i> ${dest.address}
                        </span>
                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest.title + ' ' + dest.address)}" target="_blank" class="destination-card-map-link">
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

async function renderHeroProduct(villas) {
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

    // Pre-fetch rating stats for all slider villas up front (getVillaRatingStats is async)
    const statsByVillaId = {};
    await Promise.all(sliderVillas.map(async (villa) => {
        statsByVillaId[villa.id] = (window.harmonyDB && window.harmonyDB.getVillaRatingStats)
            ? await window.harmonyDB.getVillaRatingStats(villa.id)
            : { average: 4.9, count: 120 };
    }));

    // Generate slides HTML
    const slidesHtml = sliderVillas.map((villa, idx) => {
        const activeClass = idx === 0 ? 'active' : '';

        let badgeText = 'Chỗ Nghỉ';
        if (villa.category === 'villa-giadinh') badgeText = 'Villa Gia Đình';
        else if (villa.category === 'villa-tamtrung') badgeText = 'Villa Tầm Trung';
        else if (villa.category === 'villa-caocap') badgeText = 'Villa Cao Cấp';
        else if (villa.category === 'home-giadinh') badgeText = 'Home Gia Đình';
        else if (villa.category === 'home-nhomban') badgeText = 'Home Nhóm Bạn';

        const ratingStats = statsByVillaId[villa.id];

        const wholeStars = Math.floor(ratingStats.average);
        let starsHtml = '<i class="fa-solid fa-star"></i>'.repeat(wholeStars);
        if (ratingStats.average % 1 >= 0.5) {
            starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
        }
        
        return `
            <div class="hero-slide ${activeClass}" data-slide-index="${idx}">
                <div class="container hero-product-grid">
                    <div class="hero-product-info">
                        <span class="hero-product-badge"><i class="fa-solid fa-crown"></i> ${badgeText}</span>
                        <h1 class="hero-product-title text-white">${villa.name}</h1>
                        <p class="hero-product-tagline text-muted-light">${villa.shortDescription}</p>
                        
                        <!-- Social Proof (Element 5) -->
                        <div class="hero-product-social-proof">
                            <div class="overlapping-avatars">
                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop" alt="Khách hàng">
                                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&fit=crop" alt="Khách hàng">
                                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop" alt="Khách hàng">
                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop" alt="Khách hàng">
                            </div>
                            <div class="social-proof-content">
                                <div class="social-proof-stars">
                                    ${starsHtml}
                                    <span>${ratingStats.average} / 5★</span>
                                </div>
                                <span class="social-proof-desc">${ratingStats.count} lượt đánh giá thực tế</span>
                            </div>
                        </div>

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
                            <span class="floating-discount-badge">${villa.category === 'villa-caocap' ? 'View Thung Lũng' : 'View Đồi Thông'}</span>
                            ${villa.featured ? '<span class="hot-badge"><i class="fa-solid fa-fire"></i> Hot</span>' : ''}
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

    // Pause autoplay while the user is reading/interacting with the slider
    container.addEventListener('mouseenter', () => clearInterval(slideInterval));
    container.addEventListener('mouseleave', () => startSlideShow());
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

// Sticky Contact Widget interaction
window.toggleStickySubmenu = function(event) {
    event.stopPropagation();
    const btnGroup = event.currentTarget.parentElement;
    if (btnGroup) {
        btnGroup.classList.toggle('active');
    }
};

document.addEventListener('click', () => {
    const btnGroup = document.querySelector('.sticky-btn-group');
    if (btnGroup) {
        btnGroup.classList.remove('active');
    }
});

// ==========================================
// AMENITY ICONS MAPPING HELPER
// ==========================================
function getAmenityIcon(amenity) {
    const text = amenity.toLowerCase();
    
    if (text.includes('bể bơi') || text.includes('hồ bơi') || text.includes('pool')) {
        return '<i class="fa-solid fa-water-ladder"></i>';
    }
    if (text.includes('bbq') || text.includes('nướng') || text.includes('lửa trại')) {
        return '<i class="fa-solid fa-fire"></i>';
    }
    if (text.includes('chiếu phim') || text.includes('cinema')) {
        return '<i class="fa-solid fa-film"></i>';
    }
    if (text.includes('bi-a') || text.includes('billiards') || text.includes('giải trí')) {
        return '<i class="fa-solid fa-gamepad"></i>';
    }
    if (text.includes('xông hơi') || text.includes('sauna') || text.includes('spa')) {
        return '<i class="fa-solid fa-spa"></i>';
    }
    if (text.includes('quản gia') || text.includes('phục vụ') || text.includes('bảo vệ')) {
        return '<i class="fa-solid fa-user-tie"></i>';
    }
    if (text.includes('view') || text.includes('tầm nhìn') || text.includes('thung lũng') || text.includes('đồi thông')) {
        return '<i class="fa-solid fa-mountain-sun"></i>';
    }
    if (text.includes('sân vườn') || text.includes('vườn hồng') || text.includes('hoa')) {
        return '<i class="fa-solid fa-leaf"></i>';
    }
    if (text.includes('sưởi')) {
        return '<i class="fa-solid fa-fire-burner"></i>';
    }
    if (text.includes('vui chơi') || text.includes('trẻ em') || text.includes('kid')) {
        return '<i class="fa-solid fa-child-reaching"></i>';
    }
    if (text.includes('rượu vang') || text.includes('hầm rượu')) {
        return '<i class="fa-solid fa-wine-glass"></i>';
    }
    if (text.includes('thiên văn') || text.includes('ngắm sao') || text.includes('star')) {
        return '<i class="fa-solid fa-star"></i>';
    }
    if (text.includes('golf')) {
        return '<i class="fa-solid fa-golf-ball-tee"></i>';
    }
    if (text.includes('trà chiều') || text.includes('tea')) {
        return '<i class="fa-solid fa-mug-hot"></i>';
    }
    if (text.includes('smart') || text.includes('nhà thông minh')) {
        return '<i class="fa-solid fa-house-laptop"></i>';
    }
    if (text.includes('đậu xe') || text.includes('xe hơi') || text.includes('parking')) {
        return '<i class="fa-solid fa-square-p"></i>';
    }
    if (text.includes('tv') || text.includes('smart tv') || text.includes('karaoke') || text.includes('mic')) {
        return '<i class="fa-solid fa-microphone"></i>';
    }
    if (text.includes('bếp') || text.includes('tự nấu') || text.includes('kitchen')) {
        return '<i class="fa-solid fa-kitchen-set"></i>';
    }
    if (text.includes('nóng') || text.includes('nước nóng')) {
        return '<i class="fa-solid fa-temperature-high"></i>';
    }
    
    return '<i class="fa-solid fa-circle-check"></i>';
}

// ==========================================
// RENDER REVIEWS DYNAMICALLY
// ==========================================
async function renderReviews(villaId) {
    const listContainer = document.getElementById('detail-reviews-list');
    if (!listContainer) return;

    const reviews = (window.harmonyDB && window.harmonyDB.getReviewsByVillaId)
        ? await window.harmonyDB.getReviewsByVillaId(villaId)
        : [];


    listContainer.innerHTML = reviews.map(review => {
        const starIcons = '<i class="fa-solid fa-star"></i>'.repeat(review.rating);
        return `
            <div class="review-item-card">
                <div class="review-header">
                    <div class="review-user-info">
                        <img src="${review.avatar}" alt="${review.name}" class="review-user-avatar">
                        <div>
                            <h4 class="review-user-name">${review.name}</h4>
                            <span class="review-date">${review.date}</span>
                        </div>
                    </div>
                    <div class="review-stars">
                        ${starIcons}
                    </div>
                </div>
                <p class="review-content">"${review.content}"</p>
            </div>
        `;
    }).join('');

    if (window.harmonyDB && window.harmonyDB.getVillaRatingStats) {
        const stats = await window.harmonyDB.getVillaRatingStats(villaId);

        const scoreElem = document.querySelector('.average-score');
        if (scoreElem) scoreElem.innerText = stats.average.toFixed(1);
        
        const starsElem = document.querySelector('.average-stars');
        if (starsElem) {
            const wholeStars = Math.floor(stats.average);
            let starsHtml = '<i class="fa-solid fa-star"></i>'.repeat(wholeStars);
            if (stats.average % 1 >= 0.5) {
                starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
            }
            starsElem.innerHTML = starsHtml;
        }
        
        const countElem = document.querySelector('.average-count');
        if (countElem) countElem.innerText = `Dựa trên ${stats.count} lượt đánh giá thực tế`;
    }

    await renderRatingDistribution(villaId);
}

async function renderRatingDistribution(villaId) {
    const listEl = document.getElementById('rating-distribution-list');
    if (!listEl || !window.harmonyDB || !window.harmonyDB.getVillaRatingDistribution) return;

    const distribution = await window.harmonyDB.getVillaRatingDistribution(villaId);

    listEl.innerHTML = distribution.map(row => `
        <div class="rating-category-item">
            <span class="category-name">${row.star} sao</span>
            <div class="progress-bar-wrapper">
                <div class="progress-bar-fill" style="width: ${row.percent}%;"></div>
            </div>
            <span class="category-score">${row.percent}%</span>
        </div>
    `).join('');
}

// ==========================================
// QUICK VIEW MODAL CONTROLLER
// ==========================================
window.openQuickView = async function(villaId) {
    const modal = document.getElementById('quick-view-modal');
    const body = document.getElementById('quick-view-body');
    if (!modal || !body || !window.harmonyDB) return;

    const villa = await window.harmonyDB.getVillaById(villaId);
    if (!villa) return;

    let badgeLabel = 'Chỗ Nghỉ';
    if (villa.category === 'villa-giadinh') badgeLabel = 'Villa Gia Đình';
    else if (villa.category === 'villa-tamtrung') badgeLabel = 'Villa Tầm Trung';
    else if (villa.category === 'villa-caocap') badgeLabel = 'Villa Cao Cấp';
    else if (villa.category === 'home-giadinh') badgeLabel = 'Home Gia Đình';
    else if (villa.category === 'home-nhomban') badgeLabel = 'Home Nhóm Bạn';

    const ratingStats = await window.harmonyDB.getVillaRatingStats(villa.id);
    const wholeStars = Math.floor(ratingStats.average);
    let starsHtml = '<i class="fa-solid fa-star"></i>'.repeat(wholeStars);
    if (ratingStats.average % 1 >= 0.5) {
        starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
    }

    const reviews = await window.harmonyDB.getReviewsByVillaId(villa.id);
    const reviewsListHtml = reviews.map(review => {
        const starIcons = '<i class="fa-solid fa-star"></i>'.repeat(review.rating);
        return `
            <div class="review-item-card">
                <div class="review-header">
                    <div class="review-user-info">
                        <img src="${review.avatar}" alt="${review.name}" class="review-user-avatar">
                        <div>
                            <h4 class="review-user-name">${review.name}</h4>
                            <span class="review-date">${review.date}</span>
                        </div>
                    </div>
                    <div class="review-stars">
                        ${starIcons}
                    </div>
                </div>
                <p class="review-content">"${review.content}"</p>
            </div>
        `;
    }).join('') || '<p class="reviews-empty-msg">Chưa có đánh giá nào.</p>';

    const amenitiesHtml = villa.amenities.map(amenity => `
        <li class="amenity-item">
            <span class="amenity-icon-wrapper">
                ${getAmenityIcon(amenity)}
            </span>
            <span class="amenity-text">${amenity}</span>
        </li>
    `).join('');

    const thumbsHtml = (villa.images && villa.images.length > 0 ? villa.images : [villa.image]).map((imgUrl, idx) => `
        <div class="gallery-thumb ${idx === 0 ? 'active' : ''} quick-view-thumb" onclick="window.switchModalImage(this, '${imgUrl}')">
            <img src="${imgUrl}" alt="thumbnail">
        </div>
    `).join('');

    body.innerHTML = `
        <div class="quick-view-grid">
            <!-- Left Column: Gallery & Info -->
            <div class="quick-view-info-col">
                <span class="detail-badge ${villa.category}-badge quick-view-badge">
                    ${badgeLabel}
                </span>
                ${villa.featured ? '<span class="hot-badge-inline"><i class="fa-solid fa-fire"></i> Hot</span>' : ''}
                <h2 class="quick-view-title">${villa.name}</h2>
                <p class="quick-view-address"><i class="fa-solid fa-location-dot"></i> ${villa.address}</p>
                
                <!-- Main Image -->
                <div class="quick-view-image-wrapper">
                    <img id="modal-main-img" src="${villa.image}" alt="${villa.name}">
                </div>
                
                <!-- Thumbnails -->
                <div id="modal-thumbs-list" class="quick-view-thumbs-list">
                    ${thumbsHtml}
                </div>

                <!-- Specs -->
                <div class="info-specs-grid">
                    <div class="info-spec-item">
                        <span>Phòng ngủ</span>
                        <span>${villa.bedrooms} PN</span>
                    </div>
                    <div class="info-spec-item">
                        <span>Phòng tắm</span>
                        <span>${villa.bathrooms} WC</span>
                    </div>
                    <div class="info-spec-item">
                        <span>Sức chứa</span>
                        <span>Max ${villa.capacity} khách</span>
                    </div>
                </div>

                <!-- Description -->
                <h3 class="quick-view-section-title"><i class="fa-solid fa-compass"></i> Thông Tin Tổng Quan</h3>
                <p class="quick-view-description">${villa.description}</p>

                <!-- Amenities -->
                <h3 class="quick-view-section-title"><i class="fa-solid fa-crown"></i> Tiện Ích Nổi Bật</h3>
                <ul class="amenities-list">
                    ${amenitiesHtml}
                </ul>
            </div>

            <!-- Right Column: Booking & Reviews -->
            <div class="quick-view-booking-col">
                <!-- Price Box -->
                <div class="quick-view-price-box">
                    <span class="price-label">Giá Thuê Căn</span>
                    <div class="price-value">${villa.price || 'Liên hệ trực tiếp'}</div>
                </div>

                <!-- Booking Form -->
                <div class="quick-view-booking-box">
                    <h3 class="booking-box-title"><i class="fa-solid fa-bell-concierge"></i> Đăng Ký Tư Vấn Đặt Phòng</h3>
                    <form id="modal-booking-form" onsubmit="window.submitModalBooking(event, '${villa.id}', '${villa.name}')">
                        <div class="form-group-quick">
                            <input type="text" id="modal-form-name" required placeholder="Họ và tên của bạn *">
                        </div>
                        <div class="form-group-quick">
                            <input type="text" id="modal-form-phone" required placeholder="Số điện thoại của bạn *">
                        </div>
                        <div class="form-grid-quick">
                            <input type="date" id="modal-form-date">
                            <input type="number" id="modal-form-guests" placeholder="Số khách" min="1">
                        </div>
                        <div class="form-group-quick">
                            <textarea id="modal-form-note" placeholder="Ghi chú về yêu cầu đặc biệt của bạn..." rows="2"></textarea>
                        </div>
                        <button type="submit" class="btn-primary btn-submit-quick">Gửi Yêu Cầu Tư Vấn</button>
                        <div id="modal-booking-success" class="booking-success-quick">
                            <i class="fa-solid fa-circle-check"></i> Cảm ơn! Yêu cầu của bạn đã được gửi thành công.
                        </div>
                    </form>
                </div>

                <!-- Reviews Panel -->
                <div class="quick-view-reviews-box">
                    <h3 class="reviews-box-title"><i class="fa-solid fa-quote-left"></i> Khách Hàng Đánh Giá</h3>
                    
                    <!-- Rating Summary -->
                    <div class="quick-view-rating-summary">
                        <div class="rating-number">${ratingStats.average.toFixed(1)}</div>
                        <div class="rating-stars-info">
                            <div class="stars-row">${starsHtml}</div>
                            <div class="rating-count-text">Dựa trên ${ratingStats.count} lượt đánh giá thực tế</div>
                        </div>
                    </div>

                    <!-- Reviews List Scroll Box -->
                    <div id="modal-reviews-list-box" class="quick-view-reviews-list">
                        ${reviewsListHtml}
                    </div>

                    <!-- Add Review inline Form -->
                    <div class="quick-view-add-review-section">
                        <h4 class="add-review-title"><i class="fa-solid fa-pen-to-square"></i> Viết đánh giá của bạn</h4>
                        <form id="modal-review-form" onsubmit="window.submitModalReview(event, '${villa.id}')">
                            <div class="form-grid-quick">
                                <input type="text" id="modal-rev-name" required placeholder="Tên của bạn *">
                                <select id="modal-rev-rating" required>
                                    <option value="5">★★★★★ (5/5)</option>
                                    <option value="4">★★★★☆ (4/5)</option>
                                    <option value="3">★★★☆☆ (3/5)</option>
                                    <option value="2">★★☆☆☆ (2/5)</option>
                                    <option value="1">★☆☆☆☆ (1/5)</option>
                                </select>
                            </div>
                            <div class="form-group-quick">
                                <textarea id="modal-rev-content" required placeholder="Nội dung nhận xét thực tế về trải nghiệm của bạn... *" rows="2"></textarea>
                            </div>
                            <button type="submit" class="btn-primary btn-submit-review">Gửi Nhận Xét</button>
                            <div id="modal-rev-success" class="review-success-quick">
                                <i class="fa-solid fa-circle-check"></i> Cảm ơn bạn! Đánh giá đã hiển thị ngay.
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeQuickView = function() {
    const modal = document.getElementById('quick-view-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

window.switchModalImage = function(thumbElement, imgUrl) {
    const mainImg = document.getElementById('modal-main-img');
    if (mainImg) mainImg.src = imgUrl;

    const siblings = thumbElement.parentElement.querySelectorAll('.gallery-thumb');
    siblings.forEach(s => s.classList.remove('active'));
    thumbElement.classList.add('active');
};

// Disables a submit button and swaps its label to a loading state; returns a restore function
function setSubmitLoading(submitBtn, loadingText) {
    if (!submitBtn) return () => {};
    const originalHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${loadingText}`;
    return () => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
    };
}

window.submitModalBooking = async function(event, villaId, villaName) {
    event.preventDefault();
    if (!window.harmonyDB) return;

    const form = document.getElementById('modal-booking-form');
    const restoreBtn = setSubmitLoading(form.querySelector('button[type="submit"]'), 'Đang gửi...');

    const bookingData = {
        villaId: villaId,
        villaName: villaName,
        customerName: document.getElementById('modal-form-name').value.trim(),
        customerPhone: document.getElementById('modal-form-phone').value.trim(),
        checkIn: document.getElementById('modal-form-date').value || null,
        guests: parseInt(document.getElementById('modal-form-guests').value) || null,
        note: document.getElementById('modal-form-note').value.trim(),
        status: 'pending'
    };

    await window.harmonyDB.saveBooking(bookingData);

    const successMsg = document.getElementById('modal-booking-success');
    if (successMsg) {
        successMsg.style.display = 'block';
        form.reset();
        setTimeout(() => {
            successMsg.style.display = 'none';
            restoreBtn();
        }, 5000);
    }
};

window.submitModalReview = async function(event, villaId) {
    event.preventDefault();
    if (!window.harmonyDB) return;

    const form = document.getElementById('modal-review-form');
    const restoreBtn = setSubmitLoading(form.querySelector('button[type="submit"]'), 'Đang gửi...');

    const reviewData = {
        villaId: villaId,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop",
        name: document.getElementById('modal-rev-name').value.trim(),
        date: new Date().toLocaleDateString('vi-VN'),
        rating: parseInt(document.getElementById('modal-rev-rating').value),
        content: document.getElementById('modal-rev-content').value.trim()
    };

    await window.harmonyDB.saveReview(reviewData);

    const successMsg = document.getElementById('modal-rev-success');
    if (successMsg) {
        successMsg.style.display = 'block';
        form.reset();

        setTimeout(() => {
            successMsg.style.display = 'none';
            restoreBtn();
            window.openQuickView(villaId);
        }, 1500);
    }
};

// ==========================================
// PARTNER CONSIGNMENT MODAL CONTROLLER
// ==========================================
let partnerImageUrl = "";

window.openPartnerModal = function(event) {
    if (event) event.preventDefault();
    const modal = document.getElementById('partner-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

window.closePartnerModal = function() {
    const modal = document.getElementById('partner-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

window.submitPartnerConsignment = async function(event) {
    event.preventDefault();
    if (!window.harmonyDB) return;

    const restoreBtn = setSubmitLoading(document.getElementById('partner-submit-btn'), 'Đang gửi...');

    const name = document.getElementById('partner-name').value.trim();
    const phone = document.getElementById('partner-phone').value.trim();
    const villaName = document.getElementById('partner-villa-name').value.trim();
    const category = document.getElementById('partner-category').value;
    const price = document.getElementById('partner-price').value.trim();
    const address = document.getElementById('partner-address').value.trim();
    const bedrooms = parseInt(document.getElementById('partner-bedrooms').value) || 1;
    const bathrooms = parseInt(document.getElementById('partner-bathrooms').value) || 1;
    const capacity = parseInt(document.getElementById('partner-capacity').value) || 1;
    const description = document.getElementById('partner-description').value.trim();

    // Collect checked amenities
    const checkedBoxes = document.querySelectorAll('input[name="partner-amenity"]:checked');
    const amenities = Array.from(checkedBoxes).map(cb => cb.value);

    // Save consignment as pending approval villa
    const villaData = {
        name: villaName,
        category: category,
        address: address,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        capacity: capacity,
        price: price,
        description: description,
        shortDescription: description.substring(0, 120) + (description.length > 120 ? '...' : ''),
        amenities: amenities,
        image: partnerImageUrl || "asset/luxury_villa_1.png", // fallback image if empty
        partnerName: name,
        partnerPhone: phone,
        approvalStatus: 'pending' // start as pending approval!
    };

    const saveResult = await window.harmonyDB.saveVilla(villaData);
    if (!saveResult.success) {
        restoreBtn();
        alert("Gửi ký gửi THẤT BẠI:\n" + saveResult.error + "\n\nVui lòng thử lại.");
        return;
    }

    const successMsg = document.getElementById('partner-form-success');
    if (successMsg) {
        successMsg.style.display = 'block';
        document.getElementById('partner-consignment-form').reset();

        // Hide image preview
        const prevDiv = document.getElementById('partner-image-preview');
        if (prevDiv) prevDiv.style.display = 'none';
        partnerImageUrl = "";

        setTimeout(() => {
            successMsg.style.display = 'none';
            restoreBtn();
            window.closePartnerModal();
            // Refresh grid if on homepage
            if (typeof applyFilters === 'function') {
                applyFilters();
            }
        }, 3000);
    }
};

// Check if openPartner=true is in URL on homepage load
function checkPartnerDeepLink() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openPartner') === 'true') {
        window.openPartnerModal();
        // Remove param from URL without reloading for clean UI
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({path: cleanUrl}, '', cleanUrl);
    }
}
