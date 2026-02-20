import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, Search, ChevronDown, Check, User, Info, Bold, Italic, Underline, Link, Image as ImageIcon, List, AlignLeft, AlignCenter, AlignRight, X } from 'lucide-react';
import { User as UserType } from '../App';
import { db } from '../firebaseConfig';

interface NewCaseWizardProps {
    onCancel: () => void;
    onTitleChange?: (title: string) => void;
    onSave?: () => void;
    currentUser?: UserType;
}

const RECORD_TYPES = [
    { id: 'soporte2', label: 'Soporte al estudiante 2.0', desc: 'Casos para el equipo de servicio con la nueva lógica del portal' },
    { id: 'accesos', label: 'Accesos', desc: '' },
    { id: 'bootcamp', label: 'Bootcamp', desc: '' },
    { id: 'bootcampmyd', label: 'Bootcamp MyD', desc: '' },
    { id: 'callback', label: 'Callback Retention', desc: 'Caso Callback Retention para la cancelación de suscripciones' },
    { id: 'cancelacion', label: 'Cancelación Usuarios', desc: 'Cancelación de usuarios en salesforce y Five9.' },
    { id: 'chargeback', label: 'Chargeback 2.0', desc: '' },
    { id: 'cross', label: 'Cross Selling', desc: 'Casos para renovaciones y Cross Selling' },
    { id: 'freemium', label: 'Freemium', desc: '' },
    { id: 'mentoria', label: 'Mentoria', desc: '' },
    { id: 'noestudiante', label: 'No estudiante', desc: '' },
    { id: 'novedad', label: 'Novedad Factura', desc: '' },
    { id: 'portal', label: 'Portal 2.0', desc: '' },
    { id: 'pregunta', label: 'Pregunta a tutor', desc: '' },
    { id: 'pronto', label: 'Pronto Pago', desc: '' },
    { id: 'rrhh', label: 'Recursos Humanos', desc: 'Casos para reclamos de comisiones, nómina, Certificaciones de relación comercial y facturas' },
    { id: 'reembolso', label: 'Reembolso', desc: 'Reembolsos' },
    { id: 'retenciones', label: 'Retenciones', desc: '' },
    { id: 'social', label: 'Social Selling', desc: '' },
    { id: 'soporteinternal', label: 'Soporte smartBeemo', desc: 'Soporte interno de smartBeemo' },
    { id: 'tutores', label: 'Tutores', desc: '' },
];

const REQUEST_TYPES = [
    "--Ninguno--",
    "Comisiones y nómina",
    "Certificación de relación comercial",
    "Facturas y cotizaciones"
];

const REASON_OPTIONS = [
    "--Ninguno--",
    "Venta no pagada",
    "Aceleradores",
    "Bonos, premios y ventas formación",
    "Devoluciones",
    "Otros"
];

const YES_NO_OPTIONS = ["--Ninguno--", "Sí", "No"];
const INVOICE_TYPES = ["--Ninguno--", "Factura", "Cotización"];



// --- Helper Components ---

const SuccessToast = () => (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] flex items-center justify-between gap-4 bg-[#04844b] text-white px-4 py-3 rounded shadow-lg min-w-[300px] animate-in fade-in slide-in-from-top-2 duration-300 border-none">
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0">
                <Check size={14} className="text-[#04844b]" strokeWidth={4} />
            </div>
            <span className="font-semibold text-sm tracking-wide">Caso #23452 Creado</span>
        </div>
        <button className="text-white/80 hover:text-white transition-colors">
            <X size={18} />
        </button>
    </div>
);

const RichTextToolbar = () => (
    <div className="border-b border-gray-300 bg-gray-50 p-1 flex gap-1 items-center flex-wrap">
        <div className="flex bg-white border border-gray-300 rounded px-2 py-0.5 text-xs items-center gap-1 cursor-pointer hover:bg-gray-50">
            <span>Salesforce Sans</span> <ChevronDown size={10} />
        </div>
        <div className="flex bg-white border border-gray-300 rounded px-2 py-0.5 text-xs items-center gap-1 cursor-pointer hover:bg-gray-50">
            <span>12</span> <ChevronDown size={10} />
        </div>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button className="p-1 hover:bg-gray-200 rounded"><div className="w-3 h-3 bg-black"></div></button>
        <button className="p-1 hover:bg-gray-200 rounded"><Bold size={12} /></button>
        <button className="p-1 hover:bg-gray-200 rounded"><Italic size={12} /></button>
        <button className="p-1 hover:bg-gray-200 rounded"><Underline size={12} /></button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button className="p-1 hover:bg-gray-200 rounded"><List size={12} /></button>
        <button className="p-1 hover:bg-gray-200 rounded"><AlignLeft size={12} /></button>
        <button className="p-1 hover:bg-gray-200 rounded"><AlignCenter size={12} /></button>
        <button className="p-1 hover:bg-gray-200 rounded"><AlignRight size={12} /></button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button className="p-1 hover:bg-gray-200 rounded"><Link size={12} /></button>
        <button className="p-1 hover:bg-gray-200 rounded"><ImageIcon size={12} /></button>
    </div>
);

