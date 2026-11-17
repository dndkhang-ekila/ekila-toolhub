export type ToolCategory = 'all' | 'qr-link' | 'image' | 'pdf';

export interface CategoryInfo {
  id: ToolCategory;
  name: string;
  description: string;
  iconName: string;
}

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolDefinition {
  slug: string;
  title: string;
  shortDescription: string;
  category: ToolCategory;
  clientOnly: boolean;
  iconType: 'qr' | 'link' | 'image' | 'camera' | 'document' | 'code' | 'sparkles' | 'lock';
  gradient: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    features: string[];
    howToUse: string[];
    faqs: ToolFaq[];
  };
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'all',
    name: 'Tất cả tiện ích',
    description: 'Bộ công cụ xử lý tệp, QR Code và tiện ích số trực tuyến',
    iconName: 'sparkles',
  },
  {
    id: 'qr-link',
    name: 'QR Code & Link',
    description: 'Tạo mã QR, quét mã vạch và rút gọn link nhanh',
    iconName: 'qr',
  },
  {
    id: 'image',
    name: 'Xử lý hình ảnh',
    description: 'Nén ảnh, chuyển đổi định dạng và tối ưu ảnh ngay trên trình duyệt',
    iconName: 'image',
  },
  {
    id: 'pdf',
    name: 'Tài liệu & PDF',
    description: 'Nén PDF, scan tài liệu và quản lý trang trực tuyến an toàn',
    iconName: 'document',
  },
];

