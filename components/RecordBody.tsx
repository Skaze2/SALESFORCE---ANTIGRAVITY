import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Settings, ChevronDown, Check, Pencil, Info, Phone, LayoutList, FileText, Monitor, Store, Music, Cpu, Building, Wrench, CreditCard, Send, Smartphone, Crown, FileCheck, PenTool, Briefcase, Trophy, Heart, List, Bell, StickyNote, File, Landmark, Building2, Plus, GripVertical, Cloud, Search, Calendar, Clock, User, X, ChevronLeft, Ticket, AlertCircle, AlertTriangle, Image as ImageIcon, History } from 'lucide-react';
import { NewNoteModal } from './NewNoteModal';
import { ProspectData, User as UserType } from '../App';
import { db } from '../firebaseConfig';

// --- Constants ---
const STEPS = ['MQL', 'SQL', 'En llamada', 'Agendado', 'Asignado'];

const SUBJECT_OPTIONS = [
    "Agenda",
    "Seguimiento Asignado",
    "Compromiso de pago",
    "Cliente: Diligenciar Sourcing Brief"
];

// --- Helper for Origin Logic ---
const getOriginByProgram = (program: string) => {
    switch (program) {
        case "Combo Tian Rodríguez": return "Tian Rodríguez";
        case "Libera tus finanzas en 6 pasos":
        case "Fundamentos de inversión y portafolio": return "MPF";
        case "Vibe Marketing": return "Juan Ads";
        case "Cash flow infinito": return "Carlos Salguero";
        case "Aprende de tus créditos y págales en tiempo récord": return "Mabel Quintero";
        default: return "MPF"; // Default Fallback
    }
};

// --- Toasts ---
const SuccessToast = ({ message, onClose }: { message?: string; onClose: () => void }) => (
    <div className="fixed top-28 left-1/2 transform -translate-x-1/2 z-[100] flex items-center justify-between gap-4 bg-[#04844b] text-white px-4 py-3 rounded shadow-lg min-w-[480px] animate-in fade-in slide-in-from-top-2 duration-300 border-none">
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0">
                <Check size={14} className="text-[#04844b]" strokeWidth={4} />
            </div>
            <span className="font-semibold text-sm tracking-wide">{message || 'Estado cambió correctamente.'}</span>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={18} />
        </button>
    </div>
);

const ErrorToast = ({ message, onClose }: { message?: string; onClose: () => void }) => (
    <div className="fixed top-28 left-1/2 transform -translate-x-1/2 z-[100] flex items-center justify-between gap-4 bg-[#c23934] text-white px-4 py-3 rounded shadow-lg min-w-[480px] animate-in fade-in slide-in-from-top-2 duration-300 border-none">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-white" />
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-sm tracking-wide">ERROR</span>
                <span className="text-xs opacity-90">
                    {message || 'No cuentas con los permisos suficientes para hacer esta accion'}
                </span>
            </div>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={18} />
        </button>
    </div>
);

// --- WIZARD DATA --- (Unchanged constants)
const PRODUCTS = [
    { id: 1, name: "Beemo Pro - 12 meses", mentor: "Beemo", start: "2 de nov de 2025", end: "" },
    { id: 2, name: "Combo Tian Rodríguez", mentor: "Tian Rodríguez", start: "2 de nov de 2025", end: "" },
    { id: 3, name: "Programa: Método C.A.D.I.", mentor: "Horacio Lezzi", start: "1 de dic de 2025", end: "" },
    { id: 4, name: "Programa: Método K2", mentor: "Tian Rodríguez", start: "1 de dic de 2025", end: "" },
    { id: 5, name: "Curso Cashflow Infinito: De 0 a 1800+ Apartamentos", mentor: "Carlos Salguero", start: "11 de dic de 2025", end: "" },
    { id: 6, name: "Combo Mis Propias Finanzas", mentor: "Juan Pablo Zuluaga", start: "12 de dic de 2025", end: "" },
    { id: 7, name: "Ruta de Patrimonio Inteligente (RPI)", mentor: "Camilo Rodríguez", start: "30 de dic de 2025", end: "" },
    { id: 8, name: "Reprogramación cuántica en 40 días", mentor: "Laura Moreno", start: "2 de ene de 2026", end: "" },
    { id: 9, name: "Curso: VIBE Marketing - Anuncios en RRSS", mentor: "Juan Osorio", start: "6 de ene de 2026", end: "" },
    { id: 10, name: "Curso: Embajadores energéticos 1.0", mentor: "Camilo Vargas", start: "23 de ene de 2026", end: "" },
    { id: 11, name: "Ideas de Negocio GANADORAS para el 2026", mentor: "Ammiel Manevich", start: "4 de feb de 2026", end: "13 de feb de 2026" },
    { id: 12, name: "Programa: Fénix Trader", mentor: "Juan Paladines", start: "4 de feb de 2026", end: "" },
    { id: 13, name: "Dropshipping: Configuración y Estrategias", mentor: "Fabián Perdomo", start: "16 de feb de 2026", end: "27 de feb de 2026" },
    { id: 14, name: "Reto China: Crea tu negocio real con China", mentor: "Daniel Molina", start: "17 de feb de 2026", end: "26 de feb de 2026" },
    { id: 15, name: "Fintech 360°: Modelos de negocio", mentor: "Diego Rodríguez", start: "17 de feb de 2026", end: "27 de feb de 2026" },
];

// COP (Colombia) — 4 offers, ordered highest → lowest price
const OFFERS_COP = [
    { id: 1, name: "Pro Pack 🎗️ Oferta Pro 1 año", total: 1599000, renovation: 0, quotas: 12, currency: 'COP' },
    { id: 2, name: "Pro Pack 🎗️ Oferta Pro 1 año", total: 1199000, renovation: 0, quotas: 12, currency: 'COP' },
    { id: 3, name: "Pro Pack 🎗️ Oferta Pro 1 año", total: 999000, renovation: 0, quotas: 12, currency: 'COP' },
    { id: 4, name: "Pro Pack 🎗️ Oferta Pro 1 año", total: 799000, renovation: 0, quotas: 12, currency: 'COP' },
];

// USD (USA / resto del mundo) — 5 offers
const OFFERS_USD = [
    { id: 1, name: "Pro Pack 🎗️ Oferta Pro 1 año", total: 599, renovation: 0, quotas: 12, currency: 'USD' },
    { id: 2, name: "Pro Pack 🎗️ Oferta Pro 1 año", total: 499, renovation: 0, quotas: 12, currency: 'USD' },
    { id: 3, name: "Pro Pack 🎗️ Oferta Pro 1 año", total: 399, renovation: 0, quotas: 12, currency: 'USD' },
    { id: 4, name: "Pro Pack 🎗️ Oferta Pro 1 año", total: 299, renovation: 0, quotas: 12, currency: 'USD' },
    { id: 5, name: "Pro Pack 🎗️ Oferta Pro 1 año", total: 229, renovation: 0, quotas: 12, currency: 'USD' },
];

// MXN (México) — 5 offers
const OFFERS_MXN = [
    { id: 1, name: "Pro Pack 🎗️ Oferta Pro 1 año", total: 9999, renovation: 0, quotas: 12, currency: 'MXN' },
    { id: 2, name: "Pro Pack 🎗️ Oferta Pro 1 año", total: 8499, renovation: 0, quotas: 12, currency: 'MXN' },
    { id: 3, name: "Pro Pack 🎗️ Oferta Pro 1 año", total: 6799, renovation: 0, quotas: 12, currency: 'MXN' },
    { id: 4, name: "Pro Pack 🎗️ Oferta Pro 1 año", total: 4999, renovation: 0, quotas: 12, currency: 'MXN' },
    { id: 5, name: "Pro Pack 🎗️ Oferta Pro 1 año", total: 4499, renovation: 0, quotas: 12, currency: 'MXN' },
];

const generateTimeSlots = () => {
    const slots = [];
    const periods = ['a. m.', 'p. m.'];
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 15) {
            const period = i < 12 ? periods[0] : periods[1];
            let hour = i % 12;
            if (hour === 0) hour = 12;
            const minute = j === 0 ? '00' : j;
            slots.push(`${hour}:${minute} ${period}`);
        }
    }
    return slots;
};