const LookupField = ({ label, required, placeholder, currentUser, agents = [] }: { label: string, required?: boolean, placeholder?: string, currentUser?: UserType, agents?: { name: string; role: string }[] }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<{ name: string; role: string } | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Initial load / agents update effect to set default selected agent
    useEffect(() => {
        if (currentUser && agents.length > 0 && !selectedAgent) {
            const found = agents.find(a => a.name.toLowerCase().trim() === `${currentUser.firstName} ${currentUser.lastName}`.toLowerCase().trim());
            if (found) setSelectedAgent(found);
        }
    }, [currentUser, agents, selectedAgent]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredAgents = agents.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex items-center mb-3 relative" ref={wrapperRef}>
            <div className="w-1/3 text-right pr-4">
                <label className="text-xs text-gray-600 font-bold">
                    {required && <span className="text-red-600 mr-1">*</span>}
                    {label}
                </label>
            </div>
            <div className="w-2/3 relative">
                {selectedAgent ? (
                    <div
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 bg-white h-8 shadow-sm flex items-center gap-2 group cursor-pointer hover:border-gray-400"
                        onClick={() => { setSelectedAgent(null); setSearchTerm(""); setIsOpen(true); }}
                    >
                        <div className="bg-[#65cae4] p-0.5 rounded-sm">
                            <User size={12} className="text-white" />
                        </div>
                        <span className="flex-1">{selectedAgent.name}</span>
                        <button className="text-gray-400 hover:text-gray-600">
                            <ChevronDown size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <input
                            type="text"
                            autoFocus
                            placeholder={placeholder || "Buscar Personas..."}
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
                            onFocus={() => setIsOpen(true)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 pl-2 pr-8 h-8 shadow-sm"
                        />
                        <Search size={14} className="absolute right-2 top-2 text-gray-500 pointer-events-none" />
                    </div>
                )}

                {/* Dropdown */}
                {isOpen && !selectedAgent && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-xl rounded mt-1 z-50 max-h-48 overflow-y-auto">
                        <div className="px-3 py-2 bg-gray-50 text-xs font-bold text-gray-700 uppercase">Personas recientes</div>
                        {filteredAgents.map((agent, idx) => (
                            <div
                                key={idx}
                                onClick={() => { setSelectedAgent(agent); setIsOpen(false); }}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                            >
                                <div className="bg-[#65cae4] p-1 rounded-sm">
                                    <User size={14} className="text-white" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-800">{agent.name}</div>
                                    <div className="text-xs text-gray-500">{agent.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
};

export const NewCaseWizard: React.FC<NewCaseWizardProps> = ({ onCancel, onTitleChange, onSave, currentUser }) => {
    const [selectedType, setSelectedType] = useState('soporte2');
    const [step, setStep] = useState<'select' | 'form'>('select');
    const [showToast, setShowToast] = useState(false);
    const [agents, setAgents] = useState<{ name: string; role: string }[]>([]);

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const snapshot = await db.ref('users').once('value');
                const val = snapshot.val();
                if (val) {
                    const list = Object.values(val).map((u: any) => ({
                        name: `${u.firstName} ${u.lastName}`,
                        role: 'Agente' // Use specific role if available in DB eventually
                    }));
                    setAgents(list);
                }
            } catch (error) {
                console.error("Error fetching agents:", error);
            }
        };
        fetchAgents();
    }, []);

    // Form States
    const [requestType, setRequestType] = useState(REQUEST_TYPES[0]);
    // State for conditional rendering in "Facturas y cotizaciones" & "Certificación..."
    const [entityTarget, setEntityTarget] = useState("No"); // Default No or --Ninguno--

    const handleNext = () => {
        if (selectedType === 'rrhh') {
            setStep('form');
            if (onTitleChange) onTitleChange("Crear Caso: Recursos Humanos");
        } else {
            alert("Por favor selecciona 'Recursos Humanos' para ver la demo de esa interfaz específica.");
            return;
        }
    };

    const handleSave = () => {
        // Show success notification
        setShowToast(true);

        // After 1.5 seconds, trigger the actual save/redirect
        setTimeout(() => {
            setShowToast(false);
            if (onSave) {
                onSave();
            }
        }, 1500);
    };

    const handleRequestTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRequestType(e.target.value);
        setEntityTarget("No"); // Reset the conditional field state
    };

    const renderDynamicFields = () => {
        switch (requestType) {
            case "Comisiones y nómina":
                return (
                    <>
                        <LookupField label="Lobo" required currentUser={currentUser} agents={agents} />

                        <div className="flex items-center mb-3">
                            <div className="w-1/3 text-right pr-4">
                                <label className="text-xs text-gray-600 font-bold"><span className="text-red-600 mr-1">*</span>Motivo</label>
                            </div>
                            <div className="w-2/3">
                                <select className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-8 shadow-sm">
                                    {REASON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center mb-3">
                            <div className="w-1/3 text-right pr-4">
                                <label className="text-xs text-gray-600 font-bold flex justify-end items-center gap-1">
                                    <span className="text-red-600 mr-1">*</span>Oportunidad Relacionada <Info size={12} className="text-gray-400" />
                                </label>
                            </div>
                            <div className="w-2/3 relative">
                                <input type="text" placeholder="Buscar Oportunidades..." className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 pl-2 pr-8 h-8 shadow-sm" />
                                <Search size={14} className="absolute right-2 top-2 text-gray-500" />
                            </div>
                        </div>

                        <div className="flex items-start mb-3">
                            <div className="w-1/3 text-right pr-4 pt-1">
                                <label className="text-xs text-gray-600 font-bold">Comentarios Internos de Gestión</label>
                            </div>
                            <div className="w-2/3">
                                <div className="border border-gray-300 rounded bg-white shadow-sm overflow-hidden">
                                    <RichTextToolbar />
                                    <textarea className="w-full p-2 text-sm outline-none resize-y min-h-[80px]" />
                                </div>
                            </div>
                        </div>
                    </>
                );
            case "Certificación de relación comercial":
                return (
                    <>
                        <LookupField label="Lobo" required currentUser={currentUser} agents={agents} />

                        <div className="flex items-start mb-3 min-h-[32px]">
                            <div className="w-1/3 text-right pr-4 pt-1">
                                <label className="text-xs text-gray-600 font-bold">Fecha Ingreso</label>
                            </div>
                            <div className="w-2/3 pt-1">
                                <div className="text-[11px] text-gray-500 italic">Este campo se calcula al guardar</div>
                            </div>
                        </div>

                        <div className="flex items-center mb-3">
                            <div className="w-1/3 text-right pr-4">
                                <label className="text-xs text-gray-600 font-bold flex justify-end items-center gap-1">
                                    <span className="text-red-600 mr-1">*</span>¿Incluir promedio de ingresos mensuales? <Info size={12} className="text-gray-400" />
                                </label>
                            </div>
                            <div className="w-2/3">
                                <select className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-8 shadow-sm">
                                    {YES_NO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center mb-3">
                            <div className="w-1/3 text-right pr-4">
                                <label className="text-xs text-gray-600 font-bold">
                                    <span className="text-red-600 mr-1">*</span>¿Incluir honorarios?
                                </label>
                            </div>
                            <div className="w-2/3">
                                <select className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-8 shadow-sm">
                                    {YES_NO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center mb-3">
                            <div className="w-1/3 text-right pr-4">
                                <label className="text-xs text-gray-600 font-bold">
                                    <span className="text-red-600 mr-1">*</span>¿Debe ir dirigida a alguna entidad?
                                </label>
                            </div>
                            <div className="w-2/3">
                                <select
                                    value={entityTarget}
                                    onChange={(e) => setEntityTarget(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-8 shadow-sm"
                                >
                                    {YES_NO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>

                        {entityTarget === "Sí" && (
                            <div className="flex items-center mb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="w-1/3 text-right pr-4">
                                    <label className="text-xs text-gray-600 font-bold"><span className="text-red-600 mr-1">*</span>Nombre de la entidad</label>
                                </div>
                                <div className="w-2/3">
                                    <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-8 shadow-sm" />
                                </div>
                            </div>
                        )}

                        <div className="flex items-start mb-3">
                            <div className="w-1/3 text-right pr-4 pt-1">
                                <label className="text-xs text-gray-600 font-bold">Comentarios Internos de Gestión</label>
                            </div>
                            <div className="w-2/3">
                                <div className="border border-gray-300 rounded bg-white shadow-sm overflow-hidden">
                                    <RichTextToolbar />
                                    <textarea className="w-full p-2 text-sm outline-none resize-y min-h-[80px]" />
                                </div>
                            </div>
                        </div>
                    </>
                );
            case "Facturas y cotizaciones":
                return (
                    <>
                        <LookupField label="Lobo" required currentUser={currentUser} agents={agents} />

                        <div className="flex items-center mb-3">
                            <div className="w-1/3 text-right pr-4">
                                <label className="text-xs text-gray-600 font-bold"><span className="text-red-600 mr-1">*</span>Tipo</label>
                            </div>
                            <div className="w-2/3">
                                <select className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-8 shadow-sm">
                                    {INVOICE_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center mb-3">
                            <div className="w-1/3 text-right pr-4">
                                <label className="text-xs text-gray-600 font-bold"><span className="text-red-600 mr-1">*</span>Valor de la venta</label>
                            </div>
                            <div className="w-2/3">
                                <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-8 shadow-sm" />
                            </div>
                        </div>

                        <div className="flex items-center mb-3">
                            <div className="w-1/3 text-right pr-4">
                                <label className="text-xs text-gray-600 font-bold"><span className="text-red-600 mr-1">*</span>Moneda</label>
                            </div>
                            <div className="w-2/3">
                                <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-8 shadow-sm" />
                            </div>
                        </div>

                        <div className="flex items-center mb-3">
                            <div className="w-1/3 text-right pr-4">
                                <label className="text-xs text-gray-600 font-bold flex justify-end items-center gap-1">
                                    <span className="text-red-600 mr-1">*</span>Oportunidad Relacionada <Info size={12} className="text-gray-400" />
                                </label>
                            </div>
                            <div className="w-2/3 relative">
                                <input type="text" placeholder="Buscar Oportunidades..." className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 pl-2 pr-8 h-8 shadow-sm" />
                                <Search size={14} className="absolute right-2 top-2 text-gray-500" />
                            </div>
                        </div>

                        <div className="flex items-start mb-3 min-h-[32px]">
                            <div className="w-1/3 text-right pr-4 pt-1">
                                <label className="text-xs text-gray-600 font-bold">Fecha de cierre oportunidad</label>
                            </div>
                            <div className="w-2/3 pt-1">
                                <div className="text-[11px] text-gray-500 italic">Este campo se calcula al guardar</div>
                            </div>
                        </div>

                        <div className="flex items-start mb-3">
                            <div className="w-1/3 text-right pr-4 pt-1">
                                <label className="text-xs text-gray-600 font-bold">Notas Adicionales para la factura</label>
                            </div>
                            <div className="w-2/3">
                                <textarea className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-16 shadow-sm resize-y" />
                            </div>
                        </div>

                        <div className="flex items-start mb-3">
                            <div className="w-1/3 text-right pr-4 pt-1">
                                <label className="text-xs text-gray-600 font-bold">Comentarios Internos de Gestión</label>
                            </div>
                            <div className="w-2/3">
                                <div className="border border-gray-300 rounded bg-white shadow-sm overflow-hidden">
                                    <RichTextToolbar />
                                    <textarea className="w-full p-2 text-sm outline-none resize-y min-h-[80px]" />
                                </div>
                            </div>
                        </div>
                    </>
                );
            default:
                // Default placeholder fields if "Ninguno" or fallback
                return (
                    <LookupField label="Lobo" required currentUser={currentUser} agents={agents} />
                );
        }
    };

    if (step === 'form') {
        return (
            <div className="flex flex-col h-full bg-[#f3f3f3] relative animate-in fade-in slide-in-from-right-4 duration-300 pb-12">
                {showToast && <SuccessToast />}

                {/* Header Title Area */}
                <div className="bg-white border-b border-gray-200 py-4 px-6 text-center shadow-sm shrink-0">
                    <h2 className="text-xl font-medium text-gray-800">Crear Caso: Recursos Humanos</h2>
                </div>

                {/* Main Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-4 flex justify-center w-full">
                    <div className="bg-white rounded border border-gray-300 shadow-sm w-full max-w-5xl flex flex-col h-fit">
                        {/* Form Content */}
                        <div className="p-6 pb-12">
                            <div className="flex justify-end mb-2">
                                <span className="text-xs text-red-600 font-medium">* = Información obligatoria</span>
                            </div>

                            {/* Section Header */}
                            <div className="bg-[#f3f3f3] px-3 py-1.5 rounded mb-6 border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-800">Details</h3>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-2 gap-x-12 gap-y-2 px-2">
                                {/* Left Col */}
                                <div className="space-y-1">
                                    {/* Main Selector */}
                                    <div className="flex items-center mb-3">
                                        <div className="w-1/3 text-right pr-4">
                                            <label className="text-xs text-gray-600 font-bold"><span className="text-red-600 mr-1">*</span>Tipo de Solicitud</label>
                                        </div>
                                        <div className="w-2/3">
                                            <select
                                                value={requestType}
                                                onChange={handleRequestTypeChange}
                                                className="w-full border-2 border-[#b0adab] focus:border-blue-500 rounded px-2 py-1 text-sm text-gray-700 outline-none bg-white h-8 shadow-sm transition-colors"
                                            >
                                                {REQUEST_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Dynamic Fields */}
                                    {renderDynamicFields()}

                                    {/* Common Read-only fields at bottom left */}
                                    <div className="flex items-start min-h-[32px] mb-3">
                                        <div className="w-1/3 text-right pr-4 pt-1">
                                            <label className="text-xs text-gray-600 font-bold">Monto reembolso</label>
                                        </div>
                                        <div className="w-2/3 pt-1">
                                            <div className="text-sm text-gray-800">US$ 0,00</div>
                                            <div className="text-[11px] text-gray-500 italic mt-0.5">Este campo se calcula al guardar</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start min-h-[32px] mb-3">
                                        <div className="w-1/3 text-right pr-4 pt-1">
                                            <label className="text-xs text-gray-600 font-bold">Tipo lobo opp</label>
                                        </div>
                                        <div className="w-2/3 pt-1">
                                            <div className="text-[11px] text-gray-500 italic">Este campo se calcula al guardar</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start min-h-[32px] mb-3">
                                        <div className="w-1/3 text-right pr-4 pt-1">
                                            <label className="text-xs text-gray-600 font-bold">Subscription sub status</label>
                                        </div>
                                        <div className="w-2/3 pt-1">
                                            <div className="text-[11px] text-gray-500 italic">Este campo se calcula al guardar</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Col */}
                                <div className="space-y-3">
                                    <div className="flex items-start min-h-[32px]">
                                        <div className="w-1/3 text-right pr-4 pt-1">
                                            <label className="text-xs text-gray-600 font-bold">Súper Lobo</label>
                                        </div>
                                        <div className="w-2/3 pt-1">
                                            <div className="text-[11px] text-gray-500 italic">Este campo se calcula al guardar</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start min-h-[32px]">
                                        <div className="w-1/3 text-right pr-4 pt-1">
                                            <label className="text-xs text-gray-600 font-bold">Manager</label>
                                        </div>
                                        <div className="w-2/3 pt-1">
                                            <div className="text-[11px] text-gray-500 italic">Este campo se calcula al guardar</div>
                                        </div>
                                    </div>

                                    {/* Conditional fields for right column based on logic from images */}
                                    {requestType === "Certificación de relación comercial" && (
                                        <>
                                            <div className="flex items-center mb-3">
                                                <div className="w-1/3 text-right pr-4">
                                                    <label className="text-xs text-gray-600 font-bold"><span className="text-red-600 mr-1">*</span>Tipo de Documento</label>
                                                </div>
                                                <div className="w-2/3">
                                                    <select className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-8 shadow-sm">
                                                        <option>--Ninguno--</option>
                                                        <option>Cédula de Ciudadanía</option>
                                                        <option>Cédula de Extranjería</option>
                                                        <option>Pasaporte</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex items-center mb-3">
                                                <div className="w-1/3 text-right pr-4">
                                                    <label className="text-xs text-gray-600 font-bold"><span className="text-red-600 mr-1">*</span>Numero de Documento</label>
                                                </div>
                                                <div className="w-2/3">
                                                    <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-8 shadow-sm" />
                                                </div>
                                            </div>
                                            <div className="flex items-center mb-3">
                                                <div className="w-1/3 text-right pr-4">
                                                    <label className="text-xs text-gray-600 font-bold"><span className="text-red-600 mr-1">*</span>Lugar de expedición</label>
                                                </div>
                                                <div className="w-2/3">
                                                    <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-8 shadow-sm" />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {requestType === "Facturas y cotizaciones" && (
                                        <>
                                            <div className="flex items-center mb-3">
                                                <div className="w-1/3 text-right pr-4">
                                                    <label className="text-xs text-gray-600 font-bold"><span className="text-red-600 mr-1">*</span>¿Debe ir dirigida a alguna entidad?</label>
                                                </div>
                                                <div className="w-2/3">
                                                    <select
                                                        value={entityTarget}
                                                        onChange={(e) => setEntityTarget(e.target.value)}
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-8 shadow-sm"
                                                    >
                                                        {YES_NO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* CONDITIONAL FIELD: Nombre de la entidad */}
                                            {entityTarget === "Sí" && (
                                                <div className="flex items-center mb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <div className="w-1/3 text-right pr-4">
                                                        <label className="text-xs text-gray-600 font-bold"><span className="text-red-600 mr-1">*</span>Nombre de la entidad</label>
                                                    </div>
                                                    <div className="w-2/3">
                                                        <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-8 shadow-sm" />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Default empty fields for Comisiones to match height if needed, or leave blank */}
                                    {requestType === "Comisiones y nómina" && (
                                        <>
                                            <div className="flex items-center mb-3">
                                                <div className="w-1/3 text-right pr-4">
                                                    <label className="text-xs text-gray-600 font-bold"><span className="text-red-600 mr-1">*</span>Valor de la venta</label>
                                                </div>
                                                <div className="w-2/3">
                                                    <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-8 shadow-sm" />
                                                </div>
                                            </div>
                                            <div className="flex items-center mb-3">
                                                <div className="w-1/3 text-right pr-4">
                                                    <label className="text-xs text-gray-600 font-bold">Valor del ajuste de la comisión</label>
                                                </div>
                                                <div className="w-2/3">
                                                    <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 bg-white h-8 shadow-sm" />
                                                </div>
                                            </div>
                                            <div className="flex items-start min-h-[32px]">
                                                <div className="w-1/3 text-right pr-4 pt-1">
                                                    <label className="text-xs text-gray-600 font-bold">Fecha de cierre oportunidad</label>
                                                </div>
                                                <div className="w-2/3 pt-1">
                                                    <div className="text-[11px] text-gray-500 italic">Este campo se calcula al guardar</div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed at bottom, NO absolute positioning for better layout flow */}
                <div className="bg-gray-50 p-3 border-t border-gray-200 flex justify-center gap-3 shrink-0 w-full z-10 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={onCancel}
                        className="px-4 py-1.5 border border-gray-300 rounded text-sm text-blue-600 bg-white hover:bg-gray-50 font-medium shadow-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        className="px-4 py-1.5 border border-gray-300 rounded text-sm text-blue-600 bg-white hover:bg-gray-50 font-medium shadow-sm"
                    >
                        Guardar y nuevo
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-1.5 bg-[#0b5cab] text-white rounded text-sm font-medium hover:bg-blue-800 shadow-sm transition-colors"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        )
    }

    // Default Selection View
    return (
        <div className="flex flex-col h-full bg-[#f3f3f3] p-3 pb-14">
            <div className="bg-white rounded border border-gray-300 shadow-sm flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="p-6 pb-4 shrink-0">
                    <h2 className="text-xl font-medium text-gray-800">Nuevo Caso</h2>
                </div>

                {/* Content - Scrollable List */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="border-t border-gray-200 py-4">
                        {RECORD_TYPES.map((type) => (
                            <label
                                key={type.id}
                                className="flex items-start gap-3 py-2 cursor-pointer group"
                            >
                                <div className="pt-0.5">
                                    <input
                                        type="radio"
                                        name="recordType"
                                        value={type.id}
                                        checked={selectedType === type.id}
                                        onChange={() => setSelectedType(type.id)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-1"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-800 font-medium group-hover:underline">
                                        {type.label}
                                    </span>
                                    {type.desc && (
                                        <span className="text-xs text-gray-500 mt-0.5">
                                            {type.desc}
                                        </span>
                                    )}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="bg-gray-50 p-3 border-t border-gray-200 flex justify-center gap-3 shrink-0 rounded-b">
                    <button
                        onClick={onCancel}
                        className="px-4 py-1.5 border border-gray-300 rounded text-sm text-blue-600 bg-white hover:bg-gray-50 font-medium shadow-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleNext}
                        className="px-4 py-1.5 bg-[#0b5cab] text-white rounded text-sm font-medium hover:bg-blue-800 shadow-sm"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
};