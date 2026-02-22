import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { ProspectData } from '../App';
import { Settings, RefreshCw, ArrowUp, Filter } from 'lucide-react';

interface HistoryFullViewProps {
    data: ProspectData;
}

export const HistoryFullView: React.FC<HistoryFullViewProps> = ({ data }) => {
    const [historyItems, setHistoryItems] = useState<any[]>([]);

    useEffect(() => {
        const ref = db.ref(`history/${data.id}`);
        const handler = ref.orderByChild('createdAt').on('value', (snap: any) => {
            const val = snap.val();
            if (!val) { setHistoryItems([]); return; }
            const list = Object.values(val) as any[];
            // Sort descending by createdAt
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setHistoryItems(list);
        });
        return () => ref.off('value', handler);
    }, [data.id]);

    return (
        <div className="flex flex-col h-full bg-white relative font-sans text-[#181b25] overflow-hidden">
            {/* Header Section */}
            <div className="p-4 border-b border-gray-200 bg-[#f3f3f3]">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="text-[13px] text-blue-600 hover:underline mb-1 cursor-pointer">
                            Estudiantes &gt; {data.firstName} {data.lastName}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#5c6bc0] rounded-[4px] flex items-center justify-center">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">Historial de Cuenta personal</h1>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                        {historyItems.length} elementos • Ordenado por Fecha • Se actualizó hace unos instantes
                    </div>
                    <div className="flex gap-2">
                        <button className="p-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-600">
                            <Settings size={14} />
                        </button>
                        <button className="p-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-600">
                            <RefreshCw size={14} />
                        </button>
                        <button className="p-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-600">
                            <ArrowUp size={14} />
                        </button>
                        <button className="p-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-600">
                            <Filter size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#fafafa] border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-2 text-xs font-bold text-gray-600 bg-[#fafafa]"></th>
                            <th className="px-4 py-2 text-xs font-bold text-gray-600 bg-[#fafafa] cursor-pointer hover:underline">
                                Fecha <ChevronDown className="inline ml-1" size={14} />
                            </th>
                            <th className="px-4 py-2 text-xs font-bold text-gray-600 bg-[#fafafa] cursor-pointer hover:underline">
                                Campo <ChevronDown className="inline ml-1" size={14} />
                            </th>
                            <th className="px-4 py-2 text-xs font-bold text-gray-600 bg-[#fafafa] cursor-pointer hover:underline">
                                Usuario <ChevronDown className="inline ml-1" size={14} />
                            </th>
                            <th className="px-4 py-2 text-xs font-bold text-gray-600 bg-[#fafafa] cursor-pointer hover:underline">
                                Valor original <ChevronDown className="inline ml-1" size={14} />
                            </th>
                            <th className="px-4 py-2 text-xs font-bold text-gray-600 bg-[#fafafa] cursor-pointer hover:underline">
                                Valor nuevo <ChevronDown className="inline ml-1" size={14} />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {historyItems.map((item, index) => (
                            <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 text-[13px] text-gray-800">
                                <td className="px-4 py-2 text-gray-500 w-8">{index + 1}</td>
                                <td className="px-4 py-2">{item.date}</td>
                                <td className="px-4 py-2">{item.field}</td>
                                <td className="px-4 py-2 text-blue-600 hover:underline cursor-pointer">{item.user}</td>
                                <td className="px-4 py-2">{item.original || ''}</td>
                                <td className="px-4 py-2">{item.new || ''}</td>
                            </tr>
                        ))}
                        {historyItems.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500 text-sm">
                                    No hay registros de historial.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ChevronDown = ({ className, size }: { className?: string, size?: number }) => (
    <svg className={className} width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);
