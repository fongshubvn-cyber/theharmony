// Backend Admin Dashboard logic for The Harmony - Booking Villa Đà Lạt

let villasList = [];
let currentMainImageBase64 = "";
let currentGalleryImagesBase64 = [];

document.addEventListener('DOMContentLoaded', () => {
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

        // Close menu when clicking link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = navToggle.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars';
            });
        });
    }

    // Check login state
    const loggedIn = sessionStorage.getItem('harmony_logged_in') === 'true';
    const loginScreen = document.getElementById('admin-login-screen');
    const dashboard = document.getElementById('admin-main-dashboard');

    if (!loggedIn) {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashboard) dashboard.style.display = 'none';

        // Setup login form submission
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('login-username').value.trim();
                const password = document.getElementById('login-password').value;
                const errorMsg = document.getElementById('login-error-msg');

                if (username === 'admin' && password === '123456A!') {
                    sessionStorage.setItem('harmony_logged_in', 'true');
                    if (errorMsg) errorMsg.style.display = 'none';
                    alert("Đăng nhập quản trị thành công!");
                    window.location.reload();
                } else {
                    if (errorMsg) errorMsg.style.display = 'flex';
                }
            });
        }
        return; // Halt initialization of dashboard elements
    }

    // If logged in, initialize dashboard
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';

    // Setup Logout event listener
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị?")) {
                sessionStorage.removeItem('harmony_logged_in');
                window.location.reload();
            }
        });
    }

    // Refresh the table and stats
    refreshAdminDashboard();

    // Tab switcher logic
    const tabVillasBtn = document.getElementById('tab-villas-btn');
    const tabDestinationsBtn = document.getElementById('tab-destinations-btn');
    const tabBookingsBtn = document.getElementById('tab-bookings-btn');
    const villasManagerView = document.getElementById('villas-manager-view');
    const destinationsManagerView = document.getElementById('destinations-manager-view');
    const bookingsManagerView = document.getElementById('bookings-manager-view');
    const btnAddVilla = document.getElementById('btn-add-villa');
    const btnAddDest = document.getElementById('btn-add-dest');

    if (tabVillasBtn && tabDestinationsBtn && tabBookingsBtn) {
        tabVillasBtn.addEventListener('click', () => {
            tabVillasBtn.classList.add('active');
            tabDestinationsBtn.classList.remove('active');
            tabBookingsBtn.classList.remove('active');
            villasManagerView.classList.add('active');
            destinationsManagerView.classList.remove('active');
            bookingsManagerView.classList.remove('active');
            btnAddVilla.style.display = 'inline-flex';
            btnAddDest.style.display = 'none';
            refreshAdminDashboard();
        });

        tabDestinationsBtn.addEventListener('click', () => {
            tabDestinationsBtn.classList.add('active');
            tabVillasBtn.classList.remove('active');
            tabBookingsBtn.classList.remove('active');
            destinationsManagerView.classList.add('active');
            villasManagerView.classList.remove('active');
            bookingsManagerView.classList.remove('active');
            btnAddDest.style.display = 'inline-flex';
            btnAddVilla.style.display = 'none';
            refreshAdminDashboard();
        });

        tabBookingsBtn.addEventListener('click', () => {
            tabBookingsBtn.classList.add('active');
            tabVillasBtn.classList.remove('active');
            tabDestinationsBtn.classList.remove('active');
            bookingsManagerView.classList.add('active');
            villasManagerView.classList.remove('active');
            destinationsManagerView.classList.remove('active');
            btnAddVilla.style.display = 'none';
            btnAddDest.style.display = 'none';
            refreshBookingsTab();
        });
    }

    // Event listeners for Villa
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const villaForm = document.getElementById('villa-form');
    const mainImageFileInput = document.getElementById('villa-main-image-file');
    const galleryFileInput = document.getElementById('villa-gallery-files');

    if (btnAddVilla) btnAddVilla.addEventListener('click', () => openModal());
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (villaForm) villaForm.addEventListener('submit', handleFormSubmit);

    // Event listeners for Destinations
    const btnCancelDestModal = document.getElementById('btn-cancel-dest-modal');
    const btnCloseDestModal = document.getElementById('btn-close-dest-modal');
    const destForm = document.getElementById('destination-form');
    const destImageFileInput = document.getElementById('dest-image-file');

    if (btnAddDest) btnAddDest.addEventListener('click', () => openDestModal());
    if (btnCancelDestModal) btnCancelDestModal.addEventListener('click', closeDestModal);
    if (btnCloseDestModal) btnCloseDestModal.addEventListener('click', closeDestModal);
    if (destForm) destForm.addEventListener('submit', handleDestFormSubmit);

    // Reset database listener
    const btnResetDb = document.getElementById('btn-reset-db');
    if (btnResetDb) {
        btnResetDb.addEventListener('click', () => {
            if (confirm("Bạn có chắc chắn muốn KHÔI PHỤC DỮ LIỆU GỐC? Tất cả những biệt thự và điểm du lịch tự thêm hoặc chỉnh sửa sẽ bị xóa.")) {
                if (window.harmonyDB) {
                    window.harmonyDB.resetDatabase();
                    window.harmonyDB.resetDestinationsDatabase();
                    refreshAdminDashboard();
                    alert("Đã khôi phục dữ liệu gốc thành công!");
                }
            }
        });
    }

    // Convert villa main image file to Base64 on upload
    if (mainImageFileInput) {
        mainImageFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    currentMainImageBase64 = event.target.result;
                    renderMainImagePreview(currentMainImageBase64);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Convert villa gallery images files to Base64 on upload
    if (galleryFileInput) {
        galleryFileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            let processed = 0;
            
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    currentGalleryImagesBase64.push(event.target.result);
                    processed++;
                    if (processed === files.length) {
                        renderGalleryPreview();
                    }
                };
                reader.readAsDataURL(file);
            });
            // Clear input value so same files can be selected again
            galleryFileInput.value = "";
        });
    }

    // Convert destination image file to Base64 on upload
    if (destImageFileInput) {
        destImageFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    currentDestImageBase64 = event.target.result;
                    renderDestImagePreview(currentDestImageBase64);
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

function refreshAdminDashboard() {
    if (!window.harmonyDB) return;
    
    // 1. Refresh Villas
    villasList = window.harmonyDB.getAllVillas();
    const total = villasList.length;
    const family = villasList.filter(v => v.category === 'family').length;
    const luxury = villasList.filter(v => v.category === 'luxury').length;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-family').innerText = family;
    document.getElementById('stat-luxury').innerText = luxury;
    renderAdminTable(villasList);

    // 2. Refresh Destinations
    const dests = window.harmonyDB.getAllDestinations();
    const destTotal = dests.length;
    const destCafe = dests.filter(d => d.category === 'cafe' || d.category === 'checkin').length;
    const destSightseeing = dests.filter(d => d.category === 'sightseeing').length;

    document.getElementById('stat-dest-total').innerText = destTotal;
    document.getElementById('stat-dest-cafe').innerText = destCafe;
    document.getElementById('stat-dest-sightseeing').innerText = destSightseeing;
    renderDestinationsTable(dests);

    // 3. Refresh Bookings Notification Badge
    if (window.harmonyDB.getAllBookings) {
        const bookings = window.harmonyDB.getAllBookings();
        const pendingBookings = bookings.filter(b => b.status === 'pending').length;
        const tabBtn = document.getElementById('tab-bookings-btn');
        if (tabBtn) {
            const oldBadge = tabBtn.querySelector('.badge-notification');
            if (oldBadge) oldBadge.remove();
            if (pendingBookings > 0) {
                tabBtn.innerHTML += ` <span class="badge-notification" style="background-color: #ef4444; color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.75rem; font-weight: bold; margin-left: 5px;">${pendingBookings}</span>`;
            }
        }
    }
}

function renderAdminTable(villas) {
    const tbody = document.getElementById('admin-villa-tbody');
    if (!tbody) return;

    if (villas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 40px; color: var(--color-text-muted);">
                    Không có villa nào trong hệ thống. Hãy đăng villa mới hoặc nhấn nút khôi phục dữ liệu gốc.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = villas.map(villa => {
        const isLuxury = villa.category === 'luxury';
        const badgeLabel = isLuxury ? 'Luxury' : 'Gia Đình';
        
        return `
            <tr>
                <td>
                    <div class="table-villa-info">
                        <img src="${villa.image || 'asset/luxury_villa_1.png'}" class="table-villa-img" alt="${villa.name}">
                        <div>
                            <div class="table-villa-title">${villa.name}</div>
                            <small style="color: var(--color-text-muted); display: block; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                <i class="fa-solid fa-location-dot"></i> ${villa.address}
                            </small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="table-badge ${villa.category}">${badgeLabel}</span>
                </td>
                <td><strong>${villa.bedrooms} PN</strong></td>
                <td>Tối đa <strong>${villa.capacity}</strong> khách</td>
                <td style="color: var(--color-accent-hover); font-weight: 600;">${villa.price || 'Liên hệ'}</td>
                <td>
                    <div class="table-actions">
                        <button onclick="editVilla('${villa.id}')" class="action-icon-btn edit" title="Chỉnh sửa thông tin">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onclick="deleteVillaItem('${villa.id}')" class="action-icon-btn delete" title="Xóa villa">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Open modal for adding a new villa
function openModal() {
    const modal = document.getElementById('villa-modal');
    const form = document.getElementById('villa-form');
    
    // Reset Form
    form.reset();
    document.getElementById('villa-id').value = "";
    document.getElementById('modal-title').innerText = "Đăng Villa Mới";
    
    // Reset image states
    currentMainImageBase64 = "";
    currentGalleryImagesBase64 = [];
    document.getElementById('main-image-preview').innerHTML = "";
    document.getElementById('gallery-images-preview').innerHTML = "";
    
    // Uncheck featured and amenities
    document.getElementById('villa-featured').checked = false;
    const checkboxes = document.querySelectorAll('#amenities-checkboxes input[type="checkbox"]');
    checkboxes.forEach(c => c.checked = false);

    modal.classList.add('active');
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('villa-modal');
    modal.classList.remove('active');
}

// Open modal populated with villa data for editing
window.editVilla = function(id) {
    if (!window.harmonyDB) return;
    
    const villa = window.harmonyDB.getVillaById(id);
    if (!villa) {
        alert("Không tìm thấy villa cần sửa!");
        return;
    }

    openModal(); // Reset form states and open

    // Populate data
    document.getElementById('villa-id').value = villa.id;
    document.getElementById('modal-title').innerText = "Chỉnh Sửa Villa";
    document.getElementById('villa-name').value = villa.name;
    document.getElementById('villa-category').value = villa.category;
    document.getElementById('villa-price').value = villa.price || "Liên hệ trực tiếp";
    document.getElementById('villa-address').value = villa.address;
    document.getElementById('villa-bedrooms').value = villa.bedrooms;
    document.getElementById('villa-bathrooms').value = villa.bathrooms;
    document.getElementById('villa-capacity').value = villa.capacity;
    document.getElementById('villa-featured').checked = !!villa.featured;
    document.getElementById('villa-short-desc').value = villa.shortDescription;
    document.getElementById('villa-desc').value = villa.description;

    // Amenities checkboxes selection
    const checkboxes = document.querySelectorAll('#amenities-checkboxes input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = villa.amenities && villa.amenities.includes(cb.value);
    });

    // Handle images
    currentMainImageBase64 = villa.image || "";
    if (currentMainImageBase64) {
        renderMainImagePreview(currentMainImageBase64);
    }

    currentGalleryImagesBase64 = villa.images ? [...villa.images] : [];
    if (currentGalleryImagesBase64.length > 0) {
        renderGalleryPreview();
    }
};

// Delete a villa
window.deleteVillaItem = function(id) {
    if (!window.harmonyDB) return;
    
    if (confirm("Bạn có chắc chắn muốn XÓA villa này khỏi danh sách?")) {
        window.harmonyDB.deleteVilla(id);
        refreshAdminDashboard();
        alert("Đã xóa villa thành công!");
    }
};

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    if (!window.harmonyDB) return;

    // Gather Form values
    const id = document.getElementById('villa-id').value;
    const name = document.getElementById('villa-name').value.trim();
    const category = document.getElementById('villa-category').value;
    const price = document.getElementById('villa-price').value.trim();
    const address = document.getElementById('villa-address').value.trim();
    const bedrooms = parseInt(document.getElementById('villa-bedrooms').value);
    const bathrooms = parseInt(document.getElementById('villa-bathrooms').value);
    const capacity = parseInt(document.getElementById('villa-capacity').value);
    const featured = document.getElementById('villa-featured').checked;
    const shortDescription = document.getElementById('villa-short-desc').value.trim();
    const description = document.getElementById('villa-desc').value.trim();

    // Check if main image is uploaded
    if (!currentMainImageBase64) {
        alert("Vui lòng tải lên hình ảnh đại diện chính cho villa.");
        return;
    }

    // Selected amenities
    const selectedAmenities = [];
    const checkboxes = document.querySelectorAll('#amenities-checkboxes input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        selectedAmenities.push(cb.value);
    });

    // Make sure gallery contains at least the main image if empty
    const galleryList = currentGalleryImagesBase64.length > 0 
        ? currentGalleryImagesBase64 
        : [currentMainImageBase64];

    const villaData = {
        name,
        category,
        price,
        address,
        bedrooms,
        bathrooms,
        capacity,
        featured,
        amenities: selectedAmenities,
        shortDescription,
        description,
        image: currentMainImageBase64,
        images: galleryList
    };

    if (id) {
        villaData.id = id;
    }

    // Save to Database
    window.harmonyDB.saveVilla(villaData);
    
    // Close modal, notify, refresh dashboard
    closeModal();
    refreshAdminDashboard();
    
    alert(id ? "Cập nhật villa thành công!" : "Đăng villa mới thành công!");
}

// Render main image preview
function renderMainImagePreview(src) {
    const container = document.getElementById('main-image-preview');
    if (!container) return;
    
    container.innerHTML = `
        <div class="image-preview-item">
            <img src="${src}" alt="Main Image Preview">
            <button type="button" class="image-preview-remove" onclick="removeMainImage()">&times;</button>
        </div>
    `;
}

window.removeMainImage = function() {
    currentMainImageBase64 = "";
    document.getElementById('main-image-preview').innerHTML = "";
    document.getElementById('villa-main-image-file').value = "";
};

// Render gallery images preview
function renderGalleryPreview() {
    const container = document.getElementById('gallery-images-preview');
    if (!container) return;
    
    container.innerHTML = currentGalleryImagesBase64.map((src, index) => `
        <div class="image-preview-item">
            <img src="${src}" alt="Gallery Preview ${index}">
            <button type="button" class="image-preview-remove" onclick="removeGalleryImage(${index})">&times;</button>
        </div>
    `).join('');
}

window.removeGalleryImage = function(index) {
    currentGalleryImagesBase64.splice(index, 1);
    renderGalleryPreview();
};

// =========================================================================
// DESTINATIONS (TOPLIST) CRUD LOGIC
// =========================================================================

let currentDestImageBase64 = "";

// Render destinations table rows
function renderDestinationsTable(dests) {
    const tbody = document.getElementById('admin-dest-tbody');
    if (!tbody) return;

    if (dests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center" style="padding: 40px; color: var(--color-text-muted);">
                    Không có gợi ý điểm đến nào. Nhấp nút "Đăng Điểm Đến Mới" để thêm địa điểm.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = dests.map(dest => {
        let catBadge = "";
        if (dest.category === 'checkin') {
            catBadge = `<span class="table-badge" style="background-color: rgba(59, 130, 246, 0.1); color: #3b82f6;">Check-in</span>`;
        } else if (dest.category === 'cafe') {
            catBadge = `<span class="table-badge" style="background-color: rgba(245, 158, 11, 0.1); color: #f59e0b;">Cà phê</span>`;
        } else if (dest.category === 'sightseeing') {
            catBadge = `<span class="table-badge" style="background-color: rgba(16, 185, 129, 0.1); color: #10b981;">Tham quan</span>`;
        } else if (dest.category === 'food') {
            catBadge = `<span class="table-badge" style="background-color: rgba(239, 68, 68, 0.1); color: #ef4444;">Ẩm thực</span>`;
        } else {
            catBadge = `<span class="table-badge">${dest.category}</span>`;
        }

        return `
            <tr>
                <td>
                    <div class="table-villa-info">
                        <img src="${dest.image || 'asset/dest_lake.png'}" class="table-villa-img" alt="${dest.title}">
                        <div>
                            <div class="table-villa-title" style="font-weight: 600;">${dest.title}</div>
                        </div>
                    </div>
                </td>
                <td>${catBadge}</td>
                <td>
                    <small style="color: var(--color-text-muted);">
                        <i class="fa-solid fa-location-dot"></i> ${dest.address}
                    </small>
                </td>
                <td>
                    <div class="table-actions">
                        <button onclick="editDestination('${dest.id}')" class="action-icon-btn edit" title="Chỉnh sửa">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onclick="deleteDestinationItem('${dest.id}')" class="action-icon-btn delete" title="Xóa điểm đến">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Open modal for destinations
function openDestModal() {
    const modal = document.getElementById('destination-modal');
    const form = document.getElementById('destination-form');
    
    form.reset();
    document.getElementById('dest-id').value = "";
    document.getElementById('dest-modal-title').innerText = "Đăng Điểm Đến Mới";
    
    currentDestImageBase64 = "";
    document.getElementById('dest-image-preview').innerHTML = "";
    document.getElementById('dest-image-url').value = "";
    
    modal.classList.add('active');
}

function closeDestModal() {
    const modal = document.getElementById('destination-modal');
    modal.classList.remove('active');
}

// Open modal and populate for editing destination
window.editDestination = function(id) {
    if (!window.harmonyDB) return;

    const dest = window.harmonyDB.getDestinationById(id);
    if (!dest) {
        alert("Không tìm thấy điểm đến yêu cầu!");
        return;
    }

    openDestModal();

    document.getElementById('dest-modal-title').innerText = "Chỉnh Sửa Điểm Đến";
    document.getElementById('dest-id').value = dest.id;
    document.getElementById('dest-title').value = dest.title;
    document.getElementById('dest-category').value = dest.category;
    document.getElementById('dest-address').value = dest.address;
    document.getElementById('dest-short-desc').value = dest.shortDescription;
    document.getElementById('dest-desc').value = dest.description;
    
    if (dest.image) {
        currentDestImageBase64 = dest.image;
        document.getElementById('dest-image-url').value = dest.image;
        renderDestImagePreview(dest.image);
    }
}

// Delete destination item
window.deleteDestinationItem = function(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa điểm đến này khỏi danh mục gợi ý?")) return;

    if (window.harmonyDB && window.harmonyDB.deleteDestination(id)) {
        refreshAdminDashboard();
        alert("Đã xóa điểm đến thành công!");
    }
}

// Submit handler for destinations form
function handleDestFormSubmit(e) {
    e.preventDefault();

    if (!window.harmonyDB) return;

    const id = document.getElementById('dest-id').value;
    const title = document.getElementById('dest-title').value.trim();
    const category = document.getElementById('dest-category').value;
    const address = document.getElementById('dest-address').value.trim();
    const shortDescription = document.getElementById('dest-short-desc').value.trim();
    const description = document.getElementById('dest-desc').value.trim();
    const existingImageUrl = document.getElementById('dest-image-url').value;

    let finalImageUrl = currentDestImageBase64 || existingImageUrl;

    if (!finalImageUrl) {
        alert("Vui lòng tải lên một hình ảnh đại diện cho điểm đến!");
        return;
    }

    const destData = {
        title,
        category,
        address,
        shortDescription,
        description,
        image: finalImageUrl
    };

    if (id) {
        destData.id = id;
    }

    // Save to Database
    window.harmonyDB.saveDestination(destData);
    
    // Close modal, refresh dashboard
    closeDestModal();
    refreshAdminDashboard();
    
    alert(id ? "Cập nhật điểm đến thành công!" : "Thêm mới điểm đến thành công!");
}

// Render destination image preview
function renderDestImagePreview(src) {
    const container = document.getElementById('dest-image-preview');
    if (!container) return;

    container.innerHTML = `
        <div class="image-preview-item">
            <img src="${src}" alt="Destination Preview">
            <button type="button" class="image-preview-remove" onclick="removeDestImage()">&times;</button>
        </div>
    `;
}

window.removeDestImage = function() {
    currentDestImageBase64 = "";
    document.getElementById('dest-image-preview').innerHTML = "";
    document.getElementById('dest-image-file').value = "";
    document.getElementById('dest-image-url').value = "";
};

// =========================================================================
// BOOKING / CONTACT REQUESTS CRUD LOGIC
// =========================================================================

function refreshBookingsTab() {
    if (!window.harmonyDB) return;

    const bookings = window.harmonyDB.getAllBookings();
    const total = bookings.length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const contacted = bookings.filter(b => b.status === 'contacted').length;

    document.getElementById('stat-booking-total').innerText = total;
    document.getElementById('stat-booking-pending').innerText = pending;
    document.getElementById('stat-booking-contacted').innerText = contacted;

    renderBookingsTable(bookings);
}

function renderBookingsTable(bookings) {
    const tbody = document.getElementById('admin-booking-tbody');
    if (!tbody) return;

    if (bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding: 40px; color: var(--color-text-muted);">
                    Chưa có yêu cầu tư vấn hay liên hệ nào từ khách hàng.
                </td>
            </tr>
        `;
        return;
    }

    // Sort bookings: pending first, then by date desc
    const sortedBookings = [...bookings].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    tbody.innerHTML = sortedBookings.map(b => {
        const dateText = b.createdAt ? new Date(b.createdAt).toLocaleString('vi-VN') : 'N/A';
        const checkInText = b.checkIn ? new Date(b.checkIn).toLocaleDateString('vi-VN') : 'Chưa định ngày';
        const guestsText = b.guests ? `${b.guests} khách` : 'N/A';
        
        let statusBadge = "";
        let actionBtn = "";

        if (b.status === 'pending') {
            statusBadge = `<span class="table-badge" style="background-color: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); display: inline-block; padding: 4px 10px; border-radius: 4px;">Chờ tư vấn</span>`;
            actionBtn = `
                <button onclick="markBookingContacted('${b.id}')" class="action-icon-btn edit" style="background-color: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);" title="Đánh dấu đã liên hệ">
                    <i class="fa-solid fa-check"></i>
                </button>
            `;
        } else {
            statusBadge = `<span class="table-badge" style="background-color: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); display: inline-block; padding: 4px 10px; border-radius: 4px;">Đã liên hệ</span>`;
            actionBtn = `
                <button onclick="markBookingPending('${b.id}')" class="action-icon-btn edit" style="background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2);" title="Đánh dấu chờ tư vấn">
                    <i class="fa-solid fa-rotate-left"></i>
                </button>
            `;
        }

        return `
            <tr>
                <td>
                    <div style="font-weight: bold; color: var(--color-primary);">${b.customerName}</div>
                    <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 4px;">
                        <i class="fa-solid fa-phone"></i> ${b.customerPhone}
                    </div>
                </td>
                <td>
                    <div style="font-weight: 500;">${b.villaName}</div>
                    <small style="color: var(--color-text-muted);">ID: ${b.villaId}</small>
                </td>
                <td>
                    <div><i class="fa-solid fa-calendar-days"></i> ${checkInText}</div>
                    <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 4px;">
                        <i class="fa-solid fa-user-group"></i> ${guestsText}
                    </div>
                </td>
                <td>
                    <div style="max-width: 250px; font-size: 0.85rem; color: var(--color-text-dark); white-space: normal; word-break: break-word; line-height: 1.4;">
                        ${b.note || '<span style="color: #bbb; font-style: italic;">Không có ghi chú</span>'}
                    </div>
                </td>
                <td>
                    <small style="color: var(--color-text-muted);">${dateText}</small>
                </td>
                <td>${statusBadge}</td>
                <td>
                    <div class="table-actions">
                        ${actionBtn}
                        <button onclick="deleteBookingItem('${b.id}')" class="action-icon-btn delete" title="Xóa yêu cầu">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.markBookingContacted = function(id) {
    if (window.harmonyDB && window.harmonyDB.updateBookingStatus(id, 'contacted')) {
        refreshBookingsTab();
        // Also update dashboard counts
        refreshAdminDashboard();
    }
};

window.markBookingPending = function(id) {
    if (window.harmonyDB && window.harmonyDB.updateBookingStatus(id, 'pending')) {
        refreshBookingsTab();
        // Also update dashboard counts
        refreshAdminDashboard();
    }
};

window.deleteBookingItem = function(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa yêu cầu tư vấn này khỏi hệ thống?")) return;

    if (window.harmonyDB && window.harmonyDB.deleteBooking(id)) {
        refreshBookingsTab();
        refreshAdminDashboard();
        alert("Đã xóa yêu cầu tư vấn thành công!");
    }
};
