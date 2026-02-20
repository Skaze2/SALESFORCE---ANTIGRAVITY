import React from 'react';
import { RefreshCw, ChevronDown, Info, Maximize2, User } from 'lucide-react';

const CardHeader: React.FC<{ title: string; subtitle?: string; isDark?: boolean; onRefresh?: () => void }> = ({ title, subtitle, isDark, onRefresh }) => (
    <div className={`flex justify-between items-start mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
        <div>
            <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{title}</h3>
            {subtitle && <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{subtitle}</p>}
        </div>
        <div className="flex gap-2">
            <button className={`p-1 rounded hover:bg-white/10 ${isDark ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                <RefreshCw size={14} />
            </button>
            <button className={`p-1 rounded hover:bg-white/10 ${isDark ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                <Maximize2 size={14} />
            </button>
        </div>
    </div>
);

const BarChartRow: React.FC<{ label: string; value: string; width: string; icon?: boolean; photo?: string }> = ({ label, value, width, icon, photo }) => (
    <div className="flex items-center gap-2 mb-3 text-sm">
        <div className="w-32 text-right text-gray-600 truncate text-xs font-medium flex justify-end items-center gap-2">
            {label}
            {photo ? (
                <img src={photo} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : icon ? (
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white"><User size={12}/></div>
            ) : null}
        </div>
        <div className="flex-1 relative h-6 bg-gray-100 rounded-sm overflow-hidden flex items-center">
            <div className="h-full bg-[#f3d578] rounded-r-sm" style={{ width: width }}></div>
            <span className="absolute right-2 text-xs font-bold text-gray-700">{value}</span>
        </div>
    </div>
);

const DarkChartRow: React.FC<{ label: string; value: string; count: string; width: string }> = ({ label, value, count, width }) => (
    <div className="mb-3">
        <div className="flex justify-between text-xs text-white mb-1">
            <span>{label}</span>
            <span>{count}</span>
        </div>
        <div className="h-5 bg-[#16325c] relative rounded-sm">
            <div className="h-full bg-[#f3d578]" style={{ width: width }}></div>
             <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-black">{value}</span>
        </div>
    </div>
);

export const Dashboard: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-[#eef1f6] overflow-y-auto">
            {/* --- Dashboard Header --- */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm sticky top-0 z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#3c5e96] rounded flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Panel</div>
                            <h1 className="text-xl font-bold text-gray-800">Recaudo Por Lobo - Ingresos Alternativos</h1>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                A fecha de 4/02/2026, 10:45 a. m. <Info size={12}/> • Visualización como Camila Patarroyo
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Abrir</button>
                        <div className="flex">
                             <button className="px-4 py-1.5 bg-white border border-gray-300 rounded-l text-sm font-medium text-gray-700 hover:bg-gray-50 border-r-0">Actualizar</button>
                             <button className="px-2 py-1.5 bg-white border border-gray-300 rounded-r text-sm font-medium text-gray-700 hover:bg-gray-50"><ChevronDown size={14}/></button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-4 flex gap-4 bg-[#f3f3f3] p-2 rounded border border-gray-200">
                    <div className="flex-1 bg-white border border-gray-300 rounded px-3 py-1 relative">
                        <label className="text-[10px] text-gray-500 block">Fecha de Pago</label>
                        <div className="flex justify-between items-center text-sm">
                            <span>es igual a Este Mes</span>
                            <ChevronDown size={12} className="text-gray-500" />
                        </div>
                    </div>
                    <div className="flex-1 bg-white border border-gray-300 rounded px-3 py-1 relative">
                        <label className="text-[10px] text-gray-500 block">Grupo</label>
                        <div className="flex justify-between items-center text-sm">
                            <span>Todos</span>
                            <ChevronDown size={12} className="text-gray-500" />
                        </div>
                    </div>
                    <div className="flex-1 bg-white border border-gray-300 rounded px-3 py-1 relative">
                        <label className="text-[10px] text-gray-500 block">Numero de Factura</label>
                         <div className="flex justify-between items-center text-sm">
                            <span>Todos</span>
                            <ChevronDown size={12} className="text-gray-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Body Content --- */}
            <div className="p-2 grid grid-cols-3 gap-2 pb-10">
                
                {/* 1. Cash por Lobo */}
                <div className="bg-white p-4 rounded border border-gray-200 shadow-sm col-span-1">
                    <CardHeader title="Cash por Lobo" subtitle="Suma de Payment amount USD" />
                    <div className="mt-4 space-y-4">
                        <BarChartRow label="Esneider Melo" value="$997" width="100%" photo="https://randomuser.me/api/portraits/men/32.jpg" />
                        <BarChartRow label="Doris Garcia" value="$698" width="70%" icon />
                        <BarChartRow label="Nidya Rodriguez" value="$666" width="65%" icon />
                        <BarChartRow label="Diego Gomez" value="$564" width="55%" photo="https://randomuser.me/api/portraits/men/45.jpg" />
                        <BarChartRow label="Erika Uchuvo" value="$530" width="50%" photo="https://randomuser.me/api/portraits/women/44.jpg" />
                        <BarChartRow label="Claudia Salamanca" value="$499" width="48%" icon />
                        <BarChartRow label="Johan Moreno" value="$499" width="48%" icon />
                        <BarChartRow label="Miguel Jovien" value="$217" width="20%" icon />
                        <BarChartRow label="Andrea Barrios" value="$166" width="15%" icon />
                        <BarChartRow label="Tania Rincon" value="$150" width="12%" icon />
                    </div>
                    <div className="mt-4 pt-2 border-t border-gray-100">
                        <a href="#" className="text-xs text-blue-600 hover:underline">Ver informe (TotalInvoices Zuora - Ingresos Alternativ)</a>
                    </div>
                </div>

                {/* Middle Column */}
                <div className="col-span-1 flex flex-col gap-2">
                    {/* 2. Mis ventas - Cash */}
                    <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex-1 flex flex-col">
                        <CardHeader title="Mis ventas - Cash" />
                        <div className="flex-1 flex items-center justify-center">
                            <span className="text-8xl font-medium text-[#c23934]">$0</span>
                        </div>
                         <div className="mt-2 text-right text-[10px] text-gray-400">A fecha de 4/02/2026, 10:45 a. m.</div>
                         <div className="mt-auto border-t border-gray-100 pt-2">
                            <a href="#" className="text-xs text-blue-600 hover:underline">Ver informe (Mis ventas Zuora - Ingre...</a>
                         </div>
                    </div>

                     {/* 3. Mis ventas # */}
                     <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex-1 flex flex-col">
                        <CardHeader title="Mis ventas #" />
                        <div className="flex-1 flex items-center justify-center">
                            <span className="text-8xl font-medium text-[#c23934]">0</span>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="col-span-1 flex flex-col gap-2">
                     {/* 4. Ventas por Grupo (Dark) */}
                    <div className="bg-[#0b2347] p-4 rounded border border-gray-800 shadow-sm h-64">
                         <CardHeader title="Ventas por Grupo" isDark />
                         <div className="flex h-40 items-end gap-8 px-4 justify-center">
                            <div className="flex flex-col items-center w-full">
                                <div className="w-full bg-[#f3d578] h-32 relative group">
                                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-white text-xs">$4.768</span>
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <span className="text-white text-xs mt-2">Cross - Delta</span>
                            </div>
                            <div className="flex flex-col items-center w-12">
                                <div className="w-full bg-[#f3d578] h-6 relative group">
                                     <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-white text-xs">$217</span>
                                </div>
                                <span className="text-white text-xs mt-2 text-center leading-tight">Cross - Ragnarok</span>
                            </div>
                         </div>
                    </div>

                    {/* 5. Mis ventas con Devolución - Zuora */}
                    <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex-1 flex flex-col">
                        <CardHeader title="Mis ventas con Devolución - Zuora" />
                         <div className="flex-1 flex items-center justify-center">
                            <span className="text-8xl font-medium text-[#c23934]">25</span>
                        </div>
                         <div className="mt-2 text-right text-[10px] text-gray-400">A fecha de 4/02/2026, 10:45 a. m.</div>
                         <div className="mt-auto border-t border-gray-100 pt-2">
                            <a href="#" className="text-xs text-blue-600 hover:underline">Ver informe (Mis ventas nuevas con...</a>
                         </div>
                    </div>
                </div>

                {/* Row 2: Tables & More Charts */}
                
                {/* 6. Ventas por Lobo - Adquisiciones (Table) */}
                <div className="bg-white p-0 rounded border border-gray-200 shadow-sm col-span-1 h-96 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-base font-semibold text-gray-800">Ventas por Lobo</h3>
                        <p className="text-xs text-blue-600">Adquisiciones</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="p-2 text-xs font-bold text-gray-600 border-b border-gray-200">Nombre</th>
                                    <th className="p-2 text-xs font-bold text-gray-600 border-b border-gray-200">Team</th>
                                    <th className="p-2 text-xs font-bold text-gray-600 border-b border-gray-200 text-right">Valor</th>
                                    <th className="p-2 text-xs font-bold text-gray-600 border-b border-gray-200 text-center">#</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: 'Paula Hurtado', team: 'Self', val: '$1.366', count: 9 },
                                    { name: 'Jenny Leon', team: 'Adq - Lion', val: '$201', count: 6 },
                                    { name: 'Leonardo Pena', team: 'Adq - Lion', val: '$85', count: 4 },
                                    { name: 'Julian Forero', team: 'Adq - Imparabl', val: '$145', count: 4, photo: 'https://randomuser.me/api/portraits/men/11.jpg' },
                                    { name: 'Jeffrey Hernandez', team: 'Adq - Invictus', val: '$85', count: 4 },
                                    { name: 'Heiddy Camacho', team: 'Adq - Fenix', val: '$104', count: 4 },
                                    { name: 'Edwin Riano', team: 'Adq - Spartans', val: '$124', count: 4 },
                                    { name: 'Edward Ramirez', team: 'Adq - Fenix', val: '$86', count: 4, photo: 'https://randomuser.me/api/portraits/men/22.jpg' },
                                    { name: 'Adriana Albornoz', team: 'Adq - Titans', val: '$100', count: 4 },
                                    { name: 'Stefanny Rodriguez', team: 'Adq - Dynamo', val: '$71', count: 3 },
                                    { name: 'Maria Suarez', team: 'Adq - Spartans', val: '$93', count: 3 },
                                ].map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 text-xs">
                                        <td className="p-2 flex items-center gap-2">
                                            {row.photo ? <img src={row.photo} className="w-5 h-5 rounded-full" /> : <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-white"><User size={10}/></div>}
                                            <span className="text-blue-600 truncate max-w-[80px]">{row.name}</span>
                                        </td>
                                        <td className="p-2 text-gray-600 truncate max-w-[80px]">{row.team}</td>
                                        <td className="p-2 text-right bg-teal-50 text-gray-800">{row.val}</td>
                                        <td className="p-2 text-center text-blue-600">{row.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     <div className="p-2 border-t border-gray-100">
                        <a href="#" className="text-xs text-blue-600 hover:underline">Ver informe (Ventas por Grupo - Lobos)</a>
                    </div>
                </div>

                 {/* 7. Mis ventas - Zuora */}
                <div className="bg-white p-4 rounded border border-gray-200 shadow-sm col-span-1 h-96 flex flex-col">
                     <CardHeader title="Mis ventas - Zuora" subtitle="Cash - Factura 1" />
                     <div className="flex-1 relative border-l border-b border-gray-300 ml-8 mb-6 mt-4">
                        {/* Y Axis Labels */}
                        <div className="absolute -left-10 top-0 text-[10px] text-gray-500">$300</div>
                        <div className="absolute -left-10 top-1/3 text-[10px] text-gray-500">$200</div>
                        <div className="absolute -left-10 top-2/3 text-[10px] text-gray-500">$100</div>
                        <div className="absolute -left-8 bottom-0 text-[10px] text-gray-500">$0</div>
                        
                        {/* Grid Lines */}
                        <div className="absolute w-full h-px bg-gray-100 top-0"></div>
                        <div className="absolute w-full h-px bg-gray-100 top-1/3"></div>
                        <div className="absolute w-full h-px bg-gray-100 top-2/3"></div>

                        {/* Bar */}
                        <div className="absolute bottom-0 left-1/4 w-1/2 bg-[#f3d578] h-[82%] transition-all hover:opacity-90 cursor-pointer flex justify-center">
                            <span className="text-xs font-bold mt-2">$247</span>
                        </div>
                     </div>
                     <div className="text-center text-xs text-gray-600">Bootcamp</div>
                </div>

                {/* 8. Ventas por Grupo - Adquisiciones (Dark List) */}
                <div className="bg-[#0b2347] p-4 rounded border border-gray-800 shadow-sm col-span-1 h-96 overflow-y-auto">
                    <CardHeader title="Ventas por Grupo - Adquisiciones" subtitle="Recuento de registros" isDark />
                    <div className="mt-2 space-y-1">
                         <DarkChartRow label="Adq - Fenix" count="25" value="25" width="100%" />
                         <DarkChartRow label="Adq - Titans" count="23" value="23" width="92%" />
                         <DarkChartRow label="Adq - Lions" count="20" value="20" width="80%" />
                         <DarkChartRow label="Adq - Imparables" count="18" value="18" width="72%" />
                         <DarkChartRow label="Adq - Spartans" count="16" value="16" width="64%" />
                         <DarkChartRow label="Adq - Avengers" count="13" value="13" width="52%" />
                         <DarkChartRow label="Self" count="10" value="10" width="40%" />
                         <DarkChartRow label="Adq - Sharks" count="9" value="9" width="36%" />
                         <DarkChartRow label="Adq - Elite" count="8" value="8" width="32%" />
                         <DarkChartRow label="Adq - Dynamo" count="7" value="7" width="28%" />
                    </div>
                </div>

                {/* Row 3: Bottom Full Width or split */}
                 
                {/* 9. Mis ventas por País (Dark) */}
                 <div className="bg-[#0b2347] p-4 rounded border border-gray-800 shadow-sm col-span-1 h-64">
                    <CardHeader title="Mis ventas por País" isDark />
                    <div className="mt-4">
                        <div className="text-xs text-gray-300 mb-1 flex justify-between px-2">
                             <span>País</span>
                             <span>Recuento de registros</span>
                        </div>
                        <div className="flex">
                            <div className="w-20 text-xs text-white pt-8">Colombia</div>
                            <div className="flex-1 h-32 border-l border-b border-gray-600 relative">
                                <div className="absolute bottom-0 left-0 h-[80%] w-full bg-[#f3d578] opacity-90"></div>
                                <span className="absolute right-2 bottom-1/2 text-white text-xs">1</span>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* 10. Tareas de hoy */}
                 <div className="bg-white p-0 rounded border border-gray-200 shadow-sm col-span-2 h-64 flex flex-col">
                    <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800">Tareas de hoy</span>
                            <ChevronDown size={14} className="text-gray-500"/>
                        </div>
                    </div>
                    <div className="flex-1 p-4">
                         <div className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" />
                            <div className="text-sm">
                                <a href="#" className="text-blue-600 hover:underline">Agenda</a>
                                <div className="text-xs text-gray-500">
                                    <span className="text-red-600">Vencida</span> • 
                                    <a href="#" className="text-blue-600 ml-1">DUILIO Florez</a>
                                </div>
                            </div>
                         </div>
                    </div>
                    <div className="p-2 border-t border-gray-100 text-center">
                        <a href="#" className="text-sm text-blue-600 hover:underline">Ver todos</a>
                    </div>
                 </div>

            </div>
        </div>
    );
};