import React, { useState, useRef, useEffect } from 'react';
import { 
    Grid3X3, ChevronDown, X, User, Home, Star, Building, Crown, Pencil, 
    Landmark, FileText, Briefcase, Calendar, Activity, Users, Clipboard, 
    Mountain, FileCheck, Signpost, Plane, Trophy, Ticket, Gem, AppWindow, 
    Heart, Cpu, Edit 
} from 'lucide-react';
import { ProspectData } from '../App';

interface SubHeaderProps {
    tabs: ProspectData[];
    activeTabId: string;
    onTabClick: (id: string) => void;
    onTabClose: (id: string) => void;
    onNavigate?: (destination: string) => void;
    currentView?: 'record' | 'dashboard' | 'list' | 'students-list';
}

const NAV_ITEMS = [
    { label: "Inicio", icon: Home, color: "bg-[#e0639d]" },
    { label: "Leads", icon: Star, color: "bg-[#5eb5ce]" },
    { label: "Estudiantes", icon: Building, color: "bg-[#6c7ecc]" },
    { label: "Oportunidades", icon: Crown, color: "bg-[#f59e3d]" },
    { label: "Facturas", icon: Pencil, color: "bg-[#e16b64]" },
    { label: "Pagos de Clientes", icon: Landmark, color: "bg-[#eca046]" },
    { label: "Contratos", icon: FileText, color: "bg-[#4dbd74]" },
    { label: "Casos", icon: Briefcase, color: "bg-[#f56c8d]" },
    { label: "Calendario", icon: Calendar, color: "bg-[#966fd6]" },
    { label: "Chatter", icon: Activity, color: "bg-[#2d76a7]" },
    { label: "Grupos", icon: Users, color: "bg-[#4da9e8]" },
    { label: "Informes", icon: Clipboard, color: "bg-[#42c5b1]" },
    { label: "Aprendizaje", icon: Mountain, color: "bg-[#0b3e73]" },
    { label: "Ultimátum", icon: FileCheck, color: "bg-[#4dbd74]" },
    { label: "Ultimátum", icon: Signpost, color: "bg-[#5c8bc0]" },
    { label: "Areas a Escalar", icon: Plane, color: "bg-[#788fe8]" },
    { label: "Case Escalations", icon: Plane, color: "bg-[#788fe8]" },
    { label: "Sales products", icon: Trophy, color: "bg-[#e55c6c]" },
    { label: "Checkouts", icon: Ticket, color: "bg-[#d64a6e]" },
    { label: "Invoices", icon: Gem, color: "bg-[#3bcbb5]" },
    { label: "PopUps Checkout", icon: AppWindow, color: "bg-[#5878c7]" },
    { label: "Benefits", icon: Heart, color: "bg-[#ef5350]" },
    { label: "Gamificaciones", icon: Cpu, color: "bg-[#82c341]" },
    { label: "Launch events", icon: Ticket, color: "bg-[#d64a6e]" },
];

