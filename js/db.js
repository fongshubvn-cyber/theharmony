// Database logic using localStorage for The Harmony - Booking Villa Đà Lạt

const INITIAL_VILLAS = [
    {
        id: "harmony-villa-family-1",
        name: "The Harmony Family Pine Villa",
        category: "family",
        address: "Đường Khởi Nghĩa Bắc Sơn, Phường 10, Đà Lạt",
        bedrooms: 4,
        bathrooms: 4,
        capacity: 12,
        price: "Liên hệ trực tiếp",
        image: "asset/family_villa_1.png",
        images: [
            "asset/family_villa_1.png",
            "asset/family_villa_2.png"
        ],
        amenities: ["Bể bơi mini", "Sân nướng BBQ", "Khuôn viên sân vườn", "Phòng bếp đầy đủ tiện nghi", "Smart TV & Karaoke", "Chỗ đậu xe rộng rãi"],
        shortDescription: "Villa gia đình ấm cúng ẩn mình giữa rừng thông Đà Lạt xanh mát, thích hợp cho nhóm 8-12 người nghỉ dưỡng.",
        description: "The Harmony Family Pine Villa mang đến không gian yên bình tuyệt đối giữa rừng thông rì rào của Đà Lạt. Căn villa có lối kiến trúc hiện đại kết hợp các chi tiết gỗ ấm áp, mang lại cảm giác thân thuộc như chính ngôi nhà của bạn.\n\nVới thiết kế 4 phòng ngủ khép kín rộng rãi, đầy đủ ánh sáng tự nhiên từ hệ thống cửa kính lớn nhìn thẳng ra đồi thông, căn villa là lựa chọn hoàn hảo cho các gia đình hoặc nhóm bạn thân tìm kiếm sự riêng tư.\n\nSân vườn ngoài trời được thiết kế sẵn khu vực nướng BBQ tiện lợi, bàn ăn dài cho các buổi tối quây quần ấm cúng dưới làn sương mờ của Đà Lạt. Căn villa trang bị đầy đủ dụng cụ nấu nướng hiện đại, hệ thống âm thanh giải trí gia đình tiện ích.",
        featured: true,
        createdAt: "2026-07-17T12:00:00Z"
    },
    {
        id: "harmony-villa-luxury-1",
        name: "The Harmony Luxury Horizon Estate",
        category: "luxury",
        address: "Đường Đống Đa, Phường 3, Đà Lạt",
        bedrooms: 6,
        bathrooms: 7,
        capacity: 18,
        price: "Liên hệ trực tiếp",
        image: "asset/luxury_villa_1.png",
        images: [
            "asset/luxury_villa_1.png",
            "asset/luxury_villa_2.png"
        ],
        amenities: ["Hồ bơi vô cực nước ấm", "Sân BBQ ngoài trời siêu rộng", "Phòng chiếu phim gia đình", "Bàn Bi-a & Giải trí", "Phòng xông hơi Sauna", "Quản gia phục vụ 24/7", "View thung lũng 360 độ"],
        shortDescription: "Villa siêu sang view thung lũng mây 360 độ với bể bơi nước ấm vô cực đầu tiên tại Đà Lạt.",
        description: "Tọa lạc tại vị trí đắc địa trên đồi Đống Đa, The Harmony Luxury Horizon Estate là một kiệt tác kiến trúc hiện đại, mở ra tầm nhìn bao trọn thung lũng mây ngút ngàn và toàn cảnh thành phố Đà Lạt thơ mộng.\n\nVilla sở hữu 6 phòng ngủ hạng sang với bồn tắm nằm cao cấp view ngắm mây trời, phòng khách thông tầng ngập tràn ánh sáng và nội thất nhập khẩu xa xỉ. Điểm nhấn đắt giá nhất của dinh thự là hồ bơi vô cực tràn viền sử dụng hệ thống làm nóng nước hiện đại, giúp bạn thư thái ngâm mình ngắm hoàng hôn Đà Lạt rực rỡ.\n\nCác tiện ích đi kèm đẳng cấp bao gồm phòng chiếu phim mini tiêu chuẩn cao, khu giải trí có bàn Bi-a cao cấp, phòng xông hơi sauna đá nóng thư giãn. Đội ngũ quản gia chuyên nghiệp luôn sẵn sàng hỗ trợ chuẩn bị tiệc BBQ ngoài trời hay các bữa tiệc sang trọng theo yêu cầu.",
        featured: true,
        createdAt: "2026-07-17T12:10:00Z"
    },
    {
        id: "harmony-villa-family-2",
        name: "Pinecrest Cozy Family Retreat",
        category: "family",
        address: "Đường Hùng Vương, Phường 11, Đà Lạt",
        bedrooms: 3,
        bathrooms: 3,
        capacity: 8,
        price: "Liên hệ trực tiếp",
        image: "asset/family_villa_2.png",
        images: [
            "asset/family_villa_2.png",
            "asset/family_villa_1.png"
        ],
        amenities: ["Sân vườn nhiều hoa", "Bếp sưởi trong nhà", "Khu vui chơi trẻ em", "Dụng cụ BBQ ngoài trời", "Bếp nấu tự phục vụ"],
        shortDescription: "Villa phong cách Bắc Âu mộc mạc với lò sưởi ấm cúng và vườn hồng xinh xắn quanh năm khoe sắc.",
        description: "Pinecrest Cozy Family Retreat được thiết kế theo phong cách Cottage Bắc Âu với gạch đỏ và gỗ thông tự nhiên. Không gian mang tông màu ấm cúng chủ đạo, có lò sưởi đốt củi thật tại phòng khách - nơi gia đình bạn có thể cùng nhau nướng khoai và trò chuyện trong đêm lạnh Đà Lạt.\n\nVilla gồm 3 phòng ngủ nhỏ nhắn, thiết kế tinh tế với cửa sổ nhìn ra vườn hoa hồng ngoại quanh nhà. Sân vườn ngập tràn hoa cỏ là không gian lý tưởng để đọc sách, uống trà chiều, hay để trẻ nhỏ vui chơi an toàn. Căn bếp nhỏ đầy đủ gia vị sẵn sàng để bạn trổ tài nấu nướng cho gia đình.",
        featured: false,
        createdAt: "2026-07-17T12:20:00Z"
    },
    {
        id: "harmony-villa-luxury-2",
        name: "The Harmony Obsidian Mansion",
        category: "luxury",
        address: "Phường 11 (Khu Trại Mát), Đà Lạt",
        bedrooms: 5,
        bathrooms: 6,
        capacity: 15,
        price: "Liên hệ trực tiếp",
        image: "asset/luxury_villa_2.png",
        images: [
            "asset/luxury_villa_2.png",
            "asset/luxury_villa_1.png"
        ],
        amenities: ["Bếp sưởi lửa trại ngoài trời", "Hầm rượu vang", "Kính thiên văn ngắm sao", "Sân golf mini", "Dịch vụ trà chiều hoàng hôn", "Smart Home toàn diện"],
        shortDescription: "Villa phong cách Luxury Obsidian tối giản sang trọng với khu đốt lửa trại ngắm thung lũng đèn Trại Mát về đêm.",
        description: "Nằm tách biệt trên ngọn đồi thơ mộng hướng thẳng về phía thung lũng đèn Trại Mát lung linh, The Harmony Obsidian Mansion mang sắc đen huyền bí kết hợp gỗ trầm ấm tạo nên một không gian nghỉ dưỡng cực kỳ tinh tế và đẳng cấp.\n\nMansion sở hữu hệ thống kính thiên văn chuyên nghiệp phục vụ trải nghiệm săn sao và ngắm thung lũng đèn lung linh về đêm. Sân thượng rộng lớn được trang bị hố lửa sưởi ấm ngoài trời thiết kế chìm ấn tượng, nơi lý tưởng để thưởng thức ly vang Đà Lạt hảo hạng giữa không khí se lạnh.\n\nTất cả các thiết bị trong nhà đều được điều khiển thông minh qua hệ thống Smart Home hiện đại. Căn villa hứa hẹn sẽ mang đến trải nghiệm nghỉ dưỡng khác biệt, cao cấp khó quên cho đoàn khách quý tộc.",
        featured: false,
        createdAt: "2026-07-17T12:30:00Z"
    }
];

