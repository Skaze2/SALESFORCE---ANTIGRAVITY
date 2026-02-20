import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Calendar as CalendarIcon, Clock, User, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { db } from '../firebaseConfig';
import { User as UserType } from '../App';

interface NewTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    prospectId?: string;
    currentUser?: UserType;
    onTaskCreated?: (subject: string) => void;
}

const SUBJECT_OPTIONS = [
    "Agenda",
    "Seguimiento Asignado",
    "Compromiso de pago",
    "Cliente: Diligenciar Sourcing Brief"
];

// Helper to generate time slots
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

// Helper to get Bogota Time rounded to nearest 15
const getBogotaTime = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Bogota',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    };

    // This gives us something like "10:14 PM"
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);

    let hour = parseInt(parts.find(p => p.type === 'hour')?.value || '12');
    let minute = parseInt(parts.find(p => p.type === 'minute')?.value || '00');
    let dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value || 'AM'; // AM or PM

    // Round minutes
    let roundedMinute = 0;
    if (minute < 8) roundedMinute = 0;
    else if (minute < 23) roundedMinute = 15;
    else if (minute < 38) roundedMinute = 30;
    else if (minute < 53) roundedMinute = 45;
    else {
        roundedMinute = 0;
        hour += 1;
        if (hour === 12) {
            // Toggle AM/PM if we crossed 12
            dayPeriod = dayPeriod === 'AM' ? 'PM' : 'AM';
        } else if (hour === 13) {
            hour = 1;
        }
    }

    // Format to match our slots: "10:00 p. m." (Spanish style roughly matches typical localized outputs)
    // We need to match the format of TIME_SLOTS: "10:00 p. m."
    const periodStr = dayPeriod === 'AM' ? 'a. m.' : 'p. m.';
    const minStr = roundedMinute === 0 ? '00' : roundedMinute.toString();

    return `${hour}:${minStr} ${periodStr}`;
};

