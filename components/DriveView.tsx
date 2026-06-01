import React, { useState, useMemo } from 'react';
import { User, RecentItem } from '../App';
import DriveBanner from './DriveBanner';
import { 
    FolderIcon, UploadIcon, GridIcon, ListIcon, ChevronLeftIcon, 
    FileTextIcon, FileImageIcon, FileVideoIcon, FilePdfIcon, ShareIcon, DownloadIcon, TrashIcon, InfoIcon,
    GoogleIcon, SyncIcon
} from './icons';
import { useLanguage } from './LanguageContext';
import { showPicker } from '../googlePicker';
import { getAccessToken } from '../googleTasks';

// --- TYPES ---
interface FileSystemItem {
  id: string;
  name: string;
  type: 'folder' | 'pdf' | 'docx' | 'png' | 'mp4';
  size: string;
  modifiedAt: string;
  owner: string;
  parentId: string | null;
  source?: 'google';
}

// --- MOCK DATA ---
export const initialFileSystem: FileSystemItem[] = [
  { id: 'root', name: 'My Drive', type: 'folder', size: '-', modifiedAt: '2023-10-26', owner: 'Me', parentId: null },
  { id: '1', name: 'Phòng ban', type: 'folder', size: '3.1 GB', modifiedAt: '2023-10-25', owner: 'Me', parentId: 'root' },
  { id: '2', name: 'Dự án', type: 'folder', size: '10.5 GB', modifiedAt: '2023-10-26', owner: 'Me', parentId: 'root' },
  { id: '3', name: 'Cá nhân', type: 'folder', size: '512 MB', modifiedAt: '2023-10-20', owner: 'Me', parentId: 'root' },
  { id: '1-1', name: 'Kinh doanh', type: 'folder', size: '1.5 GB', modifiedAt: '2023-10-24', owner: 'Me', parentId: '1' },
  { id: '1-2', name: 'Nhân sự', type: 'folder', size: '800 MB', modifiedAt: '2023-10-23', owner: 'Me', parentId: '1' },
  { id: '2-1', name: 'Dự án POW', type: 'folder', size: '4.2 GB', modifiedAt: '2023-10-26', owner: 'Me', parentId: '2' },
  { id: '2-1-1', name: 'Báo cáo tiến độ.pdf', type: 'pdf', size: '2.3 MB', modifiedAt: '2023-10-26', owner: 'Alice', parentId: '2-1' },
  { id: '2-1-2', name: 'Wireframes.png', type: 'png', size: '5.1 MB', modifiedAt: '2023-10-25', owner: 'Me', parentId: '2-1' },
  { id: '2-1-3', name: 'Video Demo.mp4', type: 'mp4', size: '120 MB', modifiedAt: '2023-10-24', owner: 'Bob', parentId: '2-1' },
  { id: 'root-1', name: 'Quy chế công ty.docx', type: 'docx', size: '780 KB', modifiedAt: '2023-09-15', owner: 'HR Dept', parentId: 'root' },
];

const mockGoogleDriveFiles: FileSystemItem[] = [
  { id: 'g-drive-1', name: 'Sales Report Q3.pdf', type: 'pdf', size: '1.2 MB', modifiedAt: '2023-10-27', owner: 'Google Drive', parentId: '1-1', source: 'google' },
  { id: 'g-drive-2', name: 'Competitor Analysis.docx', type: 'docx', size: '340 KB', modifiedAt: '2023-10-26', owner: 'Google Drive', parentId: '1-1', source: 'google' },
];

// --- HELPER COMPONENTS ---
const FileIcon: React.FC<{ type: string, className?: string }> = ({ type, className = "w-6 h-6" }) => {
    switch (type) {
        case 'folder': return <FolderIcon className={className} />;
        case 'pdf': return <FilePdfIcon className={className} />;
        case 'png':
        case 'jpg': return <FileImageIcon className={className} />;
        case 'mp4': return <FileVideoIcon className={className} />;
        default: return <FileTextIcon className={className} />;
    }
};

const FolderTreeItem: React.FC<{ folder: FileSystemItem, currentFolderId: string, onSelect: (id: string) => void, level?: number }> = ({ folder, currentFolderId, onSelect, level = 0 }) => {
    const isSelected = folder.id === currentFolderId;
    return (
        <div>
            <button
                onClick={() => onSelect(folder.id)}
                style={{ paddingLeft: `${level * 1.25 + 0.75}rem` }}
                className={`w-full flex items-center gap-2 py-2 text-left rounded-md transition-colors ${isSelected ? 'bg-white/70 text-[--color-accent-600] font-semibold' : 'hover:bg-white/40 text-[--color-text-primary]'}`}
            >
                <FolderIcon className="w-5 h-5 shrink-0" />
                <span className="truncate text-sm">{folder.name}</span>
            </button>
            {/* Can be extended to show sub-folders recursively */}
        </div>
    );
};


