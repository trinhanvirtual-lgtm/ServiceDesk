import React, { useState, useEffect, useRef } from 'react';
import { User } from '../App';
import { useLanguage } from './LanguageContext';
import { SitemapIcon, PlusIcon, FileEditIcon, TrashIcon, XIcon, ChecklistIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon, ShareIcon, AlertCircleIcon, FilePdfIcon } from './icons';
import { db, auth } from '../firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase-errors';
import { mockTaskLists, TaskList } from './TasklistView';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import ProjectBanner from './ProjectBanner';
import { AppNotification } from '../App';

interface ProjectManagementViewProps {
  user: User;
  onNavigateToTasks?: (taskListId: string) => void;
  onSendNotification?: (notif: Omit<AppNotification, 'id' | 'createdAt'>) => void;
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on_hold';
  dueDate: string;
  startDate?: string;
  parentProjectId?: string;
  taskListId?: string;
  taskListIds?: string[];
  department?: 'IT' | 'Marketing' | 'HR' | '';
}

const ProjectManagementView: React.FC<ProjectManagementViewProps> = ({ user, onNavigateToTasks, onSendNotification }) => {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState<'all' | 'this_week' | 'this_month' | 'overdue'>('all');
  const [notifiedProjects, setNotifiedProjects] = useState<Set<string>>(new Set());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  const handleShare = (type: string, id: string, name: string) => {
    const shareUrl = `${window.location.protocol}//${window.location.host}/?shareType=${type}&shareId=${id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast(`Đã sao chép liên kết chia sẻ của "${name}"!`);
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(`Đã sao chép liên kết chia sẻ của "${name}"!`);
    });
  };

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'completed' | 'on_hold'>('active');
  const [formStartDate, setFormStartDate] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formTaskListIds, setFormTaskListIds] = useState<string[]>([]);
  const [formDepartment, setFormDepartment] = useState<'IT' | 'Marketing' | 'HR' | ''>('');

  // Filtering department state
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // View mode state for toggle: table list vs interactive timeline gantt
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [timelineSubView, setTimelineSubView] = useState<'interactive' | 'chart'>('interactive');

  // Stats tab switch
  const [statsTab, setStatsTab] = useState<'chart' | 'flowchart'>('chart');
  // Copy of workflow tasklists for interactive flowchart checks
  const [flowTaskLists, setFlowTaskLists] = useState<TaskList[]>(mockTaskLists);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isNodeExpanded = (id: string) => {
    return expandedNodes[id] !== false; // Expanded by default
  };

  // Dropdown select and search state for tasklist
  const [taskListDropdownOpen, setTaskListDropdownOpen] = useState(false);
  const [taskListSearchTerm, setTaskListSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTaskListDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!auth.currentUser || user.id.startsWith('user-')) {
        setIsLoading(false);
        return;
    }
    if (!auth.currentUser) return;
    const projectsRef = collection(db, 'projects');
    const unsubscribe = onSnapshot(projectsRef, (snapshot) => {
      const projectsList: ProjectData[] = [];
      snapshot.forEach((doc) => {
        projectsList.push({ id: doc.id, ...doc.data() } as ProjectData);
      });
      setProjects(projectsList);
      setIsLoading(false);
    }, (error) => {
       setIsLoading(false);
       handleFirestoreError(error, OperationType.GET, 'projects');
     });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!onSendNotification || projects.length === 0) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);
    const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0];

    projects.forEach(project => {
      if (project.status === 'active' && project.dueDate && !notifiedProjects.has(project.id)) {
        if (project.dueDate >= todayStr && project.dueDate <= threeDaysLaterStr) {
          onSendNotification({
            userId: user.id,
            title: 'Sắp đến hạn dự án',
            message: `Dự án "${project.name}" sẽ hết hạn vào ngày ${new Date(project.dueDate).toLocaleDateString('vi-VN')}. Hãy kiểm tra tiến độ!`,
            read: false,
            type: 'task',
            link: 'projects'
          });
          setNotifiedProjects(prev => new Set(prev).add(project.id));
        }
      }
    });
  }, [projects, onSendNotification, user.id, notifiedProjects]);

  const openAddModal = (parentId: string = '') => {
    setModalMode('add');
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setFormStatus('active');
    setFormStartDate('');
    setFormDueDate('');
    setFormParentId(parentId);
    setFormTaskListIds([]);
    setFormDepartment('');
    setTaskListDropdownOpen(false);
    setTaskListSearchTerm('');
    setIsModalOpen(true);
  };

  const openEditModal = (project: ProjectData) => {
    setModalMode('edit');
    setEditingId(project.id);
    setFormName(project.name);
    setFormDescription(project.description);
    setFormStatus(project.status);
    setFormStartDate(project.startDate || '');
    setFormDueDate(project.dueDate || '');
    setFormParentId(project.parentProjectId || '');
    if (project.taskListIds) {
      setFormTaskListIds(project.taskListIds);
    } else if (project.taskListId) {
      setFormTaskListIds([project.taskListId]);
    } else {
      setFormTaskListIds([]);
    }
    setFormDepartment(project.department || '');
    setTaskListDropdownOpen(false);
    setTaskListSearchTerm('');
    setIsModalOpen(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa dự án này? Các công việc liên quan có thể bị ảnh hưởng hiện tại.')) {
      try {
        await deleteDoc(doc(db, 'projects', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
      }
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pData = {
        name: formName,
        description: formDescription,
        status: formStatus,
        startDate: formStartDate,
        dueDate: formDueDate,
        parentProjectId: formParentId || null,
        taskListId: formTaskListIds.length > 0 ? formTaskListIds[0] : null,
        taskListIds: formTaskListIds,
        department: formDepartment || null,
      };

      if (modalMode === 'add') {
        await addDoc(collection(db, 'projects'), pData);
      } else if (editingId) {
        await updateDoc(doc(db, 'projects', editingId), pData);
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(
        error,
        modalMode === 'add' ? OperationType.CREATE : OperationType.UPDATE,
        modalMode === 'add' ? 'projects' : `projects/${editingId}`
      );
    }
  };

  const handleExportCSV = () => {
    if (projects.length === 0) {
      showToast("Không có dự án nào để xuất báo cáo!");
      return;
    }
    const headers = ["ID", "Tên dự án", "Mô tả", "Trạng thái", "Hạn chót", "Phòng ban", "Dự án liên kết ID"];
    const rows = projects.map(p => [
      p.id,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      p.status === 'active' ? 'Đang thực hiện' : p.status === 'completed' ? 'Đã hoàn thành' : 'Tạm dừng',
      p.dueDate || 'Không có',
      p.department || 'Không có',
      p.parentProjectId || ''
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Báo_cáo_dự_án_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã xuất báo cáo CSV thành công!");
  };

  const handleExportPDF = () => {
    if (projects.length === 0) {
      showToast("Không có dự án nào để xuất báo cáo!");
      return;
    }

    const filtered = getFilteredProjects();
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('vi-VN');

    doc.setFontSize(20);
    doc.text('BÁO CÁO TỔNG QUAN DỰ ÁN', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Ngày xuất báo cáo: ${today}`, 105, 22, { align: 'center' });

    const tableData = filtered.map(p => [
      p.name,
      p.description,
      p.status === 'active' ? 'Đang thực hiện' : p.status === 'completed' ? 'Đã hoàn thành' : 'Tạm dừng',
      p.dueDate || 'Không có',
      p.department || 'Không có',
      `${calculateProjectProgress(p)}%`
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Tên dự án', 'Mô tả', 'Trạng thái', 'Hạn chót', 'Phòng ban', 'Tiến độ']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: 'F0F0F0', textColor: 0, fontStyle: 'bold' },
      styles: { fontSize: 8, font: 'helvetica' },
    });

    doc.save(`Bao_cao_du_an_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast("Đã xuất báo cáo PDF thành công!");
  };

  const calculateProjectProgress = (project: ProjectData) => {
    const listIds = project.taskListIds || (project.taskListId ? [project.taskListId] : []);
    if (listIds.length === 0) return 0;

    let totalTasks = 0;
    let completedTasks = 0;

    listIds.forEach(id => {
      const list = mockTaskLists.find(l => l.id === id);
      if (list) {
        totalTasks += list.tasks.length;
        completedTasks += list.tasks.filter(t => t.completed).length;
      }
    });

    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const getFilteredProjects = () => {
    let filtered = projects;

    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(lowerSearch) || 
        p.description.toLowerCase().includes(lowerSearch)
      );
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(p => selectedDepartment === 'None' ? !p.department : p.department === selectedDepartment);
    }

    if (dueDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayStr = today.toISOString().split('T')[0];
      
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const endOfMonthStr = endOfMonth.toISOString().split('T')[0];

      filtered = filtered.filter(p => {
        if (!p.dueDate) return false;
        
        if (dueDateFilter === 'overdue') {
          return p.dueDate < todayStr && p.status !== 'completed';
        }
        if (dueDateFilter === 'this_week') {
          return p.dueDate >= startOfWeekStr && p.dueDate <= endOfWeekStr;
        }
        if (dueDateFilter === 'this_month') {
          return p.dueDate >= startOfMonthStr && p.dueDate <= endOfMonthStr;
        }
        return true;
      });
    }

    return filtered;
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
        case 'active': return <span className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-semibold">Đang thực hiện</span>;
        case 'completed': return <span className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 px-2 py-1 rounded-full text-xs font-semibold">Đã hoàn thành</span>;
        case 'on_hold': return <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-semibold">Tạm dừng</span>;
        default: return null;
    }
  };

  const getTimelineBaseDate = (): Date => {
    let minTime = new Date('2026-05-25').getTime();
    const activeProjects = projects.filter(p => p.dueDate || p.startDate);
    if (activeProjects.length > 0) {
      const times = activeProjects.map(p => {
        const d = p.startDate ? new Date(p.startDate) : (p.dueDate ? new Date(new Date(p.dueDate).getTime() - 14 * 24 * 3600 * 1000) : new Date());
        return isNaN(d.getTime()) ? new Date().getTime() : d.getTime();
      });
      minTime = Math.min(...times);
    }
    return new Date(minTime - 3 * 24 * 3600 * 1000);
  };

  const formatXAxis = (tickItem: number) => {
    const base = getTimelineBaseDate();
    base.setDate(base.getDate() + Math.round(tickItem));
    return base.toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' });
  };

  const getTimelineData = () => {
    let filtered = projects;
    if (selectedDepartment !== 'all') {
      filtered = projects.filter(p => selectedDepartment === 'None' ? !p.department : p.department === selectedDepartment);
    }

    const baseDate = getTimelineBaseDate();
    
    return filtered.map(p => {
      let dDue = p.dueDate ? new Date(p.dueDate) : null;
      let dStart = p.startDate ? new Date(p.startDate) : null;

      if (!dDue || isNaN(dDue.getTime())) {
        dDue = new Date();
      }
      if (!dStart || isNaN(dStart.getTime())) {
        dStart = new Date(dDue.getTime() - 14 * 24 * 3600 * 1000);
      }

      if (dStart.getTime() > dDue.getTime()) {
        dStart = new Date(dDue.getTime() - 1 * 24 * 3600 * 1000);
      }

      const diffStart = dStart.getTime() - baseDate.getTime();
      const diffDue = dDue.getTime() - baseDate.getTime();

      const startDays = Math.max(0, Math.round(diffStart / (1000 * 3600 * 24)));
      const endDays = Math.max(startDays + 1, Math.round(diffDue / (1000 * 3600 * 24)));
      
      let color = '#3B82F6';
      if (p.status === 'completed') color = '#10B981';
      if (p.status === 'on_hold') color = '#F59E0B';

      const progress = calculateProjectProgress(p);

      return {
        id: p.id,
        name: p.name,
        status: p.status,
        statusLabel: p.status === 'active' ? 'Đang thực hiện' : p.status === 'completed' ? 'Đã hoàn thành' : 'Tạm dừng',
        department: p.department || 'Chưa phân loại',
        startDateStr: dStart.toLocaleDateString('vi-VN'),
        dueDateStr: dDue.toLocaleDateString('vi-VN'),
        startDateISO: dStart.toISOString().split('T')[0],
        dueDateISO: dDue.toISOString().split('T')[0],
        duration: [startDays, endDays],
        startDays,
        endDays,
        progress,
        color,
      };
    }).sort((a, b) => a.startDays - b.startDays);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderProjectNode = (p: ProjectData, depth: number = 0): React.ReactNode => {
    const listIds = p.taskListIds || (p.taskListId ? [p.taskListId] : []);
    const subProjects = projects.filter(sp => sp.parentProjectId === p.id);
    const expanded = isNodeExpanded(p.id);
    const progress = calculateProjectProgress(p);

    return (
      <div key={p.id} className="relative">
        {/* Node representation */}
        <div className={`p-4 rounded-xl border transition-all ${
          depth === 0 
            ? 'bg-[--color-surface-primary] border-[--color-border-secondary] shadow-sm hover:shadow-md'
            : 'bg-[--color-surface-primary]/60 border-[--color-border-secondary]/60 ml-4 md:ml-6 mt-2'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button 
                type="button"
                onClick={() => toggleNode(p.id)}
                className="p-1 rounded hover:bg-[--color-surface-tertiary] text-[--color-text-secondary] shrink-0"
                title={expanded ? "Thu gọn" : "Mở rộng"}
              >
                {expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </button>
              
              <div className="min-w-0">
                <div className="flex items-center flex-wrap gap-1.5 mb-1">
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                    depth === 0 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' 
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}>
                    {depth === 0 ? 'Cấp 1 - Dự án chính' : 'Cấp 2 - Dự án con'}
                  </span>
                  {p.department && (
                    <span className="text-[10px] font-semibold text-[--color-text-secondary] bg-[--color-surface-secondary] px-2 py-0.5 rounded-full border border-[--color-border-secondary]">
                      Phòng {p.department}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-[--color-text-primary] text-base truncate">{p.name}</h4>
              </div>
            </div>
            
            <div className="flex items-center flex-wrap gap-2.5 shrink-0">
              {p.dueDate && (
                <span className="text-xs text-[--color-text-secondary] bg-[--color-surface-secondary] px-2.5 py-1 rounded-lg border border-[--color-border-secondary]/60 font-medium">
                  Hạn: {new Date(p.dueDate).toLocaleDateString('vi-VN')}
                </span>
              )}
              {getStatusBadge(p.status)}
            </div>
          </div>

          {p.description && (
            <p className="mt-2 text-xs text-[--color-text-secondary] leading-relaxed pl-7 border-l-2 border-[--color-border-secondary]/40 italic">
              {p.description}
            </p>
          )}

          {/* Progress bar info for project in flowchart */}
          <div className="mt-3 pl-7 max-w-md">
            <div className="flex justify-between text-[10px] font-bold text-[--color-text-secondary] mb-1">
              <span>Độ hoàn thành</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-[--color-border-secondary]/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Child items linked below */}
        {expanded && (
          <div className="relative mt-2 pl-4 sm:pl-6 ml-4 sm:ml-5 border-l-2 border-indigo-500/20 dark:border-indigo-500/10 space-y-3 pt-1">
            {/* 1. Sub Projects */}
            {subProjects.map(sp => renderProjectNode(sp, depth + 1))}

            {/* 2. Associated Task lists */}
            {listIds.length > 0 ? (
              listIds.map(listId => {
                const listObj = flowTaskLists.find(l => l.id === listId);
                if (!listObj) return null;
                const totalTasks = listObj.tasks.length;
                const completedTasks = listObj.tasks.filter(t => t.completed).length;
                const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                const listExpanded = isNodeExpanded(`${p.id}-${listId}`);

                return (
                  <div key={listId} className="relative mt-2">
                    <div className="bg-[--color-surface-tertiary] dark:bg-slate-900/60 border border-[--color-border-secondary] rounded-xl p-3 shadow-sm hover:border-[--color-accent-500]/40 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <button 
                            type="button"
                            onClick={() => toggleNode(`${p.id}-${listId}`)}
                            className="p-1 rounded hover:bg-[--color-surface-secondary] text-[--color-text-secondary] shrink-0"
                            title={listExpanded ? "Thu gọn danh sách" : "Mở rộng danh sách"}
                          >
                            {listExpanded ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
                          </button>
                          <ChecklistIcon className="w-4 h-4 text-sky-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="inline-block text-[9px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-1.5 py-0.5 rounded mr-2 shrink-0">
                              Cấp 3 - Danh mục việc
                            </span>
                            <span className="font-semibold text-sm text-[--color-text-primary] truncate">{listObj.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className="text-xs font-semibold text-[--color-text-secondary] bg-[--color-surface-secondary] border border-[--color-border-secondary] px-2 py-0.5 rounded-full">
                            {completedTasks}/{totalTasks} việc ({pct}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Render Tasks inside this list */}
                    {listExpanded && (
                      <div className="relative mt-2 pl-4 ml-4 border-l border-dashed border-sky-300 dark:border-sky-800 space-y-2 pt-1">
                        {listObj.tasks.length > 0 ? (
                          listObj.tasks.map(task => {
                            let priorityColor = 'bg-slate-400';
                            if (task.priority === 'Cao') priorityColor = 'bg-red-500';
                            if (task.priority === 'Trung bình') priorityColor = 'bg-amber-500';
                            if (task.priority === 'Thấp') priorityColor = 'bg-green-500';

                            return (
                              <div 
                                key={task.id} 
                                className="flex items-center justify-between p-2.5 rounded-lg bg-[--color-surface-primary]/80 hover:bg-[--color-surface-primary] border border-[--color-border-secondary]/50 transition-all hover:shadow-xs gap-3"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <input 
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => {
                                      setFlowTaskLists(prev => prev.map(l => {
                                        if (l.id === listId) {
                                          return {
                                            ...l,
                                            tasks: l.tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t)
                                          };
                                        }
                                        return l;
                                      }));
                                    }}
                                    className="w-4.5 h-4.5 rounded text-[--color-accent-600] border-[--color-border-secondary] focus:ring-[--color-accent-500] cursor-pointer"
                                  />
                                  <div className="min-w-0">
                                    <div className={`text-sm ${task.completed ? 'line-through text-[--color-text-subtle] font-normal' : 'text-[--color-text-primary] font-medium'} truncate`}>
                                      {task.text}
                                    </div>
                                    {task.notes && (
                                      <p className="text-[11px] text-[--color-text-secondary] truncate max-w-[240px] sm:max-w-md mt-0.5">
                                        {task.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {task.priority && (
                                    <span className="flex items-center gap-1 text-[10px] text-[--color-text-secondary] bg-[--color-surface-secondary] border border-[--color-border-secondary] px-2 py-0.5 rounded-full">
                                      <span className={`w-1.5 h-1.5 rounded-full ${priorityColor}`} />
                                      {task.priority}
                                    </span>
                                  )}
                                  {task.dueDate && (
                                    <span className="text-[10px] text-[--color-text-subtle] bg-[--color-surface-secondary] border border-[--color-border-secondary] px-2 py-0.5 rounded-full hidden sm:inline-block">
                                      Hạn: {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs text-[--color-text-subtle] italic py-2 pl-3 bg-[--color-surface-tertiary]/30 rounded-lg">
                            Danh mục này chưa có công việc nào.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : depth === 0 ? (
              <div className="text-xs text-[--color-text-subtle] italic py-3 pl-4 bg-[--color-surface-tertiary]/30 rounded-lg border border-[--color-border-secondary] max-w-sm">
                Không có danh mục công việc nào được gán cho dự án này.
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-[3px] pb-24 md:pb-8 flex flex-col gap-3">
      <div className="shrink-0">
        <ProjectBanner />
      </div>

      {/* Pie Chart and Project Status Statistics Section */}
      <div className="bg-[--color-surface-secondary] rounded-2xl p-6 border border-[--color-border-secondary] shadow-lg shrink-0 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[--color-border-secondary]">
              <div>
                  <h3 className="text-lg font-bold text-[--color-text-primary] flex items-center gap-2">
                      <SitemapIcon className="w-5 h-5 text-[--color-accent-600]" />
                      Thống kê trạng thái & Lưu đồ cấp bậc
                  </h3>
                  <p className="text-sm text-[--color-text-secondary]">Xem cấu trúc tỷ lệ dự án hoặc lưu đồ các cấp của công việc.</p>
              </div>
              <div className="bg-[--color-surface-tertiary] p-1 rounded-xl flex items-center gap-1 border border-[--color-border-secondary] shadow-inner select-none shrink-0 self-end sm:self-center">
                  <button
                      type="button"
                      onClick={() => setStatsTab('chart')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          statsTab === 'chart'
                              ? 'bg-[--color-accent-600] text-white shadow-md font-bold'
                              : 'text-[--color-text-secondary] hover:text-[--color-text-primary]'
                      }`}
                  >
                      Biểu đồ tỷ lệ
                  </button>
                  <button
                      type="button"
                      onClick={() => setStatsTab('flowchart')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          statsTab === 'flowchart'
                              ? 'bg-[--color-accent-600] text-white shadow-md font-bold'
                              : 'text-[--color-text-secondary] hover:text-[--color-text-primary]'
                      }`}
                  >
                      Lưu đồ nhiệm vụ cấp bậc
                  </button>
              </div>
          </div>

          {statsTab === 'chart' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                  <div className="lg:col-span-1 flex flex-col justify-between">
                      <div>
                          <h4 className="text-sm font-semibold text-[--color-text-secondary] mb-4">Phân bổ trạng thái dự án thực tế</h4>
                      </div>
                      <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm font-medium">
                              <span className="flex items-center gap-2 text-[--color-text-secondary]">
                                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                  Đang thực hiện
                              </span>
                              <span className="font-bold text-[--color-text-primary]">
                                  {projects.filter(p => p.status === 'active').length} dự án
                              </span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-medium">
                              <span className="flex items-center gap-2 text-[--color-text-secondary]">
                                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                  Đã hoàn thành
                              </span>
                              <span className="font-bold text-[--color-text-primary]">
                                  {projects.filter(p => p.status === 'completed').length} dự án
                              </span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-medium">
                              <span className="flex items-center gap-2 text-[--color-text-secondary]">
                                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                  Tạm dừng
                              </span>
                              <span className="font-bold text-[--color-text-primary]">
                                  {projects.filter(p => p.status === 'on_hold').length} dự án
                              </span>
                          </div>
                      </div>
                  </div>

                  <div className="lg:col-span-2 h-[220px] flex items-center justify-center">
                      {projects.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={[
                                          { name: 'Đang thực hiện', value: projects.filter(p => p.status === 'active').length, color: '#3B82F6' },
                                          { name: 'Đã hoàn thành', value: projects.filter(p => p.status === 'completed').length, color: '#10B981' },
                                          { name: 'Tạm dừng', value: projects.filter(p => p.status === 'on_hold').length, color: '#F59E0B' },
                                      ].filter(d => d.value > 0)}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={85}
                                      paddingAngle={4}
                                      dataKey="value"
                                  >
                                      {
                                        [
                                          { name: 'Đang thực hiện', value: projects.filter(p => p.status === 'active').length, color: '#3B82F6' },
                                          { name: 'Đã hoàn thành', value: projects.filter(p => p.status === 'completed').length, color: '#10B981' },
                                          { name: 'Tạm dừng', value: projects.filter(p => p.status === 'on_hold').length, color: '#F59E0B' },
                                        ].filter(d => d.value > 0).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))
                                      }
                                  </Pie>
                                  <Tooltip 
                                      contentStyle={{ 
                                          backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                                          borderRadius: '8px', 
                                          border: 'none',
                                          color: '#fff' 
                                      }} 
                                  />
                              </PieChart>
                          </ResponsiveContainer>
                      ) : (
                          <div className="text-sm text-[--color-text-subtle]">Chưa có dữ liệu dự án nào để hiển thị biểu đồ.</div>
                      )}
                  </div>
              </div>
          ) : (
              <div className="pt-2 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-[--color-surface-tertiary] p-3 rounded-xl border border-[--color-border-secondary]/60">
                      <span className="text-xs text-[--color-text-secondary] font-medium leading-relaxed">
                          💡 <strong>Lưu ý:</strong> Lưu đồ hiển thị cơ cấu 4 cấp: <strong>Dự án chính</strong> → <strong>Dự án con</strong> → <strong>Danh mục việc</strong> → <strong>Chi tiết công việc</strong>. Bạn có thể Click để thay đổi trạng thái trực tiếp.
                      </span>
                      <button 
                          onClick={() => {
                              // Expand or collapse all parent projects
                              const parents = projects.filter(p => !p.parentProjectId);
                              const anyCollapsed = parents.some(p => expandedNodes[p.id] === false);
                              const newExpanded: Record<string, boolean> = {};
                              projects.forEach(p => {
                                  newExpanded[p.id] = anyCollapsed;
                                  const listIds = p.taskListIds || (p.taskListId ? [p.taskListId] : []);
                                  listIds.forEach(lid => {
                                      newExpanded[`${p.id}-${lid}`] = anyCollapsed;
                                  });
                              });
                              setExpandedNodes(newExpanded);
                          }}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 self-end sm:self-center"
                      >
                          {projects.some(p => expandedNodes[p.id] === false) ? 'Mở rộng tất cả' : 'Thu gọn tất cả'}
                      </button>
                  </div>
                  
                  <div className="bg-[--color-surface-tertiary] rounded-2xl border border-[--color-border-secondary]/60 h-[600px] overflow-hidden relative">
                      {(() => {
                          const filteredAll = getFilteredProjects();
                          const parentProjects = projects.filter(p => {
                              if (p.parentProjectId) return false;
                              const parentMatches = filteredAll.some(fp => fp.id === p.id);
                              if (parentMatches) return true;
                              const hasMatchingChild = projects.some(sp => sp.parentProjectId === p.id && filteredAll.some(fp => fp.id === sp.id));
                              return hasMatchingChild;
                          });

                          if (parentProjects.length === 0) {
                              return (
                                  <div className="flex h-full items-center justify-center p-8 text-center text-sm text-[--color-text-subtle]">
                                      Không tìm thấy dự án cấp bậc nào phù hợp với bộ lọc hiện tại.
                                  </div>
                              );
                          }

                          // Build tree model
                          type MMNode = { id: string; name: string; type: string; meta?: unknown; children: MMNode[] };
                          const buildNode = (p: ProjectData): MMNode => {
                              const subProjects = projects.filter(sp => sp.parentProjectId === p.id);
                              const listIds = p.taskListIds || (p.taskListId ? [p.taskListId] : []);
                              
                              const children: MMNode[] = [];
                              subProjects.forEach(sp => {
                                  children.push(buildNode(sp));
                              });
                              listIds.forEach(listId => {
                                  const listObj = flowTaskLists.find(l => l.id === listId);
                                  if (listObj) {
                                      const taskNodes = listObj.tasks.map(t => ({
                                          id: t.id,
                                          name: t.title,
                                          type: 'task',
                                          meta: t,
                                          children: []
                                      }));
                                      children.push({
                                          id: listId,
                                          name: listObj.name,
                                          type: 'tasklist',
                                          meta: listObj,
                                          children: taskNodes
                                      });
                                  }
                              });

                              return {
                                  id: p.id,
                                  name: p.name,
                                  type: 'project',
                                  meta: p,
                                  children
                              };
                          };

                          const rootNodes = parentProjects.map(p => buildNode(p));
                          
                          // Split into left and right
                          const leftNodes = rootNodes.filter((_, i) => i % 2 !== 0);
                          const rightNodes = rootNodes.filter((_, i) => i % 2 === 0);

                          const renderBranch = (node: MMNode, isLeft: boolean, isFirst: boolean, isLast: boolean, isRootConnected: boolean) => {
                              const hasChildren = node.children.length > 0;
                              
                              let typeColor = 'text-slate-700 bg-white border-slate-200';
                              if (node.type === 'project') typeColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';
                              if (node.type === 'tasklist') typeColor = 'text-sky-700 bg-sky-50 border-sky-200';
                              if (node.type === 'task') {
                                  const c = node.meta.completed;
                                  typeColor = c ? 'text-emerald-700 bg-emerald-50 border-emerald-200 line-through' : 'text-slate-600 bg-white border-slate-200';
                              }

                              return (
                                  <div key={node.id} className={`relative flex items-center py-2 ${isLeft ? 'pr-8 justify-end' : 'pl-8'}`}>
                                      {/* Horizontal connection to parent */}
                                      <div className={`absolute top-1/2 -mt-[1px] w-8 border-t-2 border-slate-300 ${isLeft ? 'right-0' : 'left-0'}`}></div>
                                      
                                      {/* Curves for first and last child if connecting to a vertical bar */}
                                      {!isRootConnected && (
                                          <>
                                              {isFirst && <div className={`absolute top-[50%] bottom-0 w-4 border-t-2 border-slate-300 ${isLeft ? 'right-0 border-r-2 rounded-tr-xl' : 'left-0 border-l-2 rounded-tl-xl'}`}></div>}
                                              {isLast && <div className={`absolute top-0 bottom-[50%] w-4 border-b-2 border-slate-300 ${isLeft ? 'right-0 border-r-2 rounded-br-xl' : 'left-0 border-l-2 rounded-bl-xl'}`}></div>}
                                          </>
                                      )}

                                      {/* Node Content */}
                                      <div className={`px-4 py-2 rounded-lg shadow-sm border font-semibold text-xs whitespace-nowrap truncate max-w-[200px] z-10 ${typeColor}`}>
                                          {node.name}
                                          {node.type === 'project' && node.meta.department && (
                                              <span className="block text-[8px] font-bold text-indigo-400 mt-0.5 uppercase tracking-wider">{node.meta.department}</span>
                                          )}
                                      </div>

                                      {/* Connect to children */}
                                      {hasChildren && (
                                          <>
                                          <div className={`w-8 border-t-2 border-slate-300 shrink-0`}></div>
                                          <div className={`flex flex-col justify-center relative ${isLeft ? 'pr-0' : 'pl-0'}`}>
                                              {/* Vertical line connecting children */}
                                              {node.children.length > 1 && (
                                                  <div className={`absolute top-[25%] bottom-[25%] border-slate-300 ${isLeft ? 'border-r-2 right-0' : 'border-l-2 left-0'}`}></div>
                                              )}
                                              {node.children.map((child, i) => renderBranch(child, isLeft, i === 0, i === node.children.length - 1, false))}
                                          </div>
                                          </>
                                      )}
                                  </div>
                              );
                          };

                          return (
                              <div className="w-full h-full overflow-auto bg-[--color-surface-primary]/50 p-8 flex items-center justify-center min-w-max">
                                  <div className="flex items-center">
                                      {/* LEFT BRANCHES */}
                                      <div className="flex flex-col justify-center relative pr-8">
                                          {leftNodes.length > 1 && <div className="absolute right-0 top-[25%] bottom-[25%] border-r-2 border-slate-300"></div>}
                                          {leftNodes.map((node, i) => renderBranch(node, true, i === 0, i === leftNodes.length - 1, leftNodes.length === 1))}
                                      </div>

                                      {/* ROOT */}
                                      <div className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg z-10 shrink-0 font-bold text-sm border-2 border-indigo-400">
                                          Tổng quan Dự án
                                      </div>

                                      {/* RIGHT BRANCHES */}
                                      <div className="flex flex-col justify-center relative pl-8">
                                          {rightNodes.length > 1 && <div className="absolute left-0 top-[25%] bottom-[25%] border-l-2 border-slate-300"></div>}
                                          {rightNodes.map((node, i) => renderBranch(node, false, i === 0, i === rightNodes.length - 1, rightNodes.length === 1))}
                                      </div>
                                  </div>
                              </div>
                          );
                      })()}
                  </div>
              </div>
          )}
      </div>

      <div className="w-full flex-1">
        <div className="bg-[--color-surface-secondary] rounded-2xl shadow-xl overflow-hidden border border-[--color-border-secondary] flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-[--color-border-secondary] flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <h2 className="text-xl font-bold text-[--color-text-primary]">{t('projectList') || 'Danh sách dự án'}</h2>
                      
                      {/* View Mode Segmented Switch - Custom Refined Design */}
                      <div className="bg-[--color-surface-tertiary] p-1 rounded-xl flex items-center gap-1 border border-[--color-border-secondary] w-max select-none shadow-inner">
                          <button
                              type="button"
                              onClick={() => setViewMode('list')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                  viewMode === 'list'
                                      ? 'bg-[--color-accent-600] text-white shadow-md'
                                      : 'text-[--color-text-secondary] hover:text-[--color-text-primary]'
                              }`}
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                  <line x1="8" y1="6" x2="21" y2="6"></line>
                                  <line x1="8" y1="12" x2="21" y2="12"></line>
                                  <line x1="8" y1="18" x2="21" y2="18"></line>
                                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                              </svg>
                              <span>Bảng danh sách</span>
                          </button>
                          <button
                              type="button"
                              onClick={() => setViewMode('timeline')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                  viewMode === 'timeline'
                                      ? 'bg-[--color-accent-600] text-white shadow-md'
                                      : 'text-[--color-text-secondary] hover:text-[--color-text-primary]'
                              }`}
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                  <line x1="16" y1="2" x2="16" y2="6"></line>
                                  <line x1="8" y1="2" x2="8" y2="6"></line>
                                  <line x1="3" y1="10" x2="21" y2="10"></line>
                              </svg>
                              <span>Dòng thời gian (Gantt)</span>
                          </button>
                      </div>
                  </div>
                  <button 
                    onClick={() => openAddModal()}
                    className="bg-[--color-accent-600] text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-[--color-accent-500/20] flex items-center justify-center gap-2 hover:bg-[--color-accent-700] transition-all active:scale-[0.98] w-full sm:w-auto"
                  >
                    <PlusIcon className="w-5 h-5" /> 
                    <span className="whitespace-nowrap">{t('newProject') || 'Tạo dự án mới'}</span>
                  </button>
              </div>

              {/* Search input field above project list */}
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-5 w-5 text-[--color-text-subtle]" />
                  </div>
                  <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-[--color-border-secondary] rounded-xl leading-5 bg-[--color-surface-tertiary]/30 text-[--color-text-primary] placeholder-[--color-text-subtle] focus:outline-none focus:ring-1 focus:ring-[--color-accent-500] focus:border-[--color-accent-500] sm:text-sm transition-all shadow-inner"
                      placeholder={t('searchProjects') || "Tìm kiếm dự án theo tên hoặc mô tả..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
          </div>

          {/* Filters and Export Button toolbar */}
          <div className="px-6 py-4 border-b border-[--color-border-secondary] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[--color-surface-tertiary]/40 shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[--color-text-secondary] whitespace-nowrap">Phòng ban:</span>
                      <select
                          value={selectedDepartment}
                          onChange={(e) => setSelectedDepartment(e.target.value)}
                          className="bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] text-sm rounded-lg py-2 px-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none cursor-pointer"
                      >
                          <option value="all">{t('allDepartments') || 'Tất cả'}</option>
                          <option value="IT">IT</option>
                          <option value="Marketing">Marketing</option>
                          <option value="HR">HR</option>
                          <option value="None">Chưa phân loại</option>
                      </select>
                  </div>

                  <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[--color-text-secondary] whitespace-nowrap">Thời hạn:</span>
                      <select
                          value={dueDateFilter}
                          onChange={(e) => setDueDateFilter(e.target.value as 'all' | 'overdue' | 'this_week' | 'this_month')}
                          className="bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] text-sm rounded-lg py-2 px-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none cursor-pointer"
                      >
                          <option value="all">{t('all') || 'Tất cả'}</option>
                          <option value="overdue">{t('overdue') || 'Quá hạn'}</option>
                          <option value="this_week">{t('thisWeek') || 'Tuần này'}</option>
                          <option value="this_month">{t('thisMonth') || 'Tháng này'}</option>
                      </select>
                  </div>
              </div>
              
              <div className="flex items-center gap-2">
                  <button
                      onClick={handleExportPDF}
                      className="bg-red-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md shadow-red-500/20 flex items-center justify-center gap-2 hover:bg-red-700 transition-all active:scale-[0.98] text-sm flex-1 sm:flex-none"
                  >
                      <FilePdfIcon className="w-4.5 h-4.5" />
                      <span className="whitespace-nowrap">{t('exportPDF') || 'Xuất PDF'}</span>
                  </button>
                  <button
                      onClick={handleExportCSV}
                      className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-[0.98] text-sm flex-1 sm:flex-none"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span className="whitespace-nowrap">{t('exportCSV') || 'Xuất CSV'}</span>
                  </button>
              </div>
          </div>

          {viewMode === 'list' ? (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-[--color-surface-tertiary] border-b border-[--color-border-secondary]">
                      <th className="p-4 font-semibold text-sm text-[--color-text-secondary]">{t('projectName')}</th>
                      <th className="p-4 font-semibold text-sm text-[--color-text-secondary]">{t('projectStatus')} / {t('progress')}</th>
                      <th className="p-4 font-semibold text-sm text-[--color-text-secondary]">{t('projectDueDate')}</th>
                      <th className="p-4 font-semibold text-sm text-[--color-text-secondary]">Tasklists</th>
                      <th className="p-4 font-semibold text-sm text-[--color-text-secondary] text-right">Thao tác</th>
                      </tr>
                  </thead>
                  <tbody>
                      {isLoading ? (
                          <tr>
                              <td colSpan={5} className="p-8 text-center text-[--color-text-subtle]">Đang tải dữ liệu...</td>
                          </tr>
                      ) : (() => {
                          const filteredList = getFilteredProjects();
                          if (filteredList.length === 0) {
                              return (
                                  <tr>
                                      <td colSpan={5} className="p-8 text-center text-[--color-text-subtle]">Không tìm thấy dự án nào.</td>
                                  </tr>
                              );
                          }

                          const parentProjects = filteredList.filter(p => !p.parentProjectId);
                          const subProjects = projects.filter(p => p.parentProjectId);

                          return parentProjects.map((project) => (
                              <React.Fragment key={project.id}>
                                  <tr className="border-b border-[--color-border-secondary] hover:bg-[--color-surface-primary]/50 transition-colors">
                                      <td className="p-4 font-bold text-[--color-text-primary] max-w-[200px] truncate">
                                          <div className="flex items-center gap-2 mb-1">
                                              <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></div>
                                              <span className="truncate">{project.name}</span>
                                          </div>
                                          {project.department && (
                                              <span className="inline-block bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide">
                                                  Phòng {project.department}
                                              </span>
                                          )}
                                      </td>
                                      <td className="p-4">
                                          <div className="mb-2">{getStatusBadge(project.status)}</div>
                                          {project.status === 'active' && (
                                              <div className="w-full max-w-[120px]">
                                                  <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-[--color-text-secondary]">
                                                      <span>Tiến độ</span>
                                                      <span>{calculateProjectProgress(project)}%</span>
                                                  </div>
                                                  <div className="w-full h-1.5 bg-[--color-border-secondary]/40 rounded-full overflow-hidden">
                                                      <div 
                                                          className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                                                          style={{ width: `${calculateProjectProgress(project)}%` }}
                                                      ></div>
                                                  </div>
                                              </div>
                                          )}
                                      </td>
                                      <td className="p-4">
                                           <div className="flex items-center gap-2">
                                               <span className="text-sm text-[--color-text-secondary]">
                                                   {project.dueDate ? new Date(project.dueDate).toLocaleDateString('vi-VN') : 'Không có'}
                                               </span>
                                               {project.status === 'active' && project.dueDate && project.dueDate < new Date().toISOString().split('T')[0] && (
                                                   <AlertCircleIcon className="w-4 h-4 text-red-500 animate-pulse" title="Đã quá hạn!" />
                                               )}
                                           </div>
                                      </td>
                                      <td className="p-4 text-sm text-[--color-text-secondary]">
                                           <span className="inline-flex items-center gap-1 bg-[--color-surface-tertiary] px-2 py-1 rounded-md border border-[--color-border-secondary]">
                                               <ChecklistIcon className="w-3.5 h-3.5" />
                                               {project.taskListIds?.length || (project.taskListId ? 1 : 0)}
                                           </span>
                                      </td>
                                      <td className="p-4 text-right whitespace-nowrap">
                                          {onNavigateToTasks && (
                                              <>
                                                  {!project.taskListIds?.length && project.taskListId && (
                                                      <button 
                                                          onClick={() => onNavigateToTasks(project.taskListId!)}
                                                          className="p-1 px-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-md transition-colors mr-1 text-xs font-semibold inline-flex items-center gap-1"
                                                          title="Mở danh sách công việc"
                                                      >
                                                          <ChecklistIcon className="w-3.5 h-3.5" />
                                                          <span>Tasklist</span>
                                                      </button>
                                                  )}
                                                  {project.taskListIds?.map((id) => {
                                                      const matchedList = mockTaskLists.find(l => l.id === id);
                                                      const listName = matchedList ? matchedList.name : `Tasklist ${id}`;
                                                      return (
                                                          <button 
                                                              key={id}
                                                              onClick={() => onNavigateToTasks(id)}
                                                              className="p-1 px-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-md transition-colors mr-1 mb-1 text-xs font-semibold inline-flex items-center gap-1"
                                                              title={`Mở danh sách ${listName}`}
                                                          >
                                                              <ChecklistIcon className="w-3 h-3" />
                                                              <span>{listName}</span>
                                                          </button>
                                                      );
                                                  })}
                                              </>
                                          )}
                                          <button 
                                              onClick={() => handleShare('project', project.id, project.name)}
                                              className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors mr-1 text-sm"
                                              title="Chia sẻ liên kết"
                                          >
                                              <ShareIcon className="w-4 h-4" />
                                          </button>
                                          <button 
                                              onClick={() => openAddModal(project.id)}
                                              className="p-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-md transition-colors mr-1 text-sm"
                                              title="Thêm dự án con"
                                          >
                                              <PlusIcon className="w-4 h-4" />
                                          </button>
                                          <button 
                                              onClick={() => openEditModal(project)}
                                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors mr-1 text-sm"
                                              title="Chỉnh sửa"
                                          >
                                              <FileEditIcon className="w-4 h-4" />
                                          </button>
                                          <button 
                                              onClick={() => handleDeleteProject(project.id)}
                                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors text-sm"
                                              title="Xóa"
                                          >
                                              <TrashIcon className="w-4 h-4" />
                                          </button>
                                      </td>
                                  </tr>
                                  {subProjects.filter(sp => sp.parentProjectId === project.id).map(sub => (
                                      <tr key={sub.id} className="border-b border-[--color-border-secondary]/50 bg-[--color-surface-tertiary]/30 hover:bg-[--color-surface-primary]/50 transition-colors">
                                          <td className="p-4 pl-10 text-sm font-medium text-[--color-text-primary] max-w-[200px] truncate italic">
                                              <div className="flex items-center gap-2 mb-1">
                                                  <span className="text-gray-400">└─</span>
                                                  <span className="truncate">{sub.name}</span>
                                              </div>
                                              {sub.department && (
                                                  <span className="ml-[18px] inline-block bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide">
                                                      Phòng {sub.department}
                                                  </span>
                                              )}
                                          </td>
                                          <td className="p-4">
                                               <div className="mb-2">{getStatusBadge(sub.status)}</div>
                                               {sub.status === 'active' && (
                                                   <div className="w-full max-w-[100px]">
                                                       <div className="w-full h-1 bg-[--color-border-secondary]/40 rounded-full overflow-hidden">
                                                           <div 
                                                               className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                                                               style={{ width: `${calculateProjectProgress(sub)}%` }}
                                                           ></div>
                                                       </div>
                                                   </div>
                                               )}
                                          </td>
                                          <td className="p-4">
                                               <div className="flex items-center gap-2">
                                                   <span className="text-xs text-[--color-text-secondary]">
                                                       {sub.dueDate ? new Date(sub.dueDate).toLocaleDateString('vi-VN') : 'Không có'}
                                                   </span>
                                                   {sub.status === 'active' && sub.dueDate && sub.dueDate < new Date().toISOString().split('T')[0] && (
                                                       <AlertCircleIcon className="w-3.5 h-3.5 text-red-500 animate-pulse" title="Đã quá hạn!" />
                                                   )}
                                               </div>
                                          </td>
                                          <td className="p-4 text-xs text-[--color-text-secondary]">
                                               <span className="inline-flex items-center gap-1 bg-[--color-surface-tertiary]/50 px-1.5 py-0.5 rounded border border-[--color-border-secondary]/50">
                                                   <ChecklistIcon className="w-3 h-3" />
                                                   {sub.taskListIds?.length || (sub.taskListId ? 1 : 0)}
                                               </span>
                                          </td>
                                          <td className="p-4 text-right whitespace-nowrap">
                                              {onNavigateToTasks && (
                                                  <>
                                                      {!sub.taskListIds?.length && sub.taskListId && (
                                                          <button 
                                                              onClick={() => onNavigateToTasks(sub.taskListId!)}
                                                              className="p-1 px-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-md transition-colors mr-1 text-xs font-semibold inline-flex items-center gap-1"
                                                              title="Mở danh sách công việc"
                                                          >
                                                              <ChecklistIcon className="w-3.5 h-3.5" />
                                                              <span>Tasklist</span>
                                                          </button>
                                                      )}
                                                      {sub.taskListIds?.map((id) => {
                                                          const matchedList = mockTaskLists.find(l => l.id === id);
                                                          const listName = matchedList ? matchedList.name : `Tasklist ${id}`;
                                                          return (
                                                              <button 
                                                                  key={id}
                                                                  onClick={() => onNavigateToTasks(id)}
                                                                  className="p-1 px-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-md transition-colors mr-1 mb-1 text-xs font-semibold inline-flex items-center gap-1"
                                                                  title={`Mở danh sách ${listName}`}
                                                              >
                                                                  <ChecklistIcon className="w-3 h-3" />
                                                                  <span>{listName}</span>
                                                              </button>
                                                          );
                                                      })}
                                                  </>
                                              )}
                                              <button 
                                                  onClick={() => handleShare('project', sub.id, sub.name)}
                                                  className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors mr-1 text-sm"
                                                  title="Chia sẻ liên kết"
                                              >
                                                  <ShareIcon className="w-3.5 h-3.5" />
                                              </button>
                                              <button 
                                                  onClick={() => openEditModal(sub)}
                                                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors mr-1 text-sm"
                                              >
                                                  <FileEditIcon className="w-3.5 h-3.5" />
                                              </button>
                                              <button 
                                                  onClick={() => handleDeleteProject(sub.id)}
                                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors text-sm"
                                              >
                                                  <TrashIcon className="w-3.5 h-3.5" />
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </React.Fragment>
                          ));
                      })()}
                  </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 p-6 flex flex-col gap-6 bg-[--color-surface-secondary]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[--color-border-secondary]/60 pb-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <h4 className="text-base font-bold text-[--color-text-primary] flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[--color-accent-600]">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>Lược đồ Thời gian & Tiến độ Dự án (Gantt Chart)</span>
                  </h4>
                  <p className="text-xs text-[--color-text-secondary]">
                    Phân tích hiển thị khoảng thời gian thực tế (Ngày bắt đầu - Hạn chót) kết hợp với tiến độ hoàn thành dựa trên danh sách công việc liên quan.
                  </p>
                </div>
                
                {/* Timeline Sub-view Segmented Toggle */}
                <div className="bg-[--color-surface-tertiary] p-1 rounded-xl flex items-center gap-1 border border-[--color-border-secondary] select-none w-max shadow-inner shrink-0">
                  <button
                    type="button"
                    onClick={() => setTimelineSubView('interactive')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                      timelineSubView === 'interactive'
                        ? 'bg-[--color-accent-600] text-white shadow-md'
                        : 'text-[--color-text-secondary] hover:text-[--color-text-primary]'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                      <line x1="9" y1="3" x2="9" y2="21" />
                      <line x1="15" y1="3" x2="15" y2="21" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="3" y1="15" x2="21" y2="15" />
                    </svg>
                    <span>Lược đồ tương tác</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimelineSubView('chart')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                      timelineSubView === 'chart'
                        ? 'bg-[--color-accent-600] text-white shadow-md'
                        : 'text-[--color-text-secondary] hover:text-[--color-text-primary]'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    <span>Biểu đồ phân bổ</span>
                  </button>
                </div>
              </div>

              {timelineSubView === 'interactive' ? (
                (() => {
                  const timelineData = getTimelineData();
                  if (timelineData.length === 0) {
                    return (
                      <div className="py-16 text-center text-sm text-[--color-text-subtle] bg-[--color-surface-primary] border border-[--color-border-secondary] rounded-2xl">
                        Không có dữ liệu dự án nào phù hợp với bộ lọc hiện tại. Hãy tạo một dự án mới!
                      </div>
                    );
                  }

                  const maxEndDays = Math.max(...timelineData.map(d => d.endDays));
                  const totalDays = Math.max(15, maxEndDays + 3);
                  const baseDate = getTimelineBaseDate();

                  return (
                    <div className="flex flex-col border border-[--color-border-secondary]/80 rounded-2xl overflow-hidden bg-[--color-surface-primary] shadow-lg">
                      <div className="flex overflow-x-auto select-none scrollbar-thin" style={{ minHeight: '380px' }}>
                        
                        {/* Sticky Left Sidebar for project names */}
                        <div className="w-[200px] md:w-[260px] shrink-0 border-r border-[--color-border-secondary] bg-[--color-surface-tertiary]/80 sticky left-0 z-30 shadow-[4px_0_12px_rgba(0,0,0,0.04)]">
                          <div className="h-14 border-b border-[--color-border-secondary] flex items-center px-4 font-bold text-xs uppercase tracking-wider text-[--color-text-secondary] bg-[--color-surface-tertiary]/90">
                            Dự án & Phòng ban phụ trách
                          </div>
                          
                          <div className="divide-y divide-[--color-border-secondary]/45">
                            {timelineData.map((project) => (
                              <div 
                                key={project.id} 
                                className="h-16 flex flex-col justify-center px-4 hover:bg-[--color-surface-primary] transition-colors gap-1 border-b border-[--color-border-secondary]/30"
                              >
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: project.color }} />
                                  <span className="font-bold text-xs text-[--color-text-primary] truncate block max-w-[155px] md:max-w-[210px]" title={project.name}>
                                    {project.name}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-[--color-text-secondary]">
                                  <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                    {project.department}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {project.taskListIds?.map((tId: string) => (
                                      <button 
                                        key={tId}
                                        type="button"
                                        onClick={() => onNavigateToTasks && onNavigateToTasks(tId)}
                                        className="text-indigo-600 hover:scale-110 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold transition-all"
                                        title="Chuyển tới danh sách công việc"
                                      >
                                        <ChecklistIcon className="w-3.5 h-3.5" />
                                      </button>
                                    ))}
                                    <span className="font-bold text-[--color-text-primary] ml-1 bg-offset dark:bg-slate-800 px-1 rounded">{project.progress}%</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Timeline Canvas Portion */}
                        <div className="flex-1 relative flex flex-col" style={{ minWidth: `${totalDays * 44}px` }}>
                          
                          {/* Days / Header Columns */}
                          <div className="h-14 border-b border-[--color-border-secondary] flex bg-[--color-surface-tertiary]/40 sticky top-0 z-20">
                            {Array.from({ length: totalDays }).map((_, i) => {
                              const d = new Date(baseDate);
                              d.setDate(d.getDate() + i);
                              const isToday = d.toDateString() === new Date().toDateString();
                              const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                              return (
                                <div 
                                  key={i} 
                                  className={`w-11 shrink-0 flex flex-col items-center justify-center border-r border-[--color-border-secondary]/40 text-center py-2 select-none ${
                                    isWeekend ? 'bg-black/5 dark:bg-white/5' : ''
                                  } ${isToday ? 'bg-[--color-accent-500]/10 text-[--color-accent-600] font-bold border-r-[--color-accent-300]' : ''}`}
                                >
                                  <span className="text-[9px] uppercase font-bold tracking-tight text-[--color-text-subtle]">
                                    {d.toLocaleDateString('vi', { weekday: 'short' })}
                                  </span>
                                  <span className={`text-[11px] font-bold mt-0.5 ${isToday ? 'bg-[--color-accent-600] text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce-short' : 'text-[--color-text-primary]'}`}>
                                    {d.getDate()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Live Calendar Rows representing Gantt lines */}
                          <div className="relative flex-1 divide-y divide-[--color-border-secondary]/45">
                            {/* Vertical helper background lines */}
                            <div className="absolute inset-y-0 left-0 right-0 pointer-events-none flex">
                              {Array.from({ length: totalDays }).map((_, i) => {
                                const d = new Date(baseDate);
                                d.setDate(d.getDate() + i);
                                const isToday = d.toDateString() === new Date().toDateString();
                                return (
                                  <div 
                                    key={i} 
                                    className={`w-11 shrink-0 border-r border-[--color-border-secondary]/15 h-full ${
                                      isToday ? 'border-r-dashed border-r-[--color-accent-400]/40 bg-[--color-accent-500]/5' : ''
                                    }`}
                                  />
                                );
                              })}
                            </div>

                            {timelineData.map((project) => {
                              const barLeft = project.startDays * 44;
                              const barWidth = Math.max(34, (project.endDays - project.startDays) * 44);

                              return (
                                <div 
                                  key={project.id} 
                                  className="h-16 relative flex items-center border-b border-[--color-border-secondary]/20 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                                >
                                  {/* Gantt Range Pill with overlay progress indicator */}
                                  <div 
                                    className="absolute h-9 rounded-xl shadow-md border hover:scale-[1.01] hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer group/bar"
                                    style={{ 
                                      left: `${barLeft}px`, 
                                      width: `${barWidth}px`,
                                      backgroundColor: `${project.color}18`,
                                      borderColor: project.color,
                                    }}
                                    onClick={() => openEditModal(project as unknown as ProjectData)}
                                    title="Nhấp để chỉnh sửa dự án này"
                                  >
                                    {/* Progress layer inside Gantt bar */}
                                    <div 
                                      className="absolute inset-y-0 left-0 transition-all duration-500 pointer-events-none"
                                      style={{ 
                                        width: `${project.progress}%`, 
                                        backgroundColor: project.color, 
                                        opacity: 0.65,
                                        borderRadius: project.progress >= 98 ? '11px' : '11px 0 0 11px'
                                      }}
                                    />

                                    {/* Text display directly superimposed on the line item bar */}
                                    <div className="absolute inset-0 flex items-center justify-between px-3 text-white select-none z-10 pointer-events-none gap-2">
                                      <span className="text-[10px] font-black bg-slate-900/75 dark:bg-slate-900/90 text-white px-1.5 py-0.5 rounded-md shadow border border-white/10 whitespace-nowrap">
                                        {project.progress}%
                                      </span>
                                      <span className="text-[10.5px] text-slate-800 dark:text-slate-100 font-bold truncate max-w-[140px] drop-shadow-md hidden md:inline">
                                        {project.name}
                                      </span>
                                    </div>

                                    {/* Rich floating hover card */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover/bar:block w-72 bg-slate-900/95 backdrop-blur-md text-slate-100 p-4 rounded-xl border border-slate-700 shadow-2xl z-50 pointer-events-none space-y-2.5 animate-fade-in-up">
                                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                        <p className="font-extrabold text-sm truncate max-w-[190px] text-white">{project.name}</p>
                                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-300 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">
                                          {project.department}
                                        </span>
                                      </div>
                                      <div className="text-xs space-y-1.5 text-slate-200">
                                        <p className="flex justify-between">
                                          <span className="text-slate-400">Thời hạn dự kiến:</span>
                                          <span className="font-semibold text-white">{project.startDateStr} - {project.dueDateStr}</span>
                                        </p>
                                        <p className="flex justify-between border-t border-slate-800/85 pt-1.5">
                                          <span className="text-slate-400">Trạng thái:</span>
                                          <span className="font-bold flex items-center gap-1.5" style={{ color: project.color }}>
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                                            {project.statusLabel}
                                          </span>
                                        </p>
                                        <div className="pt-2">
                                          <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                                            <span>Tiến độ Tasks:</span>
                                            <span>{project.progress}%</span>
                                          </div>
                                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                              className="h-full rounded-full transition-all duration-300" 
                                              style={{ width: `${project.progress}%`, backgroundColor: project.color }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      {project.description && (
                                        <div className="border-t border-slate-800/85 pt-2 text-[10.5px] text-slate-400 italic leading-relaxed whitespace-pre-wrap line-clamp-2">
                                          "{project.description}"
                                        </div>
                                      )}
                                    </div>
                                    
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      </div>

                      {/* Footer hints */}
                      <div className="p-3.5 bg-[--color-surface-tertiary]/40 border-t border-[--color-border-secondary]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span className="text-[--color-text-subtle] italic">
                          💡 Di chuyển chuột hoặc chạm nhẹ vào các thanh tiến trình để xem chi tiết. Nhấp chuột vào thanh để thay đổi thời gian hoặc trạng thái.
                        </span>
                        <div className="flex items-center gap-2">
                          <ChecklistIcon className="w-4 h-4 text-indigo-500 animate-pulse" />
                          <span className="text-[--color-text-secondary] font-semibold">Nhấn vào biểu tượng công việc để truy cập nhanh danh mục Tasklist.</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="w-full bg-[--color-surface-primary] rounded-xl p-4 border border-[--color-border-secondary]">
                  {getTimelineData().length > 0 ? (
                    <div className="w-full overflow-y-auto font-sans" style={{ maxHeight: '500px' }}>
                      <ResponsiveContainer width="100%" height={Math.max(280, getTimelineData().length * 45)}>
                        <BarChart
                          data={getTimelineData()}
                          layout="vertical"
                          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-secondary)" opacity={0.6} />
                          <XAxis 
                            type="number" 
                            domain={[0, 'dataMax + 10']} 
                            tickFormatter={formatXAxis}
                            stroke="var(--color-text-secondary)"
                            fontSize={11}
                            tickLine={false}
                          />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            stroke="var(--color-text-secondary)"
                            fontSize={11}
                            width={140}
                            tickLine={false}
                            tickFormatter={(val) => val.length > 18 ? `${val.substring(0, 16)}...` : val}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-700 shadow-xl max-w-sm">
                                    <p className="font-bold text-sm mb-1.5 text-white">{data.name}</p>
                                    <div className="space-y-1.5 text-xs text-slate-200">
                                      <p className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-300">Phòng ban:</span>{' '}
                                        <span className="bg-slate-700 text-white px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                                          {data.department}
                                        </span>
                                      </p>
                                      <p className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-300">Trạng thái:</span>{' '}
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                          data.status === 'active' ? 'bg-blue-500/30 text-blue-200 animate-pulse' :
                                          data.status === 'completed' ? 'bg-green-500/30 text-green-200' :
                                          'bg-yellow-500/30 text-yellow-200'
                                        }`}>
                                          {data.statusLabel}
                                        </span>
                                      </p>
                                      <p><span className="font-semibold text-slate-300">Bắt đầu:</span> <span className="font-semibold text-white">{data.startDateStr}</span></p>
                                      <p><span className="font-semibold text-slate-300">Hạn chót:</span> <span className="font-semibold text-white">{data.dueDateStr}</span></p>
                                      <p><span className="font-semibold text-slate-300">Tiến độ Tasks:</span> <span className="font-semibold text-white">{data.progress}%</span></p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar 
                            dataKey="duration" 
                            radius={[6, 6, 6, 6]} 
                            barSize={16}
                          >
                            {getTimelineData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-sm text-[--color-text-subtle]">
                      Không có dự án nào khớp với phòng ban này hoặc chưa có dữ liệu để hiển thị.
                    </div>
                  )}
                </div>
              )}

              {/* Legend and stats */}
              <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-[--color-text-secondary] bg-[--color-surface-tertiary]/30 p-3.5 rounded-xl border border-[--color-border-secondary]/40">
                <span className="text-[11px] uppercase tracking-wider text-[--color-text-subtle] font-bold">Chú thích biểu đồ:</span>
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/20 animate-pulse"></span>
                  Đang thực hiện (Active)
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-sm shadow-green-500/20"></span>
                  Đã hoàn thành (Completed)
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/20"></span>
                  Tạm dừng (On Hold)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in-up">
            <div className="bg-[--color-surface-tertiary] border border-[--color-border-secondary] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-[--color-border-secondary] flex justify-between items-center bg-[--color-surface-secondary]">
                    <h3 className="text-xl font-bold text-[--color-text-primary] flex items-center gap-2">
                        <SitemapIcon className="w-6 h-6 text-[--color-accent-500]" />
                        {modalMode === 'add' ? 'Thêm dự án mới' : 'Chỉnh sửa dự án'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-[--color-text-subtle] transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSaveProject} className="p-6 space-y-5 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Tên dự án *</label>
                        <input 
                            required
                            type="text" 
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none transition-shadow"
                            placeholder="Vd: Tái cấu trúc bộ nhận diện thương hiệu"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Dự án cha (Dự án liên kết)</label>
                            <select 
                                value={formParentId}
                                onChange={(e) => setFormParentId(e.target.value)}
                                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none transition-shadow"
                            >
                                <option value="">--- Không có (Dự án chính) ---</option>
                                {projects
                                    .filter(p => !p.parentProjectId && p.id !== editingId)
                                    .map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))
                                }
                            </select>
                        </div>
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Liên kết Tasklist (Công việc - Có thể chọn nhiều * )</label>
                            
                            {/* Dropdown Button */}
                            <button
                                type="button"
                                onClick={() => setTaskListDropdownOpen(!taskListDropdownOpen)}
                                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 flex items-center justify-between focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none transition-shadow text-left"
                            >
                                <span className="truncate text-sm block max-w-[200px]">
                                    {formTaskListIds.length === 0 
                                        ? "--- Chọn danh sách công việc ---" 
                                        : `${formTaskListIds.length} đã chọn: ${
                                            mockTaskLists
                                                .filter(l => formTaskListIds.includes(l.id))
                                                .map(l => l.name)
                                                .join(', ')
                                          }`
                                    }
                                </span>
                                {taskListDropdownOpen ? (
                                    <ChevronUpIcon className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                                ) : (
                                    <ChevronDownIcon className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {taskListDropdownOpen && (
                                <div className="absolute left-0 right-0 mt-1.5 bg-[--color-surface-tertiary] border border-[--color-border-secondary] rounded-xl shadow-xl z-50 flex flex-col max-h-64 overflow-hidden animate-fade-in-up">
                                    {/* Search input bar */}
                                    <div className="p-2 border-b border-[--color-border-secondary] flex items-center gap-2 bg-[--color-surface-secondary]">
                                        <SearchIcon className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
                                        <input
                                            type="text"
                                            value={taskListSearchTerm}
                                            onChange={(e) => setTaskListSearchTerm(e.target.value)}
                                            placeholder="Tìm kiếm danh sách công việc..."
                                            className="w-full bg-transparent text-sm text-[--color-text-primary] placeholder-slate-400 focus:outline-none"
                                            onClick={(e) => e.stopPropagation()} // Keep dropdown open when clicking inside search input
                                        />
                                        {taskListSearchTerm && (
                                            <button 
                                                type="button" 
                                                onClick={(e) => { e.stopPropagation(); setTaskListSearchTerm(''); }}
                                                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded text-[--color-text-subtle] text-xs font-semibold"
                                            >
                                                Xóa
                                            </button>
                                        )}
                                    </div>

                                    {/* Selected helper bar */}
                                    <div className="px-3 py-1.5 flex justify-between items-center text-xs text-[--color-text-subtle] bg-[--color-surface-primary] border-b border-[--color-border-secondary]">
                                        <span>Tìm thấy {mockTaskLists.filter(list => list.name.toLowerCase().includes(taskListSearchTerm.toLowerCase())).length} danh mục</span>
                                        {formTaskListIds.length > 0 && (
                                            <button 
                                                type="button" 
                                                onClick={(e) => { e.stopPropagation(); setFormTaskListIds([]); }}
                                                className="text-[--color-accent-600] font-semibold hover:underline"
                                            >
                                                Bỏ chọn tất cả
                                            </button>
                                        )}
                                    </div>

                                    {/* Dropdown Checklist Items */}
                                    <div className="overflow-y-auto p-2 space-y-1">
                                        {(() => {
                                            const filteredList = mockTaskLists.filter(list => 
                                                list.name.toLowerCase().includes(taskListSearchTerm.toLowerCase())
                                            );

                                            if (filteredList.length === 0) {
                                                return (
                                                    <div className="p-4 text-center text-xs text-slate-400">
                                                        Không tìm thấy danh sách công việc nào trùng khớp
                                                    </div>
                                                );
                                            }

                                            return filteredList.map((list) => {
                                                const isChecked = formTaskListIds.includes(list.id);
                                                return (
                                                    <label 
                                                        key={list.id} 
                                                        className="flex items-center gap-2 px-2.5 py-2 hover:bg-[--color-surface-secondary] rounded-lg cursor-pointer text-sm font-medium text-[--color-text-primary] transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isChecked) {
                                                                setFormTaskListIds(formTaskListIds.filter(id => id !== list.id));
                                                            } else {
                                                                setFormTaskListIds([...formTaskListIds, list.id]);
                                                            }
                                                        }}
                                                    >
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isChecked}
                                                            onChange={() => {}} // Swallowed by label onClick action
                                                            className="rounded border-[--color-border-secondary] text-[--color-accent-600] focus:ring-[--color-accent-500] w-4 h-4 cursor-pointer"
                                                        />
                                                        <span className="truncate">{list.name}</span>
                                                    </label>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Phòng ban phụ trách</label>
                            <select 
                                value={formDepartment}
                                onChange={(e) => setFormDepartment(e.target.value as 'IT' | 'Marketing' | 'HR' | '')}
                                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none transition-shadow"
                            >
                                <option value="">--- Chưa phân loại ---</option>
                                <option value="IT">IT (CNTT)</option>
                                <option value="Marketing">Marketing</option>
                                <option value="HR">HR (Nhân sự)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Trạng thái</label>
                            <select 
                                value={formStatus}
                                onChange={(e) => setFormStatus(e.target.value as 'active' | 'completed' | 'on_hold')}
                                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none transition-shadow"
                            >
                                <option value="active">Đang thực hiện (Active)</option>
                                <option value="on_hold">Tạm dừng (On hold)</option>
                                <option value="completed">Đã hoàn thành (Completed)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Ngày bắt đầu (Tự động hoặc tùy chọn)</label>
                            <input 
                                type="date" 
                                value={formStartDate}
                                onChange={(e) => setFormStartDate(e.target.value)}
                                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none transition-shadow"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[--color-[#1e293b]] dark:text-[--color-text-secondary] mb-1.5 font-bold">Ngày kết thúc / Hạn chót (Tuỳ chọn)</label>
                            <input 
                                type="date" 
                                value={formDueDate}
                                onChange={(e) => setFormDueDate(e.target.value)}
                                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none transition-shadow"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Mô tả dự án</label>
                        <textarea 
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            rows={5}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none resize-none transition-shadow"
                            placeholder="Nhập mô tả..."
                        />
                    </div>
                    <div className="pt-4 flex gap-3 justify-end border-t border-[--color-border-secondary] mt-6">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-2.5 rounded-xl border border-[--color-border-secondary] text-[--color-text-primary] font-semibold hover:bg-[--color-surface-secondary] transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-[--color-accent-600] text-white font-semibold shadow-lg hover:shadow-[--color-accent-500/20] transition-all active:scale-[0.98]"
                        >
                            Lưu dự án
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[9999] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in-up">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ProjectManagementView;
