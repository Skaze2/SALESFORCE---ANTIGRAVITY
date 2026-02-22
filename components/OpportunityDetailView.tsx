import React, { useState, useEffect } from 'react';
import { X, Lock, Info, Check, AlertCircle } from 'lucide-react';
import { db } from '../firebaseConfig';
import { CheckoutModal } from './CheckoutModal';

interface OpportunityDetailViewProps {
    opportunity: any;
    onClose: () => void;
}

// Helper temporal (Movido arriba para evitar crashes de Vite Fast Refresh)
const CheckIcon = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

export const OpportunityDetailView: React.FC<OpportunityDetailViewProps> = ({ opportunity, onClose }) => {
    const [showLinkPopup, setShowLinkPopup] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [activeCheckoutData, setActiveCheckoutData] = useState<any>(null);

    // Fetch checkout data if available (using common pattern for this app)
    useEffect(() => {
        // We need the parent prospect ID if we want to fetch the checkout snapshot
        // For now, if the opportunity has its own checkout snapshot or we use the linked paymentLink
        // The user wants it based on FIGMA/Image which shows a static URL if not dynamic.
        // Let's try to find it by prospectId if we had it, but for opportunity view we'll use the opportunity data.
    }, []);

    const paymentLink = opportunity?.paymentLink || "https://smartbeemo.com/checkout/?subscriptionid=8a36979b9c76bae7019c86b4a8bd1212";

    return (
        <div className="flex flex-col h-full bg-[#f3f2f2] overflow-y-auto">
            {/* Cabecera Principal */}
            <div className="bg-white border border-gray-300 shadow-sm p-4 m-4 mb-2 rounded-md">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-[#f27a4e] flex items-center justify-center shrink-0">
                            {/* Icono Oportunidad */}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 20h20" />
                                <path d="M4 20v-9l4 3 4-7 4 7 4-3v9" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-[11px] text-gray-500 uppercase tracking-wide">Oportunidad</div>
                            <h1 className="text-xl font-bold text-[#181818]">{opportunity?.name || 'Opp Adquisicion prueba veinte/2026-02-21 23:57:13Z'}</h1>
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={() => setShowLinkPopup(true)}
                            className="px-4 py-1.5 border border-gray-300 rounded text-sm text-[#0070d2] bg-white hover:bg-gray-50 transition-colors"
                        >
                            Link de pago
                        </button>
                    </div>
                </div>

                {/* Resumen Numerico Superior */}
                <div className="flex gap-16 mt-5 pt-0">
                    <div>
                        <div className="text-[11px] text-gray-500 mb-0.5">Tipo de Pago</div>
                        <div className="text-sm text-[#181818]">Cuotas</div>
                    </div>
                    <div>
                        <div className="text-[11px] text-gray-500 mb-0.5">Monto final moneda local</div>
                        <div className="text-sm text-[#181818]">{opportunity?.formattedAmount || '1.199.000,00'}</div>
                    </div>
                    <div>
                        <div className="text-[11px] text-gray-500 mb-0.5">Moneda Local</div>
                        <div className="text-sm text-[#181818]">{opportunity?.currency || 'COP'}</div>
                    </div>
                    <div>
                        <div className="text-[11px] text-gray-500 mb-0.5">Importe</div>
                        <div className="text-sm text-[#181818]">$ {opportunity?.amount || '420.79'}</div>
                    </div>
                    <div>
                        <div className="text-[11px] text-gray-500 mb-0.5">Fecha de cierre</div>
                        <div className="text-sm text-[#181818]">{opportunity?.closeDate || '21/02/2026'}</div>
                    </div>
                </div>
            </div>

            {/* Stepper (PathBar Placeholder) */}
            <div className="bg-white p-3 mx-4 rounded-md shadow-sm border border-gray-300 flex items-center justify-between">
                <div className="flex-1 flex gap-1 text-sm text-center font-medium mr-4">
                    <div
                        className="flex-1 bg-[#7b93ff] text-white py-1.5 flex items-center justify-center cursor-pointer"
                        style={{ clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)' }}
                    >
                        <CheckIcon size={16} />
                    </div>
                    <div
                        className="flex-[1.2] bg-[#0a234f] text-white py-1.5 flex items-center justify-center cursor-pointer"
                        style={{ clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)' }}
                    >
                        <span className="pl-3">Pendiente de Pago</span>
                    </div>
                    <div
                        className="flex-1 bg-[#f3f3f3] text-[#181818] py-1.5 flex items-center justify-center cursor-not-allowed rounded-r-[4px]"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 14px 50%)' }}
                    >
                        <span className="pl-3">Cerrada</span>
                    </div>
                </div>
                <button className="px-5 py-1.5 bg-[#155cb4] text-white rounded text-sm font-medium hover:bg-[#104b96] transition-colors flex items-center gap-2 shrink-0">
                    <CheckIcon size={16} /> Marcar Etapa como completada(o)
                </button>
            </div>

            {/* Related Lists Strip */}
            <div className="bg-white border border-gray-300 shadow-sm p-3 mx-4 mt-2 mb-2 rounded-md flex flex-wrap gap-x-6 gap-y-3">
                {[
                    { label: "Notas y archivos adjunto...", icon: "📄", color: "bg-[#7e859e]" },
                    { label: "Productos (0)", icon: "📦", color: "bg-[#e26742]" },
                    { label: "Facturas (0)", icon: "🏷️", color: "bg-[#e78065]" },
                    { label: "Casos (0)", icon: "💼", color: "bg-[#f17ca3]" },
                    { label: "Funciones de contactos (...", icon: "👥", color: "bg-[#6870df]" },
                    { label: "Notas (0)", icon: "📝", color: "bg-[#a51a4f]" },
                    { label: "Archivos (0)", icon: "📎", color: "bg-[#7e859e]" },
                    { label: "Historial de campos de o...", icon: "🕒", color: "bg-[#e26742]" },
                    { label: "Controles de auditoría (0)", icon: "🛡️", color: "bg-[#ee6b78]" },
                    { label: "Casos (Oportunidad Rela...", icon: "💼", color: "bg-[#f17ca3]" },
                    { label: "Historial de aprobacione...", icon: "✅", color: "bg-[#e26742]" },
                    { label: "Subscriptions (1)", icon: "🔁", color: "bg-[#7e859e]" },
                    { label: "Invoices (0)", icon: "🧾", color: "bg-[#4cc5af]" },
                    { label: "Payments (0)", icon: "💳", color: "bg-[#6870df]" },
                ].map((item, index) => (
                    <a key={index} href="#" className="flex items-center gap-1.5 text-[11px] text-[#0070d2] hover:underline whitespace-nowrap">
                        <span className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center text-white text-[9px] ${item.color}`}>
                            {item.icon}
                        </span>
                        {item.label}
                    </a>
                ))}
            </div>

            {/* Tabs and Content Area */}
            <div className="bg-white border text-[#181818] border-gray-300 shadow-sm mx-4 mb-4 rounded-md flex-1 flex flex-col">
                {/* Tabs Header */}
                <div className="flex px-4 border-b border-gray-300 text-[13px] font-medium overflow-x-auto hide-scrollbar">
                    {["Detalles", "Actividad", "Contrato", "Diplomados", "Facturas", "Casos", "Estudiante Adicionales", "Historial", "Comprobante"].map((tab, idx) => (
                        <button
                            key={idx}
                            className={`px-4 py-3 whitespace-nowrap outline-none ${idx === 0 ? "border-b-[3px] border-[#0176d3] text-[#181818]" : "text-gray-600 hover:text-[#0176d3]"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content - Detalles */}
                <div className="p-4 flex-1 overflow-y-auto">
                    {/* Sección Información de Oportunidad */}
                    <div className="mb-4">
                        <button className="flex items-center gap-1.5 w-full text-left bg-gray-50 p-1.5 rounded-sm hover:bg-gray-100 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                            <span className="font-medium text-[13px]">Información de Oportunidad</span>
                        </button>

                        {/* Layout de 2 Columnas para los Campos */}
                        <div className="grid grid-cols-2 gap-x-12 mt-2 px-2">
                            {/* Columna Izquierda */}
                            <div className="flex flex-col gap-2">
                                <div className="border-b border-transparent hover:border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Nombre de la cuenta</div>
                                    <a href="#" className="text-[13px] text-[#0070d2] hover:underline">{opportunity?.accountName || 'Duvan Zamora'}</a>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">País</div>
                                    <div className="text-[13px]">Colombia</div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Fecha de cierre</div>
                                    <div className="text-[13px]">{opportunity?.closeDate || '21/02/2026'}</div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Propietario de oportunidad</div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><circle cx="12" cy="8" r="4" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /></svg>
                                        </div>
                                        <a href="#" className="text-[13px] text-[#0070d2] hover:underline">{opportunity?.creatorName || 'Duvan ponque'}</a>
                                    </div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">👤</button>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Sub Tipo Suscripcion</div>
                                    <div className="text-[13px] min-h-[20px]"></div>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Producto</div>
                                    <div className="text-[13px]">Beemo Pro - 12 meses</div>
                                </div>
                            </div>

                            {/* Columna Derecha */}
                            <div className="flex flex-col gap-2">
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Tipo de registro de la oportunidad</div>
                                    <div className="text-[13px]">Oportunidad Adquisiciones </div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">🔄</button>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <div className="text-[11px] text-gray-500">Tipo Venta</div>
                                        <div className="w-3 h-3 rounded-full bg-gray-400 text-white flex items-center justify-center text-[9px] cursor-help">i</div>
                                    </div>
                                    <div className="text-[13px]">Adquisicion</div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Tipo</div>
                                    <div className="text-[13px]">Bootcamp</div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Product type</div>
                                    <div className="text-[13px] min-h-[20px]"></div>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Sub type</div>
                                    <div className="text-[13px] min-h-[20px]"></div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Motivo de Perdida</div>
                                    <div className="text-[13px] min-h-[20px]"></div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección Información de Oferta */}
                    <div className="mb-4">
                        <button className="flex items-center gap-1.5 w-full text-left bg-white border border-[#0070d2] p-1.5 rounded-sm hover:bg-gray-50 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0070d2]">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                            <span className="font-medium text-[13px] text-[#181818]">Información de Oferta</span>
                        </button>

                        <div className="grid grid-cols-2 gap-x-12 mt-2 px-2">
                            {/* Columna Izquierda */}
                            <div className="flex flex-col gap-2">
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Ruta Oferta</div>
                                    <a href="#" className="text-[13px] text-[#0070d2] hover:underline">ROF-00004177</a>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Monto final moneda local</div>
                                    <div className="text-[13px]">{opportunity?.formattedAmount || '1.199.000,00'}</div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Pago Inicial Moneda Local</div>
                                    <div className="text-[13px]">{opportunity?.initialPayment || '119.900,00'}</div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <div className="text-[11px] text-gray-500">Moneda Local</div>
                                        <div className="w-3 h-3 rounded-full bg-gray-400 text-white flex items-center justify-center text-[9px] cursor-help">i</div>
                                    </div>
                                    <div className="text-[13px]">COP</div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                            </div>
                            {/* Columna Derecha */}
                            <div className="flex flex-col gap-2">
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Tiempo de estudio (Meses)</div>
                                    <div className="text-[13px]">12</div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Tipo de Pago</div>
                                    <div className="text-[13px]">Cuotas</div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Número de Cuotas</div>
                                    <div className="text-[13px]">12</div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Monto Cuota Moneda Local</div>
                                    <div className="text-[13px]">{opportunity?.installmentAmount || '89.925,00'}</div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección Bootcamp */}
                    <div className="mb-4">
                        <button className="flex items-center gap-1.5 w-full text-left bg-gray-50 p-1.5 rounded-sm hover:bg-gray-100 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                            <span className="font-medium text-[13px]">Bootcamp</span>
                        </button>
                        <div className="grid grid-cols-2 gap-x-12 mt-2 px-2">
                            <div className="flex flex-col gap-2">
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Bootcamp</div>
                                    <div className="text-[13px] min-h-[20px]"></div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Nombre</div>
                                    <div className="text-[13px] min-h-[20px]"></div>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Categoría</div>
                                    <div className="text-[13px] min-h-[20px]"></div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Fecha Inicio</div>
                                    <div className="text-[13px] min-h-[20px]"></div>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Fecha Fin</div>
                                    <div className="text-[13px] min-h-[20px]"></div>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Jornada</div>
                                    <div className="text-[13px] min-h-[20px]"></div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección Información de Accesos Adicionales */}
                    <div className="mb-4">
                        <button className="flex items-center gap-1.5 w-full text-left bg-gray-50 p-1.5 rounded-sm hover:bg-gray-100 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                            <span className="font-medium text-[13px]">Información de Accesos Adicionales</span>
                        </button>
                        <div className="grid grid-cols-2 gap-x-12 mt-2 px-2">
                            <div className="flex flex-col gap-2">
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Incluye Accesos Adicionales</div>
                                    <div className="text-[13px] min-h-[20px]"></div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="min-h-[20px]"></div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección System Information */}
                    <div className="mb-4">
                        <button className="flex items-center gap-1.5 w-full text-left bg-gray-50 p-1.5 rounded-sm hover:bg-gray-100 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                            <span className="font-medium text-[13px]">System Information</span>
                        </button>
                        <div className="grid grid-cols-2 gap-x-12 mt-2 px-2">
                            <div className="flex flex-col gap-2">
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Creado por</div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><circle cx="12" cy="8" r="4" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /></svg>
                                        </div>
                                        <a href="#" className="text-[13px] text-[#0070d2] hover:underline">{opportunity?.creatorName || 'Duvan ponque'}</a>
                                        <span className="text-[13px] text-gray-900">, 21/02/2026, 6:57 p. m.</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Última modificación por</div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><circle cx="12" cy="8" r="4" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /></svg>
                                        </div>
                                        <a href="#" className="text-[13px] text-[#0070d2] hover:underline">Administración Salesforce</a>
                                        <span className="text-[13px] text-gray-900">, 21/02/2026, 6:57 p. m.</span>
                                    </div>
                                </div>
                                <div className="border-b border-gray-200 pb-1 group relative">
                                    <div className="text-[11px] text-gray-500 mb-0.5">Grupo</div>
                                    <div className="text-[13px]">Lobo de adquisiciones</div>
                                    <button className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 hover:text-gray-700">✎</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Popup Centrado: Link de pago */}
            {showLinkPopup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-[700px] overflow-hidden animate-in fade-in zoom-in duration-200 border-t-[6px] border-[#ffc107]">
                        <div className="p-4 flex justify-between items-center border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 font-sans mx-auto pl-8">Link de pago</h2>
                            <button onClick={() => setShowLinkPopup(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-8 pb-10">
                            <div className="flex items-center gap-12">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-sm">
                                        <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-3xl">🐝</div>
                                    </div>
                                    <button
                                        onClick={() => { setShowLinkPopup(false); setShowCheckoutModal(true); }}
                                        className="text-[#0070d2] font-semibold text-sm hover:underline mt-2"
                                    >
                                        Link
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[#ffc107] text-2xl font-bold mb-4">Link de pago</h3>
                                    <div className="bg-white border border-gray-200 rounded px-4 py-3 text-gray-600 text-sm break-all font-mono">
                                        {paymentLink}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setShowLinkPopup(false)}
                                className="px-8 py-2 bg-[#155cb4] text-white rounded font-bold text-sm hover:bg-[#104b96] transition-colors shadow-sm"
                            >
                                Finalizar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Checkout (Pantalla Completa - Unificado) */}
            <CheckoutModal
                isOpen={showCheckoutModal}
                onClose={() => setShowCheckoutModal(false)}
                data={{
                    firstName: opportunity?.firstName || '', // Opportunity might not have firstName/lastName directly if it's not the prospect object, need to ensure data source.
                    lastName: '',                             // Usually prospectName is a combined field in our data.
                    email: opportunity?.email || ''
                }}
                checkoutData={opportunity ? {
                    productName: opportunity.productName,
                    initialFee: opportunity.initialPayment,
                    quotaValue: opportunity.installmentAmount,
                    quotasCount: opportunity.quotasCount,
                    currency: opportunity.currency || 'COP',
                    nextQuotaDate: (() => {
                        const d = new Date();
                        return new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
                    })()
                } : null}
            />
        </div>
    );
};
