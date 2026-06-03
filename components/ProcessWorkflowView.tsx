import React, { useState, useRef } from 'react';
import { User, View } from '../App';
import { XIcon, WorkflowIcon, UserIcon, ClockIcon, ChecklistIcon, LightningIcon, CheckIcon } from './icons';
import Xarrow, { Xwrapper } from 'react-xarrows';

interface ProcessNode {
  id: string;
  type: 'step' | 'action';
  name: string;
  description: string;
  linkedToNodeId: string;
  x: number;
  y: number;
  assignee: string;
  duration: string;
  tasks: string[];
}

interface ProcessWorkflowViewProps {
  user: User;
  onNavigate?: (view: View, section?: string) => void;
}

const ProcessWorkflowView: React.FC<ProcessWorkflowViewProps> = ({ user }) => {
  const [nodes, setNodes] = useState<ProcessNode[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processName, setProcessName] = useState('Quy trình mới');
  const [isSaved, setIsSaved] = useState(false);
  
  // Form State
  const [newNodeType, setNewNodeType] = useState<'step' | 'action'>('step');
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeDesc, setNewNodeDesc] = useState('');
  const [newNodeLink, setNewNodeLink] = useState('');
  const [newNodeAssignee, setNewNodeAssignee] = useState('');
  const [newNodeDuration, setNewNodeDuration] = useState('');
  const [newNodeTasks, setNewNodeTasks] = useState<string[]>(['']);

  // Drag State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;

    // Calculate a simple default position based on existing nodes
    let newX = 50;
    let newY = 50;
    
    if (newNodeLink) {
        const linkedNode = nodes.find(n => n.id === newNodeLink);
        if (linkedNode) {
            newX = linkedNode.x;
            newY = linkedNode.y + 150; // Position below linked node
        }
    } else if (nodes.length > 0) {
        newX = nodes[nodes.length - 1].x + 250;
        newY = nodes[nodes.length - 1].y;
    }

    const newNode: ProcessNode = {
      id: `node-${Date.now()}`,
      type: newNodeType,
      name: newNodeName,
      description: newNodeDesc,
      linkedToNodeId: newNodeLink,
      x: newX,
      y: newY,
      assignee: newNodeAssignee,
      duration: newNodeDuration,
      tasks: newNodeTasks.filter(t => t.trim() !== ''),
    };

    setNodes([...nodes, newNode]);
    setShowCreateModal(false);
    setNewNodeType('step');
    setNewNodeName('');
    setNewNodeDesc('');
    setNewNodeLink('');
    setNewNodeAssignee('');
    setNewNodeDuration('');
    setNewNodeTasks(['']);
  };

  const handleTaskChange = (index: number, value: string) => {
      const updatedTasks = [...newNodeTasks];
      updatedTasks[index] = value;
      setNewNodeTasks(updatedTasks);
  };
  const addTaskField = () => setNewNodeTasks([...newNodeTasks, '']);
  const removeTaskField = (index: number) => {
      setNewNodeTasks(newNodeTasks.filter((_, i) => i !== index));
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    // Only drag if not clicking a button
    if ((e.target as HTMLElement).closest('button')) return;
    
    e.stopPropagation();
    setDraggingNodeId(id);
  };

  const handleDeleteNode = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setNodes(nodes.filter(n => n.id !== id).map(n => n.linkedToNodeId === id ? { ...n, linkedToNodeId: '' } : n));
  }

  const handleSaveProcess = () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - containerRect.left - 120; // 120 is roughly half the node width
      const y = e.clientY - containerRect.top - 50;   // 50 is roughly half the node height
      
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === draggingNodeId ? { ...node, x, y } : node
        )
      );
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Prevent drag from propagating up to parent view scroll
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[--color-surface-primary]/50 p-6 h-full overflow-hidden">
      <div className="mb-6 shrink-0 flex justify-between items-center bg-white/40 p-6 rounded-2xl border border-[--color-border-secondary] backdrop-blur-md shadow-sm xl:flex-row flex-col gap-4 xl:gap-0">
        <div className="w-full xl:w-auto">
          <input 
            value={processName}
            onChange={(e) => setProcessName(e.target.value)}
            className="text-2xl font-bold bg-transparent border-b-2 border-transparent focus:border-[--color-accent-500] hover:border-[--color-border-secondary] focus:outline-none transition-colors mb-1 text-[--color-text-primary] pb-1 w-full xl:w-96"
            placeholder="Nhập tên quy trình..."
          />
          <p className="text-[--color-text-secondary] text-sm font-medium">Thiết kế và quản lý các luồng quy trình công việc, {user.name}.</p>
        </div>
        <div className="flex gap-3 w-full xl:w-auto justify-end">
           <button 
             onClick={handleSaveProcess}
             className="bg-white text-[--color-text-primary] border border-[--color-border-secondary] px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-[--color-surface-hover] transition-all flex items-center gap-2">
             {isSaved ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : null}
             {isSaved ? 'Đã lưu' : 'Lưu quy trình'}
           </button>
           <button 
             onClick={() => setShowCreateModal(true)}
             className="bg-[--color-accent-600] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-[--color-accent-700] hover:shadow-md transition-all flex items-center gap-2">
             <WorkflowIcon className="w-4 h-4" />
             Tạo thẻ quy trình mới
           </button>
        </div>
      </div>
      
      {/* Designer Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-white/40 border border-[--color-border-secondary] backdrop-blur-md rounded-2xl shadow-inner overflow-auto cursor-crosshair diagram-bg"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-[--color-accent-100] text-[--color-accent-600] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[--color-accent-200]">
                 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                 </svg>
              </div>
              <h2 className="text-xl font-bold text-[--color-text-primary] mb-3">Chưa có thẻ quy trình nào</h2>
              <p className="text-[--color-text-secondary] text-sm max-w-md">Bấm "Tạo thẻ quy trình mới" để bắt đầu thiết kế lưu đồ.</p>
            </div>
        ) : (
            <Xwrapper>
                {/* Render Nodes */}
                {nodes.map(node => {
                    const isAction = node.type === 'action';
                    return (
                    <div
                        key={node.id}
                        id={node.id}
                        onMouseDown={(e) => handleMouseDown(e, node.id)}
                        onDragStart={handleDragStart}
                        style={{ left: Math.max(0, node.x), top: Math.max(0, node.y) }}
                        className={`absolute z-10 cursor-grab active:cursor-grabbing group`}
                    >
                        {isAction ? (
                            <div className="relative w-56 h-56 flex items-center justify-center">
                                {/* Diamond Background */}
                                <div className={`absolute w-36 h-36 bg-white border ${draggingNodeId === node.id ? 'border-amber-400 shadow-2xl scale-[1.02] z-50' : 'border-[--color-border-secondary] shadow-lg z-10'} rounded-2xl rotate-45 transition-all duration-200`} />
                                
                                {/* Delete Button */}
                                <button 
                                    onClick={(e) => handleDeleteNode(e, node.id)}
                                    className="absolute top-4 right-4 w-7 h-7 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 hover:scale-110 shadow-sm z-[60]"
                                >
                                    <XIcon className="w-3.5 h-3.5" />
                                </button>

                                {/* Content */}
                                <div className="relative z-20 flex flex-col items-center justify-center p-2 w-32 text-center">
                                    <LightningIcon className="w-6 h-6 text-amber-500 mb-1" />
                                    <h3 className="font-bold text-[--color-text-primary] text-xs mb-1.5 line-clamp-2">{node.name}</h3>
                                    {node.tasks && node.tasks.length > 0 && (
                                        <div className="flex flex-col w-full items-center gap-1 mt-1">
                                            {node.tasks.slice(0, 2).map((task, i) => {
                                                const taskLower = task.toLowerCase();
                                                const isAgree = taskLower === 'đồng ý';
                                                const isDisagree = taskLower === 'không đồng ý';
                                                return (
                                                <span key={i} className={`text-[11px] font-semibold px-2 py-1 rounded-md shadow-sm border truncate w-full max-w-[100px] ${isAgree ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : isDisagree ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                                    {task}
                                                </span>
                                            )})}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className={`w-72 bg-[--color-surface-secondary] border ${draggingNodeId === node.id ? 'border-[--color-accent-500] shadow-2xl scale-[1.02] z-50' : 'border-[--color-border-secondary] shadow-lg z-10'} rounded-2xl p-5 transition-all duration-200 relative`}>
                                {/* Delete Button */}
                                <button 
                                    onClick={(e) => handleDeleteNode(e, node.id)}
                                    className="absolute -top-3 -right-3 w-7 h-7 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 hover:scale-110 shadow-sm border border-red-200 z-50"
                                >
                                    <XIcon className="w-3.5 h-3.5" />
                                </button>
                                
                                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[--color-border-secondary]">
                                <div className="w-10 h-10 rounded-full bg-[--color-accent-100] text-[--color-accent-600] flex items-center justify-center shrink-0">
                                    <WorkflowIcon className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-[--color-text-primary] truncate pr-2 text-base">{node.name}</h3>
                                </div>
                                {node.description && (
                                    <p className="text-sm text-[--color-text-secondary] line-clamp-2 mb-4">{node.description}</p>
                                )}
                                <div className="flex flex-col gap-2 mb-4">
                                    {node.assignee && (
                                        <div className="flex items-center gap-2 text-xs font-medium text-[--color-text-tertiary] bg-[--color-surface-primary]/50 p-2 rounded-lg border border-[--color-border-secondary]">
                                            <UserIcon className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{node.assignee}</span>
                                        </div>
                                    )}
                                    {node.duration && (
                                        <div className="flex items-center gap-2 text-xs font-medium text-[--color-text-tertiary] bg-[--color-surface-primary]/50 p-2 rounded-lg border border-[--color-border-secondary]">
                                            <ClockIcon className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{node.duration}</span>
                                        </div>
                                    )}
                                </div>
                                {node.tasks && node.tasks.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-2">
                                            <ChecklistIcon className="w-4 h-4" />
                                            <span>Công việc ({node.tasks.length})</span>
                                        </div>
                                        <ul className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
                                            {node.tasks.map((task, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs font-medium text-[--color-text-tertiary] bg-[--color-surface-primary]/50 p-2 rounded-lg border border-[--color-border-secondary]">
                                                    <div className="w-3.5 h-3.5 mt-[1px] rounded-sm border border-[--color-border-secondary] flex-shrink-0" />
                                                    <span className="leading-snug">{task}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )})}
                
                {/* Render Edges */}
                {nodes.map(node => {
                    if (node.linkedToNodeId) {
                        return (
                            <Xarrow
                                key={`edge-${node.linkedToNodeId}-${node.id}`}
                                start={node.linkedToNodeId} /* Arrow points FROM the linked node */
                                end={node.id}             /* TO the new node */
                                color="var(--color-accent-500)"
                                strokeWidth={1.5}
                                path="smooth"
                                headSize={4}
                                zIndex={0}
                                showHead={true}
                            />
                        );
                    }
                    return null;
                })}
            </Xwrapper>
        )}
      </div>

      {/* Create Node Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in-up">
           <div className="bg-white/95 backdrop-blur-xl border border-[--color-border-secondary] rounded-2xl shadow-full w-full max-w-md overflow-hidden animate-scale-in">
              <div className="px-6 py-4 border-b border-[--color-border-secondary] flex justify-between items-center bg-[--color-surface-secondary]">
                 <h3 className="text-lg font-bold text-[--color-text-primary]">Thêm Thẻ Quy trình</h3>
                 <button onClick={() => setShowCreateModal(false)} className="text-[--color-text-tertiary] hover:text-[--color-text-primary] transition-colors p-1 rounded-md hover:bg-[--color-surface-hover]">
                    <XIcon className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleCreateNode} className="p-0">
                 <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto no-scrollbar">
                    
                    <div className="flex items-center gap-4 bg-[--color-surface-primary]/50 p-2 rounded-xl border border-[--color-border-secondary]">
                        <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all ${newNodeType === 'step' ? 'bg-white shadow-sm border border-[--color-border-secondary] text-[--color-accent-600]' : 'text-[--color-text-secondary] hover:bg-[--color-surface-hover]'}`}>
                           <input type="radio" className="sr-only" checked={newNodeType === 'step'} onChange={() => {
                               setNewNodeType('step');
                               if (newNodeTasks.join(',') === 'Đồng ý,Không đồng ý') {
                                   setNewNodeTasks(['']);
                               }
                           }} />
                           <WorkflowIcon className="w-4 h-4" />
                           <span className="font-bold text-sm">Bước (Step)</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all ${newNodeType === 'action' ? 'bg-white shadow-sm border border-[--color-border-secondary] text-amber-600' : 'text-[--color-text-secondary] hover:bg-[--color-surface-hover]'}`}>
                           <input type="radio" className="sr-only" checked={newNodeType === 'action'} onChange={() => {
                               setNewNodeType('action');
                               setNewNodeTasks(['Đồng ý', 'Không đồng ý']);
                           }} />
                           <LightningIcon className="w-4 h-4" />
                           <span className="font-bold text-sm">Hành động</span>
                        </label>
                    </div>

                    <div>
                       <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Tên thẻ: <span className="text-red-500">*</span></label>
                       <input 
                          type="text" 
                          required
                          value={newNodeName}
                          onChange={e => setNewNodeName(e.target.value)}
                          placeholder="VD: Kiểm tra tài liệu" 
                          className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-sm font-medium transition-all"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Người thực hiện:</label>
                           <input 
                              type="text" 
                              value={newNodeAssignee}
                              onChange={e => setNewNodeAssignee(e.target.value)}
                              placeholder="VD: Nhân viên CSKH" 
                              className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-sm font-medium transition-all"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Thời gian thực hiện:</label>
                           <input 
                              type="text" 
                              value={newNodeDuration}
                              onChange={e => setNewNodeDuration(e.target.value)}
                              placeholder="VD: 2 ngày làm việc" 
                              className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-sm font-medium transition-all"
                           />
                        </div>
                    </div>
                    <div>
                       <div className="flex items-center justify-between mb-1.5">
                           <label className="block text-sm font-semibold text-[--color-text-secondary]">Danh sách công việc:</label>
                           <button type="button" onClick={addTaskField} className="text-xs font-bold text-[--color-accent-600] hover:text-[--color-accent-700] p-1">+ Thêm việc</button>
                       </div>
                       <div className="space-y-2">
                           {newNodeTasks.map((task, i) => (
                               <div key={i} className="flex gap-2">
                                   <input 
                                      type="text" 
                                      value={task}
                                      onChange={e => handleTaskChange(i, e.target.value)}
                                      placeholder={`Công việc ${i + 1}...`}
                                      className="flex-1 bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-2.5 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-sm transition-all"
                                   />
                                   {newNodeTasks.length > 1 && (
                                       <button type="button" onClick={() => removeTaskField(i)} className="text-[--color-text-tertiary] hover:text-red-500 shrink-0 p-2">
                                           <XIcon className="w-4 h-4" />
                                       </button>
                                   )}
                               </div>
                           ))}
                       </div>
                    </div>
                    <div>
                       <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Mô tả chi tiết:</label>
                       <textarea 
                          value={newNodeDesc}
                          onChange={e => setNewNodeDesc(e.target.value)}
                          placeholder="Mô tả công việc cần làm ở bước này..."
                          rows={2}
                          className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-sm font-medium transition-all resize-none"
                       />
                    </div>
                    {nodes.length > 0 && (
                        <div>
                           <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Tiếp nối từ thẻ:</label>
                           <select 
                              value={newNodeLink}
                              onChange={e => setNewNodeLink(e.target.value)}
                              className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-xl p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none text-sm font-medium transition-all cursor-pointer"
                           >
                              <option value="">-- Không liên kết (Bắt đầu mới) --</option>
                              {nodes.map(n => (
                                  <option key={n.id} value={n.id}>{n.name}</option>
                              ))}
                           </select>
                           <p className="text-xs text-[--color-text-tertiary] mt-1.5">* Sẽ tạo đường kẻ mũi tên chỉ từ thẻ được chọn đến thẻ đang tạo.</p>
                        </div>
                    )}
                 </div>
                 <div className="p-6 border-t border-[--color-border-secondary] flex justify-end gap-3 bg-[--color-surface-primary]/50 rounded-b-2xl">
                    <button 
                       type="button" 
                       onClick={() => setShowCreateModal(false)}
                       className="px-5 py-2.5 rounded-xl text-sm font-bold text-[--color-text-secondary] hover:bg-[--color-surface-hover] transition-all"
                    >
                       Hủy
                    </button>
                    <button 
                       type="submit" 
                       className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[--color-accent-600] hover:bg-[--color-accent-700] text-white shadow-sm hover:shadow transition-all"
                    >
                       Tạo thẻ quy trình
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
      
      {/* Background Pattern Definition */}
      <style>{`
        .diagram-bg {
           background-image: radial-gradient(var(--color-border-secondary) 1px, transparent 1px);
           background-size: 24px 24px;
        }
      `}</style>
    </div>
  );
}

export default ProcessWorkflowView;
