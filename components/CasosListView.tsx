import React from 'react';
import { Briefcase, ChevronDown, RefreshCw, Settings, Search, Filter, LayoutList, Pin } from 'lucide-react';

interface CasosListViewProps {
    onNewCase?: () => void;
}

export const CasosListView: React.FC<CasosListViewProps> = ({ onNewCase }) => {
    // Mock data based on the provided image
    const cases = [
        { id: '01136706', subject: 'Crear Accesos para el Estudiante Vanessa Suelt', status: 'En Proceso', date: '4/02/2026, 11:43 a. m.', owner: 'mpata' },
        { id: '01136668', subject: 'Crear Accesos para el Estudiante Yeison andrey cossio gonzalez', status: 'En Proceso', date: '4/02/2026, 9:58 a. m.', owner: 'mpata' },
        { id: '01136477', subject: 'Crear Accesos para el Estudiante DUILIO Florez', status: 'En Proceso', date: '3/02/2026, 10:42 p. m.', owner: 'mpata' },
        { id: '01136272', subject: 'Crear Accesos para el Estudiante Santiago Duque Gomez', status: 'En Proceso', date: '3/02/2026, 11:49 a. m.', owner: 'mpata' },
        { id: '01136218', subject: 'Crear Accesos para el Estudiante Jairo Gomez', status: 'Cerrado', date: '3/02/2026, 9:49 a. m.', owner: 'mpata' },
        { id: '01118640', subject: 'Gestión cobranza - Felipe Trujillo Trujillo vanegas', status: 'Abierto', date: '13/12/2025, 8:15 a. m.', owner: 'Cobranza Queue' },
        { id: '01133261', subject: 'Cancelación de suscripción -Milka Rivera', status: 'Caso Duplicado', date: '26/01/2026, 10:05 a. m.', owner: 'fjime' },
        { id: '01115535', subject: 'Cambio método de pago - Soporte Estudiante - LyramizMorales', status: 'Cerrado', date: '2/12/2025, 5:22 p. m.', owner: 'pdurá' },
        { id: '01048535', subject: 'Soporte Estudiante - Franciscoyanez', status: 'Cerrado', date: '11/07/2025, 6:33 p. m.', owner: 'nquit' },
        { id: '01107923', subject: 'Cancelación de suscripción -Jhon Llanos', status: 'Cancelado', date: '11/11/2025, 2:29 p. m.', owner: 'fjime' },
        { id: '01131770', subject: 'Crear Accesos para el Estudiante Katia Saca', status: 'Pendiente información', date: '22/01/2026, 9:13 p. m.', owner: 'Accesos' },
        { id: '01107525', subject: 'Chargeback - LADY SAENZ BELTRAN', status: 'Cancelado', date: '10/11/2025, 10:21 a. m.', owner: 'Irinc' },
        { id: '01108161', subject: 'Chargeback - LADY SAENZ BELTRAN', status: 'Cancelado', date: '12/11/2025, 9:28 a. m.', owner: 'Irinc' },
        { id: '01103004', subject: 'Crear Accesos para el Estudiante Eduardo cruz', status: 'Cerrado', date: '24/10/2025, 7:38 p. m.', owner: 'ktova' },
    ];

    return (
        <div className="flex flex-col h-full bg-white font-sans text-sm overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 px-4 py-3 bg-[#f3f3f3] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#f56c8d] rounded flex items-center justify-center shadow-sm">
                        <Briefcase className="text-white" size={18} />
                    </div>
                    <div>
                        <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">Casos</div>
                        <div className="flex items-center gap-1 cursor-pointer group">
                            <h1 className="text-lg font-bold text-gray-800 group-hover:underline leading-none">Vistos recientemente</h1>
                            <div className="p-0.5 hover:bg-gray-200 rounded">
                                <ChevronDown size={14} className="text-gray-500" />
                            </div>
                            <div className="p-1 hover:bg-gray-200 rounded">
                                <Pin size={12} className="text-gray-400 rotate-45" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={onNewCase}
                        className="px-4 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                    >
                        Nuevo
                    </button>
                    <button className="px-4 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm">
                        Combinar casos
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-[#f3f3f3] border-b border-gray-200 px-4 py-2 flex justify-end items-center gap-3 shrink-0">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Buscar en esta lista..." 
                        className="pl-9 pr-3 py-1 border border-gray-300 rounded text-sm w-64 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-500"
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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Gráficos">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                    </button>
                    <button className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Filtros">
                         <Filter size={14} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto bg-white relative">
                <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                    <thead className="bg-[#fafaf9] sticky top-0 z-10 shadow-sm text-gray-600">
                        <tr>
                            <th className="p-2 w-10 border-b border-gray-200 text-center">
                                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5" />
                            </th>
                            <th className="p-2 border-b border-gray-200 w-24">
                                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide cursor-pointer hover:text-gray-900">
                                    Número... <ChevronDown size={10} className="text-gray-500" />
                                </div>
                            </th>
                            <th className="p-2 border-b border-gray-200 w-1/3">
                                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide cursor-pointer hover:text-gray-900">
                                    Asunto <ChevronDown size={10} className="text-gray-500" />
                                </div>
                            </th>
                            <th className="p-2 border-b border-gray-200 w-32">
                                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide cursor-pointer hover:text-gray-900">
                                    Estado <ChevronDown size={10} className="text-gray-500" />
                                </div>
                            </th>
                            <th className="p-2 border-b border-gray-200 w-48">
                                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide cursor-pointer hover:text-gray-900">
                                    Fecha/Hora... <ChevronDown size={10} className="text-gray-500" />
                                </div>
                            </th>
                            <th className="p-2 border-b border-gray-200 w-32">
                                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide cursor-pointer hover:text-gray-900">
                                    Alias del... <ChevronDown size={10} className="text-gray-500" />
                                </div>
                            </th>
                            <th className="p-2 w-10 border-b border-gray-200"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {cases.map((row, idx) => (
                            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 group transition-colors text-xs">
                                <td className="p-2 text-center">
                                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5" />
                                </td>
                                <td className="p-2 font-medium">
                                    <a href="#" className="text-[#0070d2] hover:underline block truncate">{row.id}</a>
                                </td>
                                <td className="p-2 font-medium">
                                    <a href="#" className="text-[#0070d2] hover:underline block truncate" title={row.subject}>{row.subject}</a>
                                </td>
                                <td className="p-2 text-gray-800">{row.status}</td>
                                <td className="p-2 text-gray-800">{row.date}</td>
                                <td className="p-2">
                                    <a href="#" className="text-[#0070d2] hover:underline">{row.owner}</a>
                                </td>
                                <td className="p-2 text-center relative">
                                    <button className="text-gray-400 hover:text-[#0070d2] border border-transparent hover:border-gray-300 hover:bg-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronDown size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="bg-[#f3f3f3] border-t border-gray-200 px-4 py-2 text-xs text-gray-600 shrink-0 flex items-center gap-1">
                <span>14 elementos</span>
                <span>•</span>
                <span>Se actualizó hace unos segundos</span>
            </div>
        </div>
    );
};