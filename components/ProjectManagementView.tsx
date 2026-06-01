import React, { useState, useEffect, useRef } from 'react';
import { User } from '../App';
import { useLanguage } from './LanguageContext';
import { SitemapIcon, PlusIcon, FileEditIcon, TrashIcon, XIcon, ChecklistIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon, ShareIcon, AlertCircleIcon, FilePdfIcon } from './icons';
import { db, auth } from '../firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase-errors';
import { mockTaskLists } from './TasklistView';
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
  const [formDueDate, setFormDueDate] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formTaskListIds, setFormTaskListIds] = useState<string[]>([]);
  const [formDepartment, setFormDepartment] = useState<'IT' | 'Marketing' | 'HR' | ''>('');

  // Filtering department state
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // View mode state for toggle: table list vs interactive timeline gantt
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

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

  const formatXAxis = (tickItem: number) => {
    const baseDate = new Date('2026-05-25');
    baseDate.setDate(baseDate.getDate() + Math.round(tickItem));
    return baseDate.toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' });
  };

  const getTimelineData = () => {
    let filtered = projects;
    if (selectedDepartment !== 'all') {
      filtered = projects.filter(p => selectedDepartment === 'None' ? !p.department : p.department === selectedDepartment);
    }

    const baseDate = new Date('2026-05-25');
    
    return filtered.map(p => {
      let endDays = 15;
      if (p.dueDate) {
        const d = new Date(p.dueDate);
        if (!isNaN(d.getTime())) {
          const diff = d.getTime() - baseDate.getTime();
          endDays = Math.max(1, Math.round(diff / (1000 * 3600 * 24)));
        }
      }
      const startDays = endDays > 12 ? endDays - 12 : 0;
      
      let color = '#3B82F6';
      if (p.status === 'completed') color = '#10B981';
      if (p.status === 'on_hold') color = '#F59E0B';

      return {
        id: p.id,
        name: p.name,
        status: p.status,
        statusLabel: p.status === 'active' ? 'Đang thực hiện' : p.status === 'completed' ? 'Đã hoàn thành' : 'Tạm dừng',
        department: p.department || 'Chưa phân loại',
        dueDateStr: p.dueDate ? new Date(p.dueDate).toLocaleDateString('vi-VN') : 'Không có',
        duration: [startDays, endDays],
        startDays,
        endDays,
        color,
      };
    }).sort((a, b) => a.endDays - b.endDays);
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-[3px] pb-24 md:pb-8 flex flex-col gap-3">
      <div className="shrink-0">
        <ProjectBanner />
      </div>

      {/* Pie Chart and Project Status Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[--color-surface-secondary] rounded-2xl p-6 border border-[--color-border-secondary] shadow-lg shrink-0">
          <div className="lg:col-span-1 flex flex-col justify-between">
              <div>
                  <h3 className="text-lg font-bold text-[--color-text-primary] mb-2">Thống kê trạng thái dự án</h3>
                  <p className="text-sm text-[--color-text-secondary] mb-6">Biểu đồ cơ cấu tỷ lệ dự án theo trạng thái thực tế: Đang tiến hành, Đã hoàn thành hoặc Tạm dừng.</p>
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
            <div className="flex-1 p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h4 className="text-base font-bold text-[--color-text-primary]">
                  Biểu đồ Gantt phụ trách theo Phòng ban
                </h4>
                <p className="text-xs text-[--color-text-secondary]">
                  Biểu đồ hiển thị tiến trình, khoảng thời gian thực tế ước lượng và thời hạn cuối (due dates) của các dự án phù hợp với bộ lọc hiện tại.
                </p>
              </div>

              {/* Gantt / Recharts component wrapper */}
              <div className="w-full bg-[--color-surface-primary] rounded-xl p-4 border border-[--color-border-secondary]">
                {getTimelineData().length > 0 ? (
                  <div className="w-full overflow-y-auto" style={{ maxHeight: '500px' }}>
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
                                    <p><span className="font-semibold text-slate-300">Hạn chót:</span> <span className="font-semibold text-white">{data.dueDateStr}</span></p>
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

              {/* Legend and stats */}
              <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-[--color-text-secondary] bg-[--color-surface-tertiary]/30 p-3.5 rounded-xl border border-[--color-border-secondary]/40">
                <span className="text-[11px] uppercase tracking-wider text-[--color-text-subtle] font-bold">Chú thích biểu đồ:</span>
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/20"></span>
                  Đang thực hiện
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-sm shadow-green-500/20"></span>
                  Đã hoàn thành
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/20"></span>
                  Tạm dừng
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                        <div>
                            <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Ngày hết hạn (Tuỳ chọn)</label>
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
