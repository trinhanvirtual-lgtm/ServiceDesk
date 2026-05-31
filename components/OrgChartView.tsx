import React from 'react';
import { useLanguage } from './LanguageContext';
import { UsersIcon } from './icons';

interface OrgNode {
  id: string;
  name: string;
  position: string;
  avatar: string;
  children?: OrgNode[];
}

const departments = [
  { id: 'it', name: 'Phòng IT' },
  { id: 'hr', name: 'Phòng Nhân sự' },
  { id: 'marketing', name: 'Phòng Marketing' },
];

const orgData: Record<string, OrgNode> = {
  it: {
    id: '1',
    name: 'Lê Minh Tú',
    position: 'Trưởng phòng IT',
    avatar: 'https://i.pravatar.cc/150?u=1',
    children: [
      {
        id: '2',
        name: 'Nguyễn Văn Nam',
        position: 'Phó phòng Kỹ thuật',
        avatar: 'https://i.pravatar.cc/150?u=2',
        children: [
          {
            id: '4',
            name: 'Trần Thị Mai',
            position: 'Lập trình viên Senior',
            avatar: 'https://i.pravatar.cc/150?u=4',
          },
          {
            id: '5',
            name: 'Phạm Hoàng Long',
            position: 'Lập trình viên Junior',
            avatar: 'https://i.pravatar.cc/150?u=5',
          },
        ],
      },
      {
        id: '3',
        name: 'Trương Mỹ Linh',
        position: 'Chuyên gia Bảo mật',
        avatar: 'https://i.pravatar.cc/150?u=3',
        children: [
          {
            id: '6',
            name: 'Đặng Quốc Bảo',
            position: 'Tester',
            avatar: 'https://i.pravatar.cc/150?u=6',
          },
        ],
      },
    ],
  },
  hr: {
    id: 'hr1',
    name: 'Phan Thị Bích',
    position: 'Trưởng phòng Nhân sự',
    avatar: 'https://i.pravatar.cc/150?u=10',
    children: [
      {
        id: 'hr2',
        name: 'Lý Kiến Quốc',
        position: 'Chuyên viên Tuyển dụng',
        avatar: 'https://i.pravatar.cc/150?u=11',
      },
      {
        id: 'hr3',
        name: 'Võ Minh Thư',
        position: 'Chuyên viên Đào tạo',
        avatar: 'https://i.pravatar.cc/150?u=12',
      }
    ]
  },
  marketing: {
    id: 'm1',
    name: 'Nguyễn Mạnh Hùng',
    position: 'Giám đốc Marketing',
    avatar: 'https://i.pravatar.cc/150?u=20',
    children: [
      {
        id: 'm2',
        name: 'Trần Kiều Anh',
        position: 'Content Leader',
        avatar: 'https://i.pravatar.cc/150?u=21',
      },
      {
        id: 'm3',
        name: 'Lê Phúc Hưng',
        position: 'SEO Expert',
        avatar: 'https://i.pravatar.cc/150?u=22',
      }
    ]
  }
};

const OrgNodeItem: React.FC<{ node: OrgNode; isRoot?: boolean }> = ({ node, isRoot }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex flex-col items-center group">
        {/* Connection Line Above (except for root) */}
        {!isRoot && (
          <div className="relative h-8 flex flex-col items-center">
            <div className="w-px h-full bg-slate-300 dark:bg-slate-700"></div>
          </div>
        )}
        
        {/* Node Card */}
        <div className="bg-[--color-surface-secondary] border border-[--color-border-secondary] rounded-2xl p-4 shadow-xl min-w-[220px] flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-[--color-accent-500] z-10 relative overflow-hidden group-hover:bg-[--color-surface-tertiary]">
          <div className="absolute top-0 left-0 w-1 h-full bg-[--color-accent-600] opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-16 h-16 rounded-full border-2 border-[--color-accent-500] p-0.5 mb-3 shadow-inner overflow-hidden">
            <img src={node.avatar} alt={node.name} className="w-full h-full rounded-full object-cover transform transition-transform group-hover:scale-110" />
          </div>
          <h4 className="font-bold text-[--color-text-primary] text-center text-sm tracking-tight">{node.name}</h4>
          <div className="bg-[--color-accent-500]/10 text-[--color-accent-600] px-3 py-1 rounded-full text-[10px] font-bold uppercase mt-2 border border-[--color-accent-500]/20">
            {node.position}
          </div>
        </div>

        {/* Connection Line Below (if children exist) */}
        {node.children && node.children.length > 0 && (
          <div className="w-px h-8 bg-slate-300 dark:bg-slate-700"></div>
        )}
      </div>

      {/* Children Container */}
      {node.children && node.children.length > 0 && (
        <div className="relative flex justify-center gap-12 px-8">
          {/* Horizontal Connection Line */}
          {node.children.length > 1 && (
            <div className="absolute top-0 left-0 right-0 flex justify-center">
                <div 
                    className="h-px bg-slate-300 dark:bg-slate-700" 
                    style={{ 
                        width: `calc(100% - ${100 / node.children.length}%)`,
                        marginTop: '0px'
                    }}
                ></div>
            </div>
          )}
          
          {node.children.map((child) => (
            <OrgNodeItem key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

const OrgChartView: React.FC = () => {
  const { t } = useLanguage();
  const [selectedDept, setSelectedDept] = React.useState('it');

  return (
    <div className="flex flex-col h-full bg-[--color-surface-primary]/20 rounded-2xl border border-[--color-border-secondary] overflow-hidden">
      {/* Dept Selector Header */}
      <div className="p-6 border-b border-[--color-border-secondary] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[--color-surface-secondary]/50">
        <div>
          <h2 className="text-xl font-bold text-[--color-text-primary] flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-[--color-accent-500]" />
            {t('orgChart')}
          </h2>
          <p className="text-sm text-[--color-text-subtle] mt-1">Sơ đồ cơ cấu tổ chức theo phòng ban</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-[--color-text-secondary] whitespace-nowrap">{t('department')}:</label>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] text-sm rounded-xl p-2.5 min-w-[200px] focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none transition-all"
          >
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Chart Canvas */}
      <div className="flex-1 overflow-auto p-12 flex justify-center bg-[--color-surface-primary]/50 min-h-[600px] no-scrollbar">
        <div className="inline-block animate-fade-in-up">
          <OrgNodeItem node={orgData[selectedDept]} isRoot />
        </div>
      </div>
    </div>
  );
};

export default OrgChartView;