const INITIAL_DESTINATIONS = [
    {
        id: "dest-lake-tuyen-lam",
        title: "Hồ Tuyền Lâm - Lá phổi xanh của Đà Lạt",
        category: "sightseeing",
        address: "Phường 4, Đà Lạt (Cách trung tâm 7km)",
        image: "asset/dest_lake.png",
        shortDescription: "Hồ nước ngọt rộng nhất Đà Lạt với cảnh quan rừng thông hoang sơ bao quanh, mây phủ sương mờ mỗi sáng sớm.",
        description: "Hồ Tuyền Lâm là hồ nước ngọt rộng nhất Đà Lạt, được bao quanh bởi những cánh rừng thông bạt ngàn tạo nên bức tranh thiên nhiên tuyệt mỹ. Đây là địa điểm lý tưởng để cắm trại, đi thuyền kayak ngắm lá phong, câu cá hoặc dạo bộ hít thở không khí trong lành thoang thoảng hương thông rừng.",
        createdAt: "2026-07-21T08:00:00Z"
    },
    {
        id: "dest-aesthetic-cafe",
        title: "Aesthetic Glasshouse Coffee - Góc check-in hoàng hôn đồi thông",
        category: "cafe",
        address: "Đường Khởi Nghĩa Bắc Sơn, Phường 10, Đà Lạt",
        image: "asset/dest_cafe.png",
        shortDescription: "Quán cà phê nhà kính phong cách tối giản với view thung lũng thông rì rào, địa điểm ngắm hoàng hôn rực rỡ nhất Đà Lạt.",
        description: "Nằm nép mình bên sườn đồi thơ mộng, quán cafe sở hữu không gian nhà kính ngập tràn ánh nắng và cây xanh. Với ban công gỗ mở rộng hướng thẳng ra thung lũng, quán là điểm hẹn hò lãng mạn bậc nhất để thưởng thức tách cà phê ấm nóng và ngắm trọn vẹn khoảnh khắc hoàng hôn nhuộm đỏ sương mù Đà Lạt.",
        createdAt: "2026-07-21T08:10:00Z"
    },
    {
        id: "dest-linh-phuoc",
        title: "Chùa Linh Phước - Độc đáo công trình khảm sành Ve Chai",
        category: "checkin",
        address: "120 Tự Phước, Trại Mát, Phường 11, Đà Lạt",
        image: "asset/dest_pagoda.png",
        shortDescription: "Ngôi chùa khảm sành giữ nhiều kỷ lục nhất Việt Nam, nổi bật với rồng dài 49m làm từ 12.000 vỏ chai bia.",
        description: "Chùa Linh Phước (hay còn gọi là Chùa Ve Chai) là một công trình kiến trúc Phật giáo khảm sành vô cùng đặc sắc và tinh xảo tại Đà Lạt. Toàn bộ các bức tường, cột chùa và tượng rồng dài 49m đều được khảm tỉ mỉ bằng hàng triệu mảnh sành, sứ và thủy tinh nhiều màu sắc, thu hút đông đảo du khách thập phương đến chiêm bái.",
        createdAt: "2026-07-21T08:20:00Z"
    },
    {
        id: "dest-cau-dat",
        title: "Đồi Chè Cầu Đất - Trải nghiệm săn mây đón bình minh cực chill",
        category: "sightseeing",
        address: "Thôn Cầu Đất, Xã Xuân Trường, Đà Lạt",
        image: "asset/dest_lake.png",
        shortDescription: "Không gian chè xanh mướt trải dài vô tận cùng thảm gỗ săn mây bồng bềnh tuyệt đẹp lúc sáng sớm.",
        description: "Đồi Chè Cầu Đất là địa điểm săn mây nổi tiếng bậc nhất Đà Lạt. Với đồi chè xanh ngút ngàn và các tua-bin gió khổng lồ, nơi đây mang vẻ đẹp bình yên thơ mộng. Du khách thường đến từ 4h30 sáng để ngắm nhìn biển mây bồng bềnh phủ lấy đồi chè xanh mướt.",
        createdAt: "2026-07-21T08:30:00Z"
    },
    {
        id: "dest-ga-dalat",
        title: "Ga Đà Lạt - Nhà ga cổ kính mang kiến trúc Pháp độc đáo",
        category: "checkin",
        address: "Đường Quang Trung, Phường 9, Đà Lạt",
        image: "asset/dest_pagoda.png",
        shortDescription: "Nhà ga xe lửa cổ nhất Việt Nam và Đông Dương, biểu tượng check-in không thể bỏ qua tại Đà Lạt.",
        description: "Ga Đà Lạt được xây dựng từ năm 1932 bởi người Pháp, mang kiến trúc độc đáo lấy cảm hứng từ ngọn núi Langbiang hùng vĩ. Nơi đây hiện vẫn lưu giữ những toa tàu gỗ cổ kính phục vụ tuyến du lịch ngắn đi Trại Mát.",
        createdAt: "2026-07-21T08:40:00Z"
    },
    {
        id: "dest-datanla",
        title: "Thác Datanla - Trải nghiệm hệ thống máng trượt xuyên rừng thông",
        category: "sightseeing",
        address: "Đèo Prenn, Phường 3, Đà Lạt",
        image: "asset/dest_lake.png",
        shortDescription: "Khu du lịch sinh thái nổi tiếng với máng trượt uốn lượn quanh rừng thông và các hoạt động mạo hiểm ngoài trời.",
        description: "Thác Datanla sở hữu dòng nước trong lành chảy hiền hòa qua các tầng đá. Hệ thống máng trượt alpine coaster hiện đại uốn lượn qua các sườn thông mang lại cảm giác phấn khích tột độ cho du khách.",
        createdAt: "2026-07-21T08:50:00Z"
    },
    {
        id: "dest-tui-mo-to",
        title: "Tiệm Cà Phê Túi Mơ To - Góc vườn cúc họa mi thơ mộng",
        category: "cafe",
        address: "Hẻm 31 Sào Nam, Phường 11, Đà Lạt",
        image: "asset/dest_cafe.png",
        shortDescription: "Quán cà phê view thung lũng đèn cực đẹp về đêm, nổi tiếng với vườn hoa cúc họa mi ngập tràn sắc trắng.",
        description: "Tiệm Cà Phê Túi Mơ To mang phong cách hoài niệm cổ xưa, nổi tiếng bậc nhất Đà Lạt với khu vườn tràn ngập cúc họa mi. Đây là nơi ngắm thung lũng đèn rực sáng huyền ảo khi đêm về.",
        createdAt: "2026-07-21T09:00:00Z"
    },
    {
        id: "dest-lau-ga-la-e",
        title: "Lẩu Gà Lá É Tao Ngộ - Ẩm thực nức tiếng làm ấm lòng du khách",
        category: "food",
        address: "5 Đường 3 Tháng 4, Phường 3, Đà Lạt",
        image: "asset/dest_cafe.png",
        shortDescription: "Món lẩu trứ danh nóng hổi kết hợp thịt gà ta chắc ngọt cùng vị cay nồng của lá é và ớt xiêm xanh.",
        description: "Lẩu gà lá é là món ăn tối quốc dân tại Đà Lạt. Dưới không khí se lạnh, một nồi lẩu nghi ngút khói thơm lừng mùi sả, vị ngọt thanh của thịt gà cùng vị cay ấm lòng của lá é chắc chắn sẽ chinh phục bất kỳ vị khách khó tính nào.",
        createdAt: "2026-07-21T09:10:00Z"
    },
    {
        id: "dest-cho-dem",
        title: "Chợ Đêm Đà Lạt - Thiên đường ẩm thực đường phố sôi động",
        category: "food",
        address: "Đường Nguyễn Thị Minh Khai, Phường 1, Đà Lạt",
        image: "asset/dest_cafe.png",
        shortDescription: "Nơi tụ hội các món ăn vặt ấm nóng như bánh tráng nướng, sữa đậu nành, dâu lắc sương đêm Đà Lạt.",
        description: "Chợ đêm Đà Lạt (Chợ Âm Phủ) là trung tâm giao lưu văn hóa ẩm thực náo nhiệt. Trải nghiệm dạo bộ chợ đêm lạnh, thưởng thức cốc sữa đậu nành nóng hổi, cắn miếng bánh tráng nướng giòn rụm là kỷ niệm khó quên của du khách.",
        createdAt: "2026-07-21T09:20:00Z"
    },
    {
        id: "dest-clay-tunnel",
        title: "Đường Hầm Điêu Khắc - Kỳ quan bằng đất sét khổng lồ",
        category: "sightseeing",
        address: "Khu du lịch Hồ Tuyền Lâm, Phường 4, Đà Lạt",
        image: "asset/dest_pagoda.png",
        shortDescription: "Công trình điêu khắc bằng đất sét tái hiện lại lịch sử hình thành và phát triển của thành phố ngàn hoa.",
        description: "Đường hầm đất sét là công trình nghệ thuật độc đáo dài hơn 2km. Nổi tiếng nhất là khu vực Hồ Vô Cực với hai bức tượng đầu người đối mặt nhau tuyệt đẹp giữa mặt hồ trong vắt.",
        createdAt: "2026-07-21T09:30:00Z"
    },
    {
        id: "dest-langbiang",
        title: "Langbiang - Nóc nhà huyền thoại của cao nguyên Lâm Viên",
        category: "sightseeing",
        address: "Thị trấn Lạc Dương, Huyện Lạc Dương (Cách Đà Lạt 12km)",
        image: "asset/dest_lake.png",
        shortDescription: "Đỉnh núi cao nhất Đà Lạt với view ngắm toàn cảnh suối Vàng, suối Bạc thơ mộng từ trên cao.",
        description: "Langbiang gắn liền với truyền thuyết tình yêu lãng mạn của chàng K'lang và nàng H'biang. Du khách có thể đi xe jeep leo lên đỉnh núi radar ngắm nhìn mây bay lững lờ và toàn cảnh thành phố phía dưới.",
        createdAt: "2026-07-21T09:40:00Z"
    },
    {
        id: "dest-chika-farm",
        title: "Chika Farm - Nông trại cừu phong cách châu Âu siêu dễ thương",
        category: "sightseeing",
        address: "Đường Đình Đa Quý, Xuân Thọ, Đà Lạt",
        image: "asset/dest_lake.png",
        shortDescription: "Nông trại cừu, lạc đà Alpaca thân thiện giữa thảo nguyên xanh bao la tuyệt đẹp.",
        description: "Chika Farm sở hữu khuôn viên rộng lớn bao quanh bởi thung lũng thông mộng mơ. Nơi đây nuôi dưỡng nhiều bạn cừu, dê và lạc đà Alpaca hiếu khách. Du khách có thể tự tay cho thú ăn và chụp những bức ảnh đồng quê cực thơ.",
        createdAt: "2026-07-21T09:51:00Z"
    },
    {
        id: "dest-binh-minh-oi",
        title: "Bình Minh Ơi Cafe - Săn mây và ngắm bình minh đồi thông lý tưởng",
        category: "cafe",
        address: "89 Hoàng Hoa Thám, Phường 10, Đà Lạt",
        image: "asset/dest_cafe.png",
        shortDescription: "Quán cà phê mộc mạc làm bằng gỗ với view thung lũng mây giăng ngút ngàn lúc bình minh lên.",
        description: "Bình Minh Ơi là điểm săn mây không thể bỏ qua tại trung tâm Đà Lạt. Thưởng thức một ly trà nóng ngắm nhìn những tia nắng đầu tiên xuyên qua làn mây sương đọng trên đồi thông là trải nghiệm khó quên.",
        createdAt: "2026-07-21T09:52:00Z"
    },
    {
        id: "dest-puppy-farm",
        title: "Puppy Farm - Nông trại cún cưng kết hợp vườn nông nghiệp công nghệ cao",
        category: "sightseeing",
        address: "Đường Cam Ly, Phường 7, Đà Lạt",
        image: "asset/dest_lake.png",
        shortDescription: "Nơi vui đùa cùng hàng chục giống cún đáng yêu và tham quan vườn dâu tây, cà chua bi trĩu quả.",
        description: "Puppy Farm tụ hội hơn 100 chú cún thuộc các giống Corgi, Husky, Alaska siêu đáng yêu. Ngoài chơi cùng cún, du khách còn được tham quan vườn bí ngô khổng lồ và vườn dâu tây công nghệ cao hái tại vườn.",
        createdAt: "2026-07-21T09:53:00Z"
    },
    {
        id: "dest-doi-vo-anh",
        title: "Đồi Vô Ảnh - Tác phẩm gương nghệ thuật ngoài trời độc nhất vô nhị",
        category: "checkin",
        address: "Đường đèo Mimosa, Phường 10, Đà Lạt",
        image: "asset/dest_pagoda.png",
        shortDescription: "Ngọn đồi với hàng trăm tấm gương phản chiếu bầu trời tạo nên không gian sống ảo ảo diệu khôn lường.",
        description: "Đồi Vô Ảnh nổi bật với những bức tường gương sáng loáng ngoài trời, phản chiếu mây trời rừng thông và hồ nước vô cực. Nơi đây là điểm check-in độc lạ, sáng tạo hàng đầu của giới trẻ.",
        createdAt: "2026-07-21T09:54:00Z"
    },
    {
        id: "dest-lam-vien",
        title: "Quảng Trường Lâm Viên - Đóa hoa dã quỳ khổng lồ bên hồ Xuân Hương",
        category: "sightseeing",
        address: "Đường Trần Quốc Toản, Phường 1, Đà Lạt",
        image: "asset/dest_lake.png",
        shortDescription: "Trái tim của thành phố Đà Lạt với hai biểu tượng kiến trúc kính bông hoa dã quỳ và nụ hoa Atisô.",
        description: "Quảng trường Lâm Viên rộng lớn hướng ra hồ Xuân Hương thơ mộng. Hai công trình bằng kính màu khổng lồ là đóa hoa dã quỳ và nụ hoa Atisô rực rỡ, bên trong có rạp chiếu phim và quán cafe độc đáo.",
        createdAt: "2026-07-21T09:55:00Z"
    },
    {
        id: "dest-lang-cu-lan",
        title: "Làng Cù Lần - Ngôi làng cổ tích ẩn mình dưới chân thung lũng xanh",
        category: "sightseeing",
        address: "Xã Lát, Huyện Lạc Dương, Lâm Đồng",
        image: "asset/dest_lake.png",
        shortDescription: "Ngôi làng nhỏ yên bình giữa thung lũng thông xanh mướt, mang đậm bản sắc văn hóa Tây Nguyên.",
        description: "Làng Cù Lần mang vẻ đẹp hoang sơ thơ mộng với những ngôi nhà sàn gỗ mộc mạc bên hồ nước. Du khách đến đây có thể đi xe jeep leo dốc, vượt suối hoặc chèo bè tre ngắm cảnh sắc thiên nhiên trong lành.",
        createdAt: "2026-07-21T09:56:00Z"
    },
    {
        id: "dest-dinh-1",
        title: "Dinh 1 Bảo Đại - Biệt điện hoàng gia Pháp cổ kính",
        category: "sightseeing",
        address: "Đường Trần Quang Diệu, Phường 10, Đà Lạt",
        image: "asset/dest_pagoda.png",
        shortDescription: "Dinh thự mang đậm kiến trúc quý tộc Pháp cổ kính ẩn mình giữa hàng thông trăm tuổi.",
        description: "Dinh 1 từng là tổng hành dinh của Vua Bảo Đại trong thời gian làm Quốc trưởng. Nơi đây sở hữu lối kiến trúc tân cổ điển sang trọng, khuôn viên rộng với con đường trải đá rợp bóng cây cổ thụ mát mẻ.",
        createdAt: "2026-07-21T09:57:00Z"
    },
    {
        id: "dest-valley-gold",
        title: "Thung Lũng Vàng - Cảnh quan rừng thông hồ nước yên bình",
        category: "sightseeing",
        address: "Đường Ankroet, Xã Lát, Lạc Dương, Lâm Đồng",
        image: "asset/dest_lake.png",
        shortDescription: "Khu du lịch sinh thái với đồi cỏ hồng trải dài rực rỡ cùng hồ nước Đan Kia rộng mênh mông.",
        description: "Thung Lũng Vàng nổi tiếng với rừng thông ba lá cổ thụ, những vườn hoa cảnh bonsai tinh tế và hồ nước thơ mộng. Đây cũng là điểm ngắm đồi cỏ hồng mọc tự nhiên vào dịp cuối năm tuyệt đẹp.",
        createdAt: "2026-07-21T09:58:00Z"
    },
    {
        id: "dest-coi-xay-gio",
        title: "Tiệm Bánh Cối Xay Gió - Bức tường vàng check-in biểu tượng",
        category: "checkin",
        address: "Đường Tăng Bạt Hổ, Phường 1, Đà Lạt",
        image: "asset/dest_cafe.png",
        shortDescription: "Bức tường vàng retro huyền thoại luôn tấp nập du khách xếp hàng chụp ảnh lưu niệm.",
        description: "Bức tường vàng với font chữ retro viết tay màu đỏ độc đáo đã trở thành biểu tượng sống ảo quen thuộc của Đà Lạt. Tiệm nổi tiếng với nhiều loại bánh mì truyền thống và bánh ngọt thơm ngon.",
        createdAt: "2026-07-21T09:59:00Z"
    },
    {
        id: "dest-kem-bo-thanh-thao",
        title: "Kem Bơ Thanh Thảo - Món ngọt thanh mát nức tiếng phố núi",
        category: "food",
        address: "76 Nguyễn Văn Trỗi, Phường 2, Đà Lạt",
        image: "asset/dest_cafe.png",
        shortDescription: "Món kem bơ sánh mịn thơm béo kết hợp cùng viên kem dừa ngọt thanh mát lạnh.",
        description: "Kem Bơ Thanh Thảo là quán ăn vặt lâu đời nổi tiếng nhất Đà Lạt. Bơ sáp đắc nông chín dẻo được xay nhuyễn mịn, phủ thêm viên kem dừa ngọt béo ngậy và chút dừa nạo giòn sần sật cực kỳ hấp dẫn.",
        createdAt: "2026-07-21T10:00:00Z"
    },
    {
        id: "dest-banh-uot-long-ga",
        title: "Bánh Ướt Lòng Gà Long - Hương vị độc đáo ăn là nhớ mãi",
        category: "food",
        address: "Hẻm 202 Phan Đình Phùng, Phường 2, Đà Lạt",
        image: "asset/dest_cafe.png",
        shortDescription: "Sự kết hợp hoàn hảo giữa bánh ướt mềm dai nóng hổi, lòng gà, thịt gà xé cùng nước mắm chua ngọt đậm đà.",
        description: "Bánh ướt lòng gà Long là quán ăn gia truyền có lượng khách vô cùng đông đúc. Đĩa bánh đầy ắp lòng mề gà giòn dai, thịt gà ta ngọt dai cùng hành tây, rau thơm chấm nước mắm pha cay cay cực hấp dẫn.",
        createdAt: "2026-07-21T10:10:00Z"
    },
    {
        id: "dest-domaine-marie",
        title: "Nhà Thờ Domaine de Marie - Kiến trúc tôn giáo sắc hồng ngọt ngào",
        category: "sightseeing",
        address: "1 Ngô Quyền, Phường 6, Đà Lạt",
        image: "asset/dest_pagoda.png",
        shortDescription: "Nhà Thờ Mai Anh mang lối kiến trúc Pháp cổ kết hợp phong cách nhà rông Tây Nguyên đặc sắc.",
        description: "Nhà thờ Domaine de Marie nổi bật giữa đồi thông nhờ lớp tường sơn màu hồng ngọt ngào và những khóm hoa rực rỡ trong khuôn viên. Nơi đây là điểm tham quan thanh tịnh và thanh lịch cho mọi du khách.",
        createdAt: "2026-07-21T10:20:00Z"
    },
    {
        id: "dest-kombi-land",
        title: "Kombi Land - Vương quốc xương rồng miền viễn tây giữa lòng Đà Lạt",
        category: "checkin",
        address: "Đèo Mimosa, Phường 3, Đà Lạt",
        image: "asset/dest_cafe.png",
        shortDescription: "Quán cafe sa mạc độc đáo với hàng trăm giống xương rồng và những chiếc xe bus retro màu sắc.",
        description: "Kombi Land mang lại làn gió mới cho du lịch Đà Lạt với phong cách miền viễn Tây đầy nắng gió. Hàng ngàn chậu xương rồng lớn nhỏ cùng mô hình xe bus cũ tạo nên phông nền chụp ảnh cực ngầu.",
        createdAt: "2026-07-21T10:30:00Z"
    },
    {
        id: "dest-que-garden",
        title: "Que Garden - Khu vườn bonsai Nhật Bản thu nhỏ yên bình",
        category: "sightseeing",
        address: "Đèo Mimosa, Phường 10, Đà Lạt",
        image: "asset/dest_lake.png",
        shortDescription: "Khu vườn tùng bonsai lá kim khổng lồ kết hợp hồ cá Koi Nhật Bản đầy màu sắc sống động.",
        description: "Que Garden được mệnh danh là tiểu Nhật Bản giữa lòng Đà Lạt. Với diện tích hơn 20.000m2, nơi đây có hàng trăm cây bonsai uốn nắn nghệ thuật tinh tế và hồ cá Koi hàng trăm con bơi lội yên bình.",
        createdAt: "2026-07-21T10:40:00Z"
    },
    {
        id: "dest-tuyet-tinh-coc",
        title: "Tuyệt Tình Cốc - Hồ nước xanh ngọc bích ảo diệu giữa rừng sâu",
        category: "sightseeing",
        address: "Suối Cạn, Xã Lát, Huyện Lạc Dương, Lâm Đồng",
        image: "asset/dest_lake.png",
        shortDescription: "Hồ nước mỏ đá bỏ hoang với màu nước xanh ngọc bích trong veo như ngọc, bao quanh bởi vách đá dựng đứng.",
        description: "Tuyệt Tình Cốc mang vẻ đẹp hoang sơ kỳ bí của thiên nhiên. Con đường đi đến đây gồ ghề đầy thử thách bằng xe jeep, nhưng bù lại bạn sẽ được chiêm ngưỡng chiếc hồ nước màu xanh ngọc bích vô cùng lạ mắt.",
        createdAt: "2026-07-21T10:50:00Z"
    },
    {
        id: "dest-pongour",
        title: "Thác Pongour - Nam Thiên Đệ Nhất Thác bảy tầng hùng vĩ",
        category: "sightseeing",
        address: "Thôn Tân Nghĩa, Xã Ninh Gia, Huyện Đức Trọng",
        image: "asset/dest_lake.png",
        shortDescription: "Kỳ quan thác nước đổ xuống qua 7 tầng đá bậc thang, rộng hơn 100m bao quanh bởi rừng nguyên sinh.",
        description: "Thác Pongour là ngọn thác nổi tiếng với vẻ đẹp hoang dã, hùng vĩ bậc nhất Tây Nguyên. Thác chảy qua hệ thống đá bậc thềm tạo nên những thảm bọt tuyết trắng xóa vô cùng tráng lệ.",
        createdAt: "2026-07-21T11:00:00Z"
    },
    {
        id: "dest-lau-bo-ba-toa",
        title: "Lẩu Bò Ba Toa Nhà Gỗ - Món lẩu bò gia truyền ngon trứ danh",
        category: "food",
        address: "1/29 Hoàng Diệu, Phường 5, Đà Lạt",
        image: "asset/dest_cafe.png",
        shortDescription: "Quán lẩu nhà gỗ mộc mạc với hương vị lẩu bò đậm đà ngọt xương ống nóng hổi lâu đời.",
        description: "Lẩu bò quán gỗ Ba Toa là điểm hẹn ẩm thực trứ danh. Một nồi lẩu bò đầy ắp nạm bò, dựng bò, đuôi bò mềm dẻo ngập trong nước dùng thơm lừng gia vị thuốc bắc sưởi ấm hoàn hảo cái lạnh Đà Lạt.",
        createdAt: "2026-07-21T11:10:00Z"
    },
    {
        id: "dest-van-thanh",
        title: "Làng Hoa Vạn Thành - Làng trồng hoa truyền thống lâu đời nhất",
        category: "sightseeing",
        address: "43 Vạn Hạnh, Phường 5, Đà Lạt",
        image: "asset/dest_lake.png",
        shortDescription: "Thiên đường ngập tràn các loài hoa ly, cẩm tú cầu, hoa hồng ngoại khoe sắc rực rỡ.",
        description: "Làng hoa Vạn Thành ứng dụng kỹ thuật trồng hoa trong nhà kính hiện đại. Đến đây du khách được chiêm ngưỡng những luống hồng ngoại kiêu sa, những vườn cẩm tú cầu nở rộ tạo thành tấm thảm hoa khổng lồ.",
        createdAt: "2026-07-21T11:20:00Z"
    },
    {
        id: "dest-zoodoo",
        title: "ZooDoo Da Lat - Sở thú thân thiện phong cách nước Úc độc đáo",
        category: "sightseeing",
        address: "Quốc lộ 27C, Xã Đạ Nhim, Lạc Dương, Lâm Đồng",
        image: "asset/dest_lake.png",
        shortDescription: "Sở thú mở thân thiện nuôi dưỡng kangaroo, cừu merino, ngựa lùn pony giữa rừng thông mát mẻ.",
        description: "ZooDoo Da Lat mang mô hình sở thú mở thân thiện kiểu Úc. Các loài động vật tại đây được huấn luyện cẩn thận, du khách có thể cho ăn và vuốt ve những bạn thú hiền lành sống giữa thiên nhiên rừng thông trong trẻo.",
        createdAt: "2026-07-21T11:30:00Z"
    },
    {
        id: "dest-me-linh",
        title: "Mê Linh Coffee Garden - Quán cà phê view thung lũng đồi chè bao la",
        category: "cafe",
        address: "Tổ 20 Thôn 4, Xã Tà Nung, Đà Lạt",
        image: "asset/dest_cafe.png",
        shortDescription: "Quán cà phê có view ôm trọn thung lũng cà phê xanh mát và đập nước Cam Ly thơ mộng từ trên cao.",
        description: "Mê Linh Coffee Garden sở hữu không gian mở 360 độ ngắm toàn cảnh núi rừng Tà Nung xanh ngút ngàn. Nơi đây nổi tiếng với hương vị cà phê chồn thơm ngon nguyên bản và các góc sống ảo nấc thang lên thiên nhiên đắt giá.",
        createdAt: "2026-07-21T11:40:00Z"
    }
];