export const SubHeader: React.FC<SubHeaderProps> = ({ tabs, activeTabId, onTabClick, onTabClose, onNavigate, currentView }) => {
  // State for Overflow Tabs Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State for Navigation Items Dropdown
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const navDropdownRef = useRef<HTMLDivElement>(null);

  // State for the current navigation label - DEFAULTED TO INICIO
  const [currentNavLabel, setCurrentNavLabel] = useState("Inicio");

  // Close on click outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setIsDropdownOpen(false);
          }
          if (navDropdownRef.current && !navDropdownRef.current.contains(event.target as Node)) {
              setIsNavDropdownOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleTabs = tabs.slice(0, 6);
  const overflowTabs = tabs.slice(6);

  // Determine if the Nav Item should look active
  const isNavActive = 
      (currentView === 'dashboard' && currentNavLabel === 'Inicio') || 
      (currentView === 'list' && currentNavLabel === 'Casos') ||
      (currentView === 'students-list' && currentNavLabel === 'Estudiantes');

  return (
    <div className="h-[40px] bg-white border-b border-gray-300 flex items-center shrink-0 shadow-sm z-40 relative">
      {/* App Launcher */}
      <div className="h-full flex items-center px-3 border-r border-gray-200 hover:bg-gray-50 cursor-pointer gap-2 shrink-0">
        <Grid3X3 size={18} className="text-gray-500" />
      </div>

      {/* App Name */}
      <div className="h-full flex items-center px-4 font-semibold text-gray-700 hover:underline cursor-pointer min-w-fit shrink-0">
        Sales Console smart...
      </div>
      
      {/* Nav Item: Dynamic Label */}
      <div 
        onClick={() => onNavigate && onNavigate(currentNavLabel)}
        className={`
            h-full flex items-center px-3 border-r border-gray-200 shrink-0 cursor-pointer hover:bg-gray-50
            ${isNavActive ? 'bg-[#eef1f6] font-semibold border-b-2 border-b-[#0070d2]' : ''}
        `}
        title={`Ir a ${currentNavLabel}`}
      >
         <span className={`text-gray-700 ${isNavActive ? 'text-black' : ''}`}>
             {currentNavLabel}
         </span>
      </div>
      
      {/* Nav Arrow Dropdown */}
       <div 
          ref={navDropdownRef}
          onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
          className={`
              h-full flex items-center px-2 border-r border-gray-200 shrink-0 cursor-pointer hover:bg-gray-50 relative
              ${isNavDropdownOpen ? 'bg-gray-100' : ''}
          `}
       >
         <ChevronDown size={14} className="text-gray-500" />
         
         {/* Navigation Dropdown Menu */}
         {isNavDropdownOpen && (
             <div className="absolute top-full left-0 mt-1 w-[280px] bg-white border border-gray-300 shadow-xl rounded z-50 flex flex-col animate-in fade-in duration-150">
                <div className="max-h-[400px] overflow-y-auto py-2">
                    {NAV_ITEMS.map((item, idx) => (
                        <div 
                            key={idx} 
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent re-triggering the toggle
                                setCurrentNavLabel(item.label);
                                setIsNavDropdownOpen(false);
                                if (onNavigate) {
                                    onNavigate(item.label);
                                }
                            }}
                            className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                        >
                             <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center shrink-0 ${item.color}`}>
                                 <item.icon size={18} className="text-white" />
                             </div>
                             <span className="text-sm font-medium text-gray-800">{item.label}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t border-gray-200 p-2 bg-gray-50 rounded-b">
                     <button className="w-full text-left px-2 py-1 text-sm text-blue-600 hover:underline flex items-center gap-2 font-medium">
                        <Edit size={14} /> Modificar
                     </button>
                </div>
             </div>
         )}
      </div>

      {/* Dynamic Tabs Area */}
      <div className="flex-1 flex overflow-hidden">
          {visibleTabs.map((tab) => {
              // Active state depends on currentView being 'record' AND matching ID
              const isActive = (currentView === undefined || currentView === 'record') && tab.id === activeTabId;
              const isNewCase = tab.type === 'new-case';
              
              return (
                <div 
                    key={tab.id}
                    onClick={() => onTabClick(tab.id)}
                    className={`
                        h-full flex items-center px-3 border-r border-gray-200 min-w-[150px] max-w-[200px] justify-between relative cursor-pointer group flex-1
                        ${isActive ? 'bg-[#eef1f6] border-t-2 border-t-blue-500' : 'bg-white hover:bg-gray-50 border-t-2 border-t-transparent'}
                    `}
                    title={isNewCase ? 'Nuevo Caso' : `${tab.firstName} ${tab.lastName}`}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        {isNewCase ? (
                             <div className="bg-[#f56c8d] p-0.5 rounded-sm shrink-0">
                                 <Briefcase size={12} className="text-white" />
                             </div>
                        ) : (
                            <div className="bg-[#7f8de1] p-0.5 rounded-sm shrink-0">
                                 <User size={12} className="text-white" />
                            </div>
                        )}
                        <span className={`truncate text-xs ${isActive ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                            {isNewCase ? 'Nuevo Caso' : `${tab.firstName} ${tab.lastName}`}
                        </span>
                    </div>
                    <div className="flex items-center ml-2">
                         <button 
                            onClick={(e) => {
                                e.stopPropagation(); 
                                onTabClose(tab.id);
                            }}
                            className="p-0.5 rounded hover:bg-gray-200 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            <X size={14} />
                         </button>
                    </div>
                </div>
              );
          })}

          {/* Overflow Dropdown Trigger */}
          {overflowTabs.length > 0 && (
             <div className="relative h-full" ref={dropdownRef}>
                 <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`
                        h-full flex items-center px-3 border-r border-gray-200 cursor-pointer hover:bg-gray-50 gap-1
                        ${isDropdownOpen ? 'bg-gray-100' : 'bg-white'}
                    `}
                 >
                     <span className="text-xs text-gray-700">Más</span>
                     <ChevronDown size={14} className="text-gray-500" />
                 </div>

                 {/* Overflow Dropdown Menu */}
                 {isDropdownOpen && (
                     <div className="absolute top-full right-0 mt-1 w-[300px] bg-white border border-gray-200 shadow-lg rounded z-50 py-1 max-h-[400px] overflow-y-auto">
                         {overflowTabs.map((tab) => {
                             const isNewCase = tab.type === 'new-case';
                             return (
                                 <div 
                                    key={tab.id}
                                    onClick={() => {
                                        onTabClick(tab.id);
                                        setIsDropdownOpen(false);
                                    }}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                                 >
                                     {/* Icon */}
                                     {isNewCase ? (
                                        <div className="bg-[#f56c8d] p-1 rounded-sm shrink-0">
                                             <Briefcase size={14} className="text-white" />
                                        </div>
                                     ) : (
                                        <div className="bg-[#7f8de1] p-1 rounded-sm shrink-0">
                                             <User size={14} className="text-white" />
                                        </div>
                                     )}
                                     <div className="flex flex-col overflow-hidden">
                                         <span className="text-sm text-gray-800 truncate">
                                             {isNewCase ? 'Nuevo Caso' : `${tab.firstName} ${tab.lastName}`}
                                         </span>
                                         <span className="text-xs text-gray-500">
                                             {isNewCase ? 'Registro' : 'Estudiante'}
                                         </span>
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 )}
             </div>
          )}
      </div>
    </div>
  );
};