// Database logic using Supabase for The Harmony - Booking Villa Đà Lạt
// Every function here is async now (real network calls instead of localStorage).

function client() {
    return window.supabaseClient;
}

// --- Row <-> app-shape mappers (DB uses snake_case, app uses camelCase) ---

function mapVillaRow(row) {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        address: row.address,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        capacity: row.capacity,
        price: row.price,
        image: row.image,
        images: row.images || [],
        amenities: row.amenities || [],
        shortDescription: row.short_description,
        description: row.description,
        featured: row.featured,
        approvalStatus: row.approval_status,
        partnerName: row.partner_name,
        partnerPhone: row.partner_phone,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function mapDestinationRow(row) {
    return {
        id: row.id,
        title: row.title,
        category: row.category,
        address: row.address,
        image: row.image,
        shortDescription: row.short_description,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function mapBookingRow(row) {
    return {
        id: row.id,
        villaId: row.villa_id,
        villaName: row.villa_name,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        checkIn: row.check_in,
        guests: row.guests,
        note: row.note,
        status: row.status,
        createdAt: row.created_at
    };
}

function mapReviewRow(row) {
    return {
        id: row.id,
        villaId: row.villa_id,
        avatar: row.avatar,
        name: row.name,
        date: row.date,
        rating: row.rating,
        content: row.content,
        createdAt: row.created_at
    };
}

// --- VILLAS ---

async function getAllVillas() {
    const { data, error } = await client().from('villas').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getAllVillas error:', error); return []; }
    return (data || []).map(mapVillaRow);
}

async function getVillaById(id) {
    const { data, error } = await client().from('villas').select('*').eq('id', id).maybeSingle();
    if (error) { console.error('getVillaById error:', error); return null; }
    return data ? mapVillaRow(data) : null;
}

async function saveVilla(villaData) {
    const row = {
        name: villaData.name,
        category: villaData.category,
        address: villaData.address,
        bedrooms: villaData.bedrooms,
        bathrooms: villaData.bathrooms,
        capacity: villaData.capacity,
        price: villaData.price,
        image: villaData.image,
        images: villaData.images || [],
        amenities: villaData.amenities || [],
        short_description: villaData.shortDescription,
        description: villaData.description,
        featured: !!villaData.featured,
        approval_status: villaData.approvalStatus !== undefined ? villaData.approvalStatus : null,
        partner_name: villaData.partnerName,
        partner_phone: villaData.partnerPhone
    };

    if (villaData.id) {
        row.updated_at = new Date().toISOString();
        const { error } = await client().from('villas').update(row).eq('id', villaData.id);
        if (error) { console.error('saveVilla (update) error:', error); return { success: false, error: error.message }; }
        return { success: true };
    }

    row.id = 'villa-' + Date.now();
    row.created_at = new Date().toISOString();
    const { error } = await client().from('villas').insert(row);
    if (error) { console.error('saveVilla (insert) error:', error); return { success: false, error: error.message }; }
    return { success: true };
}

async function deleteVilla(id) {
    const { error } = await client().from('villas').delete().eq('id', id);
    if (error) { console.error('deleteVilla error:', error); return false; }
    return true;
}

// --- DESTINATIONS ---

async function getAllDestinations() {
    const { data, error } = await client().from('destinations').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getAllDestinations error:', error); return []; }
    return (data || []).map(mapDestinationRow);
}

async function getDestinationById(id) {
    const { data, error } = await client().from('destinations').select('*').eq('id', id).maybeSingle();
    if (error) { console.error('getDestinationById error:', error); return null; }
    return data ? mapDestinationRow(data) : null;
}

async function saveDestination(destData) {
    const row = {
        title: destData.title,
        category: destData.category,
        address: destData.address,
        image: destData.image,
        short_description: destData.shortDescription,
        description: destData.description
    };

    if (destData.id) {
        row.updated_at = new Date().toISOString();
        const { error } = await client().from('destinations').update(row).eq('id', destData.id);
        if (error) { console.error('saveDestination (update) error:', error); return { success: false, error: error.message }; }
        return { success: true };
    }

    row.id = 'dest-' + Date.now();
    row.created_at = new Date().toISOString();
    const { error } = await client().from('destinations').insert(row);
    if (error) { console.error('saveDestination (insert) error:', error); return { success: false, error: error.message }; }
    return { success: true };
}

async function deleteDestination(id) {
    const { error } = await client().from('destinations').delete().eq('id', id);
    if (error) { console.error('deleteDestination error:', error); return false; }
    return true;
}

// --- BOOKING/CONTACT REQUESTS ---

async function getAllBookings() {
    const { data, error } = await client().from('bookings').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getAllBookings error:', error); return []; }
    return (data || []).map(mapBookingRow);
}

async function saveBooking(bookingData) {
    const row = {
        id: 'booking-' + Date.now(),
        villa_id: bookingData.villaId,
        villa_name: bookingData.villaName,
        customer_name: bookingData.customerName,
        customer_phone: bookingData.customerPhone,
        check_in: bookingData.checkIn || null,
        guests: bookingData.guests || null,
        note: bookingData.note,
        status: bookingData.status || 'pending',
        created_at: new Date().toISOString()
    };
    const { error } = await client().from('bookings').insert(row);
    if (error) { console.error('saveBooking error:', error); return null; }
    return mapBookingRow(row);
}

async function updateBookingStatus(id, status) {
    const { error } = await client().from('bookings').update({ status }).eq('id', id);
    if (error) { console.error('updateBookingStatus error:', error); return false; }
    return true;
}

async function deleteBooking(id) {
    const { error } = await client().from('bookings').delete().eq('id', id);
    if (error) { console.error('deleteBooking error:', error); return false; }
    return true;
}

// --- REVIEWS ---

async function getAllReviews() {
    const { data, error } = await client().from('reviews').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getAllReviews error:', error); return []; }
    return (data || []).map(mapReviewRow);
}

async function getReviewsByVillaId(villaId) {
    const { data, error } = await client().from('reviews').select('*').eq('villa_id', villaId).order('created_at', { ascending: false });
    if (error) { console.error('getReviewsByVillaId error:', error); return []; }
    return (data || []).map(mapReviewRow);
}

async function saveReview(reviewData) {
    const row = {
        id: 'rev-' + Date.now(),
        villa_id: reviewData.villaId,
        avatar: reviewData.avatar,
        name: reviewData.name,
        date: reviewData.date,
        rating: reviewData.rating,
        content: reviewData.content,
        created_at: new Date().toISOString()
    };
    const { error } = await client().from('reviews').insert(row);
    if (error) { console.error('saveReview error:', error); return null; }
    return mapReviewRow(row);
}

async function getVillaRatingStats(villaId) {
    const reviews = await getReviewsByVillaId(villaId);
    if (reviews.length === 0) {
        return { average: 5.0, count: 0 };
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = parseFloat((sum / reviews.length).toFixed(1));

    return {
        average: isNaN(average) ? 5.0 : average,
        count: reviews.length
    };
}

// Returns the % of reviews at each star level (5 down to 1) for a villa
async function getVillaRatingDistribution(villaId) {
    const reviews = await getReviewsByVillaId(villaId);
    const total = reviews.length;

    return [5, 4, 3, 2, 1].map(star => {
        const count = reviews.filter(r => r.rating === star).length;
        return {
            star: star,
            count: count,
            percent: total === 0 ? 0 : Math.round((count / total) * 100)
        };
    });
}

// --- IMAGES (Supabase Storage) ---

async function uploadVillaImage(file) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await client().storage.from('villa-images').upload(path, file);
    if (error) { console.error('uploadVillaImage error:', error); return null; }
    const { data } = client().storage.from('villa-images').getPublicUrl(path);
    return data.publicUrl;
}

// Export functions to global scope
window.harmonyDB = {
    getAllVillas,
    getVillaById,
    saveVilla,
    deleteVilla,

    getAllDestinations,
    getDestinationById,
    saveDestination,
    deleteDestination,

    getAllBookings,
    saveBooking,
    updateBookingStatus,
    deleteBooking,

    getAllReviews,
    getReviewsByVillaId,
    saveReview,
    getVillaRatingStats,
    getVillaRatingDistribution,

    uploadVillaImage
};
