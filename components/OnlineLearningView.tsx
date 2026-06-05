import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Award, 
  Volume2, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Trophy, 
  Activity, 
  Lightbulb, 
  GraduationCap, 
  Clock,
  Sparkles,
  HelpCircle,
  FileEdit
} from 'lucide-react';
import { User } from '../App';
import { ClassInfo } from './TrainingDashboardView';

export interface CourseScenarioStep {
  id: string;
  title: string;
  speaker: string;
  narrative: string;
  visualType: 'welcome' | 'highlight' | 'matrix' | 'interactive_choice' | 'certificate';
  visualMeta?: { 
    type?: string; 
    items?: Array<{ label: string; desc: string }>; 
    quadrants?: Array<{ title: string; actions: string; items: string[]; color: string }>; 
    question?: string; 
    options?: Array<{ id: string; text: string; isCorrect: boolean; feedback: string }>;
    pointsEarned?: number;
  };
  duration: number; // in seconds
}

// Preset course scenarios designed for each class
const SCENARIO_DATA: Record<string, CourseScenarioStep[]> = {
  'class-1': [
    {
      id: 'c1-1',
      title: 'Chào mừng tham gia bài giảng Online',
      speaker: 'ThS. Trần Văn An (Chuyên gia Hiệu suất)',
      narrative: 'Xin chào toàn thể học viên! Chào mừng các bạn đến với học phần "Kỹ năng Quản lý Thời gian" - hệ thống kịch bản học tập trực quan. Hôm nay chúng ta sẽ cùng học cách làm chủ quỹ thời gian hữu hạn để kiến tạo hiệu quả đột phá bậc nhất trong môi trường công sở hiện đại.',
      visualType: 'welcome',
      duration: 10
    },
    {
      id: 'c1-2',
      title: 'Thiết lập Mục tiêu Thông minh (S.M.A.R.T)',
      speaker: 'ThS. Trần Văn An (Chuyên gia Hiệu suất)',
      narrative: 'Để quản lý quỹ thời gian khôn ngoan, điều bắt buộc đầu tiên là mục tiêu phải thật rõ nét. Mô hình SMART bao gồm 5 tiêu chuẩn cốt lõi: Cụ thể (Specific), Đo lường (Measurable), Khả thi (Achievable), Thực tế (Relevant), và Thời hạn (Time-bound). Hãy nhấp xem chi tiết từng tiêu chí phía bên phải màn hình.',
      visualType: 'highlight',
      visualMeta: {
        type: 'smart',
        items: [
          { label: 'S - Specific (Cụ thể)', desc: 'Xác định chính xác mong muốn, không đặt mục tiêu chung chung như "muốn làm việc chăm chỉ hơn".' },
          { label: 'M - Measurable (Đo lường)', desc: 'Đong đếm được bằng chỉ báo/con số cụ thể, ví dụ như "hoàn thành 3 báo cáo kinh doanh".' },
          { label: 'A - Achievable (Khả thi)', desc: 'Nằm trong năng lực khả thi của bản thân, không đặt mục tiêu viển vông vượt quá mọi tiềm lực.' },
          { label: 'R - Relevant (Thực tế)', desc: 'Mục tiêu phải đồng bộ và trực tiếp phục vụ sứ mệnh hoặc lợi ích chung của doanh nghiệp.' },
          { label: 'T - Time-bound (Thời hạn)', desc: 'Bắt buộc phải cài đặt ngày giờ hoàn thành cụ thể (Deadline) để kích hoạt mức độ ưu tiên.' }
        ]
      },
      duration: 15
    },
    {
      id: 'c1-3',
      title: 'Thực hành Ma trận quản lý thời gian Eisenhower',
      speaker: 'ThS. Trần Văn An (Chuyên gia Hiệu suất)',
      narrative: 'Tiếp theo, hãy nghiên cứu Ma trận Eisenhower huyền thoại. Ma trận này phân chia toàn bộ công việc hàng ngày của bạn thành 4 nhóm theo trục Quan trọng và Khẩn cấp. Hãy di chuột khám phá 4 ô phần tư này để phân định hành động thông minh nhất.',
      visualType: 'matrix',
      visualMeta: {
        quadrants: [
          { title: 'Q1: Khẩn & Quan trọng', actions: 'Hành động ngay lập tức', items: ['Khắc phục sự cố khẩn', 'Báo cáo tài chính đến hạn chót', 'Khủng hoảng từ khách hàng lớn'], color: 'border-rose-500/30 bg-rose-500/5 text-rose-500 dark:text-rose-400' },
          { title: 'Q2: Quan trọng - Thư thả', actions: 'Lên lịch hẹn thực hiện', items: ['Đào tạo năng lực cốt lõi', 'Xây dựng mối quan hệ hệ thống', 'Lập kế hoạch tuần/tháng'], color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' },
          { title: 'Q3: Gấp - Ít quan trọng', actions: 'Ủy quyền / Giao quyền', items: ['Các tin nhắn rác chen ngang', 'Các cuộc họp giao ban diện rộng', 'Hỗ trợ vụn vặt bộ phận bạn'], color: 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400' },
          { title: 'Q4: Không gấp - Không quan', actions: 'Loại bỏ / Tránh xa', items: ['Đọc tin giật gân, MXH', 'Tán gẫu kéo dài', 'Thủ tục rườm rà không giá trị'], color: 'border-slate-500/30 bg-slate-500/5 text-slate-500 dark:text-slate-400' }
        ]
      },
      duration: 18
    },
    {
      id: 'c1-4',
      title: 'Trắc nghiệm: Phân tích tư duy quản trị thời gian',
      speaker: 'ThS. Trần Văn An (Chuyên gia Hiệu suất)',
      narrative: 'Chúng ta cùng thử thách nhanh: Theo mô hình Eisenhower, một công việc rất "Quan trọng nhưng Chưa hề khẩn cấp" (Ví dụ: Thiết lập kế hoạch phòng ngừa bảo mật hệ thống thông tin nội bộ hàng tháng) nên được xử trí ra sao để tối ưu hóa năng suất?',
      visualType: 'interactive_choice',
      visualMeta: {
        question: 'Đối với việc "Quan trọng nhưng Không khẩn cấp" (Phần tư Q2), đâu là quyết sách hành động chuẩn xác nhất?',
        options: [
          { id: 'opt1-1', text: 'Ủy nhiệm hoặc giao hết cho bất kỳ nhân viên tập sự nào rảnh rỗi', isCorrect: false, feedback: 'Sai rồi. Đây là việc mang tính quan trọng cốt lõi đối với hiệu năng hoạt động của bạn hoặc tổ chức, không thể phó mặc không định hướng.' },
          { id: 'opt1-2', text: 'Lên lịch hẹn chi tiết trên Google Calendar và tự mình bắt tay hoàn thành chu đáo', isCorrect: true, feedback: 'Hoàn hảo! Đầu tư thời gian cho nhóm Q2 (Quan trọng nhưng Chưa gấp) chính là chìa khóa vàng giúp loại bỏ các khủng hoảng bất ngờ nhóm Q1 sau này.' },
          { id: 'opt1-3', text: 'Trì hoãn, đợi tới khi nào sếp thúc giục gắt gao rồi mới nhảy vào làm gấp', isCorrect: false, feedback: 'Chưa chính xác. Nếu chỉ đợi đến khi việc trở nên khẩn cấp (biến thành Q1), bạn sẽ luôn rơi vào trạng thái kiệt quệ và áp lực tột độ.' },
          { id: 'opt1-4', text: 'Cắt giảm và loại trừ vĩnh viễn khỏi danh sách việc vì không có áp lực thời gian trước mắt', isCorrect: false, feedback: 'Không đúng. Bỏ qua nhóm Q2 sẽ khiến bạn mất định hướng chiến lược và chất lượng vận hành đi xuống nghiêm trọng.' }
        ]
      },
      duration: 9999
    },
    {
      id: 'c1-5',
      title: 'Hoàn thành Khóa học xuất sắc',
      speaker: 'Hệ thống Quản lý Đào tạo',
      narrative: 'Xin nhiệt liệt chúc mừng học viên! Bạn đã hoàn thành trọn vẹn kịch bản Đào tạo trực tuyến một cách ấn tượng. Hãy nhấp nút "Nhận điểm thi đua" để đồng bộ kết quả trực tiếp vào Sổ điểm tổng hợp của lớp học nhé!',
      visualType: 'certificate',
      visualMeta: { pointsEarned: 100 },
      duration: 10
    }
  ],
  'class-2': [
    {
      id: 'c2-1',
      title: 'Chào mừng khóa Marketing Kỹ thuật số 101',
      speaker: 'Hoàng Văn Em (Chuyên gia MKT & SEO)',
      narrative: 'Xin chào các nhân sự chiến binh! Tôi là Hoàng Văn Em. Hôm nay chúng ta sẽ tiếp cận giáo kịch thiết kế kịch bản hoạt động Marketing Số. Mục tiêu là giúp các bạn nắm rõ cấu trúc vận chuyển khách hàng và cách tiếp cận đa kênh thông minh nhất.',
      visualType: 'welcome',
      duration: 10
    },
    {
      id: 'c2-2',
      title: 'Mô hình Phễu Chuyển đổi khách hàng (Marketing Funnel)',
      speaker: 'Hoàng Văn Em (Chuyên gia MKT & SEO)',
      narrative: 'Phễu Marketing là xương sống định hình đường đi của khách hàng bao gồm 4 giai đoạn logic sâu sắc từ rộng đến hẹp: Nhận thức (Awareness), Cân nhắc (Consideration), Chuyển đổi mua hàng (Conversion) và Trung thành (Loyalty). Chăm sóc đúng phễu sẽ giảm thiểu chi phí quảng cáo ròng rỗng.',
      visualType: 'highlight',
      visualMeta: {
        type: 'funnel',
        items: [
          { label: '1. Awareness (Nhận thức)', desc: 'Xây dựng độ phủ ban đầu thông qua bài viết chia sẻ, Fanpage hữu ích, video ngắn giải trí.' },
          { label: '2. Consideration (Cân nhắc)', desc: 'Cung cấp bài đánh giá chiều sâu, tài liệu chuyên nghành, so sánh thông số với đối thủ để củng cố lòng tin.' },
          { label: '3. Conversion (Chuyển đổi)', desc: 'Khơi gợi ưu đãi giới hạn, miễn phí tư vấn hoặc dùng thử để khách hàng click chốt đơn ngay.' },
          { label: '4. Loyalty (Trung thành)', desc: 'Xây dựng chăm sóc hậu mãi, email marketing giá trị định kỳ biến họ thành đại sứ thương hiệu.' }
        ]
      },
      duration: 15
    },
    {
      id: 'c2-3',
      title: 'Tình huống: Tối ưu kênh tiếp cận ngân sách nhỏ',
      speaker: 'Hoàng Văn Em (Chuyên gia MKT & SEO)',
      narrative: 'Bài toán thực thế đặt ra: Nếu công ty của bạn muốn phát triển lâu dài, tạo tệp khách hàng tự nhiên ổn định nhưng có nguồn tài chính duy trì ban đầu ở mức tối thiểu, kênh tiếp thị nào nên được dồn tài nguyên đầu tư lực lượng?',
      visualType: 'interactive_choice',
      visualMeta: {
        question: 'Với mong muốn bền vững, chi phí dài hạn tối ưu và tiếp cận tự nhiên, phương hướng tiếp thị nào khả quan nhất?',
        options: [
          { id: 'opt2-1', text: 'Bơm toàn bộ ngân sách để thuê KOLs mảng giải trí giật gân quảng bá một lần duy nhất', isCorrect: false, feedback: 'Rất tiếc, KOL mảng rác có thể kéo sóng ảo lúc đầu nhưng hoàn toàn không đem lại tệp khách hàng thực tế bền vững.' },
          { id: 'opt2-2', text: 'Tập trung sáng tạo nội dung chất trị hữu ích phục vụ SEO & Organic Website lâu dài', isCorrect: true, feedback: 'Không thể tuyệt vời hơn! Giá trị SEO bền vững giúp website của bạn luôn xếp hạng cao tự nhiên trên Google, thu hút đúng tệp người dùng đang có nhu cầu thực sự.' },
          { id: 'opt2-3', text: 'Đốt tiền chạy quảng cáo trả phí PPC (Google Ads) giá thầu từ khóa khốc liệt liên tục không ngừng', isCorrect: false, feedback: 'Nhầm lẫn lớn, PPC kéo khách tức thời nhưng nếu cứ dừng nạp tiền là lượng khách tắt ngấm, không bền cho dự án ít vốn.' }
        ]
      },
      duration: 9999
    },
    {
      id: 'c2-4',
      title: 'Hoàn thành Chứng chỉ Tiếp thị Kỹ thuật số',
      speaker: 'Ban Giám đốc Marketing',
      narrative: 'Bạn đã hoàn tất xuất sắc bài thực nghiệm lý thuyết kịch bản Marketing Số! Điểm thi đua của bạn đã sẵn sàng được cộng vào tài khoản học tập chung.',
      visualType: 'certificate',
      visualMeta: { pointsEarned: 100 },
      duration: 10
    }
  ],
  'class-3': [
    {
      id: 'c3-1',
      title: 'Lộ trình Lập trình ứng dụng với React',
      speaker: 'Phạm Minh Cường (Kỹ sư Frontend Cao cấp)',
      narrative: 'Chào mừng anh chị em đồng nghiệp IT! Tôi là Phạm Minh Cường. Đào tạo online hôm nay sẽ đưa bạn qua cơ chế hoạt động của React - thư viện UI hàng đầu thế giới để kiến tạo nên những Web App siêu tốc độ.',
      visualType: 'welcome',
      duration: 10
    },
    {
      id: 'c3-2',
      title: 'Quản lý Trạng thái mượt mà với React Hooks',
      speaker: 'Phạm Minh Cường (Kỹ sư Frontend Cao cấp)',
      narrative: 'React sở hữu cơ chế Virtual DOM cực đỉnh. Khi cập nhật giao diện, Hooks đóng vai trò then chốt trong cấu trúc functional component. Chúng ta cần hiểu rõ công hiệu của useState giúp điều khiển trạng thái hiển thị, và useEffect giúp xử lý logic gọi API ngoài hoặc đồng bộ hóa sự kiện.',
      visualType: 'highlight',
      visualMeta: {
        type: 'react',
        items: [
          { label: 'useState', desc: 'Hook cơ sở cài đặt trạng thái. Khi state cập nhật, React tự động kích hoạt tính toán render lại component tối ưu nhất.' },
          { label: 'useEffect', desc: 'Chạy logic side-effects như kéo data từ máy chủ, lắng nghe bàn phím chuột. Luôn quản lý dependency array để tránh vòng lặp re-render!' },
          { label: 'useRef', desc: 'Trỏ trực tiếp tham chiếu tới nút thẻ DOM thực tế hoặc lưu trữ thông tin không muốn kích hoạt re-render màn hình.' },
          { label: 'useMemo/useCallback', desc: 'Đóng băng bộ nhớ cho các hàm tính toán nặng nề hoặc callback truyền xuống lớp con nhằm ngăn ngừa lãng phí CPU.' }
        ]
      },
      duration: 16
    },
    {
      id: 'c3-3',
      title: 'Tư duy Code thực dụng trong React',
      speaker: 'Phạm Minh Cường (Kỹ sư Frontend Cao cấp)',
      narrative: 'Hãy suy ngẫm sâu về quy tắc bất biến (Immutability). Ở React, để cập nhật một danh sách mảng trong state một cách chính xác không gây ra lỗi tham chiếu tĩnh, bạn sẽ chọn giải đoạn code nào dưới đây?',
      visualType: 'interactive_choice',
      visualMeta: {
        question: 'Làm thế nào để thêm một phần tử công việc mới vào mảng danh sách (todoList) của useState một cách chính quy nhất?',
        options: [
          { id: 'opt3-1', text: 'todoList.push(newItem); setTodoList(todoList);', isCorrect: false, feedback: 'Sai hoàn toàn. Push làm thay đổi trực tiếp mảng gốc, React sẽ so sánh nông thấy cùng địa chỉ biến nên sẽ KHÔNG render lại màn hình đâu.' },
          { id: 'opt3-2', text: 'setTodoList([...todoList, newItem]);', isCorrect: true, feedback: 'Tuyệt diệu! Sử dụng toán tử spread (`...`) tạo ra một tham chiếu mảng hoàn toàn mới. Đây chính là chuẩn mực tư duy bất biến (Immutability) thúc đẩy React vận hành an toàn.' },
          { id: 'opt3-3', text: 'todoList = [...todoList, newItem];', isCorrect: false, feedback: 'Sai cú pháp cơ bản. Bạn tuyệt đối không được gán đè trực tiếp tham chiếu biến state mà bắt buộc phải qua hàm setter.' }
        ]
      },
      duration: 9999
    },
    {
      id: 'c3-4',
      title: 'Chúc mừng nhận chứng chỉ React Basic',
      speaker: 'Đội ngũ Huấn luyện Công nghệ',
      narrative: 'Vỗ tay tán thưởng! Bạn đã vượt qua chương trình lý thuyết thực chiến của lập trình React mượt mà. Đã sẵn sàng cập nhật thành quả của bạn tủ điểm số.',
      visualType: 'certificate',
      visualMeta: { pointsEarned: 100 },
      duration: 10
    }
  ],
  'generic': [
    {
      id: 'cg-1',
      title: 'Học phần Đào tạo tổng hợp',
      speaker: 'Bộ phận Học thuật & Đội ngũ Giảng viên',
      narrative: 'Chào mừng toàn thể anh chị học viên. Hệ thống kịch bản học trực tuyến đã kích hoạt khóa chuyên đề này. Vui lòng tập trung tinh thần để ghi nhận toàn bộ luận điểm lý thuyết quan trọng nhất.',
      visualType: 'welcome',
      duration: 10
    },
    {
      id: 'cg-2',
      title: 'Phương châm học tập tối ưu',
      speaker: 'Bộ phận Học thuật & Đội ngũ Giảng viên',
      narrative: 'Tiến trình đào tạo của chúng ta được chia làm 3 bước đệm vững chắc: Đọc hiểu trọng tâm, Thực nghiệm các trường hợp ví dụ cụ thể, và Trả lời câu kiểm tra trắc nghiệm tức thời để khắc sâu trí nhớ dài hạn.',
      visualType: 'highlight',
      visualMeta: {
        type: 'gen',
        items: [
          { label: '1. Tiếp thu Chủ động', desc: 'Quan sát các thẻ bên phải, kết hợp suy luận ứng dụng vào bài toán của chính phòng ban làm việc.' },
          { label: '2. Tương tác Thường trực', desc: 'Bấm chọn vào các mục tiêu để hệ thống hiển thị chi tiết chỉ báo và kiến giải cụ thể.' },
          { label: '3. Nghiêm túc Kiểm định', desc: 'Hoàn thành câu hỏi đánh giá thực tế khách quan trước khi được ghi nhận tích lũy điểm.' }
        ]
      },
      duration: 14
    },
    {
      id: 'cg-3',
      title: 'Nghiệm thu kiến thức bài học',
      speaker: 'Bộ phận Học thuật & Đội ngũ Giảng viên',
      narrative: 'Để đảm bảo anh chị đã thu hoạch trọn vẹn tinh túy bài học, hãy giải quyết câu trắc nghiệm tình huống sau đây:',
      visualType: 'interactive_choice',
      visualMeta: {
        question: 'Phương thức tối ưu nhất giúp chuyển hóa lý thuyết đào tạo thành kết quả năng suất làm việc thực tế hàng ngày là gì?',
        options: [
          { id: 'optg-1', text: 'Học vẹt thi hộ cho có chứng chỉ, sau đó cất hết tài liệu vào tủ khóa kín', isCorrect: false, feedback: 'Sai lầm nghiêm trọng! Học đối phó không tạo ra bất kỳ giá trị thực học thực làm nào cả.' },
          { id: 'optg-2', text: 'Chủ động bàn bạc thảo luận với đồng nghiệp, triển khai thử nghiệm từng bước nhỏ và ghi nhật ký đúc rút', isCorrect: true, feedback: 'Tuyệt cú mèo! Học đi đôi với hành, liên tục phản tư chính là con đường ngắn nhất nâng tầm năng lực bản thân.' },
          { id: 'optg-3', text: 'Đợi khi nào thật rảnh rỗi mới lôi ra đọc lướt, không cần thảo luận ứng dụng chi cho nhức đầu', isCorrect: false, feedback: 'Không ổn. Trì hoãn thực nghiệm khiến kiến thức nguội lạnh nhanh chóng.' }
        ]
      },
      duration: 9999
    },
    {
      id: 'cg-4',
      title: 'Đạt yêu cầu Chuyên nghiệp',
      speaker: 'Ban Thư ký Đào tạo',
      narrative: 'Xuất sắc tuyệt vời! Toàn bộ nội dung kịch bản giảng huấn đã được bạn thực nghiệm trọn vẹn và thông qua. Hệ thống đã mở khóa điểm tích lũy thi đua.',
      visualType: 'certificate',
      visualMeta: { pointsEarned: 100 },
      duration: 10
    }
  ]
};

interface OnlineLearningViewProps {
  classId: string;
  classInfo: ClassInfo;
  user: User;
}

export const OnlineLearningView: React.FC<OnlineLearningViewProps> = ({ classId, classInfo, user }) => {
  const scenario = useMemo(() => {
    return SCENARIO_DATA[classId] || SCENARIO_DATA['generic'];
  }, [classId]);

  // Core scenario states
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(() => {
    const key = `course_step_idx_${classId}_${user.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = parseInt(stored, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  });
  const [progress, setProgress] = useState(0); // 0 to 100 for current step progress bar
  const [isPlaying, setIsPlaying] = useState(true);
  const [courseSpeed, setCourseSpeed] = useState<number>(1); // 1, 1.25, 1.5, 2
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userFeedback, setUserFeedback] = useState<string | null>(null);
  const [scoreEarned, setScoreEarned] = useState(0);
  const [quizScore, setQuizScore] = useState<number | null>(null); // null, or 0 / 100
  const [isCompleted, setIsCompleted] = useState(false);

  // Quick Notes State
  const [quickNotes, setQuickNotes] = useState<string>(() => {
    return localStorage.getItem(`online_learning_notes_${classId}_${user.id}`) || '';
  });

  // Auto-persist active step and compute course completion stats
  useEffect(() => {
    if (!classId || !user?.id) return;
    localStorage.setItem(`course_step_idx_${classId}_${user.id}`, String(currentStepIdx));
    const progressPercent = Math.round(((currentStepIdx + 1) / scenario.length) * 100);
    localStorage.setItem(`course_progress_percentage_${classId}_${user.id}`, String(progressPercent));
  }, [currentStepIdx, classId, user.id, scenario.length]);

  // Soundwave visual states
  const [voicePulse, setVoicePulse] = useState<number[]>([12, 28, 42, 10, 32]);
  
  // Animation timer ref to avoid React stale states
  const animationFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);

  const currentStep = useMemo(() => {
    return scenario[currentStepIdx] || scenario[0];
  }, [scenario, currentStepIdx]);

  // Save completion status to localStorage
  const hasEverCompleted = useMemo(() => {
    const key = `course_completed_${classId}_${user.id}`;
    return localStorage.getItem(key) === 'true';
  }, [classId, user.id]);

  useEffect(() => {
    if (hasEverCompleted && !isCompleted) {
      setScoreEarned(100);
    }
  }, [hasEverCompleted]);

  // Soundwave ripple effect simulation when speaking is active and playing
  useEffect(() => {
    if (!isPlaying) {
      // flat line simulation when paused
      setVoicePulse([4, 4, 4, 4, 4]);
      return;
    }
    
    // Do not pulse if it's quiz waiting or certificate
    if (currentStep.visualType === 'interactive_choice' && isAnswered === false) {
      setVoicePulse([4, 4, 4, 4, 4]);
      return;
    }

    const interval = setInterval(() => {
      setVoicePulse(Array.from({ length: 6 }, () => Math.floor(Math.random() * 45) + 6));
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying, currentStep.visualType, isAnswered]);

  const handleNextStep = () => {
    if (currentStepIdx < scenario.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
      setProgress(0);
      setIsAnswered(false);
      setSelectedOption(null);
      setUserFeedback(null);
      // Resume autoplay unless it's a quiz step
      const nextStep = scenario[currentStepIdx + 1];
      if (nextStep && nextStep.visualType === 'interactive_choice') {
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(false);
      setIsCompleted(true);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
      setProgress(0);
      setIsAnswered(false);
      setSelectedOption(null);
      setUserFeedback(null);
      setIsPlaying(true);
    }
  };

  // Play / Pause toggler
  const handleTogglePlay = () => {
    if (currentStep.visualType === 'interactive_choice' && !isAnswered) {
      // Cannot play slide if waiting for quiz response
      setIsPlaying(false);
      return;
    }
    setIsPlaying(!isPlaying);
  };

  // Complete Reset / Stop button
  const handleStopAndReset = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
    setProgress(0);
    setIsAnswered(false);
    setSelectedOption(null);
    setUserFeedback(null);
    setQuizScore(null);
  };

  // Core automatic progress calculation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    // Skip slide calculation if it's a waiting state
    if (currentStep.duration >= 9999) {
      setIsPlaying(false);
      return;
    }

    lastTickTimeRef.current = performance.now();

    const tick = (now: number) => {
      const delta = (now - lastTickTimeRef.current) / 1000; // in seconds
      lastTickTimeRef.current = now;

      setProgress(prev => {
        // Base duration modified by course speed (Multiply rate by speed)
        const stepDuration = currentStep.duration;
        const rate = (100 / stepDuration) * courseSpeed;
        const nextProgress = prev + (delta * rate);

        if (nextProgress >= 100) {
          // Slide completed! Advance to next slide after a super tiny breather
          setTimeout(() => {
            handleNextStep();
          }, 150);
          return 100;
        }
        return nextProgress;
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentStepIdx, courseSpeed, currentStep]);

  // Speed handlers
  const handleCycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(courseSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setCourseSpeed(nextSpeed);
  };

  // Quiz submission handler
  const handleOptionSelect = (optionId: string, isCorrect: boolean, feedback: string) => {
    if (isAnswered) return; // locked once checked
    setSelectedOption(optionId);
    setIsAnswered(true);
    setUserFeedback(feedback);
    
    if (isCorrect) {
      setQuizScore(100);
      setScoreEarned(100);
    } else {
      setQuizScore(0);
    }
    
    // Open flow so they can hit Next step
    setIsPlaying(false);
  };

  // Send score to classroom grades in localStorage
  const handleClaimPoints = () => {
    // 1. Commit to course completed list
    const compKey = `course_completed_${classId}_${user.id}`;
    localStorage.setItem(compKey, 'true');

    // 2. Insert into score roster sheet
    const scoreMapKey = `classroom_grades_${classId}`;
    const storedScoresStr = localStorage.getItem(scoreMapKey);
    let scoresObj: Record<string, Record<string, string>> = {};
    if (storedScoresStr) {
      try {
        scoresObj = JSON.parse(storedScoresStr);
      } catch (e) {
        console.error(e);
      }
    }

    if (!scoresObj[user.id]) {
      scoresObj[user.id] = {};
    }
    // Set score onto assignments
    // Let's check assignments. In Kỹ năng Quản lý Thời Gian, default assignment is 'mat-4'.
    // We can populate to all assignments or custom online-learning metric inside
    scoresObj[user.id]['mat-4'] = '100'; // Set 100 points
    scoresObj[user.id]['online-mkt-m4'] = '100'; // or fallback helper
    localStorage.setItem(scoreMapKey, JSON.stringify(scoresObj));

    setIsCompleted(true);
    alert('Hệ thống đã đồng bộ 100 điểm thi đua Đào tạo thuộc chuyên mục này vào sổ học tập của bạn!');
  };

  return (
    <div className="max-w-5xl mx-auto py-2 px-1 text-left space-y-4">
      
      {/* Intro visual panel with layout description */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-500 animate-bounce" />
            <span>Đào tạo thông minh: Bắt đầu học online</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Kịch bản học trực tiếp theo lộ trình chuẩn hóa. Nhấn Play để tự động phát thuyết minh nội dung và làm các bài kiểm tra thực nghiệm.
          </p>
        </div>
        
        {/* Status indicator badges */}
        <div className="flex items-center gap-2">
          {hasEverCompleted ? (
            <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ĐÃ HOÀN THÀNH KHÓA HỌC
            </span>
          ) : (
            <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-950/20 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              CHƯA HOÀN THÀNH (ĐANG HỌC)
            </span>
          )}
          
          <div className="bg-indigo-50 dark:bg-slate-900 border border-indigo-150/15 p-1 rounded-xl flex items-center gap-2.5 text-xs font-bold text-slate-705 shadow-sm px-3.5 py-1">
            <Trophy className="w-3.5 h-3.5 text-indigo-500" />
            <span>Điểm tích lũy: <strong className="text-indigo-650 dark:text-indigo-400">{scoreEarned}/100</strong></span>
          </div>
        </div>
      </div>

      {/* RETAILING THE MAIN GLASSMORPHISM ONLINE STUDENT BOX CONTAINER */}
      <div className="w-full glass-card-premium rounded-2xl border border-white/20 dark:border-slate-800 p-5 md:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        
        {/* Absolute glowing neon circles behind the glass player */}
        <div className="absolute top-10 right-10 w-44 h-44 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-12 left-12 w-32 h-32 rounded-full bg-pink-500/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
          
          {/* LEFT COLUMN: SPEAKER, TRANSCRIPT (3 OF 12 COLS) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            
            {/* Lecturer Card */}
            <div className="bg-white/40 dark:bg-slate-950/30 border border-white/40 dark:border-white/5 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-md relative shrink-0">
                {currentStep.speaker.charAt(0)}
                {isPlaying && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold flex items-center gap-1">
                  Giảng viên Trực tuyến
                  {isPlaying && <span className="text-green-500 font-bold">• Speaking</span>}
                </p>
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">{currentStep.speaker}</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{classInfo.name}</p>
              </div>
            </div>

            {/* Narrator Voice Audio Visualizer Waveforms */}
            <div className="bg-white/40 dark:bg-slate-950/45 border border-white/30 dark:border-white/5 rounded-xl p-3.5 flex flex-col justify-center items-center gap-2">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tần số giọng thuyết minh AI</p>
              <div className="h-10 flex items-center gap-1.5 justify-center py-1">
                {voicePulse.map((val, idx) => (
                  <span 
                    key={idx} 
                    className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-150 inline-block"
                    style={{ height: `${val}px` }}
                  ></span>
                ))}
              </div>
            </div>

            {/* Subtitles & Captions Block (Tài liệu Transcript) */}
            <div className="bg-white/60 dark:bg-slate-950/50 border border-white/50 dark:border-white/5 rounded-xl p-4 flex-1 flex flex-col no-scrollbar overflow-y-auto max-h-[220px] shadow-inner relative justify-between">
              <div>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-extrabold mb-2.5 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-indigo-500" /> Cập nhật Thuyết minh tự động
                </p>
                <p className="text-[11.5px] leading-relaxed font-semibold text-slate-700 dark:text-slate-200">
                  "{currentStep.narrative}"
                </p>
              </div>

              {/* Interactive Hints footer */}
              {currentStep.visualType === 'interactive_choice' && !isAnswered && (
                <div className="mt-3.5 bg-amber-50 dark:bg-amber-950/15 text-amber-700 dark:text-amber-400 border border-amber-200/20 text-[9.5px] font-bold px-2.5 py-2 rounded-xl flex items-center gap-2 animate-pulse">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Bạn cần chọn đáp án chính xác bên phải để bài học được lưu tự động và tiếp tục.
                </div>
              )}
            </div>

          </div>

          {/* MIDDLE COLUMN: INTERACTIVE SLIDES SCREEN (6 OF 12 COLS) */}
          <div className="lg:col-span-6 flex flex-col min-h-[360px] bg-slate-50/60 dark:bg-slate-950/60 border border-slate-200/40 dark:border-slate-900 rounded-2xl p-4 md:p-5 relative justify-between overflow-hidden">
            
            {/* Top index headers indicator */}
            <div className="flex items-center justify-between border-b border-slate-200/30 dark:border-slate-800/60 pb-3 mb-4">
              <span className="text-[10.5px] uppercase tracking-wider font-extrabold text-indigo-600 dark:text-blue-400">
                CHƯƠNG {currentStepIdx + 1} / {scenario.length}: {currentStep.title}
              </span>
              <span className="text-[10px] font-bold bg-white/55 dark:bg-slate-900 border border-slate-200/20 px-2 py-0.5 rounded-lg text-slate-400">
                Slide Mode
              </span>
            </div>

            {/* DYNAMIC CONTENT SWITCHER COMPONENT */}
            <div className="flex-1 flex flex-col justify-center py-2 relative z-10">
              
              {/* WELCOME SLIDE TYPE */}
              {currentStep.visualType === 'welcome' && (
                <div className="text-center py-5 space-y-4 animate-fade-in">
                  <div className="w-20 h-20 bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-inner relative">
                    <BookOpen className="w-10 h-10 animate-pulse text-indigo-500" />
                    <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-purple-400 animate-spin" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h2 className="text-lg md:text-xl font-extrabold text-slate-800 dark:text-white leading-normal">
                      Kịch bản đào tạo online: {classInfo.name}
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-400">
                      Được chuẩn hóa kỹ lưỡng bởi {classInfo.teacher}. Nhấn nút khởi động bên dưới hoặc click nút Play ở thanh điều khiển để bắt đầu khóa học.
                    </p>
                  </div>
                  
                  <div>
                    <button 
                      onClick={() => setIsPlaying(true)} 
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Play className="w-4.5 h-4.5 fill-white" />
                      Khởi động Tiến trình Học Online
                    </button>
                  </div>
                </div>
              )}

              {/* HIGHLIGHT BULLET POINTS SLIDE TYPE */}
              {currentStep.visualType === 'highlight' && (
                <div className="space-y-3 animate-fade-in text-left">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-extrabold flex items-center gap-1 mb-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Nhấp chọn các tiêu chuẩn trọng tâm để xem giải nghĩa
                  </p>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar pr-1">
                    {currentStep.visualMeta?.items?.map((item, i: number) => (
                      <div 
                        key={i} 
                        className="bg-white/45 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 hover:border-indigo-500/30 p-2.5 rounded-xl transition-all shadow-xs group"
                      >
                        <h5 className="text-[11.5px] font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-500 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 text-[10px] font-bold flex items-center justify-center">
                            0{i + 1}
                          </span>
                          {item.label}
                        </h5>
                        <p className="text-[10.5px] text-slate-400 dark:text-slate-400 leading-relaxed pl-7 mt-1 font-semibold">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EISENHOWER / GRID MATRIX SLIDE TYPE */}
              {currentStep.visualType === 'matrix' && (
                <div className="space-y-2.5 animate-fade-in text-left">
                  <p className="text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-widest font-extrabold mb-1">
                    Trực quan: Biểu đồ phân tích vị trí Eisenhower
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {currentStep.visualMeta?.quadrants?.map((quad, i: number) => (
                      <div 
                        key={i} 
                        className={`p-2.5 rounded-xl border transition-all h-[115px] flex flex-col justify-between ${quad.color} shadow-xs hover:scale-[1.02]`}
                      >
                        <div>
                          <h6 className="text-[10.5px] font-black uppercase tracking-tight truncate" title={quad.title}>
                            {quad.title}
                          </h6>
                          <div className="space-y-0.5 mt-1">
                            {quad.items.slice(0, 2).map((item: string, j: number) => (
                              <p key={j} className="text-[9px] truncate opacity-90 font-medium pl-1.5 relative">
                                <span className="absolute left-0 top-1 w-1 h-1 rounded-full bg-current opacity-70"></span>
                                {item}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="pt-1.5 border-t border-current/10 mt-1 flex justify-between items-center bg-transparent shrink-0">
                          <span className="text-[8px] font-extrabold uppercase">Quản trị:</span>
                          <span className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded font-black text-[8px] tracking-wide">
                            {quad.actions}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QUIZ CHOICE QUESTION SLIDE TYPE */}
              {currentStep.visualType === 'interactive_choice' && (
                <div className="space-y-3.5 animate-fade-in text-left">
                  <div className="space-y-1">
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wide font-black flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" /> Thử thách kiểm định năng lực
                    </p>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-white leading-relaxed">
                      {currentStep.visualMeta?.question}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {currentStep.visualMeta?.options?.map((opt) => {
                      const isSelected = selectedOption === opt.id;
                      let btnStyle = "bg-white/45 dark:bg-slate-900 border-slate-200/40 dark:border-slate-800 hover:border-indigo-500/30";
                      
                      if (isAnswered) {
                        if (opt.isCorrect) {
                          btnStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400";
                        } else if (isSelected) {
                          btnStyle = "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400";
                        } else {
                          btnStyle = "opacity-45 bg-slate-50 border-slate-100 dark:bg-slate-950 dark:border-slate-900";
                        }
                      }

                      return (
                        <button
                          key={opt.id}
                          disabled={isAnswered}
                          onClick={() => handleOptionSelect(opt.id, opt.isCorrect, opt.feedback)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between gap-3 ${btnStyle} ${!isAnswered ? 'cursor-pointer active:scale-99' : 'cursor-default'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-350 dark:border-slate-700 text-slate-400'} text-[10px]`}>
                              {isSelected ? '✓' : ''}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          
                          {isAnswered && opt.isCorrect && (
                            <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-black shrink-0">
                              ĐÁP ÁN ĐÚNG
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && userFeedback && (
                    <div className={`p-3 rounded-xl border text-[10.5px] font-semibold leading-relaxed flex gap-2 animate-fade-in ${quizScore === 100 ? 'bg-emerald-100/40 dark:bg-emerald-950/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-400'}`}>
                      {quizScore === 100 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <div>
                        <strong>Giải nghĩa:</strong> {userFeedback}
                        <div className="mt-1.5">
                          <button 
                            onClick={handleNextStep} 
                            className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold rounded-lg transition-colors active:scale-95"
                          >
                            Tiếp tục bài học →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CERTIFICATE GRADUATION ACHIEVEMENT SLIDE */}
              {currentStep.visualType === 'certificate' && (
                <div className="text-center py-4 space-y-4 animate-fade-in">
                  <div className="w-16 h-16 bg-amber-500/15 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-md relative">
                    <Award className="w-9 h-9 text-amber-500 animate-pulse" />
                    <Sparkles className="absolute -top-1.5 -right-1.5 w-5 h-5 text-indigo-400 animate-spin" />
                  </div>
                  
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">CHỨNG NHẬN TRỰC TUYẾN THÀNH CÔNG</h3>
                    <h2 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-600">
                      {user.name}
                    </h2>
                    <p className="text-[10.5px] text-slate-400 dark:text-slate-450 leading-relaxed">
                      Đã hoàn thành toàn bộ kịch bản bài học đào tạo trực thuộc chuyên đề <strong className="text-slate-705 dark:text-slate-300">"{classInfo.name}"</strong> của lớp học do {classInfo.teacher} chủ nhiệm.
                    </p>
                  </div>

                  <div>
                    {hasEverCompleted ? (
                      <div className="bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30 text-[10.5px] font-bold px-3 py-1.5 rounded-xl inline-flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Điểm số đã đồng bộ trong sổ học tập!
                      </div>
                    ) : (
                      <button
                        onClick={handleClaimPoints}
                        className="px-5 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 mx-auto"
                      >
                        <Trophy className="w-4 h-4" />
                        Nhận 100 Điểm Thi Đua Đào Tạo
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* PROGRESS GAUGE BAR CONTROLLER */}
            <div className="mt-4 border-t border-slate-200/20 dark:border-slate-850/40 pt-3 relative z-10">
              
              {/* Progress Slider track */}
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden mb-3 shadow-inner relative">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-100 rounded-full shadow-xs"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {/* ACTION COMMAND CONTROLS BAR (Play, Pause, Stop, Prev, Next) */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                
                {/* Pause learning stop button and speed */}
                <div className="flex items-center gap-1.5 bg-transparent shrink-0">
                  <button
                    onClick={handlePrevStep}
                    disabled={currentStepIdx === 0}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-all disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed"
                    title="Slide trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Play & Pause Toggler */}
                  <button
                    onClick={handleTogglePlay}
                    disabled={currentStep.duration >= 9999}
                    className={`py-2 px-3.5 border text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${isPlaying ? 'bg-amber-100 dark:bg-amber-950/20 border-amber-200/20 text-amber-800 dark:text-amber-400 shadow-sm animate-pulse' : 'bg-indigo-600 border-indigo-600 hover:bg-indigo-700 text-white shadow'}`}
                    title={isPlaying ? "Tạm dừng tự phát" : "Phát thuyết minh"}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Tạm dừng học</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Học tiếp</span>
                      </>
                    )}
                  </button>

                  {/* Stop and Reset buttons to return to welcome screen */}
                  <button
                    onClick={handleStopAndReset}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer"
                    title="Học lại từ đầu / Dừng học"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Status message or timeline label */}
                <div className="text-[10px] font-bold text-slate-400 uppercase hidden md:block">
                  {isPlaying ? 'Tự động chạy bài học...' : 'Hệ thống đang tạm dừng'}
                </div>

                {/* Right button group: speed and forward */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleCycleSpeed}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl text-[10px] text-slate-500 font-extrabold hover:text-indigo-600 cursor-pointer active:scale-95"
                    title="Tốc độ phát bài giảng"
                  >
                    {courseSpeed.toFixed(2)}x Speed
                  </button>

                  <button
                    onClick={handleNextStep}
                    disabled={currentStepIdx === scenario.length - 1 || (currentStep.visualType === 'interactive_choice' && !isAnswered)}
                    className="py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Tiếp tục</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>

          </div>

          {/* COLUMN 3: QUICK NOTES (3 OF 12 COLS) */}
          <div className="lg:col-span-3 flex flex-col gap-3.5 bg-white/45 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 p-4 rounded-2xl text-left min-h-[360px] justify-between">
             <div className="flex flex-col gap-2.5 h-full">
               <div className="flex items-center justify-between border-b border-slate-200/30 dark:border-slate-800/60 pb-2.5 shrink-0">
                 <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                   <FileEdit className="w-4 h-4 text-indigo-505" />
                   <span>Ghi chú nhanh</span>
                 </h4>
                 <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                   Auto-save
                 </span>
               </div>
               
               <textarea
                 value={quickNotes}
                 onChange={(e) => {
                   setQuickNotes(e.target.value);
                   localStorage.setItem(`online_learning_notes_${classId}_${user.id}`, e.target.value);
                 }}
                 placeholder="📝 Điền nhanh các ý chính bài học tại đây..."
                 className="flex-1 w-full min-h-[160px] p-2.5 text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/40 placeholder:text-slate-400 leading-relaxed no-scrollbar"
               />

               <div className="space-y-2 shrink-0">
                 <p className="text-[9px] font-black text-slate-405 uppercase tracking-widest pl-0.5">Phím chèn nhanh tiêu đề:</p>
                 <div className="flex gap-1.5 flex-wrap">
                   <button
                     onClick={() => {
                       const heading = `\n- [Chương ${currentStepIdx + 1}: ${currentStep.title}]: `;
                       const newNotes = quickNotes + heading;
                       setQuickNotes(newNotes);
                       localStorage.setItem(`online_learning_notes_${classId}_${user.id}`, newNotes);
                     }}
                     className="text-[9px] font-black bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950 px-2 py-1.5 rounded-lg border border-indigo-100/30 text-indigo-650 dark:text-indigo-400 transition-colors cursor-pointer"
                   >
                     + Chương hiện tại
                   </button>
                   <button
                     onClick={() => {
                       const text = `\n💡 Ý tưởng áp dụng thực tế: `;
                       const newNotes = quickNotes + text;
                       setQuickNotes(newNotes);
                       localStorage.setItem(`online_learning_notes_${classId}_${user.id}`, newNotes);
                     }}
                     className="text-[9px] font-black bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950 px-2 py-1.5 rounded-lg border border-emerald-150/30 text-emerald-650 dark:text-emerald-400 transition-colors cursor-pointer"
                   >
                     + Ý tưởng thực tế
                   </button>
                 </div>
               </div>
             </div>

             <button
               onClick={() => {
                 localStorage.setItem(`online_learning_notes_${classId}_${user.id}`, quickNotes);
                 alert('Đã lưu tất cả ghi chú bài học thành công!');
               }}
               className="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-[10.5px] rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer shrink-0 mt-2"
             >
               <span>Lưu ghi chú</span>
             </button>
          </div>

        </div>

      </div>

      {/* ROADMAP SECTIONS LIST PREVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Navigation playlist panel (index road maps) */}
        <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-left">
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>Kịch bản sơ đồ bài học trực tuyến ({scenario.length} Chương)</span>
          </h4>
          
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1 no-scrollbar-x">
            {scenario.map((step, idx) => {
              const isActive = idx === currentStepIdx;
              const isPast = idx < currentStepIdx;
              
              let rowStyle = "hover:bg-slate-50/50 dark:hover:bg-slate-950/20";
              if (isActive) {
                rowStyle = "bg-indigo-50/50 dark:bg-indigo-950/15 border-l-4 border-l-indigo-600 font-bold";
              }
              
              return (
                <div 
                  key={step.id}
                  onClick={() => {
                    setCurrentStepIdx(idx);
                    setProgress(0);
                    setIsAnswered(false);
                    setSelectedOption(null);
                    setUserFeedback(null);
                    if (step.visualType === 'interactive_choice') {
                      setIsPlaying(false);
                    } else {
                      setIsPlaying(true);
                    }
                  }}
                  className={`p-2 rounded-lg flex items-center justify-between text-left text-xs transition-all cursor-pointer ${rowStyle}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${isPast ? 'bg-emerald-100 text-emerald-600' : isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                      {isPast ? '✓' : idx + 1}
                    </span>
                    <span className={`truncate ${isActive ? 'text-indigo-605 dark:text-blue-400 font-extrabold' : 'text-slate-500 dark:text-slate-350'}`}>
                      {step.title}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{step.duration >= 9999 ? 'Trắc nghiệm' : `${step.duration}s`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Learning report summary info cards (4 of 12 cols) */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-left flex flex-col justify-between">
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Thống kê lớp học của bạn</span>
            </h4>
            
            <div className="space-y-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/25 p-2 rounded-lg">
                <span>Học viên trực tuyến:</span>
                <span className="text-slate-755 dark:text-slate-200 font-extrabold">{user.name}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/25 p-2 rounded-lg">
                <span>Tổng chương đã xem:</span>
                <span className="text-slate-755 dark:text-slate-200 font-extrabold">{currentStepIdx}/{scenario.length}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/25 p-2 rounded-lg">
                <span>Điểm kiểm nghiệm:</span>
                <span className="text-slate-755 dark:text-slate-200 font-extrabold">{quizScore !== null ? `${quizScore}/100` : '-- / 100'}</span>
              </div>
            </div>
          </div>
          
          <div className="pt-3 border-t border-slate-200/20 dark:border-slate-850 mt-3 md:mt-0 text-center">
            <p className="text-[10px] font-semibold text-slate-400">
              Tỷ lệ hoàn tất lớp: <strong className="text-indigo-505 font-bold">{Math.round(((currentStepIdx + 1) / scenario.length) * 100)}%</strong>
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
