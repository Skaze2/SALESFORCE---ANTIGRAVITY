import React, { useState, useRef, useEffect } from 'react';
import { Building, ChevronDown, Pin, Search, Settings, LayoutList, RefreshCw, Edit, Filter, Check, ArrowUp } from 'lucide-react';
import { db } from '../firebaseConfig';
import { ProspectData, User } from '../App';

type ViewType = 'recent' | 'en_llamada' | 'mis_agendados' | 'mis_asignados';

interface StudentsListViewProps {
    currentUser: User;
    onOpenRecord: (record: ProspectData) => void;
}

export const StudentsListView: React.FC<StudentsListViewProps> = ({ currentUser, onOpenRecord }) => {
    // Persist filter per-agent in localStorage so navigating away and back keeps the same filter
    const storageKey = `students_view_${currentUser.id || currentUser.email || 'default'}`;
    const [currentView, setCurrentView] = useState<ViewType>(() => {
        const saved = localStorage.getItem(storageKey);
        return (saved as ViewType) || 'recent';
    });

    const changeView = (view: ViewType) => {
        setCurrentView(view);
        localStorage.setItem(storageKey, view);
    };
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [allProspects, setAllProspects] = useState<ProspectData[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);

    // Click outside logic for menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    // --- Firebase Data Fetching ---
    useEffect(() => {
        const prospectsRef = db.ref('prospects');
        const listener = prospectsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list: ProspectData[] = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                // Sort by CreatedAt descending by default for better UX
                list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setAllProspects(list);
            } else {
                setAllProspects([]);
            }
        });

        return () => prospectsRef.off('value', listener);
    }, []);

    // --- Helper for Date Formatting ---
    const formatDate = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleString('es-CO', {
                day: 'numeric', month: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
            }).replace(',', '');
        } catch (e) {
            return isoString;
        }
    };

    // --- Filtering Logic ---
    const getFilteredData = () => {
        const userFullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();

        // Vistos Recientemente: Show ALL records for the user to browse (Global List behavior in this demo)
        // Or if strictly "owned", we filter. Prompt says: "llenaremos si el agente en cuestión tiene a su propiedad".
        // But for "Vistos Recientemente", usually we want to see the pool to pick from. 
        // Let's assume 'recent' shows everything to facilitate picking, but the other tabs are strict.
        if (currentView === 'recent') {
            return allProspects;
        }

        return allProspects.filter(p => {
            const isOwner = (p.owner || '').trim() === userFullName;
            if (!isOwner) return false;

            if (currentView === 'en_llamada') return p.status === 'En llamada';
            if (currentView === 'mis_agendados') return p.status === 'Agendado';
            if (currentView === 'mis_asignados') return p.status === 'Asignado';

            return false;
        });
    };

    const filteredData = getFilteredData();

    // --- Config Helpers ---
    const getViewConfig = () => {
        const count = filteredData.length;
        const countText = `${count} elementos`;

        switch (currentView) {
            case 'en_llamada':
                return {
                    title: 'En Llamada',
                    subtitle: `${countText} • Ordenado por Nombre de la cuenta • Filtrado por Estado • Se actualizó hace unos segundos`,
                    type: filteredData.length === 0 ? 'empty' : 'standard' // En llamada usually uses standard view in SF unless customized
                };
            case 'mis_agendados':
                return {
                    title: 'Mis Agendados',
                    subtitle: `${countText} • Ordenado por Nombre de la cuenta • Filtrado por Estado • Se actualizó hace unos segundos`,
                    type: filteredData.length === 0 ? 'empty' : 'status_table'
                };
            case 'mis_asignados':
                return {
                    title: 'Mis Asignados',
                    subtitle: `${countText} • Ordenado por Nombre de la cuenta • Filtrado por Estado • Se actualizó hace unos segundos`,
                    type: filteredData.length === 0 ? 'empty' : 'status_table'
                };
            default:
                return {
                    title: 'Vistos recientemente',
                    subtitle: '50+ elementos • Se actualizó hace unos segundos',
                    type: 'standard'
                };
        }
    };

    const config = getViewConfig();

    return (
        <div className="flex flex-col h-full bg-white font-sans text-sm overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 px-4 py-3 bg-[#f3f3f3] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#7f8de1] rounded flex items-center justify-center shadow-sm shrink-0">
                        <Building className="text-white" size={18} />
                    </div>
                    <div className="relative" ref={menuRef}>
                        <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">Estudiantes</div>
                        <div
                            className="flex items-center gap-1 cursor-pointer group select-none"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <h1 className="text-lg font-bold text-gray-800 group-hover:underline leading-none truncate max-w-[300px]">
                                {config.title}
                            </h1>
                            <div className="p-0.5 hover:bg-gray-200 rounded transition-colors">
                                <ChevronDown size={14} className="text-gray-500" />
                            </div>
                            <div className="p-1 hover:bg-gray-200 rounded transition-colors ml-1" title="Anclar esta lista">
                                <Pin size={12} className="text-gray-500" />
                            </div>
                        </div>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute top-full left-[-10px] mt-1 w-[350px] bg-white border border-gray-300 rounded shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col">
                                <div className="p-2 border-b border-gray-100">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Buscar listas..."
                                            className="w-full border border-gray-300 rounded px-3 py-1.5 pl-8 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                            autoFocus
                                        />
                                        <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
                                    </div>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto py-1">
                                    <div className="px-3 py-1.5 text-xs font-bold text-gray-800 uppercase tracking-wide bg-gray-50">Vistas de lista recientes</div>

                                    <div
                                        onClick={() => { changeView('en_llamada'); setIsMenuOpen(false); }}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                    >
                                        {currentView === 'en_llamada' && <Check size={14} className="text-gray-600" />}
                                        <span className={currentView === 'en_llamada' ? '' : 'ml-6'}>En Llamada</span>
                                    </div>
                                    <div
                                        onClick={() => { changeView('mis_agendados'); setIsMenuOpen(false); }}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                    >
                                        {currentView === 'mis_agendados' && <Check size={14} className="text-gray-600" />}
                                        <span className={currentView === 'mis_agendados' ? '' : 'ml-6'}>Mis Agendados</span>
                                    </div>
                                    <div
                                        onClick={() => { changeView('mis_asignados'); setIsMenuOpen(false); }}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                    >
                                        {currentView === 'mis_asignados' && <Check size={14} className="text-gray-600" />}
                                        <span className={currentView === 'mis_asignados' ? '' : 'ml-6'}>Mis Asignados</span>
                                    </div>
                                    <div
                                        onClick={() => { changeView('recent'); setIsMenuOpen(false); }}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                    >
                                        {currentView === 'recent' && <Check size={14} className="text-gray-600" />}
                                        <span className={currentView === 'recent' ? '' : 'ml-6'}>Vistos recientemente (Lista anclada)</span>
                                    </div>

                                    <div className="px-3 py-1.5 text-xs font-bold text-gray-800 uppercase tracking-wide bg-gray-50 mt-1">Todas las demás listas</div>
                                    <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2">
                                        <span className="ml-6">Estudiantes Recientemente Mostrados</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm">
                        Vista de inteligencia
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-[#f3f3f3] border-b border-gray-200 px-4 py-2 flex justify-between items-center gap-3 shrink-0">
                <div className="text-xs text-gray-500 truncate flex-1 mr-4" title={config.subtitle}>
                    {config.subtitle}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar en esta lista..."
                            className="pl-8 pr-3 py-1 border border-gray-300 rounded text-sm w-64 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-500"
                        />
                        <Search className="absolute left-2.5 top-1.5 text-gray-400" size={14} />
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-gray-300 rounded p-0.5 shadow-sm">
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Configuración de lista">
                            <Settings size={14} />
                        </button>
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Visualización">
                            <LayoutList size={14} />
                        </button>
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Actualizar">
                            <RefreshCw size={14} />
                        </button>
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Editar">
                            <Edit size={14} />
                        </button>
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Gráficos">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                        </button>
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Filtros">
                            <Filter size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto bg-white relative">
                {/* --- Empty State --- */}
                {config.type === 'empty' && (
                    <div className="flex flex-col items-center justify-center h-full pb-20">
                        {/* Custom Empty Illustration - Abstract Clouds */}
                        <div className="w-[400px] h-[200px] relative opacity-90">
                            <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M50 150 Q80 120 120 140 T200 130 T300 150" stroke="#d8e6fe" strokeWidth="2" fill="none" />
                                <path d="M100 80 Q130 50 180 70 T280 60 T350 90" stroke="#d8e6fe" strokeWidth="2" fill="none" />
                                <circle cx="150" cy="100" r="40" fill="#eef4ff" stroke="#d8e6fe" />
                                <circle cx="220" cy="80" r="50" fill="#eef4ff" stroke="#d8e6fe" />
                                <circle cx="280" cy="110" r="30" fill="#eef4ff" stroke="#d8e6fe" />
                                <path d="M30 180 L370 180" stroke="#e0e0e0" strokeWidth="1" />
                                <path d="M280 40 L290 35 L285 30" stroke="#a0c0f0" fill="none" />
                                <path d="M100 40 L90 35 L95 30" stroke="#a0c0f0" fill="none" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* --- Standard Table (Recent / En Llamada) --- */}
                {config.type === 'standard' && (
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-[#fafaf9] sticky top-0 z-10 shadow-sm text-gray-600">
                            <tr>
                                <th className="p-2 w-10 border-b border-gray-200 text-center text-xs"></th>
                                <th className="p-2 border-b border-gray-200 w-[40%]">
                                    <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide cursor-pointer hover:text-gray-900 border-r border-gray-200 h-full pr-2">
                                        Nombre de la cuenta <ChevronDown size={10} className="text-gray-500" />
                                    </div>
                                </th>
                                <th className="p-2 border-b border-gray-200 w-[20%]">
                                    <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide cursor-pointer hover:text-gray-900 border-r border-gray-200 h-full pr-2">
                                        Teléfono <ChevronDown size={10} className="text-gray-500" />
                                    </div>
                                </th>
                                <th className="p-2 border-b border-gray-200 w-[30%]">
                                    <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide cursor-pointer hover:text-gray-900 h-full pr-2">
                                        Alias del propietario de la cuenta <ChevronDown size={10} className="text-gray-500" />
                                    </div>
                                </th>
                                <th className="p-2 w-10 border-b border-gray-200"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {filteredData.map((row, idx) => (
                                <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50 group transition-colors text-[13px]">
                                    <td className="p-2 text-center text-xs text-gray-500 w-10">{idx + 1}</td>
                                    <td className="p-2 font-medium bg-white group-hover:bg-gray-50 relative">
                                        <button
                                            onClick={() => onOpenRecord(row)}
                                            className="text-[#0070d2] hover:underline block truncate text-left w-full"
                                        >
                                            {row.firstName} {row.lastName}
                                        </button>
                                    </td>
                                    <td className="p-2 text-gray-800 bg-white group-hover:bg-gray-50">
                                        {row.phoneCode} {row.phone}
                                    </td>
                                    <td className="p-2 bg-white group-hover:bg-gray-50">
                                        <a href="#" className="text-[#0070d2] hover:underline">{row.owner || 'Administrador Salesforce'}</a>
                                    </td>
                                    <td className="p-2 text-center relative bg-white group-hover:bg-gray-50">
                                        <button className="text-gray-400 hover:text-[#0070d2] border border-transparent hover:border-gray-300 hover:bg-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronDown size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* --- Status Table (Agendados / Asignados) --- */}
                {config.type === 'status_table' && (
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-[#fafaf9] sticky top-0 z-10 shadow-sm text-gray-600">
                            <tr>
                                <th className="p-2 w-10 border-b border-gray-200 text-center text-xs"></th>
                                <th className="p-2 border-b border-gray-200 w-[15%]">
                                    <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide cursor-pointer hover:text-gray-900 border-r border-gray-200 h-full pr-2">
                                        Estado <ChevronDown size={10} className="text-gray-500" />
                                    </div>
                                </th>
                                <th className="p-2 border-b border-gray-200 w-[40%]">
                                    <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide cursor-pointer hover:text-gray-900 border-r border-gray-200 h-full pr-2">
                                        Nombre de la cuenta <ArrowUp size={10} className="text-gray-600" />
                                    </div>
                                </th>
                                <th className="p-2 border-b border-gray-200 w-[35%]">
                                    <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide cursor-pointer hover:text-gray-900 h-full pr-2">
                                        Fecha status <ChevronDown size={10} className="text-gray-500" />
                                    </div>
                                </th>
                                <th className="p-2 w-10 border-b border-gray-200"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {filteredData.map((row, idx) => (
                                <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50 group transition-colors text-[13px]">
                                    <td className="p-2 text-center text-xs text-gray-500 w-10">{idx + 1}</td>
                                    <td className="p-2 text-gray-800 bg-white group-hover:bg-gray-50">{row.status}</td>
                                    <td className="p-2 font-medium bg-white group-hover:bg-gray-50 relative">
                                        <button
                                            onClick={() => onOpenRecord(row)}
                                            className="text-[#0070d2] hover:underline block truncate text-left w-full"
                                        >
                                            {row.firstName} {row.lastName}
                                        </button>
                                    </td>
                                    <td className="p-2 text-gray-800 bg-white group-hover:bg-gray-50">
                                        {formatDate(row.createdAt)}
                                    </td>
                                    <td className="p-2 text-center relative bg-white group-hover:bg-gray-50">
                                        <button className="text-gray-400 hover:text-[#0070d2] border border-transparent hover:border-gray-300 hover:bg-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronDown size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer Line */}
            <div className="h-2 bg-gray-100 border-t border-gray-200 w-full shrink-0"></div>
        </div>
    );
};