// Initialize database
function initDatabase() {
    if (!localStorage.getItem('villas')) {
        localStorage.setItem('villas', JSON.stringify(INITIAL_VILLAS));
    }
    if (!localStorage.getItem('destinations')) {
        localStorage.setItem('destinations', JSON.stringify(INITIAL_DESTINATIONS));
    }
}

// Get all villas
function getAllVillas() {
    initDatabase();
    return JSON.parse(localStorage.getItem('villas')) || [];
}

// Get villa by ID
function getVillaById(id) {
    const villas = getAllVillas();
    return villas.find(v => v.id === id);
}

// Save or Update villa
function saveVilla(villaData) {
    const villas = getAllVillas();
    if (villaData.id) {
        // Update existing
        const index = villas.findIndex(v => v.id === villaData.id);
        if (index !== -1) {
            villas[index] = { ...villas[index], ...villaData, updatedAt: new Date().toISOString() };
        }
    } else {
        // Create new
        const newVilla = {
            ...villaData,
            id: 'villa-' + Date.now(),
            createdAt: new Date().toISOString()
        };
        villas.push(newVilla);
    }
    localStorage.setItem('villas', JSON.stringify(villas));
    return true;
}

// Delete villa
function deleteVilla(id) {
    let villas = getAllVillas();
    villas = villas.filter(v => v.id !== id);
    localStorage.setItem('villas', JSON.stringify(villas));
    return true;
}