// --- MAIN VIEW COMPONENT ---
interface DriveViewProps {
  user: User;
  onItemViewed: (item: RecentItem) => void;
}

const DriveView: React.FC<DriveViewProps> = ({ user, onItemViewed }) => {
    const [mockFileSystem, setMockFileSystem] = useState<FileSystemItem[]>(initialFileSystem);
    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isFolderPaneCollapsed, setFolderPaneCollapsed] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const { t } = useLanguage();

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage('');
        }, 2500);
    };

    const handleShare = (item: FileSystemItem) => {
        const shareUrl = `${window.location.protocol}//${window.location.host}/?shareType=drive&shareId=${item.id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast(`Đã sao chép liên kết chia sẻ của "${item.name}"!`);
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = shareUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast(`Đã sao chép liên kết chia sẻ của "${item.name}"!`);
        });
    };

    const itemsInCurrentFolder = useMemo(() => mockFileSystem.filter(item => item.parentId === currentFolderId), [mockFileSystem, currentFolderId]);
    const selectedItem = useMemo(() => mockFileSystem.find(item => item.id === selectedItemId), [mockFileSystem, selectedItemId]);

    const breadcrumbs = useMemo(() => {
        const path = [];
        let currentId: string | null = currentFolderId;
        while (currentId) {
            const currentItem = mockFileSystem.find(item => item.id === currentId);
            if (currentItem) {
                path.unshift(currentItem);
                currentId = currentItem.parentId;
            } else {
                break;
            }
        }
        return path;
    }, [mockFileSystem, currentFolderId]);

    const handleSelectFolder = (id: string) => {
        setCurrentFolderId(id);
        setSelectedItemId(null); // Deselect file when changing folder
    }

    const handleItemClick = (item: FileSystemItem) => {
        onItemViewed({
            id: `drive-${item.id}`,
            name: item.name,
            type: 'drive',
            icon: <FileIcon type={item.type} />,
            itemId: item.id
        });

        if (item.type === 'folder') {
            setCurrentFolderId(item.id);
            setSelectedItemId(null);
        } else {
            setSelectedItemId(item.id);
        }
    }

    const handleSync = async () => {
        setIsSyncing(true);
        showToast(t('syncing'));
        await new Promise(resolve => setTimeout(resolve, 1500));
        let updatedCount = 0;
        setMockFileSystem(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const newFiles = mockGoogleDriveFiles.filter(file => !existingIds.has(file.id));
            if (newFiles.length === 0) {
                return prev;
            }
            updatedCount = newFiles.length;
            return [...prev, ...newFiles];
        });
        setIsSyncing(false);
        if (updatedCount > 0) {
            showToast(t('syncSuccess'));
        } else {
            showToast('Dữ liệu đã được cập nhật đồng bộ trước đó.');
        }
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFiles: FileSystemItem[] = Array.from(files).map((file: File, index) => {
            let type: FileSystemItem['type'] = 'docx';
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (ext === 'pdf') type = 'pdf';
            else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') type = 'png';
            else if (ext === 'mp4' || ext === 'mov') type = 'mp4';

            const size = file.size > 1024 * 1024 
                ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
                : (file.size / 1024).toFixed(0) + ' KB';

            return {
                id: `uploaded-${Date.now()}-${index}`,
                name: file.name,
                type,
                size,
                modifiedAt: new Date().toISOString().split('T')[0],
                owner: user.name,
                parentId: currentFolderId,
            };
        });

        setMockFileSystem(prev => [...prev, ...newFiles]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleGooglePicker = async () => {
        try {
            const token = await getAccessToken();
            showPicker(token, (result) => {
                if (result.action === 'picked' && result.docs) {
                    const newFiles: FileSystemItem[] = result.docs.map(doc => {
                        let type: FileSystemItem['type'] = 'docx';
                        if (doc.mimeType.includes('pdf')) type = 'pdf';
                        else if (doc.mimeType.includes('image')) type = 'png';
                        else if (doc.mimeType.includes('video')) type = 'mp4';

                        return {
                            id: doc.id,
                            name: doc.name,
                            type,
                            size: '-',
                            modifiedAt: new Date(doc.lastEditedUtc).toISOString().split('T')[0],
                            owner: 'Google Drive',
                            parentId: currentFolderId,
                            source: 'google'
                        };
                    });
                    setMockFileSystem(prev => {
                        const existingIds = new Set(prev.map(i => i.id));
                        const filtered = newFiles.filter(f => !existingIds.has(f.id));
                        return [...prev, ...filtered];
                    });
                    showToast(`Đã thêm ${newFiles.length} tệp từ Google Drive!`);
                }
            });
        } catch (error) {
            console.error('Picker error:', error);
            showToast('Không thể mở Google Picker. Kiểm tra cấu hình API Key.');
        }
    };

    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] pb-24 md:pb-8">
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
                <DriveBanner />
                <div className="flex-1 bg-white/40 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden flex min-h-0">
                    
                    {/* Folder Tree Pane */}
                    <div className="relative shrink-0">
                        <aside className={`flex flex-col bg-white/30 border-r border-white/50 h-full transition-all duration-300 ease-in-out ${isFolderPaneCollapsed ? 'w-0' : 'w-64'}`}>
                        <div className={`flex-1 flex flex-col min-h-0 transition-opacity duration-200 ${isFolderPaneCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                                <div className="p-4 border-b border-white/50">
                                    <h2 className="text-lg font-bold text-[--color-text-primary] truncate">My Drive</h2>
                                </div>
                                <div className="flex-1 p-2 overflow-y-auto no-scrollbar">
                                    {mockFileSystem.filter(f => f.type === 'folder' && f.parentId === 'root').map(folder => (
                                        <FolderTreeItem key={folder.id} folder={folder} currentFolderId={currentFolderId} onSelect={handleSelectFolder} />
                                    ))}
                                </div>
                        </div>
                        </aside>
                        <button
                            onClick={() => setFolderPaneCollapsed(!isFolderPaneCollapsed)}
                            className="absolute top-1/2 -right-3 -translate-y-1/2 bg-white/60 hover:bg-cyan-500 text-slate-700 hover:text-white w-6 h-6 rounded-full flex items-center justify-center z-10 ring-4 ring-gray-100/50 transition-all"
                            aria-label={isFolderPaneCollapsed ? 'Expand folder pane' : 'Collapse folder pane'}
                        >
                            <ChevronLeftIcon className={`w-4 h-4 transition-transform duration-300 ${isFolderPaneCollapsed ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                    
                    {/* Main Content Pane */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <header className="p-4 border-b border-white/50 shrink-0 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm text-[--color-text-secondary] font-medium overflow-hidden">
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb.id}>
                                    {index > 0 && <span className="text-[--color-text-subtle]">/</span>}
                                    <button onClick={() => handleSelectFolder(crumb.id)} className={`truncate max-w-[150px] p-1 rounded-md ${index === breadcrumbs.length-1 ? 'text-[--color-text-primary] font-bold' : 'hover:bg-white/50'}`}>{crumb.name}</button>
                                </React.Fragment>
                            ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleSync} disabled={isSyncing} title={isSyncing ? t('syncing') : t('syncWithDrive')} className="p-2.5 rounded-lg bg-white/70 text-blue-700 shadow-md hover:bg-white transition-all transform hover:scale-105 disabled:opacity-60">
                                    <SyncIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload} 
                                    className="hidden" 
                                    multiple
                                />
                                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 py-2 px-4 bg-gradient-to-br from-blue-500 to-sky-600 text-white font-bold rounded-lg shadow-md hover:shadow-sky-500/40 transition-all transform hover:scale-105">
                                    <UploadIcon className="w-5 h-5"/> <span className="hidden sm:inline">Tải lên</span>
                                </button>
                                <button onClick={handleGooglePicker} className="flex items-center gap-2 py-2 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg shadow-md hover:bg-slate-50 transition-all transform hover:scale-105">
                                    <GoogleIcon className="w-5 h-5"/> <span className="hidden sm:inline">Chọn từ Drive</span>
                                </button>
                                <div className="bg-white/50 p-1 rounded-lg flex items-center text-sm font-semibold">
                                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:bg-white/50'}`} title="Grid View"><GridIcon className="w-5 h-5" /></button>
                                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:bg-white/50'}`} title="List View"><ListIcon className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </header>
                        <div className="flex-1 overflow-y-auto no-scrollbar px-3 md:px-4 py-4 pb-24">
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                    {itemsInCurrentFolder.map(item => (
                                        <button key={item.id} onClick={() => handleItemClick(item)} className={`relative p-4 bg-white/60 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group text-center flex flex-col items-center justify-center gap-2 ${selectedItemId === item.id ? 'ring-2 ring-[--color-accent-500]' : 'ring-1 ring-transparent hover:ring-[--color-accent-400]'}`}>
                                            {item.source === 'google' && <GoogleIcon className="absolute top-2 right-2 w-4 h-4" title="From Google Drive" />}
                                            <FileIcon type={item.type} className={`w-12 h-12 ${item.type === 'folder' ? 'text-[--color-accent-500]' : 'text-[--color-text-subtle]'}`} />
                                            <p className="font-semibold text-[--color-text-primary] text-sm w-full truncate">{item.name}</p>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                            <thead className="border-b border-[--color-border-secondary]">
                                        <tr>
                                            <th className="p-3 font-semibold text-[--color-text-secondary] text-sm">Name</th>
                                            <th className="p-3 font-semibold text-[--color-text-secondary] text-sm hidden md:table-cell">Owner</th>
                                            <th className="p-3 font-semibold text-[--color-text-secondary] text-sm hidden sm:table-cell">Last Modified</th>
                                            <th className="p-3 font-semibold text-[--color-text-secondary] text-sm hidden lg:table-cell">File Size</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsInCurrentFolder.map(item => (
                                            <tr key={item.id} onClick={() => handleItemClick(item)} className={`border-t border-[--color-border-secondary] hover:bg-white/50 cursor-pointer ${selectedItemId === item.id ? 'bg-[--color-accent-500]/10' : ''}`}>
                                                <td className="p-3 font-medium text-[--color-text-primary] text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <FileIcon type={item.type} className={`w-6 h-6 shrink-0 ${item.type === 'folder' ? 'text-[--color-accent-500]' : 'text-[--color-text-subtle]'}`} />
                                                        {item.name}
                                                        {item.source === 'google' && <GoogleIcon className="w-4 h-4" title="From Google Drive" />}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-[--color-text-secondary] text-sm hidden md:table-cell">{item.owner}</td>
                                                <td className="p-3 text-[--color-text-secondary] text-sm hidden sm:table-cell">{item.modifiedAt}</td>
                                                <td className="p-3 text-[--color-text-secondary] text-sm hidden lg:table-cell">{item.size}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Details Pane */}
                    <div className={`flex flex-col border-l border-white/50 bg-white/30 transition-all duration-300 ease-in-out ${selectedItem ? 'w-72' : 'w-0'}`}>
                    <div className={`flex-1 flex flex-col min-h-0 p-4 gap-4 transition-opacity duration-200 ${selectedItem ? 'opacity-100' : 'opacity-0'}`}>
                            {selectedItem && <>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-[--color-text-primary]">Details</h3>
                                    <button onClick={() => setSelectedItemId(null)} className="p-1.5 rounded-full hover:bg-black/10"><ChevronLeftIcon className="w-5 h-5 rotate-180 text-[--color-text-subtle]" /></button>
                                </div>
                                <div className="flex flex-col items-center justify-center p-6 bg-white/40 rounded-xl">
                                    <FileIcon type={selectedItem.type} className="w-20 h-20 text-[--color-text-subtle] mb-3" />
                                    <p className="font-bold text-[--color-text-primary] text-center break-all text-sm">{selectedItem.name}</p>
                                </div>
                                <div className="flex justify-around items-center">
                                    <button 
                                        onClick={() => handleShare(selectedItem)}
                                        className="flex flex-col items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-2 rounded-lg hover:bg-black/5"
                                        title="Chia sẻ liên kết"
                                    >
                                        <ShareIcon className="w-6 h-6" /> 
                                        <span className="text-xs font-semibold">Share</span>
                                    </button>
                                    <button className="flex flex-col items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-black/5"><DownloadIcon className="w-6 h-6" /> <span className="text-xs font-semibold">Download</span></button>
                                    <button className="flex flex-col items-center gap-1 text-slate-600 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-black/5"><TrashIcon className="w-6 h-6" /> <span className="text-xs font-semibold">Delete</span></button>
                                </div>
                                <div className="text-sm text-[--color-text-primary] space-y-2 bg-white/40 p-3 rounded-lg">
                                    <p><strong>Type:</strong> <span className="capitalize">{selectedItem.type}</span></p>
                                    <p><strong>Size:</strong> {selectedItem.size}</p>
                                    <p><strong>Owner:</strong> {selectedItem.owner}</p>
                                    <p><strong>Modified:</strong> {selectedItem.modifiedAt}</p>
                                    {selectedItem.source === 'google' && <p><strong>Source:</strong> Google Drive</p>}
                                </div>
                                <div className="mt-2">
                                    <h4 className="font-semibold text-[--color-text-secondary] mb-2 text-sm">Activity</h4>
                                    <div className="space-y-2 text-xs text-[--color-text-secondary]">
                                        <div className="flex items-center gap-2"><InfoIcon className="w-4 h-4 text-[--color-text-subtle]" /> <p>You created this item.</p></div>
                                        <div className="flex items-center gap-2"><InfoIcon className="w-4 h-4 text-[--color-text-subtle]" /> <p>Alice viewed this item.</p></div>
                                    </div>
                                </div>
                            </>}
                    </div>
                    </div>
                </div>
            </div>
            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-[9999] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in-up">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-sm font-medium">{toastMessage}</span>
                </div>
            )}
        </main>
    );
};

export default DriveView;