import React, { useState } from 'react';
import { X, Minus, Maximize2, User } from 'lucide-react';

interface NewNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    relatedTo: string;
    onSave: (note: { title: string; body: string }) => void;
}

// SVG toolbar icons to match the exact Salesforce style
const ToolbarBtn = ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <button
        title={title}
        className="w-[28px] h-[28px] flex items-center justify-center border border-[#c9c7c5] bg-white hover:bg-[#f3f2f2] text-[#444] text-xs font-bold"
    >
        {children}
    </button>
);

export const NewNoteModal: React.FC<NewNoteModalProps> = ({ isOpen, onClose, relatedTo, onSave }) => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        const finalTitle = title.trim() || 'Nota sin título';
        onSave({ title: finalTitle, body });
        onClose();
        setTitle('');
        setBody('');
    };

    return (
        // Outer wrapper: fixed bottom-right, mimics a floating panel
        <div
            className="fixed bottom-0 right-0 z-[70] flex flex-col bg-white font-sans animate-in slide-in-from-bottom-4 duration-200"
            style={{
                width: '480px',
                height: '520px',
                boxShadow: '0 2px 14px rgba(0,0,0,0.25)',
                border: '1px solid #c9c7c5',
            }}
        >
            {/* ── Top bar ─────────────────────────────− */}
            {/* Blue top border stripe */}
            <div style={{ height: '3px', background: '#0070d2', flexShrink: 0 }} />

            {/* Header row */}
            <div
                className="flex items-center px-3 py-1.5 bg-white border-b"
                style={{ borderColor: '#e0e0e0', flexShrink: 0 }}
            >
                {/* Note icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-500 mr-2">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="7" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="7" y1="16" x2="13" y2="16" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <div className="flex-1" />
                {/* Window controls */}
                <div className="flex items-center gap-3 text-gray-500">
                    <button className="hover:text-gray-800" title="Minimizar">
                        <Minus size={14} />
                    </button>
                    <button className="hover:text-gray-800" title="Maximizar">
                        <Maximize2 size={14} />
                    </button>
                    <button onClick={onClose} className="hover:text-gray-800" title="Cerrar">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* ── Scrollable body ─────────────────────− */}
            <div className="flex-1 overflow-y-auto" style={{ background: '#fff' }}>
                <div className="px-4 pt-5 pb-3">
                    {/* Título */}
                    <div className="mb-4">
                        <label className="block text-xs text-[#3e3e3c] mb-1" style={{ fontWeight: 400 }}>
                            Título
                        </label>
                        <div className="flex items-start gap-4">
                            {/* Title input — blue outlined box */}
                            <input
                                type="text"
                                placeholder="Nota sin título"
                                autoFocus
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="flex-shrink-0 px-2 py-1 text-sm text-gray-700 placeholder-gray-500 outline-none"
                                style={{
                                    width: '168px',
                                    border: '1.5px solid #0070d2',
                                    borderRadius: '3px',
                                    height: '32px',
                                }}
                            />
                            {/* Visibility label */}
                            <div className="flex items-center gap-1.5 text-[#54698d] text-xs whitespace-nowrap mt-1">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                                </svg>
                                Visibilidad establecida por registro
                            </div>
                        </div>
                    </div>

                    {/* Redactar texto */}
                    <div>
                        <label className="block text-xs text-[#3e3e3c] mb-1.5" style={{ fontWeight: 400 }}>
                            Redactar texto
                        </label>

                        {/* Toolbar */}
                        <div
                            className="flex items-center"
                            style={{
                                border: '1px solid #c9c7c5',
                                borderBottom: 'none',
                                background: '#f3f2f2',
                                padding: '4px 6px',
                                gap: '2px',
                            }}
                        >
                            <ToolbarBtn title="Negrita"><strong>B</strong></ToolbarBtn>
                            <ToolbarBtn title="Cursiva"><em style={{ fontFamily: 'serif' }}>I</em></ToolbarBtn>
                            <ToolbarBtn title="Subrayado"><span style={{ textDecoration: 'underline' }}>U</span></ToolbarBtn>
                            <ToolbarBtn title="Tachado"><span style={{ textDecoration: 'line-through' }}>S</span></ToolbarBtn>

                            {/* Separator */}
                            <div style={{ width: '1px', height: '18px', background: '#c9c7c5', margin: '0 3px' }} />

                            {/* Bullet list */}
                            <ToolbarBtn title="Lista con viñetas">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="4" cy="6" r="2" /><rect x="8" y="5" width="13" height="2" />
                                    <circle cx="4" cy="12" r="2" /><rect x="8" y="11" width="13" height="2" />
                                    <circle cx="4" cy="18" r="2" /><rect x="8" y="17" width="13" height="2" />
                                </svg>
                            </ToolbarBtn>

                            {/* Ordered list */}
                            <ToolbarBtn title="Lista numerada">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <text x="2" y="8" fontSize="8" fontFamily="Arial">1.</text>
                                    <rect x="9" y="5" width="12" height="2" />
                                    <text x="2" y="14" fontSize="8" fontFamily="Arial">2.</text>
                                    <rect x="9" y="11" width="12" height="2" />
                                    <text x="2" y="20" fontSize="8" fontFamily="Arial">3.</text>
                                    <rect x="9" y="17" width="12" height="2" />
                                </svg>
                            </ToolbarBtn>

                            {/* Indent */}
                            <ToolbarBtn title="Aumentar sangría">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="3" y="4" width="18" height="2" />
                                    <rect x="8" y="9" width="13" height="2" />
                                    <rect x="8" y="14" width="13" height="2" />
                                    <rect x="3" y="19" width="18" height="2" />
                                    <polygon points="3,9 3,15 7,12" />
                                </svg>
                            </ToolbarBtn>

                            {/* Outdent */}
                            <ToolbarBtn title="Reducir sangría">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="3" y="4" width="18" height="2" />
                                    <rect x="9" y="9" width="12" height="2" />
                                    <rect x="9" y="14" width="12" height="2" />
                                    <rect x="3" y="19" width="18" height="2" />
                                    <polygon points="8,9 8,15 3,12" />
                                </svg>
                            </ToolbarBtn>

                            {/* Image */}
                            <ToolbarBtn title="Insertar imagen">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21,15 16,10 5,21" />
                                </svg>
                            </ToolbarBtn>
                        </div>

                        {/* Text area */}
                        <textarea
                            className="w-full resize-none outline-none text-sm leading-relaxed"
                            placeholder="Introducir una nota..."
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            style={{
                                border: '1px solid #c9c7c5',
                                height: '210px',
                                padding: '10px 12px',
                                color: body ? '#3e3e3c' : undefined,
                                caretColor: '#0070d2',
                            }}
                        />
                        <style>{`
                            textarea::placeholder { color: #0070d2; }
                        `}</style>
                    </div>
                </div>

                {/* Related To — inside scroll area, before footer */}
                <div
                    className="flex items-center gap-2 px-4 py-2"
                    style={{ borderTop: '1px solid #e0e0e0' }}
                >
                    <span className="text-sm text-[#3e3e3c]">Relacionado con</span>
                    <div
                        className="flex items-center gap-1.5 px-2 py-0.5"
                        style={{
                            border: '1px solid #0070d2',
                            borderRadius: '3px',
                            background: '#fff',
                        }}
                    >
                        <div
                            className="flex items-center justify-center"
                            style={{
                                width: '18px', height: '18px',
                                background: '#0070d2',
                                borderRadius: '2px',
                                flexShrink: 0,
                            }}
                        >
                            <User size={11} color="#fff" />
                        </div>
                        <a href="#" className="text-sm text-[#0070d2] hover:underline">{relatedTo}</a>
                    </div>
                </div>
            </div>

            {/* ── Footer buttons ───────────────────────− */}
            <div
                className="flex items-center justify-between px-3 py-2"
                style={{
                    borderTop: '1px solid #c9c7c5',
                    background: '#fff',
                    flexShrink: 0,
                }}
            >
                {/* Left */}
                <button
                    onClick={onClose}
                    className="text-sm text-[#0070d2] hover:underline px-3 py-1.5 border border-[#c9c7c5] rounded bg-white hover:bg-[#f3f2f2]"
                    style={{ minWidth: '72px' }}
                >
                    Eliminar
                </button>

                {/* Right group */}
                <div className="flex items-center gap-2">
                    <button
                        className="text-sm text-[#0070d2] px-3 py-1.5 border border-[#c9c7c5] rounded bg-white hover:bg-[#f3f2f2]"
                        style={{ minWidth: '72px' }}
                    >
                        Compartir
                    </button>
                    <button
                        className="text-sm text-[#0070d2] px-3 py-1.5 border border-[#0070d2] rounded bg-white hover:bg-blue-50"
                        style={{ minWidth: '130px' }}
                    >
                        Agregar a Registros
                    </button>
                    <button
                        onClick={handleSave}
                        className="text-sm text-white px-4 py-1.5 rounded"
                        style={{
                            background: '#0070d2',
                            minWidth: '60px',
                            border: '1px solid #0070d2',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#005fb2')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#0070d2')}
                    >
                        Listo
                    </button>
                </div>
            </div>
        </div>
    );
};