// --- Custom Calendar Component ---
const CustomCalendar = ({ onSelect, onClose, initialDate }: { onSelect: (date: string) => void, onClose: () => void, initialDate: string }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDateStr, setSelectedDateStr] = useState(initialDate); // format DD/MM/YYYY

    // Parse initial date string to set view if valid, else today
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
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 is Sunday

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const dateStr = `${day}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
        onSelect(dateStr);
        onClose();
    };

    const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    // Render grid
    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalSlots = [...blanks, ...days];

    return (
        <div className="absolute z-50 bg-white border border-gray-300 shadow-xl rounded mt-1 p-2 w-[300px] right-0 top-full">
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

                    // Check if selected
                    const isSelected = selectedDateStr === `${day}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;

                    return (
                        <button
                            key={idx}
                            onClick={() => handleDateClick(day)}
                            className={`
                                text-sm w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors
                                ${isSelected ? 'bg-blue-700 text-white font-bold' : 'text-gray-700 hover:bg-gray-100'}
                            `}
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

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, prospectId, currentUser, onTaskCreated }) => {
    // Field States
    const [subject, setSubject] = useState("Agenda");
    const [dueDate, setDueDate] = useState("2/02/2026");
    const [reminderSet, setReminderSet] = useState(true);
    const [reminderDate, setReminderDate] = useState("2/02/2026");
    const [reminderTime, setReminderTime] = useState(""); // Will init on mount
    const [saving, setSaving] = useState(false);

    // Dropdown Visibility States
    const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
    const [showDueDateCalendar, setShowDueDateCalendar] = useState(false);
    const [showReminderDateCalendar, setShowReminderDateCalendar] = useState(false);
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);

    // Init Bogota time
    useEffect(() => {
        if (isOpen) {
            setReminderTime(getBogotaTime());
        }
    }, [isOpen]);

    const modalRef = useRef<HTMLDivElement>(null);

    // Close dropdowns if clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // This logic is simplified; specific refs for dropdowns would be cleaner but 
            // keeping it simple for single-file demo constraints.
            const target = event.target as HTMLElement;
            if (!target.closest('.dropdown-container')) {
                setShowSubjectDropdown(false);
                setShowTimeDropdown(false);
                setShowDueDateCalendar(false);
                setShowReminderDateCalendar(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            if (prospectId) {
                await db.ref(`tasks/${prospectId}`).push({
                    subject,
                    dueDate,
                    reminderDate: reminderSet ? reminderDate : null,
                    reminderTime: reminderSet ? reminderTime : null,
                    assignedTo: currentUser
                        ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
                        : 'Camila Patarroyo',
                    createdAt: new Date().toISOString(),
                });
                onTaskCreated?.(subject);
            }
        } catch (err) {
            console.error('Error saving task:', err);
        } finally {
            setSaving(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

            {/* Modal Container */}
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl z-50 flex flex-col max-h-[90vh]" ref={modalRef}>

                {/* Header */}
                <div className="h-14 border-b border-gray-200 flex items-center justify-center relative shrink-0">
                    <h2 className="text-xl font-normal text-gray-800">Nueva tarea</h2>
                    {/* Maximize/Close icons could go here, omitting for simplicity/cleanliness matching image */}
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">

                    {/* Subject Field */}
                    <div className="relative dropdown-container">
                        <label className="block text-xs text-gray-600 mb-1">
                            <span className="text-red-500 mr-0.5">*</span>Asunto
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={subject}
                                onClick={() => {
                                    setShowSubjectDropdown(true);
                                    setShowDueDateCalendar(false);
                                    setShowReminderDateCalendar(false);
                                    setShowTimeDropdown(false);
                                }}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                            <Search className="absolute right-2 top-2 text-gray-400" size={16} />
                        </div>
                        {/* Subject Dropdown */}
                        {showSubjectDropdown && (
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg rounded mt-1 z-20">
                                {SUBJECT_OPTIONS.map((opt) => (
                                    <div
                                        key={opt}
                                        className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                        onClick={() => {
                                            setSubject(opt);
                                            setShowSubjectDropdown(false);
                                        }}
                                    >
                                        {subject === opt && <Check size={14} className="text-blue-600" />}
                                        <span className={subject === opt ? '' : 'ml-6'}>{opt}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Due Date Field */}
                    <div className="relative dropdown-container">
                        <label className="block text-xs text-gray-600 mb-1">Fecha de vencimiento</label>
                        <div className="relative">
                            <input
                                type="text"
                                readOnly
                                value={dueDate}
                                onClick={() => {
                                    const newState = !showDueDateCalendar;
                                    setShowDueDateCalendar(newState);
                                    if (newState) {
                                        setShowSubjectDropdown(false);
                                        setShowReminderDateCalendar(false);
                                        setShowTimeDropdown(false);
                                    }
                                }}
                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                            />
                            <CalendarIcon className="absolute right-2 top-2 text-gray-500" size={16} />

                            {showDueDateCalendar && (
                                <CustomCalendar
                                    initialDate={dueDate}
                                    onSelect={setDueDate}
                                    onClose={() => setShowDueDateCalendar(false)}
                                />
                            )}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">Formato: 31/12/2024</div>
                    </div>

                    {/* Reminder Section */}
                    <div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 mb-2 cursor-pointer w-fit">
                            <span>Recordatorio establecido</span>
                        </label>
                        <div className="mb-2">
                            <input
                                type="checkbox"
                                checked={reminderSet}
                                onChange={(e) => setReminderSet(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        </div>

                        {reminderSet && (
                            <div className="flex gap-4">
                                {/* Reminder Date */}
                                <div className="flex-1 relative dropdown-container">
                                    <label className="block text-xs text-gray-600 mb-1">Fecha</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            readOnly
                                            value={reminderDate}
                                            onClick={() => {
                                                const newState = !showReminderDateCalendar;
                                                setShowReminderDateCalendar(newState);
                                                if (newState) {
                                                    setShowSubjectDropdown(false);
                                                    setShowDueDateCalendar(false);
                                                    setShowTimeDropdown(false);
                                                }
                                            }}
                                            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                                        />
                                        <CalendarIcon className="absolute right-2 top-2 text-gray-500" size={16} />
                                        {showReminderDateCalendar && (
                                            <CustomCalendar
                                                initialDate={reminderDate}
                                                onSelect={setReminderDate}
                                                onClose={() => setShowReminderDateCalendar(false)}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Reminder Time */}
                                <div className="flex-1 relative dropdown-container">
                                    <label className="block text-xs text-gray-600 mb-1">Hora</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={reminderTime}
                                            readOnly
                                            onClick={() => {
                                                const newState = !showTimeDropdown;
                                                setShowTimeDropdown(newState);
                                                if (newState) {
                                                    setShowSubjectDropdown(false);
                                                    setShowDueDateCalendar(false);
                                                    setShowReminderDateCalendar(false);
                                                }
                                            }}
                                            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                                        />
                                        <Clock className="absolute right-2 top-2 text-gray-500" size={16} />

                                        {showTimeDropdown && (
                                            <div className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg rounded mt-1 z-20 max-h-48 overflow-y-auto">
                                                {TIME_SLOTS.map((slot) => (
                                                    <div
                                                        key={slot}
                                                        className={`px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2 ${slot === reminderTime ? 'bg-blue-50' : ''}`}
                                                        onClick={() => {
                                                            setReminderTime(slot);
                                                            setShowTimeDropdown(false);
                                                        }}
                                                    >
                                                        {slot === reminderTime && <Check size={14} className="text-blue-600" />}
                                                        <span className={slot === reminderTime ? '' : 'ml-6'}>{slot}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Assigned To */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1"><span className="text-red-500 mr-0.5">*</span>Asignado a</label>
                        <div className="border border-gray-300 rounded px-2 py-1.5 flex items-center gap-2 bg-white">
                            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                                <User size={14} className="text-white" />
                            </div>
                            <span className="text-sm text-gray-800 flex-1">{currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : 'Agente'}</span>
                            <X size={16} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                        </div>
                    </div>

                    <div className="h-20"></div> {/* Spacer */}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 border border-gray-300 rounded text-sm text-blue-600 bg-white hover:bg-gray-50 font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-1.5 bg-[#1b5297] text-white rounded text-sm font-medium hover:bg-blue-800 shadow-sm disabled:opacity-60"
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};