// Reset database to default
function resetDatabase() {
    localStorage.setItem('villas', JSON.stringify(INITIAL_VILLAS));
    return true;
}

// --- DESTINATIONS DB METHODS ---

function getAllDestinations() {
    initDatabase();
    return JSON.parse(localStorage.getItem('destinations')) || [];
}

function getDestinationById(id) {
    const destinations = getAllDestinations();
    return destinations.find(d => d.id === id);
}

function saveDestination(destData) {
    const destinations = getAllDestinations();
    if (destData.id) {
        // Update existing
        const index = destinations.findIndex(d => d.id === destData.id);
        if (index !== -1) {
            destinations[index] = { ...destinations[index], ...destData, updatedAt: new Date().toISOString() };
        }
    } else {
        // Create new
        const newDest = {
            ...destData,
            id: 'dest-' + Date.now(),
            createdAt: new Date().toISOString()
        };
        destinations.push(newDest);
    }
    localStorage.setItem('destinations', JSON.stringify(destinations));
    return true;
}

function deleteDestination(id) {
    let destinations = getAllDestinations();
    destinations = destinations.filter(d => d.id !== id);
    localStorage.setItem('destinations', JSON.stringify(destinations));
    return true;
}

function resetDestinationsDatabase() {
    localStorage.setItem('destinations', JSON.stringify(INITIAL_DESTINATIONS));
    return true;
}

// --- BOOKING/CONTACT REQUESTS DB METHODS ---

function getAllBookings() {
    return JSON.parse(localStorage.getItem('bookings')) || [];
}

function saveBooking(bookingData) {
    const bookings = getAllBookings();
    const newBooking = {
        ...bookingData,
        id: 'booking-' + Date.now(),
        createdAt: new Date().toISOString(),
        status: bookingData.status || 'pending'
    };
    bookings.push(newBooking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    return newBooking;
}

function updateBookingStatus(id, status) {
    const bookings = getAllBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
        bookings[index].status = status;
        localStorage.setItem('bookings', JSON.stringify(bookings));
        return true;
    }
    return false;
}

function deleteBooking(id) {
    let bookings = getAllBookings();
    bookings = bookings.filter(b => b.id !== id);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    return true;
}

// Export functions to global scope
window.harmonyDB = {
    getAllVillas,
    getVillaById,
    saveVilla,
    deleteVilla,
    resetDatabase,
    
    getAllDestinations,
    getDestinationById,
    saveDestination,
    deleteDestination,
    resetDestinationsDatabase,

    getAllBookings,
    saveBooking,
    updateBookingStatus,
    deleteBooking
};