export const TOOLS: ToolDefinition[] = [
  {
    slug: 'qr-generator',
    title: 'Tạo mã QR Code',
    shortDescription: 'Tạo mã QR tĩnh & động cho URL, văn bản, Wi-Fi, tải ảnh PNG và SVG tức thì.',
    category: 'qr-link',
    clientOnly: true,
    iconType: 'qr',
    gradient: 'from-blue-600 to-indigo-600',
    seo: {
      title: 'Tạo Mã QR Online Miễn Phí - Tạo QR Code SVG, PNG Nhanh Nhất',
      description:
        'Công cụ tạo mã QR trực tuyến miễn phí, hỗ trợ QR tĩnh và động, Wi-Fi, URL, Text. Xử lý trực tiếp trên trình duyệt, không cần đăng nhập.',
      keywords: ['tạo mã qr', 'qr code generator', 'tạo qr online', 'qr code wifi', 'tool tạo qr'],
      features: [
        'Tạo mã QR tức thì cho URL, văn bản thuần, thông tin kết nối Wi-Fi, email',
        'Tùy chỉnh màu sắc nền và màu mã theo phong cách thương hiệu của bạn',
        'Tải về với độ phân giải cao định dạng PNG và vector SVG sắc nét',
        'Bảo mật tuyệt đối: toàn bộ dữ liệu tạo mã xử lý ngay trong trình duyệt',
      ],
      howToUse: [
        'Chọn loại nội dung bạn muốn mã hóa (Liên kết URL, Văn bản, Wi-Fi...)',
        'Nhập nội dung tương ứng vào ô biểu mẫu',
        'Xem trước mã QR được sinh tự động theo thời gian thực',
        'Bấm nút Tải PNG hoặc Tải SVG để lưu mã về máy',
      ],
      faqs: [
        {
          question: 'Tôi có cần đăng nhập để tạo mã QR không?',
          answer:
            'Không. Bạn có thể sử dụng công cụ tạo mã QR hoàn toàn miễn phí và tải về ngay lập tức mà không cần tạo tài khoản.',
        },
        {
          question: 'Mã QR tĩnh có thời hạn sử dụng không?',
          answer:
            'Mã QR tĩnh chứa trực tiếp thông tin đã mã hóa nên hoạt động vĩnh viễn và không bao giờ hết hạn.',
        },
        {
          question: 'Dữ liệu tôi nhập có bị lưu trên máy chủ không?',
          answer:
            'Không. Quá trình sinh mã QR tĩnh diễn ra hoàn toàn trên thiết bị của bạn bằng JavaScript/Canvas, không có bất kỳ dữ liệu nào gửi về máy chủ.',
        },
      ],
    },
  },
  {
    slug: 'url-shortener',
    title: 'Rút gọn liên kết',
    shortDescription: 'Rút gọn link dài thành link ngắn gọn gàng trong 1 giây, kèm mã QR chia sẻ.',
    category: 'qr-link',
    clientOnly: false,
    iconType: 'link',
    gradient: 'from-cyan-500 to-blue-600',
    seo: {
      title: 'Rút Gọn Link Miễn Phí - Rút Gọn URL Nhanh Chóng Trong 1 Giây',
      description:
        'Rút gọn liên kết dài thành link ngắn dễ nhớ, an toàn, chống lừa đảo, kèm mã QR tiện lợi. Chuyển hướng tốc độ cao dưới 100ms.',
      keywords: ['rút gọn link', 'shorten url', 'rut gon link mien phi', 'link shortener', 'url shortener'],
      features: [
        'Rút gọn URL bất kỳ với định danh slug ngẫu nhiên ngắn gọn từ 6 đến 8 ký tự',
        'Tốc độ chuyển hướng siêu tốc p95 dưới 100ms nhờ cơ chế cache biên',
        'Tự động tích hợp mã QR cho liên kết vừa rút gọn để quét nhanh trên điện thoại',
        'Cơ chế bảo vệ chống liên kết độc hại và trang web giả mạo',
      ],
      howToUse: [
        'Dán liên kết (URL) dài cần rút gọn vào ô nhập liệu',
        'Nhấn nút Rút gọn liên kết',
        'Sao chép link ngắn được tạo ra hoặc tải mã QR đi kèm để chia sẻ',
      ],
      faqs: [
        {
          question: 'Link rút gọn của người dùng chưa đăng nhập tồn tại trong bao lâu?',
          answer:
            'Link của khách sử dụng bình thường và sẽ được lưu trữ ít nhất 30 ngày kể từ lượt truy cập gần nhất.',
        },
        {
          question: 'Hệ thống có bảo vệ người dùng trước link độc hại không?',
          answer:
            'Có. Mọi liên kết đều được kiểm tra đối chiếu tự động với danh sách chặn và hệ thống kiểm tra URL độc hại trước khi chuyển hướng.',
        },
      ],
    },
  },
  {
    slug: 'qr-scanner',
    title: 'Quét mã QR & Barcode',
    shortDescription: 'Quét mã QR và mã vạch bằng camera hoặc ảnh tải lên, bảo vệ an toàn trước URL lạ.',
    category: 'qr-link',
    clientOnly: true,
    iconType: 'camera',
    gradient: 'from-emerald-500 to-teal-600',
    seo: {
      title: 'Quét Mã QR Online - Đọc Barcode Từ Ảnh Và Camera Trực Tuyến',
      description:
        'Công cụ quét mã QR và mã vạch trực tuyến từ camera hoặc tệp ảnh. Nhận diện QR Code, EAN-13, Code 128 ngay trên trình duyệt mà không gửi ảnh lên server.',
      keywords: ['quét mã qr', 'qr scanner', 'quét barcode online', 'đọc mã qr từ ảnh', 'scan qr'],
      features: [
        'Hỗ trợ đọc mã QR trực tiếp từ camera thiết bị hoặc tải tệp ảnh lên',
        'Nhận dạng đa định dạng: QR Code, Data Matrix, EAN-13, EAN-8, Code 128, Code 39',
        'Cảnh báo an toàn: hiển thị rõ tên miền đầy đủ trước khi người dùng quyết định mở liên kết',
        'Xử lý 100% trên thiết bị: hình ảnh quét không bao giờ rời khỏi trình duyệt của bạn',
      ],
      howToUse: [
        'Chọn chế độ Quét từ ảnh (kéo thả ảnh chứa mã) hoặc Bật camera',
        'Hệ thống tự động phân tích và giải mã nội dung trong dưới 1 giây',
        'Xem kết quả, sao chép văn bản hoặc mở liên kết an toàn',
      ],
      faqs: [
        {
          question: 'Nếu tôi không có camera thì có quét được không?',
          answer:
            'Có. Bạn có thể chụp màn hình hoặc tải trực tiếp ảnh chứa mã QR lên, hoặc dán từ clipboard (Ctrl+V).',
        },
        {
          question: 'Ảnh quét có bị tải lên máy chủ không?',
          answer:
            'Tuyệt đối không. Theo quy tắc bảo mật NFR-PRI-01, toàn bộ quá trình nhận diện mã chạy trực tiếp trên bộ xử lý của thiết bị bạn.',
        },
      ],
    },
  },
  {
    slug: 'image-compressor',
    title: 'Nén hình ảnh',
    shortDescription: 'Giảm dung lượng ảnh JPG, PNG, WebP tức thì, giữ nguyên chất lượng sắc nét.',
    category: 'image',
    clientOnly: true,
    iconType: 'image',
    gradient: 'from-amber-500 to-orange-600',
    seo: {
      title: 'Nén Ảnh Online Miễn Phí - Giảm Dung Lượng JPG PNG WebP Tức Thì',
      description:
        'Nén ảnh trực tuyến giữ nguyên độ nét, hỗ trợ so sánh trước sau, nén hàng loạt trên trình duyệt với công nghệ WebAssembly cực nhanh.',
      keywords: ['nén ảnh', 'giảm dung lượng ảnh', 'compress image', 'nén jpg', 'nén png'],
      features: [
        'Giảm tới 80% dung lượng tệp ảnh mà mắt thường khó phân biệt được sự thay đổi',
        'Thanh trượt so sánh trực quan ảnh trước và sau khi nén theo thời gian thực',
        'Tùy chỉnh 3 mức nén định sẵn (Nhẹ, Cân bằng, Mạnh) hoặc điều chỉnh thanh trượt chất lượng',
        'Tự động loại bỏ dữ liệu định vị GPS và thông tin nhạy cảm EXIF để bảo vệ quyền riêng tư',
      ],
      howToUse: [
        'Kéo thả một hoặc nhiều tệp ảnh vào khung nén',
        'Chọn mức nén mong muốn và quan sát dung lượng giảm được',
        'Bấm Tải về ảnh đã tối ưu hoặc tải gói nén ZIP',
      ],
      faqs: [
        {
          question: 'Hình ảnh của tôi có bị tải lên máy chủ của website không?',
          answer:
            'Không. Công cụ sử dụng WebAssembly chạy trực tiếp trong trình duyệt của bạn, ảnh không bao giờ gửi qua internet.',
        },
        {
          question: 'Tôi có thể nén nhiều ảnh cùng lúc được không?',
          answer:
            'Được. Bạn có thể chọn nhiều ảnh cùng lúc và tải về từng ảnh hoặc trọn gói một tệp ZIP tiện lợi.',
        },
      ],
    },
  },
  {
    slug: 'pdf-compressor',
    title: 'Nén tài liệu PDF',
    shortDescription: 'Nén dung lượng file PDF thông minh, giữ nguyên font chữ, mục lục và liên kết.',
    category: 'pdf',
    clientOnly: false,
    iconType: 'document',
    gradient: 'from-rose-500 to-red-600',
    seo: {
      title: 'Nén File PDF Online Miễn Phí - Giảm Dung Lượng PDF An Toàn',
      description:
        'Giảm dung lượng tài liệu PDF trực tuyến nhanh chóng, giữ nguyên chất lượng trang in, văn bản chọn được và liên kết. Tệp được tự động xóa sau 1 giờ.',
      keywords: ['nén pdf', 'giảm dung lượng pdf', 'compress pdf', 'nén file pdf online', 'pdf compressor'],
      features: [
        '3 chế độ nén tối ưu: Nén nhẹ (giữ chất lượng in), Cân bằng (màn hình) và Siêu nén',
        'Giữ nguyên văn bản có thể chọn, bookmark mục lục, siêu liên kết và số trang',
        'Bảo mật tuyệt đối: tệp tạm tự động xóa sạch hoàn toàn sau tối đa 1 giờ theo chuẩn NFR-PRI-02',
        'Nếu sau khi nén dung lượng không nhỏ hơn, hệ thống thông báo minh bạch và giữ nguyên bản gốc',
      ],
      howToUse: [
        'Chọn hoặc kéo thả tệp PDF cần nén vào khu vực tải lên',
        'Lựa chọn mức nén phù hợp với nhu cầu sử dụng',
        'Nhấn Bắt đầu nén và tải về file PDF dung lượng nhỏ hơn',
      ],
      faqs: [
        {
          question: 'File PDF tải lên có bị người khác đọc được không?',
          answer:
            'Không. Tệp được xử lý trong môi trường cô lập bảo mật và tự động xóa vĩnh viễn sau 1 giờ.',
        },
        {
          question: 'Văn bản trong PDF sau khi nén có bị biến thành ảnh không?',
          answer:
            'Không. Văn bản vẫn giữ nguyên dạng vector sao chép và tìm kiếm được bình thường.',
        },
      ],
    },
  },
  {
    slug: 'doc-scanner',
    title: 'Quét tài liệu sang PDF',
    shortDescription: 'Chụp hoặc chọn ảnh văn bản, tự nhận diện mép giấy, lọc tương phản và xuất file PDF.',
    category: 'pdf',
    clientOnly: true,
    iconType: 'camera',
    gradient: 'from-purple-500 to-indigo-600',
    seo: {
      title: 'Quét Tài Liệu Sang PDF Online - Chuyển Ảnh Thành File PDF A4',
      description:
        'Quét tài liệu, hóa đơn, giấy tờ thành file PDF trực tuyến. Tự động nắn thẳng, áp dụng bộ lọc đen trắng, ghép nhiều trang xuất file chuẩn A4.',
      keywords: ['quét tài liệu', 'scan tài liệu sang pdf', 'chuyển ảnh sang pdf', 'doc scanner online'],
      features: [
        'Hỗ trợ chụp từ camera hoặc tải ảnh giấy tờ, hóa đơn từ máy tính / điện thoại',
        'Bộ lọc xử lý ảnh tài liệu chuyên nghiệp: Đen trắng (B&W), Thang xám, Tăng cường độ nét',
        'Ghép nhiều trang ảnh thành một tệp tài liệu PDF duy nhất với kích thước chuẩn A4',
        'Xử lý hoàn toàn cục bộ trên trình duyệt mà không yêu cầu gửi giấy tờ lên mạng',
      ],
      howToUse: [
        'Tải lên hoặc chụp các trang tài liệu cần scan',
        'Áp dụng bộ lọc làm nét chữ hoặc chuyển sang đen trắng',
        'Sắp xếp thứ tự các trang theo ý muốn',
        'Nhấn Xuất file PDF để lưu tài liệu',
      ],
      faqs: [
        {
          question: 'Tôi có thể scan nhiều trang vào một file PDF không?',
          answer:
            'Có. Bạn có thể thêm bao nhiêu trang tùy ý, sau đó hệ thống sẽ xuất toàn bộ thành 1 tệp PDF duy nhất.',
        },
        {
          question: 'Giấy tờ của tôi có được bảo mật không?',
          answer:
            'Hoàn toàn bảo mật. Thao tác xử lý diễn ra ngay trên máy của bạn nên dữ liệu không thể bị lộ ra ngoài.',
        },
      ],
    },
  },
];

export function getAllTools(): ToolDefinition[] {
  return TOOLS;
}

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  if (category === 'all') return TOOLS;
  return TOOLS.filter((t) => t.category === category);
}

export function getCategories(): CategoryInfo[] {
  return CATEGORIES;
}
