import React, { useState, useEffect, useRef } from "react";
import {
  Lead,
  Stage,
  Interaction,
  InteractionType,
  Task,
  TaskPriority,
  TaskType,
} from "../types";
import { useApp } from "../App";
import { STAGES } from "../constants";
import {
  X,
  Linkedin,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  Calendar,
  Building2,
  Trash2,
  Send,
  PlusCircle,
  History,
  Clock,
  Wand2,
  Loader2,
  CheckSquare,
  Square,
  ListTodo,
  AlertCircle,
  BrainCircuit,
} from "lucide-react";
import {
  analyzeLeadQuality,
  fixGrammar,
  suggestNextSteps,
} from "../services/geminiService";

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead;
  initialTab?: "history" | "tasks";
}

const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  lead,
  initialTab,
}) => {
  const { addLead, updateLead, deleteLead } = useApp();
  const [activeTab, setActiveTab] = useState<"history" | "tasks">("history");

  // Ref to track the current state for auto-save on unmount
  const formDataRef = useRef<Partial<Lead>>({});

  const [formData, setFormData] = useState<Partial<Lead>>({
    name: "",
    company: "",
    email: "",
    value: 0,
    stage: Stage.LEAD,
    source: "Manual",
    notes: "",
    interactions: [],
    tasks: [],
  });

  const [newInteraction, setNewInteraction] = useState({
    content: "",
    type: "Note" as InteractionType,
  });
  const [newTask, setNewTask] = useState({
    title: "",
    type: "Follow-up" as TaskType,
    priority: "Medium" as TaskPriority,
    targetDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
  });

  const [aiScore, setAiScore] = useState<string>(
    "Click analyze to get AI insights",
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFixingGrammar, setIsFixingGrammar] = useState(false);
  const [isSuggestingTasks, setIsSuggestingTasks] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      let data: Partial<Lead>;
      if (lead) {
        data = { ...lead };
        setAiScore("Click analyze to get AI insights");
      } else {
        data = {
          name: "",
          company: "",
          email: "",
          value: 0,
          stage: Stage.LEAD,
          source: "Manual",
          notes: "",
          interactions: [],
          tasks: [],
        };
      }
      setFormData(data);
      formDataRef.current = data;
    }
  }, [lead, isOpen, initialTab]);

  // Sync ref with state for closing save
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const handleSave = () => {
    const data = formDataRef.current;
    if (!data.name) return; // Don't save empty lead
    if (lead) updateLead(lead.id, data);
    else addLead(data as any);
  };

  const handleRequestClose = () => {
    handleSave();
    onClose();
  };

  if (!isOpen) return null;

  const handleAddInteraction = () => {
    if (!newInteraction.content.trim()) return;
    const interaction: Interaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: newInteraction.type,
      content: newInteraction.content,
      timestamp: new Date().toISOString(),
    };
    const updatedInteractions = [interaction, ...(formData.interactions || [])];
    setFormData({
      ...formData,
      interactions: updatedInteractions,
      lastActivity: new Date().toISOString(),
    });
    setNewInteraction({ ...newInteraction, content: "" });
  };

  const handleAddTask = (taskData?: any) => {
    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: taskData?.title || newTask.title,
      type: taskData?.type || newTask.type,
      priority: taskData?.priority || newTask.priority,
      targetDate:
        taskData?.targetDate || new Date(newTask.targetDate).toISOString(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    if (!task.title.trim()) return;
    setFormData({ ...formData, tasks: [task, ...(formData.tasks || [])] });
    setNewTask({
      title: "",
      type: "Follow-up",
      priority: "Medium",
      targetDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    });
  };

  const toggleTask = (taskId: string) => {
    setFormData({
      ...formData,
      tasks: formData.tasks?.map((t) => {
        if (t.id === taskId) {
          const isCompleting = !t.completed;
          return {
            ...t,
            completed: isCompleting,
            completedDate: isCompleting ? new Date().toISOString() : undefined,
          };
        }
        return t;
      }),
    });
  };

  const handleAISuggestTasks = async () => {
    setIsSuggestingTasks(true);
    const suggestions = await suggestNextSteps(formData as Lead);
    suggestions.forEach((s: any) => handleAddTask(s));
    setIsSuggestingTasks(false);
  };

  const handleFixGrammar = async () => {
    if (!newInteraction.content.trim() || isFixingGrammar) return;
    setIsFixingGrammar(true);
    const correctedText = await fixGrammar(newInteraction.content);
    setNewInteraction({ ...newInteraction, content: correctedText });
    setIsFixingGrammar(false);
  };

  const handleAnalyze = async () => {
    if (!formData.name) return;
    setIsAnalyzing(true);
    const result = await analyzeLeadQuality(formData as Lead);
    setAiScore(result);
    setIsAnalyzing(false);
  };

  const getInteractionIcon = (type: InteractionType) => {
    switch (type) {
      case "Call":
        return <Phone size={14} className="text-green-500" />;
      case "LinkedIn":
        return <Linkedin size={14} className="text-blue-500" />;
      case "Email":
        return <Mail size={14} className="text-orange-500" />;
      default:
        return <MessageSquare size={14} className="text-slate-400" />;
    }
  };

  const getPriorityColor = (p: TaskPriority) => {
    if (p === "High") return "bg-red-100 text-red-700";
    if (p === "Medium") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleRequestClose();
      }}
    >
      <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex animate-in zoom-in-95 duration-300 relative">
        {/* Absolute Close Button (Top Right) */}
        <button
          onClick={handleRequestClose}
          className="absolute top-6 right-6 z-50 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all group active:scale-95"
          title="Save and Close"
        >
          <X
            size={24}
            className="group-hover:rotate-90 transition-transform duration-300"
          />
        </button>

        {/* Profile & Form Column (Left) */}
        <div className="w-1/2 flex flex-col border-r border-slate-100 overflow-y-auto custom-scrollbar bg-slate-50/30">
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
              <img
                src={`https://ui-avatars.com/api/?name=${formData.name || "User"}&size=128&background=random`}
                className="w-20 h-20 rounded-[2rem] border-4 border-white shadow-xl"
              />
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {lead ? "Edit Lead" : "New Lead"}
                </h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Lead Intelligence Profile
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Company
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                  />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="w-full pl-11 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900"
                    placeholder="Company Name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Value ($)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        value: Number(e.target.value),
                      })
                    }
                    className="w-full pl-8 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Pipeline Stage
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) =>
                    setFormData({ ...formData, stage: e.target.value as Stage })
                  }
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl appearance-none outline-none font-bold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full pl-11 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900"
                    placeholder="email@domain.com"
                  />
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <BrainCircuit size={48} className="text-indigo-600" />
              </div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-xs font-black text-indigo-900 flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles size={16} className="text-indigo-500" /> AI Insights
                </span>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 bg-white text-[10px] font-black text-indigo-600 rounded-xl shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                >
                  {isAnalyzing ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    "Re-Analyze"
                  )}
                </button>
              </div>
              <p className="text-xs text-indigo-700/80 leading-relaxed font-medium italic relative z-10">
                "{aiScore}"
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleRequestClose}
                className="flex-1 px-8 py-4.5 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-blue-600 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                Save Profile
              </button>
              {lead && (
                <button
                  onClick={() => {
                    if (confirm("Delete this lead forever?")) {
                      deleteLead(lead.id);
                      onClose();
                    }
                  }}
                  className="p-4 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all border border-transparent hover:border-red-100"
                >
                  <Trash2 size={24} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Activity & Tasks Column (Right) */}
        <div className="w-1/2 flex flex-col bg-white">
          {/* Segmented Slider Tab Switcher */}
          <div className="p-6 pb-2">
            <div className="bg-slate-100/80 p-1 rounded-2xl flex relative overflow-hidden h-12">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out z-0 ${activeTab === "tasks" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"}`}
              />
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all relative z-10 ${activeTab === "history" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
              >
                <History size={16} /> Timeline
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all relative z-10 ${activeTab === "tasks" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
              >
                <ListTodo size={16} /> Action Items
                {formData.tasks?.filter((t) => !t.completed).length ? (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white rounded-md text-[9px] font-black">
                    {formData.tasks?.filter((t) => !t.completed).length}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-8 custom-scrollbar bg-slate-50/20">
            {activeTab === "history" ? (
              <>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                  <div className="flex gap-2">
                    {["LinkedIn", "Email", "Call", "Note"].map((type) => (
                      <button
                        key={type}
                        onClick={() =>
                          setNewInteraction({
                            ...newInteraction,
                            type: type as InteractionType,
                          })
                        }
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${newInteraction.type === type ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <textarea
                      value={newInteraction.content}
                      onChange={(e) =>
                        setNewInteraction({
                          ...newInteraction,
                          content: e.target.value,
                        })
                      }
                      className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm font-medium pr-14 placeholder:text-slate-300"
                      placeholder="Add a note or log an activity..."
                      rows={3}
                    />
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <button
                        onClick={handleFixGrammar}
                        disabled={isFixingGrammar}
                        className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
                        title="AI Fix Grammar"
                      >
                        {isFixingGrammar ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Wand2 size={16} />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={handleAddInteraction}
                      className="absolute bottom-4 right-4 p-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-blue-600 transition-all active:scale-90"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-6">
                  {formData.interactions?.map((i) => (
                    <div
                      key={i.id}
                      className="bg-white p-5 rounded-2xl border border-slate-100 flex gap-4 shadow-sm hover:border-slate-300 transition-colors"
                    >
                      <div className="mt-1 p-2 bg-slate-50 rounded-xl">
                        {getInteractionIcon(i.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {i.type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {new Date(i.timestamp).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {i.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!formData.interactions ||
                    formData.interactions.length === 0) && (
                    <div className="text-center py-10 opacity-30 flex flex-col items-center gap-3">
                      <Clock size={32} />
                      <p className="text-xs font-black uppercase tracking-[0.2em]">
                        No activities recorded
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      Strategy for {formData.name}
                    </h4>
                    <button
                      onClick={handleAISuggestTasks}
                      disabled={isSuggestingTasks}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      {isSuggestingTasks ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <BrainCircuit size={12} />
                      )}{" "}
                      AI Suggest
                    </button>
                  </div>
                  <div className="flex flex-col gap-4">
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Task description..."
                    />
                    <div className="flex gap-3">
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={newTask.targetDate}
                          onChange={(e) =>
                            setNewTask({
                              ...newTask,
                              targetDate: e.target.value,
                            })
                          }
                          className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600"
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Priority
                        </label>
                        <select
                          value={newTask.priority}
                          onChange={(e) =>
                            setNewTask({
                              ...newTask,
                              priority: e.target.value as TaskPriority,
                            })
                          }
                          className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => handleAddTask()}
                          className="p-3.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-blue-600 transition-all active:scale-90"
                        >
                          <PlusCircle size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {formData.tasks?.map((t) => (
                    <div
                      key={t.id}
                      className={`bg-white p-5 rounded-[1.5rem] border border-slate-100 flex items-center justify-between group transition-all hover:border-blue-200 hover:shadow-md ${t.completed ? "opacity-40 grayscale bg-slate-50" : ""}`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <button
                          onClick={() => toggleTask(t.id)}
                          className="text-slate-300 hover:text-blue-500 transition-colors flex-shrink-0"
                        >
                          {t.completed ? (
                            <CheckSquare size={24} className="text-blue-500" />
                          ) : (
                            <Square size={24} />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-bold truncate ${t.completed ? "line-through text-slate-400" : "text-slate-900"}`}
                          >
                            {t.title}
                          </p>
                          <div className="flex items-center gap-4 mt-1.5">
                            <span
                              className={`text-[8px] px-2 py-0.5 rounded-lg font-black uppercase border ${getPriorityColor(t.priority)}`}
                            >
                              {t.priority}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                              <Calendar size={12} className="text-slate-300" />
                              Due:{" "}
                              {new Date(t.targetDate).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!t.completed && t.priority === "High" && (
                        <div className="flex-shrink-0">
                          <AlertCircle
                            size={18}
                            className="text-red-400 animate-pulse"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  {(!formData.tasks || formData.tasks.length === 0) && (
                    <div className="text-center py-12 opacity-30 flex flex-col items-center gap-3">
                      <ListTodo size={32} />
                      <p className="text-xs font-black uppercase tracking-[0.2em]">
                        No open tasks
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadModal;
