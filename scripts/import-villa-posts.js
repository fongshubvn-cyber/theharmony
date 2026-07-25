// Reads villa-post/<folder>/(info.txt + images), copies images into asset/villa-post/,
// and writes villa-post-import.json for the admin dashboard's "Nhập Hàng Loạt" button.
//
// Usage: node scripts/import-villa-posts.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'villa-post');
const ASSET_OUT_DIR = path.join(ROOT, 'asset', 'villa-post');
const OUTPUT_FILE = path.join(ROOT, 'villa-post-import.json');

const VALID_CATEGORIES = ['villa-giadinh', 'villa-tamtrung', 'villa-caocap', 'home-giadinh', 'home-nhomban'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const FALLBACK_IMAGE = 'asset/luxury_villa_1.png';

function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip diacritics
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'villa';
}

function parseInfoFile(rawText, folderName, warnings) {
    const lines = rawText.replace(/\r\n/g, '\n').split('\n');
    const separatorIndex = lines.findIndex(line => line.trim() === '---');

    const headerLines = separatorIndex === -1 ? lines : lines.slice(0, separatorIndex);
    let contentLines = separatorIndex === -1 ? [] : lines.slice(separatorIndex + 1);

    if (contentLines.length && contentLines[0].trim().toUpperCase().startsWith('NOI_DUNG:')) {
        contentLines = contentLines.slice(1);
    }

    const fields = {};
    headerLines.forEach(line => {
        const match = line.match(/^([A-Z_]+):\s*(.*)$/i);
        if (match) {
            fields[match[1].toUpperCase()] = match[2].trim();
        }
    });

    // Blank lines separate paragraphs; a single newline is just soft word-wrap
    // from the text file and should read as a space, not a forced line break.
    const rawContent = contentLines.join('\n').trim();
    const content = rawContent
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map(paragraph => paragraph.replace(/\s*\n\s*/g, ' ').trim())
        .join('\n\n');

    if (!fields.TITLE) {
        warnings.push(`[${folderName}] Thiếu TITLE — dùng tên folder làm tên villa.`);
    }
    if (!content) {
        warnings.push(`[${folderName}] Không có nội dung mô tả (NOI_DUNG).`);
    }

    let category = (fields.PHAN_KHUC || '').trim();
    if (!VALID_CATEGORIES.includes(category)) {
        warnings.push(`[${folderName}] PHAN_KHUC "${category || '(trống)'}" không hợp lệ — mặc định "villa-tamtrung".`);
        category = 'villa-tamtrung';
    }

    const bedrooms = parseInt(fields.PHONG_NGU, 10);
    const bathrooms = parseInt(fields.PHONG_TAM, 10);
    const capacity = parseInt(fields.SUC_CHUA, 10);
    if (!bedrooms) warnings.push(`[${folderName}] Thiếu/sai PHONG_NGU — mặc định 2.`);
    if (!bathrooms) warnings.push(`[${folderName}] Thiếu/sai PHONG_TAM — mặc định 2.`);
    if (!capacity) warnings.push(`[${folderName}] Thiếu/sai SUC_CHUA — mặc định 6.`);

    const amenities = (fields.TIEN_ICH || '')
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);
    if (amenities.length === 0) {
        warnings.push(`[${folderName}] Không có TIEN_ICH nào được liệt kê.`);
    }

    const paragraphs = content.split(/\n\s*\n/).filter(Boolean);
    let shortDescription = (paragraphs[0] || '').replace(/\n/g, ' ').trim();
    if (shortDescription.length > 160) {
        shortDescription = shortDescription.slice(0, 157).trim() + '...';
    }

    return {
        name: fields.TITLE || folderName,
        category: category,
        address: fields.DIA_CHI || 'Đà Lạt',
        bedrooms: bedrooms || 2,
        bathrooms: bathrooms || 2,
        capacity: capacity || 6,
        price: fields.GIA || 'Liên hệ trực tiếp',
        amenities: amenities,
        shortDescription: shortDescription || 'Chỗ nghỉ tại Đà Lạt.',
        description: content || 'Đang cập nhật mô tả chi tiết.',
        featured: (fields.NOI_BAT || '').trim().toLowerCase() === 'true'
    };
}

function collectImages(folderPath) {
    return fs.readdirSync(folderPath)
        .filter(f => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
        .sort((a, b) => a.localeCompare(b, 'vi'));
}

function main() {
    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`Không tìm thấy thư mục: ${SOURCE_DIR}`);
        process.exit(1);
    }

    const folders = fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
        .map(d => d.name);

    if (folders.length === 0) {
        console.log('Không có folder villa nào trong villa-post/ (bỏ qua _TEMPLATE và folder ẩn).');
        return;
    }

    const warnings = [];
    const villas = [];

    folders.forEach(folderName => {
        const folderPath = path.join(SOURCE_DIR, folderName);
        const infoPath = path.join(folderPath, 'info.txt');

        if (!fs.existsSync(infoPath)) {
            warnings.push(`[${folderName}] Bỏ qua — không tìm thấy info.txt.`);
            return;
        }

        const rawText = fs.readFileSync(infoPath, 'utf8');
        const parsed = parseInfoFile(rawText, folderName, warnings);

        const imageFiles = collectImages(folderPath);
        let imagePaths;
        if (imageFiles.length === 0) {
            warnings.push(`[${folderName}] Không có ảnh nào — dùng ảnh mặc định tạm thời.`);
            imagePaths = [FALLBACK_IMAGE];
        } else {
            const slug = slugify(folderName);
            const destDir = path.join(ASSET_OUT_DIR, slug);
            fs.mkdirSync(destDir, { recursive: true });
            imagePaths = imageFiles.map(fileName => {
                fs.copyFileSync(path.join(folderPath, fileName), path.join(destDir, fileName));
                return `asset/villa-post/${slug}/${fileName}`.replace(/\\/g, '/');
            });
        }

        villas.push({
            ...parsed,
            image: imagePaths[0],
            images: imagePaths,
            createdAt: new Date().toISOString()
        });
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(villas, null, 2), 'utf8');

    console.log(`\nĐã xử lý ${villas.length}/${folders.length} villa.`);
    console.log(`Đã ghi: ${path.relative(ROOT, OUTPUT_FILE)}`);
    if (villas.some(v => v.images[0] !== FALLBACK_IMAGE)) {
        console.log(`Ảnh đã được copy vào: ${path.relative(ROOT, ASSET_OUT_DIR)}/`);
    }

    if (warnings.length > 0) {
        console.log(`\n⚠ ${warnings.length} cảnh báo:`);
        warnings.forEach(w => console.log('  - ' + w));
        console.log('\nVào trang Quản Trị sau khi nhập để chỉnh lại các villa bị cảnh báo ở trên.');
    }

    console.log('\nBước tiếp theo: Trang Quản Trị → tab Quản Lý Villa → nút "Nhập Hàng Loạt" → chọn file villa-post-import.json');
}

main();