const TIME_SLOTS = generateTimeSlots();

const getBogotaTime = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Bogota',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);

    let hour = parseInt(parts.find(p => p.type === 'hour')?.value || '12');
    let minute = parseInt(parts.find(p => p.type === 'minute')?.value || '00');
    let dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value || 'AM';

    let roundedMinute = 0;
    if (minute < 8) roundedMinute = 0;
    else if (minute < 23) roundedMinute = 15;
    else if (minute < 38) roundedMinute = 30;
    else if (minute < 53) roundedMinute = 45;
    else {
        roundedMinute = 0;
        hour += 1;
        if (hour === 12) dayPeriod = dayPeriod === 'AM' ? 'PM' : 'AM';
        else if (hour === 13) hour = 1;
    }

    const periodStr = dayPeriod === 'AM' ? 'a. m.' : 'p. m.';
    const minStr = roundedMinute === 0 ? '00' : roundedMinute.toString();
    return `${hour}:${minStr} ${periodStr}`;
};

// --- Custom Calendar Component ---
const CustomCalendar = ({ onSelect, onClose, initialDate }: { onSelect: (date: string) => void, onClose: () => void, initialDate: string }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDateStr, setSelectedDateStr] = useState(initialDate);

    useEffect(() => {
        if (selectedDateStr) {
            const parts = selectedDateStr.split('/');
            if (parts.length === 3) {
                const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                if (!isNaN(d.getTime())) setCurrentDate(d);
            }
        }
    }, []);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const handleDateClick = (day: number) => {
        const dateStr = `${day}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
        onSelect(dateStr);
        onClose();
    };

    const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalSlots = [...blanks, ...days];

    return (
        <div className="absolute z-50 bg-white border border-gray-300 shadow-xl rounded mt-1 p-2 w-[280px] right-0 top-full">
            <div className="flex justify-between items-center mb-2 px-1">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronLeft size={16} /></button>
                <div className="font-semibold text-gray-700 text-sm">
                    {monthNames[currentDate.getMonth()]} <span className="text-gray-500">{currentDate.getFullYear()}</span>
                </div>
                <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronRight size={16} /></button>
            </div>
            <div className="grid grid-cols-7 text-center mb-1">
                {['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'].map(d => (
                    <div key={d} className="text-xs text-gray-500 font-medium py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {totalSlots.map((day, idx) => {
                    if (!day) return <div key={idx}></div>;
                    const isSelected = selectedDateStr === `${day}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
                    return (
                        <button
                            key={idx}
                            onClick={() => handleDateClick(day)}
                            className={`text-xs w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-colors ${isSelected ? 'bg-blue-700 text-white font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                            {day}
                        </button>
                    )
                })}
            </div>
            <div className="mt-2 text-center border-t border-gray-100 pt-2">
                <button
                    onClick={() => {
                        const today = new Date();
                        const str = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
                        onSelect(str);
                        onClose();
                    }}
                    className="text-xs text-blue-600 hover:underline"
                >
                    Hoy
                </button>
            </div>
        </div>
    );
};

// --- QuickLinks Component ---
const QuickLinks = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const items = [
        { icon: FileText, color: '#e5c15d', label: 'Userpilot Form Account...' },
        { icon: Monitor, color: '#9d8aee', label: 'Userpilot Interaction Acc...' },
        { icon: Store, color: '#4dbd74', label: 'Userpilot Survey Accoun...' },
        { icon: Music, color: '#f0898d', label: 'Userpilot Nps Account R...' },
        { icon: Cpu, color: '#9ccc65', label: 'Gamificaciones (0)' },
        { icon: Building, color: '#7986cb', label: 'Billing Accounts (1)' },
        { icon: Wrench, color: '#90a4ae', label: 'Subscriptions (10+)' },
        { icon: CreditCard, color: '#7986cb', label: 'Payments (0)' },
        { icon: Send, color: '#4dd0e1', label: 'Órdenes Portal (0)' },
        { icon: Smartphone, color: '#9ccc65', label: 'Prospect Interactions (0)' },
        { icon: FileText, color: '#607d8b', label: 'Quotes (0)' },
        { icon: Crown, color: '#ffb74d', label: 'Oportunidades (10+)' },
        { icon: FileCheck, color: '#4dbd74', label: 'Contratos (0)' },
        { icon: PenTool, color: '#f0898d', label: 'Facturas (0)' },
        { icon: Briefcase, color: '#f48fb1', label: 'Casos (0)' },
        { icon: Trophy, color: '#e57373', label: 'Student success (0)' },
        { icon: Heart, color: '#ef5350', label: 'Perfilamientos (0)' },
        { icon: List, color: '#5c6bc0', label: 'Historial de Cuenta pers...' },
        { icon: Bell, color: '#ef5350', label: 'Controles de auditoría (0)' },
        { icon: StickyNote, color: '#ba68c8', label: 'Notas (6)' },
        { icon: File, color: '#90a4ae', label: 'Archivos (2)' },
        { icon: Landmark, color: '#ffb74d', label: 'Pagos de Clientes (0)' },
        { icon: Building2, color: '#5c6bc0', label: 'Cuentas relacionadas (0)' },
    ];

    const INITIAL_COUNT = 14;
    const visibleItems = isExpanded ? items : items.slice(0, INITIAL_COUNT);

    return (
        <div style={{
            background: '#fff',
            borderBottom: '1px solid #dddbda',
            padding: '5px 16px',
            fontFamily: 'Salesforce Sans, Arial, sans-serif',
        }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', alignItems: 'center' }}>
                {visibleItems.map((item, index) => (
                    <a
                        key={index}
                        href="#"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            color: '#0070d2', textDecoration: 'none',
                            fontSize: '12px', whiteSpace: 'nowrap',
                            padding: '2px 0',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                    >
                        <span style={{
                            width: '16px', height: '16px',
                            background: item.color,
                            borderRadius: '2px',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <item.icon size={9} color="white" strokeWidth={2.5} />
                        </span>
                        <span>{item.label}</span>
                    </a>
                ))}

                {!isExpanded && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        style={{
                            color: '#0070d2', background: 'none', border: 'none',
                            fontSize: '12px', cursor: 'pointer', padding: '2px 0',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Mostrar todo ({items.length})
                    </button>
                )}
            </div>

            {isExpanded && (
                <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #f3f2f2', textAlign: 'center' }}>
                    <button
                        onClick={() => setIsExpanded(false)}
                        style={{ color: '#0070d2', background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                    >
                        Mostrar menos
                    </button>
                </div>
            )}
        </div>
    );
};

// --- PathBar Component ---
interface PathBarProps {
    currentStep: number;
    onStepChange: (step: number) => void;
}

const PathBar: React.FC<PathBarProps> = ({ currentStep, onStepChange }) => {
    const [selectedStep, setSelectedStep] = useState(currentStep);

    useEffect(() => {
        setSelectedStep(currentStep);
    }, [currentStep]);

    const handleStepClick = (index: number) => setSelectedStep(index);
    const handleMarkAsCurrent = () => onStepChange(selectedStep);

    return (
        <div style={{ background: '#f3f2f2', borderBottom: '1px solid #dddbda', padding: '8px 16px' }}>
            <div className="flex items-center justify-between gap-3">
                {/* Chevron path bar */}
                <div className="flex flex-1 h-[30px] relative isolate">
                    {STEPS.map((step, index) => {
                        const isFirst = index === 0;
                        const isLast = index === STEPS.length - 1;
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;
                        const isSelected = index === selectedStep;

                        // Color logic
                        let bg = '#e0dedc';           // unvisited gray
                        let textColor = '#706e6b';

                        if (isSelected && isCompleted) {
                            bg = '#1b3a6b'; textColor = '#fff';
                        } else if (isSelected && isCurrent) {
                            bg = '#1b3a6b'; textColor = '#fff';
                        } else if (isSelected) {
                            bg = '#1b3a6b'; textColor = '#fff';
                        } else if (isCompleted) {
                            bg = '#5b7ecc'; textColor = '#fff';
                        } else if (isCurrent) {
                            bg = '#ffffff'; textColor = '#1b3a6b';
                        }

                        const clipPath = isFirst
                            ? 'polygon(0% 0%, 93% 0%, 100% 50%, 93% 100%, 0% 100%)'
                            : isLast
                                ? 'polygon(8% 0%, 100% 0%, 100% 100%, 8% 100%, 0% 50%)'
                                : 'polygon(8% 0%, 93% 0%, 100% 50%, 93% 100%, 8% 100%, 0% 50%)';

                        return (
                            <div
                                key={step}
                                onClick={() => handleStepClick(index)}
                                className="flex-1 flex items-center justify-center cursor-pointer group transition-all"
                                style={{
                                    background: bg,
                                    color: textColor,
                                    clipPath,
                                    zIndex: 50 - index,
                                    marginLeft: isFirst ? 0 : '-10px',
                                    border: isCurrent && !isSelected ? '1px solid #c9c7c5' : 'none',
                                }}
                            >
                                {isCompleted && !isSelected ? (
                                    <span className="block group-hover:hidden"><Check size={14} strokeWidth={3} /></span>
                                ) : null}
                                <span
                                    className={`text-xs ${isSelected || isCurrent ? 'font-bold' : 'font-medium'
                                        } ${isCompleted && !isSelected ? 'hidden group-hover:block' : ''}`}
                                >
                                    {step}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Action button */}
                <button
                    onClick={handleMarkAsCurrent}
                    style={{
                        background: '#16325c', color: '#fff', fontSize: '12px', fontWeight: 700,
                        border: 'none', borderRadius: '4px', padding: '0 12px', whiteSpace: 'nowrap',
                        height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                        flexShrink: 0,
                    }}
                >
                    <Check size={13} strokeWidth={3} />
                    {selectedStep !== currentStep ? 'Marcar como actual' : 'Marcar como completado'}
                </button>
            </div>
        </div>
    );
};

// --- TabBar Component ---
const TabBar = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => (
    <div style={{ background: '#fff', borderBottom: '1px solid #dddbda', padding: '0 16px' }}>
        <nav className="flex">
            {['Detalles', 'Notas', 'Archivos', 'Historial', 'Pagos', 'Controles De Auditoría'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    style={{
                        padding: '10px 14px',
                        fontSize: '13px',
                        fontWeight: activeTab === tab ? 700 : 400,
                        color: activeTab === tab ? '#0070d2' : '#54698d',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === tab ? '2px solid #0070d2' : '2px solid transparent',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        marginBottom: '-1px',
                    }}
                >
                    {tab}
                </button>
            ))}
        </nav>
    </div>
);

// --- Sub-View Components ---

const DetailsTab = ({ currentStepName, data }: { currentStepName: string, data: ProspectData }) => {
    const [accInfoOpen, setAccInfoOpen] = useState(true);
    const [contactInfoOpen, setContactInfoOpen] = useState(false);

    // ── Five9 active-session detector ──────────────────────────────────────
    // If Five9 has ANY status in localStorage → user is logged in → phone is dialable
    const isFive9Active = (): boolean => {
        const s = localStorage.getItem('five9_status');
        return s !== null && s !== '';
    };
    const [five9Active, setFive9Active] = useState(isFive9Active);

    useEffect(() => {
        const sync = () => setFive9Active(isFive9Active());
        window.addEventListener('five9_status_changed', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('five9_status_changed', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);
    // ────────────────────────────────────────────────────────────────────────

    // Business Logic for Field Visibility
    const showEmail = ['En llamada', 'Agendado', 'Asignado'].includes(currentStepName);
    const showMobile = ['Agendado', 'Asignado'].includes(currentStepName);

    // Format created date
    const formattedDate = data.createdAt ? new Date(data.createdAt).toLocaleString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    }).replace(',', '') : 'N/A';

    // Calculate Origin
    const origin = getOriginByProgram(data.program);

    const FieldRow = ({ label, value, isLink = false, icon }: { label: string; value?: React.ReactNode; isLink?: boolean; icon?: React.ReactNode }) => (
        <div style={{ borderBottom: '1px solid #e0dedc', paddingBottom: '6px', marginBottom: '6px' }}>
            <div style={{ fontSize: '11px', color: '#706e6b', marginBottom: '2px' }}>{label}</div>
            {isLink
                ? <a href="#" style={{ fontSize: '13px', color: '#0070d2', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')} onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>{value}</a>
                : <div style={{ fontSize: '13px', color: '#3e3e3c', minHeight: '18px' }}>{value ?? icon}</div>
            }
        </div>
    );

    return (
        <div style={{ fontFamily: 'Salesforce Sans, Arial, sans-serif', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Account Information */}
            <div style={{ background: '#fff', border: '1px solid #dddbda', borderRadius: '4px' }}>
                <button
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', padding: '8px 12px',
                        background: '#f3f2f2', borderBottom: '1px solid #e0dedc', cursor: 'pointer',
                        border: 'none', textAlign: 'left'
                    }}
                    onClick={() => setAccInfoOpen(!accInfoOpen)}
                >
                    <ChevronRight size={14} style={{ color: '#706e6b', marginRight: '6px', transform: accInfoOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#3e3e3c' }}>Account Information</span>
                </button>

                {accInfoOpen && (
                    <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                        {/* Column 1 */}
                        <div>
                            <FieldRow label="Nombre de la cuenta"
                                value={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <span>{data.firstName} {data.lastName}</span>
                                        <Pencil size={11} style={{ color: '#b0adab', cursor: 'pointer' }} />
                                    </div>
                                }
                            />
                            {showEmail && <FieldRow label="Correo electrónico" value={data.email} isLink />}
                            {showMobile && (
                                <FieldRow label="Móvil" value={
                                    five9Active ? (
                                        // ── Five9 active: blue clickable link → triggers dial ──
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Phone size={11} style={{ color: '#0070d2' }} fill="#0070d2" />
                                            <a
                                                href="#"
                                                style={{ color: '#0070d2', fontSize: '13px' }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const fullNumber = `${data.phoneCode}${data.phone}`;
                                                    window.dispatchEvent(
                                                        new CustomEvent('five9:dial', { detail: { number: fullNumber } })
                                                    );
                                                }}
                                            >
                                                {data.phoneCode}{data.phone}
                                            </a>
                                        </span>
                                    ) : (
                                        // ── Five9 inactive: plain black text, no interaction ──
                                        <span style={{ color: '#3e3e3c', fontSize: '13px' }}>
                                            {data.phoneCode}{data.phone}
                                        </span>
                                    )
                                } />
                            )}
                            <FieldRow label="Teléfono" />
                            <FieldRow label="UTM_source" value={'Analytics'} />
                            <FieldRow label="Landing de origen" icon={<Info size={12} style={{ color: '#b0adab', display: 'inline' }} />} />
                        </div>
                        {/* Column 2 */}
                        <div>
                            <FieldRow label="Propietario de la cuenta" value={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ width: '18px', height: '18px', background: '#e8e3ff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>👤</span>
                                        <a href="#" style={{ color: '#0070d2', fontSize: '13px' }}>{data.owner || 'Camila Patarroyo'}</a>
                                    </span>
                                    <div style={{ background: '#fff', border: '1px solid #dddbda', borderRadius: '50%', padding: '2px', cursor: 'pointer' }}><Settings size={10} style={{ color: '#706e6b' }} /></div>
                                </div>
                            } />
                            <FieldRow label="Código único" value={<span style={{ color: '#c23934' }}>📌</span>} />
                            <FieldRow label="Origen del candidato" value={origin} />
                            <FieldRow label="Fecha de Creación" value={formattedDate} />
                            <FieldRow label="UTM_campaign" value={'paid-social-media / meta-ads'} />
                            <FieldRow label="Descripción" value={<Pencil size={11} style={{ color: '#b0adab', cursor: 'pointer' }} />} />
                        </div>
                    </div>
                )}
            </div>

            {/* Información de Contacto */}
            <div style={{ background: '#fff', border: '1px solid #dddbda', borderRadius: '4px' }}>
                <button
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', padding: '8px 12px',
                        background: '#f3f2f2', borderBottom: contactInfoOpen ? '1px solid #e0dedc' : 'none',
                        cursor: 'pointer', border: 'none', textAlign: 'left'
                    }}
                    onClick={() => setContactInfoOpen(!contactInfoOpen)}
                >
                    <ChevronRight size={14} style={{ color: '#706e6b', marginRight: '6px', transform: contactInfoOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#3e3e3c' }}>Información de Contacto</span>
                </button>
                {contactInfoOpen && <div style={{ padding: '16px', color: '#706e6b', fontSize: '12px' }}>Sin información de contacto adicional.</div>}
            </div>

            {/* System Information */}
            <div style={{ background: '#fff', border: '1px solid #dddbda', borderRadius: '4px' }}>
                <button
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', padding: '8px 12px',
                        background: '#f3f2f2', cursor: 'pointer', border: 'none', textAlign: 'left'
                    }}
                    onClick={() => { }}
                >
                    <ChevronRight size={14} style={{ color: '#706e6b', marginRight: '6px', transform: 'rotate(90deg)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#3e3e3c' }}>System Information</span>
                </button>
                <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                    <FieldRow label="Creado por" value={
                        <span style={{ fontSize: '12px', color: '#3e3e3c' }}>
                            <a href="#" style={{ color: '#0070d2' }}>Administracion Salesforce</a> · {formattedDate}
                        </span>
                    } />
                    <FieldRow label="Última modificación" value={
                        <span style={{ fontSize: '12px', color: '#3e3e3c' }}>
                            <a href="#" style={{ color: '#0070d2' }}>{data.owner || 'Kevin Matute'}</a> · {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                    } />
                </div>
            </div>
        </div>
    );
};

// --- Additional Tabs Components ---

const NotesTab = ({ notes, onOpenNewNote }: { notes: any[], onOpenNewNote: () => void }) => {
    return (
        <div className="bg-white rounded border border-gray-200 shadow-sm">
            <div className="p-3 bg-[#f3f3f3] border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#ba68c8] rounded-[2px] flex items-center justify-center">
                        <StickyNote size={14} className="text-white" />
                    </div>
                    <span className="font-bold text-sm text-gray-800">Notas ({notes.length}{notes.length > 0 ? '+' : ''})</span>
                </div>
                <button
                    onClick={onOpenNewNote}
                    className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                    Nuevo
                </button>
            </div>

            {notes.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center text-gray-400">
                    <StickyNote size={36} className="mb-3 text-gray-300" />
                    <p className="text-sm">No hay notas todavía.</p>
                    <p className="text-xs mt-1">Haz clic en <strong>Nuevo</strong> para crear la primera.</p>
                </div>
            ) : (
                <div className="p-4 grid grid-cols-2 gap-6">
                    {notes.map((note: any, idx: number) => (
                        <div key={idx} className="border-b border-gray-100 pb-3 last:border-0">
                            <a href="#" className="text-sm text-blue-600 hover:underline font-bold block mb-0.5">{note.title}</a>
                            <div className="text-xs text-gray-500 mb-1">
                                {note.date} por <a href="#" className="text-blue-600 hover:underline">{note.user}</a>
                            </div>
                            <div className="text-sm text-gray-800">{note.body}</div>
                        </div>
                    ))}
                </div>
            )}

            {notes.length > 0 && (
                <div className="p-2 border-t border-gray-200 text-center">
                    <a href="#" className="text-sm text-blue-600 hover:underline">Ver todos</a>
                </div>
            )}
        </div>
    );
};

const FilesTab = () => {
    return (
        <div className="bg-white rounded border border-gray-200 shadow-sm">
            <div className="p-3 bg-[#f3f3f3] border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#90a4ae] rounded-[2px] flex items-center justify-center">
                        <File size={14} className="text-white" />
                    </div>
                    <span className="font-bold text-sm text-gray-800">Archivos (2)</span>
                </div>
                <button className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50">
                    Agregar archivos
                </button>
            </div>
            <div className="grid grid-cols-2">
                <div className="p-3 flex items-start gap-3 border-r border-gray-100 border-b border-gray-100">
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center shrink-0">
                        <ImageIcon size={16} className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                        <a href="#" className="text-sm text-blue-600 hover:underline font-medium block truncate" title="Copia de Tian Rodríguez es un reconocido mentor">Copia de Tian Rodríguez es un reconocido men...</a>
                        <div className="text-xs text-gray-500 mt-0.5">19/01/2026 • 3,5MB • png</div>
                    </div>
                </div>
                <div className="p-3 flex items-start gap-3 border-b border-gray-100">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <div className="font-bold text-[10px] flex items-center gap-0.5">
                            <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-black">🐝</div>
                        </div>
                    </div>
                    <div className="min-w-0">
                        <a href="#" className="text-sm text-blue-600 hover:underline font-medium block truncate">Beemo PNG</a>
                        <div className="text-xs text-gray-500 mt-0.5">22/12/2025 • 87KB • png</div>
                    </div>
                </div>
            </div>
            <div className="p-2 border-t border-gray-200 text-center">
                <a href="#" className="text-sm text-blue-600 hover:underline">Ver todos</a>
            </div>
        </div>
    );
};

const HistoryTab = () => {
    const history = [
        { date: '5/02/2026, 12:38 a. m.', field: 'Estado', user: 'Camila Patarroyo', original: 'En llamada', new: 'SQL' },
        { date: '5/02/2026, 12:38 a. m.', field: 'Propietario de la cu...', user: 'Camila Patarroyo', original: 'Camila Patarroyo', new: 'Administracion Sale...' },
        { date: '4/02/2026, 11:58 p. m.', field: 'Estado', user: 'Camila Patarroyo', original: 'SQL', new: 'En Llamada' },
        { date: '4/02/2026, 11:58 p. m.', field: 'Propietario de la cu...', user: 'Camila Patarroyo', original: 'Administracion Sale...', new: 'Camila Patarroyo' },
        { date: '4/02/2026, 6:22 p. m.', field: 'Propietario de la cu...', user: 'Camila Patarroyo', original: 'Camila Patarroyo', new: 'Administracion Sale...' },
        { date: '4/02/2026, 6:22 p. m.', field: 'Estado', user: 'Camila Patarroyo', original: 'En llamada', new: 'SQL' },
    ];

    return (
        <div className="bg-white rounded border border-gray-200 shadow-sm">
            <div className="p-3 bg-[#f3f3f3] border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#5c6bc0] rounded-[2px] flex items-center justify-center">
                        <List size={14} className="text-white" />
                    </div>
                    <span className="font-bold text-sm text-gray-800">Historial de Cuenta personal (6+)</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f3f3f3] border-b border-gray-200">
                        <tr>
                            <th className="p-2 text-xs font-bold text-gray-600">Fecha</th>
                            <th className="p-2 text-xs font-bold text-gray-600">Campo</th>
                            <th className="p-2 text-xs font-bold text-gray-600">Usuario</th>
                            <th className="p-2 text-xs font-bold text-gray-600">Valor original</th>
                            <th className="p-2 text-xs font-bold text-gray-600">Valor nuevo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((row, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 text-xs">
                                <td className="p-2 text-gray-800 whitespace-nowrap">{row.date}</td>
                                <td className="p-2 text-gray-800">{row.field}</td>
                                <td className="p-2"><a href="#" className="text-blue-600 hover:underline">{row.user}</a></td>
                                <td className="p-2 text-gray-800">{row.original}</td>
                                <td className="p-2 text-gray-800">{row.new}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-2 border-t border-gray-200 text-center">
                <a href="#" className="text-sm text-blue-600 hover:underline">Ver todos</a>
            </div>
        </div>
    );
};

const PaymentsTab = () => {
    return (
        <div className="bg-white rounded border border-gray-200 shadow-sm">
            <div className="p-3 bg-[#f3f3f3] border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#5c6bc0] rounded-[2px] flex items-center justify-center">
                        <Building2 size={14} className="text-white" />
                    </div>
                    <span className="font-bold text-sm text-gray-800">Payments (0)</span>
                </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-center items-center">
                {/* Empty State */}
            </div>
        </div>
    );
};

const AuditTab = () => {
    return (
        <div className="bg-white rounded border border-gray-200 shadow-sm">
            <div className="p-3 bg-[#f3f3f3] border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#ef5350] rounded-[2px] flex items-center justify-center">
                        <Bell size={14} className="text-white" />
                    </div>
                    <span className="font-bold text-sm text-gray-800">Controles de auditoría (0)</span>
                </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-center items-center">
                {/* Empty State */}
            </div>
        </div>
    );
};

// --- Activity Sidebar Component ---
const ActivitySidebar: React.FC<{
    currentStepName: string;
    prospectId: string;
    currentUser: UserType;
    daysCreation: number;
    country: string;
    onTaskCreated: (subject: string) => void;
}> = ({ currentStepName, prospectId, currentUser, daysCreation, country, onTaskCreated }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);

    // --- Select offer array and formatting based on prospect country ---
    const isColombia = country === 'Colombia';
    const isMexico = country === 'México' || country === 'Mexico';

    // Colombia -> COP, Mexico -> MXN, Rest of the world -> USD
    const baseOffers = isColombia ? OFFERS_COP : isMexico ? OFFERS_MXN : OFFERS_USD;
    const offerCurrency = isColombia ? 'COP' : isMexico ? 'MXN' : 'USD';
    const offerLocale = isColombia ? 'es-CO' : isMexico ? 'es-MX' : 'en-US';

    // COP has 4 offers: 0-3d = 2, 4-6d = 3, 7+ = 4
    // USD / MXN have 5 offers: 0-3d = 3, 4-6d = 4, 7+ = 5
    const visibleOffers = isColombia
        ? (daysCreation <= 3 ? baseOffers.slice(0, 2) : daysCreation <= 6 ? baseOffers.slice(0, 3) : baseOffers)
        : (daysCreation <= 3 ? baseOffers.slice(0, 3) : daysCreation <= 6 ? baseOffers.slice(0, 4) : baseOffers);

    // Currency-aware formatters for the wizard
    const formatOfferMoney = (amount: number) =>
        new Intl.NumberFormat(offerLocale, { style: 'currency', currency: offerCurrency, minimumFractionDigits: 0 }).format(amount);
    const formatOfferMoneyDecimals = (amount: number) =>
        new Intl.NumberFormat(offerLocale, { style: 'currency', currency: offerCurrency, minimumFractionDigits: 2 }).format(amount);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [selectedOffer, setSelectedOffer] = useState<any>(null);
    const [initialFee, setInitialFee] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState("");
    const [generatedLink, setGeneratedLink] = useState("");
    const [subject, setSubject] = useState("Agenda");
    const [dueDate, setDueDate] = useState("2/02/2026");
    const [reminderSet, setReminderSet] = useState(true);
    const [reminderDate, setReminderDate] = useState("2/02/2026");
    const [reminderTime, setReminderTime] = useState("");
    const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
    const [showDueDateCalendar, setShowDueDateCalendar] = useState(false);
    const [showReminderDateCalendar, setShowReminderDateCalendar] = useState(false);
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const showPromoButton = ['En llamada', 'Agendado', 'Asignado'].includes(currentStepName);

    useEffect(() => { setReminderTime(getBogotaTime()); }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.dropdown-container')) {
                setShowSubjectDropdown(false); setShowTimeDropdown(false); setShowDueDateCalendar(false); setShowReminderDateCalendar(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExpand = () => setIsExpanded(true);
    const handleCollapse = () => setIsExpanded(false);
    const handleInlineSave = async () => {
        setSaving(true);
        try {
            await db.ref(`tasks/${prospectId}`).push({
                subject,
                dueDate,
                reminderDate: reminderSet ? reminderDate : null,
                reminderTime: reminderSet ? reminderTime : null,
                assignedTo: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
                createdAt: new Date().toISOString(),
            });
            onTaskCreated(subject);
        } catch (err) {
            console.error('Error saving inline task:', err);
        } finally {
            setSaving(false);
            setIsExpanded(false);
        }
    };
    const startWizard = () => { setWizardStep(1); setSelectedProduct(null); setSelectedOffer(null); setInitialFee(0); setErrorMessage(""); }
    const nextStep = () => {
        setErrorMessage("");
        if (wizardStep === 2 && !selectedProduct) { setErrorMessage("Debes seleccionar un producto para continuar."); return; }
        if (wizardStep === 3 && !selectedOffer) { setErrorMessage("Debes seleccionar una oferta para continuar."); return; }
        if (wizardStep === 5) {
            const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            setGeneratedLink(`https://smartbeemo.com/checkout/?subscriptionid=${randomId}`);
        }
        setWizardStep(prev => prev + 1);
    }
    const prevStep = () => { setErrorMessage(""); setWizardStep(prev => prev - 1); }
    const formatMoney = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
    const formatMoneyWithDecimals = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 }).format(amount);

    const renderWizardContent = () => {
        return (
            <div className="bg-white border border-gray-300 rounded-md shadow-sm mb-3 font-sans">
                <div className="flex items-center justify-center p-4 border-b border-gray-100 relative">
                    <div className="absolute left-4 top-4">
                        <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-black"><span className="text-2xl">🐝</span></div>
                    </div>
                    <h2 className="text-[#ffc107] text-xl font-bold tracking-wide">
                        {wizardStep === 1 && "Productos disponibles"}
                        {wizardStep === 2 && "Productos disponibles"}
                        {wizardStep === 3 && "Ofertas disponibles"}
                        {wizardStep === 4 && "Opción de pago"}
                        {wizardStep === 5 && "Resumen del pedido"}
                        {wizardStep === 6 && "Link de pago"}
                    </h2>
                </div>
                <div className="p-6">
                    {errorMessage && <div className="mb-4 text-red-600 text-sm font-medium flex items-center gap-2"><AlertCircle size={16} />{errorMessage}</div>}
                    {wizardStep === 1 && (<div className="space-y-6"><div><label className="block text-sm text-gray-700 mb-1"><span className="text-red-500">*</span></label><select className="w-full border border-blue-500 rounded px-3 py-2 text-sm text-gray-800 outline-none"><option>Bootcamp</option></select></div><div className="text-sm font-bold text-gray-800">Tipo de usuario: <span className="font-normal">Freemium</span></div></div>)}
                    {wizardStep === 2 && (<div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-100 border-b border-gray-300"><th className="py-2 px-2 w-8"></th><th className="py-2 px-2 text-xs font-bold text-gray-600">Nombre</th><th className="py-2 px-2 text-xs font-bold text-gray-600">Mentor</th><th className="py-2 px-2 text-xs font-bold text-gray-600">Fecha inicio</th><th className="py-2 px-2 text-xs font-bold text-gray-600">Fecha fin</th></tr></thead><tbody>{PRODUCTS.map(prod => (<tr key={prod.id} className="border-b border-gray-200 hover:bg-gray-50"><td className="py-3 px-2"><div onClick={() => setSelectedProduct(prod)} className={`w-4 h-4 rounded-full border cursor-pointer ${selectedProduct?.id === prod.id ? 'border-blue-600 bg-blue-600' : 'border-gray-400'}`}></div></td><td className="py-3 px-2 text-xs text-gray-800">{prod.name}</td><td className="py-3 px-2 text-xs text-gray-800">{prod.mentor}</td><td className="py-3 px-2 text-xs text-gray-800">{prod.start}</td><td className="py-3 px-2 text-xs text-gray-800">{prod.end}</td></tr>))}</tbody></table></div>)}
                    {wizardStep === 3 && (<div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-100 border-b border-gray-300"><th className="py-2 px-2 w-8"></th><th className="py-2 px-2 text-xs font-bold text-gray-600">Oferta</th><th className="py-2 px-2 text-xs font-bold text-gray-600">Total primer pago</th><th className="py-2 px-2 text-xs font-bold text-gray-600">Renovación</th><th className="py-2 px-2 text-xs font-bold text-gray-600">Cuotas</th><th className="py-2 px-2 text-xs font-bold text-gray-600">Máx Cuotas</th></tr></thead><tbody>{visibleOffers.map(offer => (<tr key={offer.id} className="border-b border-gray-200 hover:bg-gray-50"><td className="py-3 px-2"><div onClick={() => { setSelectedOffer(offer); setInitialFee(offer.total * 0.1); }} className={`w-4 h-4 rounded-full border cursor-pointer ${selectedOffer?.id === offer.id ? 'border-blue-600 bg-blue-600' : 'border-gray-400'}`}></div></td><td className="py-3 px-2 text-xs text-gray-800 font-medium">{offer.name}</td><td className="py-3 px-2 text-xs text-gray-800">{formatOfferMoney(offer.total)}</td><td className="py-3 px-2 text-xs text-gray-800">{offerCurrency} $0</td><td className="py-3 px-2 text-xs text-gray-500"><Check size={16} /></td><td className="py-3 px-2 text-xs text-gray-800">{offer.quotas}</td></tr>))}</tbody></table></div>)}
                    {wizardStep === 4 && selectedOffer && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-center gap-2 text-sm font-bold text-black text-center">
                                <span className="text-yellow-500 text-lg">⚠️</span>
                                La cuota inicial debe ser mínimo {formatOfferMoneyDecimals(selectedOffer.total * 0.1)} {offerCurrency}
                                <span className="text-yellow-500 text-lg">⚠️</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-600 mb-1">Tipo de pago</label>
                                    <select className="w-full border-2 border-[#0070d2] rounded px-2 py-1.5 text-sm bg-white outline-none font-medium text-gray-800">
                                        <option>Cuotas</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1">Cuotas <Info size={12} className="text-gray-400" /></label>
                                    <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white outline-none">
                                        <option>12</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-[#ffc107] font-bold text-lg mb-2">Cuota inicial</h3>
                                <label className="block text-xs text-red-500 mb-1">* Valor de la cuota inicial:</label>
                                <input
                                    type="text"
                                    value={formatOfferMoneyDecimals(initialFee)}
                                    readOnly
                                    className="w-full text-base mb-4 border border-gray-500 rounded px-2 py-1 outline-none bg-[#333] text-[#666] font-bold cursor-not-allowed"
                                />
                                <div className="space-y-2 text-sm">
                                    <div className="font-bold text-gray-800">Pago total: <span className="font-normal">{formatOfferMoneyDecimals(selectedOffer.total)} {offerCurrency}</span></div>
                                    <div className="font-bold text-gray-800">Cuota inicial: <span className="font-normal">{formatOfferMoneyDecimals(initialFee)} {offerCurrency}</span></div>
                                    <div className="font-bold text-gray-800">Saldo pendiente: <span className="font-normal">{formatOfferMoneyDecimals(selectedOffer.total - initialFee)} {offerCurrency}</span></div>
                                    <div className="font-bold text-gray-800">Cuotas restantes: <span className="font-normal">11 x {formatOfferMoneyDecimals((selectedOffer.total - initialFee) / 11)} {offerCurrency}</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                    {wizardStep === 5 && selectedProduct && selectedOffer && (() => {
                        const fmt = (amount: number) =>
                            new Intl.NumberFormat('es-CO', {
                                style: 'currency', currency: offerCurrency,
                                currencyDisplay: 'code', minimumFractionDigits: 2,
                            }).format(amount).replace(/\u00A0/g, ' ');
                        const perInstallment = (selectedOffer.total - initialFee) / 11;
                        return (
                            <div className="space-y-4 text-sm">
                                <h3 className="font-bold text-gray-900 text-sm">{selectedProduct.name}</h3>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Pago Inicial:</span>
                                    <span className="text-[#1b5297] font-medium">{fmt(initialFee)}</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="font-bold text-gray-900">Cuotas Pendientes:</div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Valor: 11 x</span>
                                        <span className="text-[#1b5297] font-medium">{fmt(perInstallment)}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="font-bold text-gray-900">Bono: Accede 12 meses a Beemo PRO</div>
                                    <div className="flex justify-end">
                                        <span className="text-[#1b5297] font-medium">{fmt(0)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                    <span className="font-bold text-gray-900">Total a pagar:</span>
                                    <span className="text-[#1b5297] font-medium">{fmt(initialFee)}</span>
                                </div>
                            </div>
                        );
                    })()}
                    {wizardStep === 6 && (<div className="py-4"><div className="flex items-center gap-4"><a href="#" className="text-blue-600 underline text-lg font-medium">Link</a><span className="text-gray-800 text-sm break-all">{generatedLink}</span></div></div>)}
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">{wizardStep < 6 ? (<><button onClick={wizardStep === 1 ? () => setWizardStep(0) : prevStep} className="px-4 py-1.5 border border-gray-400 rounded text-sm text-blue-600 bg-white hover:bg-gray-50 font-medium min-w-[80px]">{wizardStep === 5 ? "Ofertas" : "Volver"}</button><button onClick={nextStep} className="px-4 py-1.5 bg-[#1b5297] text-white rounded text-sm font-medium hover:bg-blue-800 shadow-sm min-w-[80px]">{wizardStep === 5 ? "Crear cotización" : "Siguiente"}</button></>) : (<button onClick={() => setWizardStep(0)} className="px-4 py-1.5 bg-[#1b5297] text-white rounded text-sm font-medium hover:bg-blue-800 shadow-sm min-w-[80px]">Finalizar</button>)}</div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {showPromoButton && wizardStep === 0 && (
                <div className="bg-white border border-gray-300 rounded-md shadow-sm flex justify-center items-center py-3 px-4">
                    <button
                        onClick={startWizard}
                        className="bg-[#1b5297] text-white hover:bg-blue-800 transition-colors font-bold text-sm flex items-center gap-2 px-5 py-1.5 rounded animate-in fade-in slide-in-from-top-1 duration-300"
                    >
                        <Ticket size={16} strokeWidth={2} />
                        <span>Ofertas Lanzamientos - 🐺 Lobo Pro 🐺</span>
                    </button>
                </div>
            )}
            {wizardStep > 0 && renderWizardContent()}
            <div className="bg-white border border-gray-300 rounded-md shadow-sm text-sm" ref={containerRef}>
                <div className="flex bg-[#f3f3f3] border-b border-gray-300 rounded-t-md"><button className="px-4 py-2.5 bg-white border-r border-gray-300 font-bold text-gray-800 text-xs border-t-2 border-t-transparent relative -mb-[1px] border-b-white z-10 rounded-tl-md">Nueva tarea</button><button className="px-4 py-2.5 hover:bg-white text-gray-600 font-medium text-xs border-r border-gray-300">Correo electrónico</button><button className="px-4 py-2.5 hover:bg-white text-gray-600 font-medium text-xs">Nuevo evento</button></div>
                {!isExpanded ? (<div className="p-4 border-b border-gray-200"><div className="flex gap-2 relative"><input type="text" placeholder="Crear una tarea..." onClick={handleExpand} className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-500 cursor-text" /><button onClick={handleExpand} className="bg-[#1b5297] text-white text-xs font-bold px-4 py-1.5 rounded-[4px] hover:bg-blue-800 transition-colors shadow-sm">Agregar</button></div></div>) : (
                    <div className="p-4 border-b border-gray-200 bg-white"><div className="space-y-4"><div className="relative dropdown-container"><label className="block text-xs text-gray-600 mb-1"><span className="text-red-500 mr-0.5">*</span>Asunto</label><div className="relative"><input type="text" value={subject} onClick={() => { setShowSubjectDropdown(true); setShowDueDateCalendar(false); setShowReminderDateCalendar(false); setShowTimeDropdown(false); }} onChange={(e) => setSubject(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /><Search className="absolute right-2 top-2 text-gray-400" size={16} /></div>{showSubjectDropdown && (<div className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg rounded mt-1 z-50">{SUBJECT_OPTIONS.map((opt) => (<div key={opt} className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2" onClick={() => { setSubject(opt); setShowSubjectDropdown(false); }}>{subject === opt && <Check size={14} className="text-blue-600" />}<span className={subject === opt ? '' : 'ml-6'}>{opt}</span></div>))}</div>)}</div><div className="relative dropdown-container"><label className="block text-xs text-gray-600 mb-1">Fecha de vencimiento</label><div className="relative"><input type="text" readOnly value={dueDate} onClick={() => { const newVal = !showDueDateCalendar; setShowDueDateCalendar(newVal); if (newVal) { setShowSubjectDropdown(false); setShowReminderDateCalendar(false); setShowTimeDropdown(false); } }} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer" /><Calendar className="absolute right-2 top-2 text-gray-500" size={16} />{showDueDateCalendar && <CustomCalendar initialDate={dueDate} onSelect={setDueDate} onClose={() => setShowDueDateCalendar(false)} />}</div></div><div><label className="flex items-center gap-2 text-sm text-gray-700 mb-2 cursor-pointer w-fit"><span>Recordatorio establecido</span></label><div className="mb-2"><input type="checkbox" checked={reminderSet} onChange={(e) => setReminderSet(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></div>{reminderSet && (<div className="flex gap-4"><div className="flex-1 relative dropdown-container"><label className="block text-xs text-gray-600 mb-1">Fecha</label><div className="relative"><input type="text" readOnly value={reminderDate} onClick={() => { const newVal = !showReminderDateCalendar; setShowReminderDateCalendar(newVal); if (newVal) { setShowSubjectDropdown(false); setShowDueDateCalendar(false); setShowTimeDropdown(false); } }} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none cursor-pointer" /><Calendar className="absolute right-2 top-2 text-gray-500" size={16} />{showReminderDateCalendar && <CustomCalendar initialDate={reminderDate} onSelect={setReminderDate} onClose={() => setShowReminderDateCalendar(false)} />}</div></div><div className="flex-1 relative dropdown-container"><label className="block text-xs text-gray-600 mb-1">Hora</label><div className="relative"><input type="text" value={reminderTime} readOnly onClick={() => { const newVal = !showTimeDropdown; setShowTimeDropdown(newVal); if (newVal) { setShowSubjectDropdown(false); setShowDueDateCalendar(false); setShowReminderDateCalendar(false); } }} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none cursor-pointer" /><Clock className="absolute right-2 top-2 text-gray-500" size={16} />{showTimeDropdown && (<div className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg rounded mt-1 z-50 max-h-48 overflow-y-auto">{TIME_SLOTS.map((slot) => (<div key={slot} className={`px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2 ${slot === reminderTime ? 'bg-blue-50' : ''}`} onClick={() => { setReminderTime(slot); setShowTimeDropdown(false); }}>{slot === reminderTime && <Check size={14} className="text-blue-600" />}<span className={slot === reminderTime ? '' : 'ml-6'}>{slot}</span></div>))}</div>)}</div></div></div>)}</div><div><label className="block text-xs text-gray-600 mb-1"><span className="text-red-500 mr-0.5">*</span>Asignado a</label><div className="border border-gray-300 rounded px-2 py-1.5 flex items-center gap-2 bg-white"><div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center"><User size={14} className="text-white" /></div><span className="text-sm text-gray-800 flex-1">{`${currentUser.firstName} ${currentUser.lastName}`.trim()}</span></div></div><div className="flex justify-end gap-2 pt-2"><button onClick={handleCollapse} className="px-4 py-1.5 border border-gray-300 rounded text-sm text-blue-600 bg-white hover:bg-gray-50 font-medium">Cancelar</button><button onClick={handleInlineSave} disabled={saving} className="px-4 py-1.5 bg-[#1b5297] text-white rounded text-sm font-medium hover:bg-blue-800 shadow-sm disabled:opacity-60">{saving ? 'Guardando...' : 'Guardar'}</button></div></div></div>)}<div className="bg-[#f3f3f3] px-4 py-2 flex items-center justify-between border-b border-gray-200"><div className="flex items-center gap-2"><div className="bg-[#5b7ecc] p-0.5 rounded-sm"><Cloud size={12} className="text-white" fill="currentColor" /></div><span className="text-gray-700 font-medium text-xs">Solo mostrar actividades con perspectivas</span><div className="w-9 h-5 bg-[#b0adab] rounded-full relative cursor-pointer hover:bg-gray-500 transition-colors"><div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div></div></div></div><div className="px-4 py-3 bg-white"><div className="text-[11px] text-gray-500 leading-relaxed mb-2 flex items-start justify-between"><span>Filtros: En 2 meses • Todas las actividades • Llamadas registradas, Correo electrónico, Eventos, Correo electrónico de lista, Tareas, Llamadas de voz, Llamadas de vídeo y Web</span><button className="ml-2 p-1 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-600 shrink-0 shadow-sm"><Settings size={14} /></button></div><div className="flex justify-end gap-1 text-[11px]"><a href="#" className="text-blue-600 hover:underline">Actualizar</a><span className="text-gray-400">•</span><a href="#" className="text-blue-600 hover:underline">Ampliar todo</a><span className="text-gray-400">•</span><a href="#" className="text-blue-600 hover:underline">Ver todo</a></div></div><div className="bg-[#f3f3f3] border-t border-gray-200"><button className="w-full flex items-center px-4 py-2 hover:bg-gray-200 transition-colors"><ChevronDown size={14} className="text-gray-700 mr-2" /><span className="text-xs font-bold text-gray-800">Próximas y vencidas</span></button><div className="bg-white"><div className="flex group relative"><div className="absolute left-[29px] top-8 bottom-[-10px] w-[2px] bg-[#4dbd74] z-0"></div><div className="p-4 w-full flex gap-3 z-10"><div className="shrink-0 flex items-start pt-1"><button className="mr-2 mt-0.5 text-gray-400 hover:text-gray-600"><ChevronRight size={12} /></button><div className="w-6 h-6 bg-[#4dbd74] rounded-[2px] flex items-center justify-center shadow-sm z-10 relative"><LayoutList size={14} className="text-white" /></div></div><div className="flex-1"><div className="flex items-start justify-between mb-1"><div className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" /><a href="#" className="text-sm text-blue-600 hover:underline font-medium">Seguimiento Asignado</a></div><div className="flex items-center gap-2"><span className="text-xs text-[#c23934] font-bold">22/12/2025</span><button className="p-0.5 hover:bg-gray-100 rounded border border-gray-300 text-gray-500 bg-white"><ChevronDown size={12} /></button></div></div><div className="text-xs text-gray-800 mb-3 leading-snug"><a href="#" className="text-blue-600 hover:underline">Dahiana Pacheco</a> tiene una próxima tarea con <a href="#" className="text-blue-600 hover:underline">Ana Mis propias Finanzas Mis inversiones</a></div><button className="text-xs text-blue-600 border border-gray-300 rounded px-3 py-1 hover:bg-gray-50 font-medium bg-white">Ver más</button></div></div></div></div><div className="flex items-center justify-between px-4 py-2 bg-[#f3f3f3] border-t border-gray-200"><button className="flex items-center hover:underline"><ChevronDown size={14} className="text-gray-700 mr-2" /><span className="text-xs font-bold text-gray-800">enero • 2026</span></button><span className="text-xs font-bold text-gray-800">El mes pasado</span></div><div className="bg-white"><div className="flex group relative"><div className="absolute left-[29px] top-0 bottom-0 w-[2px] bg-[#4dbd74] z-0 h-10"></div><div className="p-4 w-full flex gap-3 z-10 pt-2"><div className="shrink-0 flex items-start pt-1"><button className="mr-2 mt-0.5 text-gray-400 hover:text-gray-600"><ChevronRight size={12} /></button><div className="w-6 h-6 bg-[#4dbd74] rounded-[2px] flex items-center justify-center shadow-sm z-10 relative"><Phone size={14} className="text-white" fill="currentColor" /></div></div><div className="flex-1"><div className="flex items-start justify-between mb-1"><a href="#" className="text-sm text-blue-600 hover:underline">Call 01/23/2026 10:45am -05</a><div className="flex items-center gap-2"><span className="text-xs text-gray-500">23/01</span><button className="p-0.5 hover:bg-gray-100 rounded border border-gray-300 text-gray-500 bg-white"><ChevronDown size={12} /></button></div></div><div className="text-xs text-gray-800">Tenía una tarea</div></div></div></div></div></div></div></div>
    );
};

export const RecordBody: React.FC<{
    data: ProspectData;
    currentUser: UserType;
    onUpdateRecord: (data: ProspectData) => void;
}> = ({ data, currentUser, onUpdateRecord }) => {
    const [activeTab, setActiveTab] = useState('Detalles');
    const [currentStep, setCurrentStep] = useState(0);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

    // Notes State — Firebase real-time sync per client
    const [notes, setNotes] = useState<any[]>([]);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

    // Subscribe to notes for this specific prospect in real-time
    useEffect(() => {
        const ref = db.ref(`notes/${data.id}`);
        const handler = ref.orderByChild('createdAt').on('value', (snap: any) => {
            const val = snap.val();
            if (!val) { setNotes([]); return; }
            const list = Object.values(val) as any[];
            // Sort newest first
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setNotes(list);
        });
        return () => ref.off('value', handler);
    }, [data.id]);

    const handleAddNote = async (note: { title: string; body: string }) => {
        const now = new Date();
        const newNote = {
            title: note.title,
            body: note.body,
            date: now.toLocaleString('es-CO', {
                day: 'numeric', month: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
            }),
            user: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
            createdAt: now.toISOString(),
        };
        try {
            await db.ref(`notes/${data.id}`).push(newNote);
        } catch (err) {
            console.error('Error saving note:', err);
        }
    };

    useEffect(() => {
        const idx = STEPS.indexOf(data.status || 'MQL');
        if (idx !== -1) setCurrentStep(idx);
        else setCurrentStep(0);
    }, [data.status]);

    const handleStepChange = async (index: number) => {
        const userFullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();
        const recordOwner = (data.owner || '').trim();

        // Permission check:
        // 1. User owns the record
        // 2. Record is owned by "Administrador Salesforce" (common pool)
        if (recordOwner !== userFullName && recordOwner !== 'Administrador Salesforce') {
            setErrorMessage(undefined); // default error message
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 4000);
            return;
        }

        const newStatus = STEPS[index];

        // === AGENDADO RULE: Must have a task with subject "Agenda" created by THIS agent ===
        if (newStatus === 'Agendado') {
            try {
                const tasksSnap = await db.ref(`tasks/${data.id}`).once('value');
                const tasksVal = tasksSnap.val();
                // The task must have subject "Agenda" AND be assigned to the current agent
                const hasOwnAgendaTask = tasksVal
                    ? Object.values(tasksVal).some(
                        (t: any) => t.subject === 'Agenda' && t.assignedTo === userFullName
                    )
                    : false;

                if (!hasOwnAgendaTask) {
                    setErrorMessage(
                        "Ha encontrado algunos errores al intentar guardar este registro. El status no puede ser 'Agendado' si no cuenta con una tarea de Agenda."
                    );
                    setShowErrorToast(true);
                    setTimeout(() => setShowErrorToast(false), 5000);
                    return;
                }
            } catch (err) {
                console.error('Error verificando tareas:', err);
            }
        }

        // === ASIGNADO RULE: Must have own task with subject "Seguimiento Asignado" or "Compromiso de pago" ===
        if (newStatus === 'Asignado') {
            const ASIGNADO_SUBJECTS = ['Seguimiento Asignado', 'Compromiso de pago'];
            try {
                const tasksSnap = await db.ref(`tasks/${data.id}`).once('value');
                const tasksVal = tasksSnap.val();
                const hasOwnAsignadoTask = tasksVal
                    ? Object.values(tasksVal).some(
                        (t: any) =>
                            ASIGNADO_SUBJECTS.includes(t.subject) && t.assignedTo === userFullName
                    )
                    : false;

                if (!hasOwnAsignadoTask) {
                    setErrorMessage(
                        "Ha encontrado algunos errores al intentar guardar este registro. El status no puede ser 'Asignado' si no cuenta con una tarea de 'Seguimiento Asignado' o 'Compromiso de pago'."
                    );
                    setShowErrorToast(true);
                    setTimeout(() => setShowErrorToast(false), 5000);
                    return;
                }
            } catch (err) {
                console.error('Error verificando tareas para Asignado:', err);
            }
        }
        // ══════════════════════════════════════════
        // CAPACITY LIMITS PER USER
        // ══════════════════════════════════════════
        const CAPACITY_LIMITS: Record<string, number> = {
            'En llamada': 1,
            'Agendado': 5,
            'Asignado': 5,
        };

        if (CAPACITY_LIMITS[newStatus] !== undefined) {
            const limit = CAPACITY_LIMITS[newStatus];
            try {
                const allSnap = await db.ref('prospects').once('value');
                const allVal = allSnap.val() || {};
                const countOwned = Object.entries(allVal).filter(([id, p]: [string, any]) =>
                    id !== data.id &&          // exclude the current record itself
                    p.status === newStatus &&
                    p.owner === userFullName
                ).length;

                if (countOwned >= limit) {
                    setErrorMessage(
                        `Error no puede tener más de ${limit} cuenta(s) en estado ${newStatus}`
                    );
                    setShowErrorToast(true);
                    setTimeout(() => setShowErrorToast(false), 5000);
                    return;
                }
            } catch (err) {
                console.error('Error verificando límite de capacidad:', err);
            }
        }

        let newOwner = recordOwner;


        // Ownership Logic:
        // If moving back to SQL -> Release to Admin pool
        if (newStatus === 'SQL') {
            newOwner = 'Administrador Salesforce';
        } else {
            // If moving to any other stage (and permissions passed), assign to current user
            newOwner = userFullName;
        }

        try {
            // 1. Persist to Firebase so all agents see the change and it survives logout
            await db.ref(`prospects/${data.id}`).update({
                status: newStatus,
                owner: newOwner
            });

            // 2. Update local React state to reflect immediately without a re-fetch
            onUpdateRecord({
                ...data,
                status: newStatus,
                owner: newOwner
            });

            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (err) {
            console.error('Error al guardar el estado en Firebase:', err);
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative font-sans text-[#181b25]">
            {showSuccessToast && <SuccessToast message={successMessage} onClose={() => { setShowSuccessToast(false); setSuccessMessage(undefined); }} />}
            {showErrorToast && <ErrorToast message={errorMessage} onClose={() => setShowErrorToast(false)} />}

            <div style={{ marginBottom: '4px', marginLeft: '8px', marginRight: '8px' }}>
                <QuickLinks />
            </div>

            <div style={{ marginBottom: '4px', marginLeft: '8px', marginRight: '8px' }}>
                <PathBar currentStep={currentStep} onStepChange={handleStepChange} />
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-[0_0_55%] flex flex-col min-w-0 bg-white border-r border-gray-200">
                    <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

                    <div className="flex-1 overflow-y-auto bg-[#eef1f6] p-4">
                        {activeTab === 'Detalles' && <DetailsTab currentStepName={STEPS[currentStep]} data={data} />}
                        {activeTab === 'Notas' && <NotesTab notes={notes} onOpenNewNote={() => setIsNoteModalOpen(true)} />}
                        {activeTab === 'Archivos' && <FilesTab />}
                        {activeTab === 'Historial' && <HistoryTab />}
                        {activeTab === 'Pagos' && <PaymentsTab />}
                        {activeTab === 'Controles De Auditoría' && <AuditTab />}
                    </div>
                </div>

                <div className="flex-[0_0_45%] bg-[#f3f3f3] border-l border-gray-200 flex flex-col">
                    <div className="overflow-y-auto flex-1 p-3">
                        <ActivitySidebar
                            currentStepName={STEPS[currentStep]}
                            prospectId={data.id}
                            currentUser={currentUser}
                            daysCreation={data.daysCreation}
                            country={data.country}
                            onTaskCreated={(subject) => {
                                setSuccessMessage(`Se creó la tarea "${subject}"`);
                                setShowSuccessToast(true);
                                setTimeout(() => { setShowSuccessToast(false); setSuccessMessage(undefined); }, 4000);
                            }}
                        />
                    </div>
                </div>
            </div>
            {/* New Note Modal */}
            <NewNoteModal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                relatedTo={`${data.firstName} ${data.lastName}`}
                onSave={handleAddNote}
            />
        </div>
    );
};