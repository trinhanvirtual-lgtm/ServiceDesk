import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { 
  PlusIcon, XIcon, SitemapIcon, 
  TrashIcon, PencilIcon 
} from './icons';
import { User } from '../App';
import { db, auth } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface OrgTarget {
  id: string;
  title: string;
  progress: number; // 0-100
  status: 'pending' | 'inprogress' | 'completed';
  weight: number; // weight %
  period: string; // e.g., 'Quý 2/2026'
}

interface OrgNode {
  id: string;
  name: string;
  position: string;
  avatar: string;
  email?: string;
  userId?: string; // Links to system User ID if assigned
  children?: OrgNode[];
  authorityLevel?: string;
  phone?: string;
  workLocation?: string;
  tenure?: number;
  targets?: OrgTarget[];
}

interface OrgChartViewProps {
  user?: User;
  allUsers?: User[];
}

// Initial default departments
const defaultDepartments = [
  { id: 'it', name: 'Phòng IT' },
  { id: 'hr', name: 'Phòng Nhân sự' },
  { id: 'marketing', name: 'Phòng Marketing' },
];

// Initial default sitemaps
const defaultOrgData: Record<string, OrgNode> = {
  it: {
    id: 'it-root',
    name: 'Lê Minh Tú',
    position: 'Trưởng phòng IT',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop',
    email: 'tu.le@company.com',
    authorityLevel: 'Quyết định trực tiếp (Thẩm quyền Cao)',
    phone: '0901.234.567',
    workLocation: 'Văn phòng TP.HCM',
    tenure: 5,
    targets: [
      { id: 'it-t1', title: 'Hoàn thiện nâng cấp bảo mật hệ thống mạng nội bộ', progress: 85, status: 'inprogress', weight: 40, period: 'Quý 2/2026' },
      { id: 'it-t2', title: 'Tối ưu hóa SLA kỹ thuật hạ tầng xuống dưới 15 phút', progress: 95, status: 'inprogress', weight: 30, period: 'Quý 2/2026' },
      { id: 'it-t3', title: 'Chuyển di hạ tầng máy chủ nội bộ lên Cloud Run', progress: 100, status: 'completed', weight: 30, period: 'Quý 2/2026' }
    ],
    children: [
      {
        id: 'it-node-2',
        name: 'Nguyễn Văn Nam',
        position: 'Phó phòng Kỹ thuật',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=150&auto=format&fit=crop',
        email: 'nam.nguyen@company.com',
        authorityLevel: 'Phê duyệt trung gian (Thẩm quyền Vừa)',
        phone: '0902.999.888',
        workLocation: 'Văn phòng TP.HCM',
        tenure: 3,
        targets: [
          { id: 'it-t4', title: 'Phát triển module sơ đồ tổ chức cấu hình', progress: 90, status: 'inprogress', weight: 50, period: 'Quý 2/2026' },
          { id: 'it-t5', title: 'Đào tạo kỹ luật cho 3 nhân viên lập trình mới', progress: 60, status: 'inprogress', weight: 50, period: 'Quý 2/2026' }
        ],
        children: [
          {
            id: 'it-node-4',
            name: 'Trần Thị Mai',
            position: 'Lập trình viên Senior',
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=150&auto=format&fit=crop',
            email: 'mai.tran@company.com',
            authorityLevel: 'Chuyên môn kỹ thuật (Thẩm quyền Thấp)',
            phone: '0903.111.222',
            workLocation: 'Văn phòng TP.HCM',
            tenure: 4,
            targets: [
              { id: 'it-t6', title: 'Xây dựng core logic layout applet', progress: 95, status: 'inprogress', weight: 70, period: 'Quý 2/2026' },
              { id: 'it-t7', title: 'Viết tài liệu tích hợp API nội bộ', progress: 100, status: 'completed', weight: 30, period: 'Quý 2/2026' }
            ]
          },
          {
            id: 'it-node-5',
            name: 'Phạm Hoàng Long',
            position: 'Lập trình viên Junior',
            avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=150&auto=format&fit=crop',
            email: 'long.pham@company.com',
            authorityLevel: 'Thực thi kỹ thuật (Tham mưu)',
            phone: '0988.555.444',
            workLocation: 'Văn phòng TP.HCM',
            tenure: 1,
            targets: [
              { id: 'it-t8', title: 'Khắc phục các ticket UI/UX trên hệ thống CRM', progress: 75, status: 'inprogress', weight: 100, period: 'Quý 2/2026' }
            ]
          },
        ],
      },
      {
        id: 'it-node-3',
        name: 'Trương Mỹ Linh',
        position: 'Chuyên gia Bảo mật',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
        email: 'linh.truong@company.com',
        authorityLevel: 'Phê duyệt chuyên môn (Thẩm quyền Cao)',
        phone: '0905.777.666',
        workLocation: 'Văn phòng TP.HCM',
        tenure: 4,
        targets: [
          { id: 'it-t9', title: 'Kiểm thử hộp đen định kỳ hệ thống core', progress: 80, status: 'inprogress', weight: 60, period: 'Quý 2/2026' },
          { id: 'it-t10', title: 'Tổ chức lớp nâng cao bảo mật mã nguồn', progress: 100, status: 'completed', weight: 40, period: 'Quý 2/2026' }
        ],
        children: [
          {
            id: 'it-node-6',
            name: 'Đặng Quốc Bảo',
            position: 'Kỹ sư Đảm bảo chất lượng',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
            email: 'bao.dang@company.com',
            authorityLevel: 'Thực thi kiểm thử',
            phone: '0966.333.222',
            workLocation: 'Văn phòng Hà Nội',
            tenure: 2,
            targets: [
              { id: 'it-t11', title: 'Xây dựng kịch bản automation test cho API', progress: 90, status: 'inprogress', weight: 100, period: 'Quý 2/2026' }
            ]
          },
        ],
      },
    ],
  },
  hr: {
    id: 'hr-root',
    name: 'Phan Thị Bích',
    position: 'Trưởng phòng Nhân sự',
    avatar: 'https://images.unsplash.com/photo-1534751516642-a131fed10495?q=80&w=150&auto=format&fit=crop',
    email: 'bich.phan@company.com',
    authorityLevel: 'Quyết định trực tiếp (Thẩm quyền Cao)',
    phone: '0903.444.555',
    workLocation: 'Văn phòng Hà Nội',
    tenure: 6,
    targets: [
      { id: 'hr-t1', title: 'Triển khai chiến dịch tuyển dụng nhân tài năm 2026', progress: 70, status: 'inprogress', weight: 50, period: 'Quý 2/2026' },
      { id: 'hr-t2', title: 'Chuẩn hóa quy trình đánh giá hiệu suất OKRs', progress: 100, status: 'completed', weight: 50, period: 'Quý 2/2026' }
    ],
    children: [
      {
        id: 'hr-node-2',
        name: 'Lý Kiến Quốc',
        position: 'Chuyên viên Tuyển dụng',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
        email: 'quoc.ly@company.com',
        authorityLevel: 'Thẩm quyền chuyên môn',
        phone: '0909.112.233',
        workLocation: 'Văn phòng Hà Nội',
        tenure: 2,
        targets: [
          { id: 'hr-t3', title: 'Tuyển dụng đủ 10 vị trí Dev cho Khối công nghệ', progress: 50, status: 'inprogress', weight: 100, period: 'Quý 2/2026' }
        ]
      },
      {
        id: 'hr-node-3',
        name: 'Võ Minh Thư',
        position: 'Chuyên viên Đào tạo',
        avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=150&auto=format&fit=crop',
        email: 'thu.vo@company.com',
        authorityLevel: 'Thực thi đào tạo',
        phone: '0905.555.777',
        workLocation: 'Văn phòng Hà Nội',
        tenure: 3,
        targets: [
          { id: 'hr-t4', title: 'Tổ chức khóa đào tạo kỹ năng mềm cho Team lead', progress: 90, status: 'inprogress', weight: 100, period: 'Quý 2/2026' }
        ]
      }
    ]
  },
  marketing: {
    id: 'm-root',
    name: 'Nguyễn Mạnh Hùng',
    position: 'Giám đốc Marketing',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop',
    email: 'hung.nguyen@company.com',
    authorityLevel: 'Quyết định trực tiếp (Thẩm quyền Cao)',
    phone: '0904.888.222',
    workLocation: 'Văn phòng TP.HCM',
    tenure: 7,
    targets: [
      { id: 'm-t1', title: 'Tăng trưởng lưu lượng truy cập tự nhiên thêm 35%', progress: 85, status: 'inprogress', weight: 60, period: 'Quý 2/2026' },
      { id: 'm-t2', title: 'Thực hiện quảng bá định vị thương hiệu sản phẩm mới', progress: 95, status: 'inprogress', weight: 40, period: 'Quý 2/2026' }
    ],
    children: [
      {
        id: 'm-node-2',
        name: 'Trần Kiều Anh',
        position: 'Content Leader',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
        email: 'anh.tran@company.com',
        authorityLevel: 'Phê duyệt nội dung',
        phone: '0908.111.444',
        workLocation: 'Văn phòng TP.HCM',
        tenure: 3,
        targets: [
          { id: 'm-t3', title: 'Biên tập & xuất bản 24 bài viết Blog chuẩn SEO', progress: 100, status: 'completed', weight: 100, period: 'Quý 2/2026' }
        ]
      },
      {
        id: 'm-node-3',
        name: 'Lê Phúc Hưng',
        position: 'SEO Expert',
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=150&auto=format&fit=crop',
        email: 'hung.le@company.com',
        authorityLevel: 'Tối ưu kỹ thuật SEO',
        phone: '0909.222.777',
        workLocation: 'Văn phòng TP.HCM',
        tenure: 3,
        targets: [
          { id: 'm-t4', title: 'Đẩy 10 từ khóa cốt lõi lên top 5 Google', progress: 75, status: 'inprogress', weight: 100, period: 'Quý 2/2026' }
        ]
      }
    ]
  }
};

