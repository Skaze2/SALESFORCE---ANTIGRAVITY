import React from 'react';
import { ProspectData } from '../App';

interface RecordHeaderProps {
    data: ProspectData;
    onNewTaskClick?: () => void;
}

/**
 * Pixel-perfect Salesforce Record Header.
 * Matches the SF Lightning UI header: icon, object type label, name, action buttons, and highlight fields row.
 * Uses ONLY inline styles to avoid any Tailwind CSS class leakage.
 */
export const RecordHeader: React.FC<RecordHeaderProps> = ({ data, onNewTaskClick }) => {
    const daysCreation = data.daysCreation !== undefined
        ? data.daysCreation
        : (data.createdAt
            ? Math.floor((Date.now() - new Date(data.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            : 365);

    // ── Shared token values ────────────────────────────────────────────────
    const COLOR_LABEL = '#706e6b';   // SF warm gray for labels
    const COLOR_VALUE = '#3e3e3c';   // SF dark gray for values
    const COLOR_NAME = '#16325c';   // SF dark navy for record title
    const COLOR_BORDER = '#dddbda';   // SF standard border
    const COLOR_BTN_TXT = '#0070d2';   // SF blue for button labels
    const FONT = '"Salesforce Sans", Arial, sans-serif';

    // ── Button base style ──────────────────────────────────────────────────
    const btnStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        height: '28px',
        padding: '0 12px',
        fontSize: '13px',
        fontWeight: 400,
        fontFamily: FONT,
        color: COLOR_BTN_TXT,
        background: '#ffffff',
        border: `1px solid ${COLOR_BORDER}`,
        borderRadius: '4px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.10)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        lineHeight: 1,
    };

    // ── Highlight fields ───────────────────────────────────────────────────
    const BlueBox = (
        <span style={{
            display: 'inline-block',
            width: '18px',
            height: '18px',
            background: '#007ac2',
            borderRadius: '3px',
            verticalAlign: 'middle',
        }} />
    );

    const fields: { label: string; value: React.ReactNode; maxW?: string }[] = [
        { label: 'País', value: data.country || 'Colombia' },
        { label: 'Programa de interés', value: data.program || 'N/A', maxW: '280px' },
        { label: 'Base de ofertas', value: BlueBox },
        { label: 'Días de creación', value: String(daysCreation) },
        { label: 'Tipo de registro de cuenta', value: 'Lead Account' },
    ];

    return (
        <div
            style={{
                background: '#f3f2f2',
                borderBottom: `1px solid ${COLOR_BORDER}`,
                padding: '10px 20px 8px 20px',
                fontFamily: FONT,
                userSelect: 'none',
                marginBottom: '4px',
                marginLeft: '8px',
                marginRight: '8px',
            }}
        >
            {/* ── Row 1: Object icon + title + action buttons ── */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '10px',
            }}>

                {/* LEFT: icon + type label + name */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>

                    {/* Account icon — SF purple square */}
                    <div style={{
                        width: '36px',
                        height: '36px',
                        background: '#7f8de1',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '1px',
                    }}>
                        {/* SF "Account" icon path (person/group) */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 100 100"
                            width="20"
                            height="20"
                            fill="white"
                        >
                            <path d="M50 10c-11 0-20 9-20 20s9 20 20 20 20-9 20-20S61 10 50 10zm0 35c-16.5 0-30 8.3-30 18.5V70h60v-6.5C80 53.3 66.5 45 50 45z" />
                        </svg>
                    </div>

                    {/* Object type + record name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 400,
                            color: COLOR_LABEL,
                            lineHeight: 1.4,
                            letterSpacing: '0.01em',
                        }}>
                            Cuenta personal
                        </span>
                        <span style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: COLOR_NAME,
                            lineHeight: 1.2,
                            letterSpacing: '-0.01em',
                        }}>
                            {data.firstName} {data.lastName}
                        </span>
                    </div>
                </div>

                {/* RIGHT: action buttons */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingTop: '2px' }}>
                    {/* + Seguir */}
                    <button style={btnStyle}>
                        {/* Plus icon — inline SVG for exact sizing */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Seguir
                    </button>

                    {/* Nueva tarea */}
                    <button style={btnStyle} onClick={onNewTaskClick}>
                        Nueva tarea
                    </button>
                </div>
            </div>

            {/* ── Row 2: Highlight fields — distributed across full width ── */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                gap: '44px',
                width: '100%',
                overflow: 'hidden',
            }}>
                {fields.map(({ label, value, maxW }) => (
                    <div key={label} style={{ flexShrink: 0 }}>
                        {/* Label */}
                        <div style={{
                            fontSize: '11px',
                            fontWeight: 400,
                            color: COLOR_LABEL,
                            whiteSpace: 'nowrap',
                            marginBottom: '2px',
                            lineHeight: 1.3,
                        }}>
                            {label}
                        </div>

                        {/* Value */}
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 400,
                            color: COLOR_VALUE,
                            lineHeight: 1.35,
                            maxWidth: maxW || '160px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};