const OrgNodeItem: React.FC<{
  node: OrgNode;
  isRoot?: boolean;
  isAdmin: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  hasSiblings?: boolean;
  onAddChild: (parentNodeId: string) => void;
  onEditNode: (node: OrgNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onSelectNode: (node: OrgNode) => void;
  collapsedNodeIds: string[];
  onToggleCollapse: (nodeId: string) => void;
}> = ({ 
  node, 
  isRoot, 
  isAdmin, 
  isFirst = false, 
  isLast = false, 
  hasSiblings = false, 
  onAddChild, 
  onEditNode, 
  onDeleteNode,
  onSelectNode,
  collapsedNodeIds,
  onToggleCollapse
}) => {
  const isCollapsed = collapsedNodeIds.includes(node.id);
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex flex-col items-center group w-full">
        {/* Connection Line Above */}
        {!isRoot && (
          <div className="relative h-8 w-full flex items-center justify-center">
            {hasSiblings ? (
              <>
                {isFirst && (
                  <>
                    {/* First child elbow corner: line from right, curving down */}
                    <div className="absolute top-0 right-0 w-1/2 h-4 border-t-[3px] border-l-[3px] border-slate-400 dark:border-slate-500 rounded-tl-xl" />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[3px] h-4 bg-slate-400 dark:bg-slate-500" />
                  </>
                )}
                {isLast && (
                  <>
                    {/* Last child elbow corner: line from left, curving down */}
                    <div className="absolute top-0 left-0 w-1/2 h-4 border-t-[3px] border-r-[3px] border-slate-400 dark:border-slate-500 rounded-tr-xl" />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[3px] h-4 bg-slate-400 dark:bg-slate-500" />
                  </>
                )}
                {!isFirst && !isLast && (
                  <>
                    {/* Middle child: horizontal line, vertical down */}
                    <div className="absolute top-0 left-0 right-0 h-4 border-t-[3px] border-slate-400 dark:border-slate-500" />
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[3px] bg-slate-400 dark:bg-slate-500" />
                  </>
                )}
              </>
            ) : (
              // Single child: straight vertical pipe
              <div className="w-[3px] h-full bg-slate-400 dark:bg-slate-500" />
            )}
            
            {/* Arrowhead pointing down on top of the card */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-400 dark:border-t-slate-500 z-10" />
          </div>
        )}
        
        {/* Node Card wrapper with hover container and horizontal spacing */}
        <div className="relative flex flex-col items-center px-4.5 w-full">
          {/* Node Card */}
          <div 
            onClick={() => onSelectNode(node)}
            className="cursor-pointer bg-[--color-surface-secondary] border border-[--color-border-secondary] rounded-2xl p-4 shadow-md min-w-[220px] max-w-[260px] flex flex-col items-center justify-between transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-[--color-accent-500] z-10 relative overflow-hidden group/card mx-auto"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[--color-accent-600]"></div>
            
            {/* Upper details */}
            <div className="flex flex-col items-center w-full">
              <div className="w-14 h-14 rounded-full border-2 border-[--color-accent-500] p-0.5 mb-2.5 shadow-inner overflow-hidden shrink-0">
                <img 
                  src={node.avatar || 'https://i.ibb.co/6NKQZf64/avatar-placeholder.png'} 
                  alt={node.name} 
                  className="w-full h-full rounded-full object-cover transform transition-transform group-hover/card:scale-110" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <h4 className="font-bold text-[--color-text-primary] text-center text-sm truncate max-w-full" title={node.name}>
                {node.name}
              </h4>
              <div className="bg-[--color-accent-500]/10 text-[--color-accent-600] px-3 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1.5 border border-[--color-accent-500]/20 truncate max-w-full" title={node.position}>
                {node.position}
              </div>
              {node.email && (
                <span className="text-[10px] text-[--color-text-subtle] mt-1 truncate max-w-full font-mono">
                  {node.email}
                </span>
              )}
            </div>

            {/* ONE BOTTOM ACTION BUTTON: collapse/expand */}
            <div className="flex w-full border-t border-[--color-border-secondary]/60 mt-3 pt-2 items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse(node.id);
                }}
                disabled={!node.children || node.children.length === 0}
                className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-[10px] font-bold transition-all ${
                  !node.children || node.children.length === 0
                    ? 'text-slate-400 dark:text-slate-600 bg-transparent cursor-not-allowed opacity-45 border border-transparent'
                    : isCollapsed
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100/85 dark:hover:bg-indigo-900/35 border border-indigo-200/55 dark:border-indigo-800/35 active:scale-95'
                      : 'text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/75 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700/70 active:scale-95'
                }`}
                title={isCollapsed ? "Mở rộng sơ đồ" : "Thu gọn sơ đồ"}
              >
                {node.children && node.children.length > 0 ? (
                  isCollapsed ? (
                    <>
                      <PlusIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Hiển thị cấp dưới ({node.children.length})</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                      <span>Thu gọn sơ đồ</span>
                    </>
                  )
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Không có cấp dưới</span>
                )}
              </button>
            </div>
          </div>

          {/* Floater Toolbar for Admins */}
          {isAdmin && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform duration-200 z-20 flex items-center justify-center gap-1.5 bg-[--color-surface-tertiary] border border-[--color-border-secondary] px-2.5 py-1 rounded-full shadow-lg">
              <button 
                onClick={(e) => { e.stopPropagation(); onEditNode(node); }}
                className="p-1 hover:bg-yellow-500/15 rounded-full text-amber-500 transition-colors"
                title="Sửa thông tin"
              >
                <PencilIcon className="w-3.5 h-3.5" />
              </button>
              {!isRoot && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}
                  className="p-1 hover:bg-red-500/15 rounded-full text-red-500 transition-colors"
                  title="Xoá vị trí"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Connection Line Below */}
        {!isCollapsed && node.children && node.children.length > 0 && (
          <div className="w-[3px] h-6 bg-slate-400 dark:bg-slate-500"></div>
        )}
      </div>

      {/* Children Container */}
      {!isCollapsed && node.children && node.children.length > 0 && (
        <div className="relative flex justify-center px-4">
          {node.children.map((child, index) => (
            <OrgNodeItem 
              key={child.id} 
              node={child} 
              isAdmin={isAdmin} 
              isFirst={index === 0}
              isLast={index === node.children.length - 1}
              hasSiblings={node.children.length > 1}
              onAddChild={onAddChild} 
              onEditNode={onEditNode} 
              onDeleteNode={onDeleteNode} 
              onSelectNode={onSelectNode}
              collapsedNodeIds={collapsedNodeIds}
              onToggleCollapse={onToggleCollapse}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const OrgChartView: React.FC<OrgChartViewProps> = ({ user, allUsers = [] }) => {
  const { t } = useLanguage();
  const [departments, setDepartments] = useState<typeof defaultDepartments>([]);
  const [orgData, setOrgData] = useState<Record<string, OrgNode>>({});
  const [selectedDept, setSelectedDept] = useState('all');
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // States for Modals
  const [actionModal, setActionModal] = useState<'none' | 'add-child' | 'edit-node' | 'add-dept' | 'edit-dept'>('none');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);

  // Details Modal (Click on Node Card popup)
  const [detailNode, setDetailNode] = useState<OrgNode | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'info' | 'targets'>('info');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newDeptName, setNewDeptName] = useState('');

  // Additional Enriched Fields
  const [formAuthorityLevel, setFormAuthorityLevel] = useState('Quyết định trực tiếp (Thẩm quyền Cao)');
  const [formPhone, setFormPhone] = useState('0902.345.678');
  const [formWorkLocation, setFormWorkLocation] = useState('Văn phòng TP.HCM');
  const [formTenure, setFormTenure] = useState(6);
  const [formTargets, setFormTargets] = useState<OrgTarget[]>([]);

  // Check if current user is admin/superadmin
  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  const getDeptIdByNodeId = (nodeId: string): string => {
    if (selectedDept !== 'all') return selectedDept;
    
    const checkHasNode = (root: OrgNode, targetId: string): boolean => {
      if (root.id === targetId) return true;
      if (root.children && root.children.length > 0) {
        return root.children.some(child => checkHasNode(child, targetId));
      }
      return false;
    };

    for (const dept of departments) {
      const root = orgData[dept.id];
      if (root && checkHasNode(root, nodeId)) {
        return dept.id;
      }
    }
    return departments[0]?.id || 'it';
  };

  const [collapsedNodeIds, setCollapsedNodeIds] = useState<string[]>([]);

  const toggleCollapseNode = (nodeId: string) => {
    setCollapsedNodeIds(prev =>
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  const [projectsList, setProjectsList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fallbacks = [
      { id: 'proj-1', name: 'Nâng cấp Hệ thống Nhân sự Core' },
      { id: 'proj-2', name: 'Đo lường & Đồng bộ OKRs doanh nghiệp' },
      { id: 'proj-3', name: 'Chiến dịch Quảng bá Sản phẩm 2026' },
      { id: 'proj-4', name: 'Tối ưu hóa SLA kỹ thuật' }
    ];

    if (!auth || !auth.currentUser) {
      setProjectsList(fallbacks);
      return;
    }

    try {
      const projectsRef = collection(db, 'projects');
      const unsubscribe = onSnapshot(projectsRef, (snapshot) => {
        const list: { id: string; name: string }[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({ id: doc.id, name: data.name || '' });
        });
        if (list.length > 0) {
          setProjectsList(list);
        } else {
          setProjectsList(fallbacks);
        }
      }, () => {
        setProjectsList(fallbacks);
      });
      return () => unsubscribe();
    } catch {
      setProjectsList(fallbacks);
    }
  }, []);

  // Inline Goal adding states for the details tab
  const [isAddingInlineGoal, setIsAddingInlineGoal] = useState(false);
  const [inlineGoalTitle, setInlineGoalTitle] = useState('');
  const [inlineGoalWeight, setInlineGoalWeight] = useState(20);
  const [inlineGoalPeriod, setInlineGoalPeriod] = useState('Quý 2/2026');
  const [inlineGoalProgress, setInlineGoalProgress] = useState(0);
  const [inlineGoalProjectId, setInlineGoalProjectId] = useState('');

  const addTargetToNodeInTree = (root: OrgNode, targetNodeId: string, newTarget: OrgTarget): OrgNode => {
    if (root.id === targetNodeId) {
      const originalTargets = root.targets || [];
      return {
        ...root,
        targets: [...originalTargets, newTarget]
      };
    }
    if (root.children && root.children.length > 0) {
      return {
        ...root,
        children: root.children.map(child => addTargetToNodeInTree(child, targetNodeId, newTarget))
      };
    }
    return root;
  };

  const handleAddInlineGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailNode) return;
    if (!inlineGoalTitle.trim()) return;

    const newTarget: OrgTarget = {
      id: `target-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: inlineGoalTitle,
      progress: inlineGoalProgress,
      status: inlineGoalProgress === 100 ? 'completed' : (inlineGoalProgress > 0 ? 'inprogress' : 'pending'),
      weight: inlineGoalWeight,
      period: inlineGoalPeriod,
      projectId: inlineGoalProjectId || undefined
    };

    const targetDeptId = getDeptIdByNodeId(detailNode.id);
    const rootNode = orgData[targetDeptId];
    if (rootNode) {
      const updatedRoot = addTargetToNodeInTree(rootNode, detailNode.id, newTarget);
      const updatedOrgData = {
        ...orgData,
        [targetDeptId]: updatedRoot
      };
      
      saveOrgState(departments, updatedOrgData);
      setDetailNode(prev => {
        if (!prev) return null;
        return {
          ...prev,
          targets: [...(prev.targets || []), newTarget]
        };
      });

      setIsAddingInlineGoal(false);
      setInlineGoalTitle('');
      setInlineGoalWeight(20);
      setInlineGoalProgress(0);
      setInlineGoalProjectId('');
    }
  };

  const handleDeleteInlineGoal = (targetId: string) => {
    if (!detailNode) return;
    if (!confirm('Bạn có chắc chắn muốn xóa mục tiêu này không?')) return;

    const targetDeptId = getDeptIdByNodeId(detailNode.id);
    const rootNode = orgData[targetDeptId];
    if (rootNode) {
      const updatedTargets = (detailNode.targets || []).filter(t => t.id !== targetId);
      
      const removeTargetFromNodeInTree = (node: OrgNode, nodeId: string): OrgNode => {
        if (node.id === nodeId) {
          return {
            ...node,
            targets: updatedTargets
          };
        }
        if (node.children && node.children.length > 0) {
          return {
            ...node,
            children: node.children.map(child => removeTargetFromNodeInTree(child, nodeId))
          };
        }
        return node;
      };

      const updatedRoot = removeTargetFromNodeInTree(rootNode, detailNode.id);
      const updatedOrgData = {
        ...orgData,
        [targetDeptId]: updatedRoot
      };
      
      saveOrgState(departments, updatedOrgData);
      setDetailNode(prev => {
        if (!prev) return null;
        return {
          ...prev,
          targets: updatedTargets
        };
      });
    }
  };

  // Load configuration from local storage or set defaults
  useEffect(() => {
    const savedDepts = localStorage.getItem('pow_org_depts');
    const savedOrg = localStorage.getItem('pow_org_data');

    if (savedDepts && savedOrg) {
      try {
        setDepartments(JSON.parse(savedDepts));
        setOrgData(JSON.parse(savedOrg));
      } catch {
        setDepartments(defaultDepartments);
        setOrgData(defaultOrgData);
      }
    } else {
      setDepartments(defaultDepartments);
      setOrgData(defaultOrgData);
      localStorage.setItem('pow_org_depts', JSON.stringify(defaultDepartments));
      localStorage.setItem('pow_org_data', JSON.stringify(defaultOrgData));
    }
    setIsDataLoaded(true);
  }, []);

  // Sync to local storage on changes
  const saveOrgState = (updatedDepts: typeof defaultDepartments, updatedData: Record<string, OrgNode>) => {
    setDepartments(updatedDepts);
    setOrgData(updatedData);
    localStorage.setItem('pow_org_depts', JSON.stringify(updatedDepts));
    localStorage.setItem('pow_org_data', JSON.stringify(updatedData));
  };

  // Assign user profile helpers
  const handleAssignUserChange = (uId: string) => {
    setSelectedUserId(uId);
    if (uId === 'custom') {
      setFormName('');
      setFormAvatar('');
      setFormEmail('');
    } else {
      const selectedUser = allUsers.find(u => u.id === uId);
      if (selectedUser) {
        setFormName(selectedUser.name);
        setFormAvatar(selectedUser.avatar || '');
        setFormEmail(selectedUser.email || '');
      }
    }
  };

  // RECURSIVE TRANSFORMATION HELPERS
  const addChildToNodeRecursive = (root: OrgNode, targetId: string, newChild: OrgNode): OrgNode => {
    if (root.id === targetId) {
      return {
        ...root,
        children: [...(root.children || []), newChild]
      };
    }
    if (root.children) {
      return {
        ...root,
        children: root.children.map(child => addChildToNodeRecursive(child, targetId, newChild))
      };
    }
    return root;
  };

  const updateNodeRecursive = (root: OrgNode, targetId: string, updatedData: Partial<OrgNode>): OrgNode => {
    if (root.id === targetId) {
      return {
        ...root,
        ...updatedData
      };
    }
    if (root.children) {
      return {
        ...root,
        children: root.children.map(child => updateNodeRecursive(child, targetId, updatedData))
      };
    }
    return root;
  };

  const deleteNodeRecursive = (root: OrgNode, targetId: string): OrgNode | null => {
    if (root.id === targetId) {
      return null;
    }
    if (root.children) {
      return {
        ...root,
        children: root.children
          .filter(child => child.id !== targetId)
          .map(child => deleteNodeRecursive(child, targetId))
          .filter((child): child is OrgNode => child !== null)
      };
    }
    return root;
  };

  // Dynamic Reporting Line Helper
  const findParentNode = (root: OrgNode, targetId: string, parent: OrgNode | null = null): OrgNode | null => {
    if (root.id === targetId) {
      return parent;
    }
    if (root.children) {
      for (const child of root.children) {
        const found = findParentNode(child, targetId, root);
        if (found) return found;
      }
    }
    return null;
  };

  // Gurantee rich details with fallbacks
  const getRichNode = (node: OrgNode): OrgNode & {
    authorityLevel: string;
    phone: string;
    workLocation: string;
    tenure: number;
    targets: OrgTarget[];
  } => {
    return {
      ...node,
      authorityLevel: node.authorityLevel || 'Quyết định trực tiếp (Thẩm quyền Cao)',
      phone: node.phone || '0902.345.678',
      workLocation: node.workLocation || 'Văn phòng TP.HCM',
      tenure: node.tenure !== undefined ? node.tenure : 6,
      targets: node.targets || [
        { id: `t-${node.id}-1`, title: 'Hoàn thành chỉ tiêu KPI được giao trong quý', progress: 85, status: 'inprogress', weight: 40, period: 'Quý 2/2026' },
        { id: `t-${node.id}-2`, title: 'Nâng cao năng lực và tối ưu hóa hiệu suất làm việc nhóm', progress: 90, status: 'inprogress', weight: 30, period: 'Quý 2/2026' },
        { id: `t-${node.id}-3`, title: 'Tham gia các khóa đào tạo nâng cao nghiệp vụ quản lý', progress: 100, status: 'completed', weight: 30, period: 'Quý 2/2026' }
      ]
    };
  };

  // HANDLERS
  const handleOpenAddChild = (parentNodeId: string) => {
    setSelectedNodeId(parentNodeId);
    setFormName('');
    setFormPosition('');
    setFormEmail('');
    setFormAvatar('');
    setSelectedUserId('custom');
    setFormAuthorityLevel('Quyết định trực tiếp (Thẩm quyền Cao)');
    setFormPhone('');
    setFormWorkLocation('Văn phòng TP.HCM');
    setFormTenure(1);
    setFormTargets([
      { id: `t-${Date.now()}-1`, title: 'Hoàn thành chỉ tiêu KPI được giao trong quý', progress: 0, status: 'pending', weight: 40, period: 'Quý 2/2026' },
      { id: `t-${Date.now()}-2`, title: 'Nâng cao năng lực và tối ưu hóa hiệu suất làm việc nhóm', progress: 0, status: 'pending', weight: 30, period: 'Quý 2/2026' },
      { id: `t-${Date.now()}-3`, title: 'Tham gia các khóa đào tạo nâng cao nghiệp vụ quản lý', progress: 0, status: 'pending', weight: 30, period: 'Quý 2/2026' }
    ]);
    setActionModal('add-child');
  };

  const handleOpenEditNode = (node: OrgNode) => {
    setSelectedNode(node);
    setFormName(node.name);
    setFormPosition(node.position);
    setFormEmail(node.email || '');
    setFormAvatar(node.avatar || '');
    setSelectedUserId(node.userId || 'custom');
    setFormAuthorityLevel(node.authorityLevel || 'Quyết định trực tiếp (Thẩm quyền Cao)');
    setFormPhone(node.phone || '0902.345.678');
    setFormWorkLocation(node.workLocation || 'Văn phòng TP.HCM');
    setFormTenure(node.tenure !== undefined ? node.tenure : 6);
    setFormTargets(node.targets || [
      { id: `t-${node.id}-1`, title: 'Hoàn thành chỉ tiêu KPI được giao trong quý', progress: 85, status: 'inprogress', weight: 40, period: 'Quý 2/2026' },
      { id: `t-${node.id}-2`, title: 'Nâng cao năng lực và tối ưu hóa hiệu suất làm việc nhóm', progress: 90, status: 'inprogress', weight: 30, period: 'Quý 2/2026' },
      { id: `t-${node.id}-3`, title: 'Tham gia các khóa đào tạo nâng cao nghiệp vụ quản lý', progress: 100, status: 'completed', weight: 30, period: 'Quý 2/2026' }
    ]);
    setActionModal('edit-node');
  };

  const handleSaveAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNodeId || !formName || !formPosition) return;

    const newChild: OrgNode = {
      id: `node-${Date.now()}`,
      name: formName,
      position: formPosition,
      avatar: formAvatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop`,
      email: formEmail,
      userId: selectedUserId !== 'custom' ? selectedUserId : undefined,
      authorityLevel: formAuthorityLevel,
      phone: formPhone || '0902.345.678',
      workLocation: formWorkLocation,
      tenure: formTenure,
      targets: formTargets,
    };

    const targetDeptId = getDeptIdByNodeId(selectedNodeId);
    const updatedTree = addChildToNodeRecursive(orgData[targetDeptId], selectedNodeId, newChild);
    saveOrgState(departments, {
      ...orgData,
      [targetDeptId]: updatedTree
    });

    setActionModal('none');
  };

  const handleSaveEditNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode || !formName || !formPosition) return;

    const updatedNodeData: Partial<OrgNode> = {
      name: formName,
      position: formPosition,
      avatar: formAvatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop`,
      email: formEmail,
      userId: selectedUserId !== 'custom' ? selectedUserId : undefined,
      authorityLevel: formAuthorityLevel,
      phone: formPhone,
      workLocation: formWorkLocation,
      tenure: formTenure,
      targets: formTargets,
    };

    const targetDeptId = getDeptIdByNodeId(selectedNode.id);
    const updatedTree = updateNodeRecursive(orgData[targetDeptId], selectedNode.id, updatedNodeData);
    saveOrgState(departments, {
      ...orgData,
      [targetDeptId]: updatedTree
    });

    setActionModal('none');
  };

  const handleDeleteNode = (nodeId: string) => {
    if (confirm('Bạn có chắc chắn muốn xoá vị trí này và tất cả cấp dưới trực thuộc của nó không?')) {
      const targetDeptId = getDeptIdByNodeId(nodeId);
      const updatedTree = deleteNodeRecursive(orgData[targetDeptId], nodeId);
      if (updatedTree) {
        saveOrgState(departments, {
          ...orgData,
          [targetDeptId]: updatedTree
        });
      }
    }
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;

    const deptId = `dept-${Date.now()}`;
    const newDept = { id: deptId, name: newDeptName };
    const defaultRootNode: OrgNode = {
      id: `root-${deptId}`,
      name: user?.name || 'Trưởng phòng mới',
      position: 'Trưởng phòng',
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
    };

    saveOrgState(
      [...departments, newDept],
      {
        ...orgData,
        [deptId]: defaultRootNode
      }
    );

    setSelectedDept(deptId);
    setNewDeptName('');
    setActionModal('none');
  };

  const handleEditDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;

    const updatedDepts = departments.map(d => d.id === selectedDept ? { ...d, name: newDeptName } : d);
    saveOrgState(updatedDepts, orgData);
    setActionModal('none');
  };

  const handleDeleteDept = () => {
    if (departments.length <= 1) {
      alert('Hệ thống phải có ít nhất một phòng ban.');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xoá phòng ban "${departments.find(d => d.id === selectedDept)?.name}" không?`)) {
      const updatedDepts = departments.filter(d => d.id !== selectedDept);
      const updatedData = { ...orgData };
      delete updatedData[selectedDept];

      const nextDept = updatedDepts[0].id;
      saveOrgState(updatedDepts, updatedData);
      setSelectedDept(nextDept);
    }
  };

  if (!isDataLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <span className="text-[--color-text-subtle] font-medium">Đang tải dữ liệu sơ đồ tổ chức...</span>
      </div>
    );
  }

  const activeRoot = orgData[selectedDept];

  return (
    <div className="flex-1 flex flex-col h-full bg-[--color-surface-primary]/20 rounded-2xl border border-[--color-border-secondary] overflow-hidden">
      {/* Header section */}
      <div className="p-6 border-b border-[--color-border-secondary] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[--color-surface-secondary]/50 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-[--color-text-primary] flex items-center gap-2">
            <SitemapIcon className="w-6 h-6 text-[--color-accent-600]" />
            <span>Tổ chức</span>
          </h2>
          <p className="text-sm text-[--color-text-subtle] mt-1">Sơ đồ cơ cấu tổ chức, phòng ban và phân nhiệm nhân sự</p>
        </div>

        {/* Action controllers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 relative">
            <label className="text-sm font-semibold text-[--color-text-secondary] whitespace-nowrap">{t('department')}:</label>
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                className="bg-[--color-surface-secondary] border border-[--color-border-secondary] hover:border-[--color-accent-500] text-[--color-text-primary] text-sm rounded-xl p-2.5 min-w-[200px] flex items-center justify-between gap-2.5 transition-all font-semibold shadow-sm text-left cursor-pointer"
              >
                <span>{selectedDept === 'all' ? 'Tất cả phòng ban' : (departments.find(d => d.id === selectedDept)?.name || selectedDept)}</span>
                <svg className={`w-4 h-4 text-[--color-text-subtle] transition-transform duration-200 ${isDeptDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDeptDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDeptDropdownOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[--color-surface-secondary]/95 backdrop-blur-md border border-[--color-border-secondary] rounded-2xl shadow-xl p-2 z-50 animate-fade-in-up flex flex-col gap-0.5 max-h-80 overflow-y-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDept('all');
                        setIsDeptDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        selectedDept === 'all' 
                          ? 'bg-[--color-accent-500]/15 text-[--color-accent-600] dark:text-[--color-accent-400]' 
                          : 'text-[--color-text-primary] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      Tất cả phòng ban
                    </button>
                    {departments.map(dept => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => {
                          setSelectedDept(dept.id);
                          setIsDeptDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          selectedDept === dept.id 
                            ? 'bg-[--color-accent-500]/15 text-[--color-accent-600] dark:text-[--color-accent-400]' 
                            : 'text-[--color-text-primary] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        {dept.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-[--color-border-secondary]">
              <button 
                onClick={() => {
                  setNewDeptName('');
                  setActionModal('add-dept');
                }}
                className="p-2 rounded-lg bg-[--color-accent-600] text-white hover:bg-[--color-accent-700] transition-colors shadow-sm"
                title="Thêm phòng ban mới"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
              {selectedDept !== 'all' && (
                <>
                  <button 
                    onClick={() => {
                      const currDept = departments.find(d => d.id === selectedDept);
                      setNewDeptName(currDept ? currDept.name : '');
                      setActionModal('edit-dept');
                    }}
                    className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[--color-text-primary] transition-colors"
                    title="Sửa tên phòng ban"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleDeleteDept}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                    title="Xóa phòng ban"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Sitemap Tree Viewport */}
      <div className="flex-1 overflow-auto p-12 flex justify-center bg-[--color-surface-primary]/50 min-h-[500px] no-scrollbar">
        <div className="inline-block animate-fade-in-up w-full max-w-5xl">
          {selectedDept === 'all' ? (
            <div className="flex flex-col gap-16 items-center w-full">
              {departments.map((dept) => {
                const deptRoot = orgData[dept.id];
                if (!deptRoot) return null;
                return (
                  <div key={dept.id} className="flex flex-col items-center w-full border-b border-dashed border-[--color-border-secondary]/60 pb-16 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-[--color-surface-secondary]/80 border border-[--color-border-secondary] rounded-2xl mb-8 shadow-sm">
                      <SitemapIcon className="w-5 h-5 text-[--color-accent-600]" />
                      <span className="text-sm font-bold text-[--color-text-primary] uppercase tracking-wider">{dept.name}</span>
                    </div>
                    <OrgNodeItem 
                      node={deptRoot} 
                      isRoot 
                      isAdmin={isAdmin}
                      onAddChild={handleOpenAddChild}
                      onEditNode={handleOpenEditNode}
                      onDeleteNode={handleDeleteNode}
                      onSelectNode={setDetailNode}
                      collapsedNodeIds={collapsedNodeIds}
                      onToggleCollapse={toggleCollapseNode}
                    />
                  </div>
                );
              })}
            </div>
          ) : activeRoot ? (
            <OrgNodeItem 
              node={activeRoot} 
              isRoot 
              isAdmin={isAdmin}
              onAddChild={handleOpenAddChild}
              onEditNode={handleOpenEditNode}
              onDeleteNode={handleDeleteNode}
              onSelectNode={setDetailNode}
              collapsedNodeIds={collapsedNodeIds}
              onToggleCollapse={toggleCollapseNode}
            />
          ) : (
            <div className="text-center p-8 border border-dashed border-[--color-border-secondary] rounded-2xl">
              <span className="text-[--color-text-subtle]">Không có dữ liệu cơ cấu cho bộ phận này.</span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL WINDOWS FOR EDIT / CONFIG ACTIONS */}
      {actionModal !== 'none' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[--color-border-secondary] flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-[--color-text-primary]">
                {actionModal === 'add-child' && 'Thêm nhân sự cấp dưới'}
                {actionModal === 'edit-node' && 'Sửa thông tin vị trí'}
                {actionModal === 'add-dept' && 'Thêm phòng ban mới'}
                {actionModal === 'edit-dept' && 'Đổi tên phòng ban'}
              </h3>
              <button 
                onClick={() => setActionModal('none')} 
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-[--color-text-subtle] transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body scrollable area */}
            <div className="flex-1 overflow-y-auto">
              {/* 1. Add Department Modal Form */}
              {(actionModal === 'add-dept' || actionModal === 'edit-dept') && (
                <form onSubmit={actionModal === 'add-dept' ? handleAddDept : handleEditDept} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Tên phòng ban</label>
                    <input 
                      required
                      type="text"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-sm font-medium"
                      placeholder="VD: Phòng Kế toán & Tài chính"
                    />
                    {actionModal === 'add-dept' && (
                      <p className="mt-1.5 text-xs text-[--color-text-subtle]">
                        * Một phòng ban mới khi tạo sẽ tự động khởi tạo Trưởng phòng mặc định. Bạn có thể chỉnh sửa thông tin Trưởng phòng sau đó.
                      </p>
                    )}
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setActionModal('none')}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[--color-border-secondary] text-[--color-text-primary] font-semibold text-sm hover:bg-black/5 transition-colors"
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[--color-accent-600] text-white font-semibold text-sm shadow-md hover:bg-[--color-accent-700] transition-colors"
                    >
                      Lưu cấu hình
                    </button>
                  </div>
                </form>
              )}

              {/* 2. Add Child / Edit Position Modal Form */}
              {(actionModal === 'add-child' || actionModal === 'edit-node') && (
                <form onSubmit={actionModal === 'add-child' ? handleSaveAddChild : handleSaveEditNode} className="p-6 space-y-4">
                  
                  {/* 1. Select Existing Employee Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">
                      Liên kết nhân sự hệ thống
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => handleAssignUserChange(e.target.value)}
                      className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-sm font-medium"
                    >
                      <option value="custom">-- Nhập tùy chỉnh / Không có tài khoản --</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email}) [{u.role.toUpperCase()}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Name field */}
                    <div>
                      <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Tên nhân sự</label>
                      <input 
                        required
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        disabled={selectedUserId !== 'custom'}
                        className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-sm font-medium disabled:opacity-60"
                        placeholder="VD: Nguyễn Văn A"
                      />
                    </div>

                    {/* Position field */}
                    <div>
                      <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Chức danh / Vị trí</label>
                      <input 
                        required
                        type="text"
                        value={formPosition}
                        onChange={(e) => setFormPosition(e.target.value)}
                        className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-sm font-medium"
                        placeholder="VD: Chuyên viên kỹ thuật"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div>
                    <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Email liên hệ (tùy chọn)</label>
                    <input 
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      disabled={selectedUserId !== 'custom'}
                      className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-sm font-medium disabled:opacity-60"
                      placeholder="VD: email@company.com"
                    />
                  </div>

                  {/* Avatar URL field */}
                  <div>
                    <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Đường dẫn ảnh đại diện (avatar)</label>
                    <input 
                      type="url"
                      value={formAvatar}
                      onChange={(e) => setFormAvatar(e.target.value)}
                      disabled={selectedUserId !== 'custom'}
                      className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-sm font-medium disabled:opacity-60"
                      placeholder="VD: https://i.pravatar.cc/150?u=custom-user"
                    />
                  </div>

                  {/* Addition details section */}
                  <div className="border-t border-[--color-border-secondary] pt-4 mt-4 space-y-4">
                    <h4 className="text-sm font-bold text-[--color-text-secondary]">Thông tin bổ sung & Thống kê</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[--color-text-secondary] mb-1">Cấp thẩm quyền</label>
                        <select
                          value={formAuthorityLevel}
                          onChange={(e) => setFormAuthorityLevel(e.target.value)}
                          className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-2.5 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-xs font-medium"
                        >
                          <option value="Quyết định trực tiếp (Thẩm quyền Cao)">Quyết định trực tiếp (Thẩm quyền Cao)</option>
                          <option value="Phê duyệt trung gian (Thẩm quyền Vừa)">Phê duyệt trung gian (Thẩm quyền Vừa)</option>
                          <option value="Chuyên môn kỹ thuật (Thẩm quyền Thấp)">Chuyên môn kỹ thuật (Thẩm quyền Thấp)</option>
                          <option value="Thực thi kỹ thuật (Tham mưu)">Thực thi kỹ thuật (Tham mưu)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[--color-text-secondary] mb-1">Số điện thoại</label>
                        <input 
                          type="text"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-2.5 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-xs font-medium"
                          placeholder="VD: 0901.234.567"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[--color-text-secondary] mb-1">Khu vực làm việc</label>
                        <input 
                          type="text"
                          value={formWorkLocation}
                          onChange={(e) => setFormWorkLocation(e.target.value)}
                          className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-2.5 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-xs font-medium"
                          placeholder="VD: Văn phòng TP.HCM"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[--color-text-secondary] mb-1">Thâm niên (năm)</label>
                        <input 
                          type="number"
                          min="0"
                          value={formTenure}
                          onChange={(e) => setFormTenure(Number(e.target.value))}
                          className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-2.5 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Targets management section */}
                  <div className="border-t border-[--color-border-secondary] pt-4 mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-[--color-text-secondary]">Chỉ tiêu mục tiêu (KPIs / OKRs)</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setFormTargets([
                            ...formTargets,
                            {
                              id: `target-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                              title: '',
                              progress: 0,
                              status: 'pending',
                              weight: 20,
                              period: 'Quý 2/2026'
                            }
                          ]);
                        }}
                        className="text-xs bg-[--color-accent-600] text-white px-2.5 py-1 rounded-lg font-semibold hover:bg-[--color-accent-700] transition"
                      >
                        + Thêm mục tiêu
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                      {formTargets.length === 0 ? (
                        <p className="text-xs text-[--color-text-subtle] text-center italic py-2">Chưa gán mục tiêu nào.</p>
                      ) : (
                        formTargets.map((t, idx) => (
                          <div key={t.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl space-y-2 relative">
                            <button
                              type="button"
                              onClick={() => {
                                setFormTargets(formTargets.filter((_, i) => i !== idx));
                              }}
                              className="absolute top-2.5 right-2.5 text-rose-500 hover:text-rose-700 p-0.5 rounded-full hover:bg-rose-500/10 transition"
                            >
                              <XIcon className="w-3.5 h-3.5" />
                            </button>
                            
                            <div className="grid grid-cols-1 gap-2 pr-4">
                              <input
                                required
                                type="text"
                                value={t.title}
                                onChange={(e) => {
                                  const copy = [...formTargets];
                                  copy[idx].title = e.target.value;
                                  setFormTargets(copy);
                                }}
                                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-2 focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none text-xs"
                                placeholder="Nhập nội dung mục tiêu chính"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Tiến độ (%)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={t.progress}
                                  onChange={(e) => {
                                    const copy = [...formTargets];
                                    const val = Math.min(100, Math.max(0, Number(e.target.value)));
                                    copy[idx].progress = val;
                                    copy[idx].status = val === 100 ? 'completed' : (val > 0 ? 'inprogress' : 'pending');
                                    setFormTargets(copy);
                                  }}
                                  className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-1.5 text-xs text-center"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Trọng số (%)</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={t.weight}
                                  onChange={(e) => {
                                    const copy = [...formTargets];
                                    copy[idx].weight = Number(e.target.value);
                                    setFormTargets(copy);
                                  }}
                                  className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-1.5 text-xs text-center"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Chu kỳ</label>
                                <input
                                  type="text"
                                  value={t.period}
                                  onChange={(e) => {
                                    const copy = [...formTargets];
                                    copy[idx].period = e.target.value;
                                    setFormTargets(copy);
                                  }}
                                  className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-1.5 text-xs text-center"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 font-semibold text-xs mt-1">
                              <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Dự án liên kết</label>
                              <select
                                value={t.projectId || ''}
                                onChange={(e) => {
                                  const copy = [...formTargets];
                                  copy[idx].projectId = e.target.value || undefined;
                                  setFormTargets(copy);
                                }}
                                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-1.5 text-xs font-semibold"
                              >
                                <option value="">-- Không liên kết --</option>
                                {projectsList.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setActionModal('none')}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[--color-border-secondary] text-[--color-text-primary] font-semibold text-sm hover:bg-black/5 transition-colors"
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[--color-accent-600] text-white font-semibold text-sm shadow-md hover:bg-[--color-accent-700] transition-colors"
                    >
                      Áp dụng cấu hình
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. DETAILS MODAL (POPUP) WITH 2 TABS */}
      {detailNode && (
        (() => {
          const richDetail = getRichNode(detailNode);
          
          const parentNode = (() => {
            if (activeRoot) return findParentNode(activeRoot, detailNode.id);
            // Search dynamically in all departments
            for (const dept of departments) {
              const root = orgData[dept.id];
              if (root) {
                const p = findParentNode(root, detailNode.id);
                if (p) return p;
              }
            }
            return null;
          })();

          const nodeDeptName = (() => {
            const currDept = departments.find(d => d.id === selectedDept);
            if (currDept) return currDept.name;
            
            // Search which department root contains this node
            const checkHasNode = (root: OrgNode, targetId: string): boolean => {
              if (root.id === targetId) return true;
              if (root.children && root.children.length > 0) {
                return root.children.some(child => checkHasNode(child, targetId));
              }
              return false;
            };

            for (const dept of departments) {
              const root = orgData[dept.id];
              if (root && checkHasNode(root, detailNode.id)) {
                return dept.name;
              }
            }
            return 'Phòng ban';
          })();
          
          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in-up">
              <div className="bg-[#f4f0f7] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in">
                <div className="relative pt-6 px-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="absolute top-4 right-4 z-20">
                    <button 
                      onClick={() => setDetailNode(null)} 
                      className="text-slate-400 hover:text-slate-700 hover:bg-black/5 dark:hover:bg-white/10 rounded-full p-2 transition-all"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 pr-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden bg-slate-100 shrink-0">
                      <img 
                        src={richDetail.avatar || 'https://i.ibb.co/6NKQZf64/avatar-placeholder.png'} 
                        alt={richDetail.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-[--color-text-primary] flex items-center gap-2">
                        {richDetail.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1.5 text-xs text-[--color-text-subtle]">
                        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-bold">
                          {richDetail.position}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-slate-500">
                          <SitemapIcon className="w-3.5 h-3.5 text-slate-400" />
                          {nodeDeptName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setDetailActiveTab('info')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all relative ${
                      detailActiveTab === 'info' 
                        ? 'text-[--color-accent-600] border-b-2 border-[--color-accent-600]' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <span>Thông tin cá nhân</span>
                  </button>
                  <button
                    onClick={() => setDetailActiveTab('targets')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all relative ${
                      detailActiveTab === 'targets' 
                        ? 'text-[--color-accent-600] border-b-2 border-[--color-accent-600]' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <span>Mục tiêu được giao</span>
                  </button>
                </div>

                {/* Tab Content Box */}
                <div className="p-6 max-h-[350px] overflow-y-auto space-y-4">
                  {detailActiveTab === 'info' ? (
                    <div className="space-y-4 text-left">
                      {/* Thẩm quyền */}
                      <div className="bg-amber-500/[0.04] border border-amber-500/15 p-4 rounded-xl flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider">MỨC ĐỘ THẨM QUYỀN QUYẾT ĐỊNH</div>
                          <div className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                            {richDetail.authorityLevel}
                          </div>
                        </div>
                      </div>

                      {/* Contact items */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-900/60 p-3 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1 shadow-sm">
                          <div className="text-[10px] font-bold text-slate-400 tracking-wider">EMAIL LIÊN HỆ</div>
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate font-mono" title={richDetail.email || 'Chưa thiết lập'}>
                            {richDetail.email || 'Chưa thiết lập'}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900/60 p-3 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1 shadow-sm">
                          <div className="text-[10px] font-bold text-slate-400 tracking-wider">SỐ ĐIỆN THOẠI</div>
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                            {richDetail.phone}
                          </div>
                        </div>
                      </div>

                      {/* Tuyến báo cáo hierarchy */}
                      <div className="bg-white dark:bg-slate-900/60 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3 shadow-sm">
                        <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">SƠ ĐỒ VÀ TUYẾN BÁO CÁO CÔNG VIỆC</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Parent reporting line */}
                          <div className="space-y-1.5">
                            <div className="text-[10px] text-slate-500 font-bold">CẤP TRÊN TRỰC TIẾP</div>
                            {parentNode ? (
                              <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                <img src={parentNode.avatar} className="w-7 h-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{parentNode.name}</div>
                                  <div className="text-[9px] text-slate-400 truncate">{parentNode.position}</div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 italic mt-1">Không có cấp trên (Vị trí cao nhất)</div>
                            )}
                          </div>

                          {/* Children team list */}
                          <div className="space-y-1.5">
                            <div className="text-[10px] text-slate-500 font-bold">ĐỘI NGŨ DƯỚI QUYỀN TRỰC TIẾP</div>
                            {richDetail.children && richDetail.children.length > 0 ? (
                              <div className="flex flex-col gap-1.5">
                                <span className="inline-block text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/45 px-2 py-1 rounded w-fit">
                                  {richDetail.children.length} Nhân viên trực tiếp
                                </span>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {richDetail.children.map(c => c.name).join(', ')}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 italic mt-1">Chưa gán cấp dưới trực tiếp</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Location and tenure */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-900/60 p-3 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1 shadow-sm">
                          <div className="text-[10px] font-bold text-slate-400 tracking-wider">KHU VỰC LÀM VIỆC</div>
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {richDetail.workLocation}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900/60 p-3 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1 shadow-sm">
                          <div className="text-[10px] font-bold text-slate-400 tracking-wider">THÂM NIÊN (NĂM)</div>
                          <div className="text-xs font-bold text-slate-800 dark:text-white">
                            {richDetail.tenure} năm
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Tab Targets (Mục tiêu được giao OKRs) */
                    <div className="space-y-4 text-left">
                      <div className="flex justify-between items-center bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="text-xs font-semibold text-[--color-text-subtle]">Quản lý mục tiêu (OKRs)</span>
                        <button
                          type="button"
                          onClick={() => setIsAddingInlineGoal(!isAddingInlineGoal)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all"
                        >
                          {isAddingInlineGoal ? 'Hủy' : '+ Mục tiêu mới'}
                        </button>
                      </div>

                      {/* CREATE TARGET INLINE FORM */}
                      {isAddingInlineGoal && (
                        <form onSubmit={handleAddInlineGoal} className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 space-y-3.5 shadow-sm">
                          <div>
                            <label className="block text-[11px] font-bold text-[--color-text-secondary] mb-1">Tên mục tiêu: *</label>
                            <input
                              type="text"
                              required
                              value={inlineGoalTitle}
                              onChange={(e) => setInlineGoalTitle(e.target.value)}
                              placeholder="Nhập tên mục tiêu cho nhân sự..."
                              className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-2 text-xs font-semibold focus:outline-indigo-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-[--color-text-secondary] mb-1">Trọng số (%):</label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={inlineGoalWeight}
                                onChange={(e) => setInlineGoalWeight(Number(e.target.value))}
                                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-2 text-xs font-semibold focus:outline-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-[--color-text-secondary] mb-1">Giai đoạn:</label>
                              <input
                                type="text"
                                value={inlineGoalPeriod}
                                onChange={(e) => setInlineGoalPeriod(e.target.value)}
                                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-2 text-xs font-semibold focus:outline-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-[--color-text-secondary] mb-1">Tiến độ ban đầu (%):</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={inlineGoalProgress}
                                onChange={(e) => setInlineGoalProgress(Number(e.target.value))}
                                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-2 text-xs font-semibold focus:outline-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-[--color-text-secondary] mb-1">Gắn vào dự án:</label>
                              <select
                                value={inlineGoalProjectId}
                                onChange={(e) => setInlineGoalProjectId(e.target.value)}
                                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-2 text-xs font-semibold focus:outline-indigo-500"
                              >
                                <option value="">-- Không gắn --</option>
                                {projectsList.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
                            >
                              Thêm & Lưu mục tiêu
                            </button>
                          </div>
                        </form>
                      )}

                      {richDetail.targets.length === 0 ? (
                        <div className="text-center p-8 text-xs text-slate-400">Không có mục tiêu nào được gán cho nhân sự này.</div>
                      ) : (
                        richDetail.targets.map((target) => (
                          <div 
                            key={target.id} 
                            className="bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3 shadow-none hover:shadow-xs transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 max-w-[70%]">
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                                  {target.title || 'Mục tiêu chung'}
                                </h4>
                                {target.projectId && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 px-2.5 py-0.5 rounded-full w-fit">
                                    <span className="uppercase tracking-widest text-[8px] text-slate-400 font-bold font-mono">Dự án:</span>
                                    <span className="truncate max-w-[150px]">
                                      {projectsList.find(p => p.id === target.projectId)?.name || 'Dự án liên quan'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                                    {target.period}
                                  </span>
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteInlineGoal(target.id)}
                                      className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-500/10 transition shrink-0"
                                      title="Xóa mục tiêu"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                                <span className="bg-blue-500/10 dark:bg-blue-950/40 text-[10px] font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-mono">
                                  TRỌNG SỐ: {target.weight}%
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                                <span>Tiến độ thực hiện</span>
                                <span className="font-bold text-slate-850 dark:text-white font-mono">{target.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    target.progress === 100 
                                      ? 'bg-emerald-500' 
                                      : (target.progress >= 50 ? 'bg-amber-500' : 'bg-rose-500')
                                  }`}
                                  style={{ width: `${target.progress}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 text-[10px]">
                              <span className="text-slate-400 font-bold">TRẠNG THÁI</span>
                              <span className={`px-2.5 py-0.5 rounded-full font-bold select-none text-[9px] ${
                                target.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : (target.status === 'inprogress'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-450'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')
                              }`}>
                                {target.status === 'completed' && 'ĐÃ HOÀN THÀNH'}
                                {target.status === 'inprogress' && 'ĐANG THỰC HIỆN'}
                                {target.status === 'pending' && 'CHƯA BẮT ĐẦU'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Footer buttons section */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setDetailNode(null);
                        handleOpenEditNode(detailNode);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[--color-border-secondary] text-slate-750 dark:text-slate-350 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                      Chỉnh sửa thẻ
                    </button>
                  )}
                  <button
                    onClick={() => setDetailNode(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[--color-accent-600] text-white font-bold text-xs shadow hover:bg-[--color-accent-700] transition-all text-center"
                  >
                    Đóng lại
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};

export default OrgChartView;
