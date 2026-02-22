import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Plus, Star, ChevronDown, HelpCircle, Mountain, Book, X, Check } from 'lucide-react';
import { db } from '../firebaseConfig';
import { ProspectData, User } from '../App';

interface HeaderProps {
    onOpenRecord: (record: ProspectData) => void;
    onLogout?: () => void;
    user?: User;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRecord, onLogout, user }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<ProspectData[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [allProspects, setAllProspects] = useState<ProspectData[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Fetch all prospects on mount (efficient for demo size)
    useEffect(() => {
        const prospectsRef = db.ref('prospects');
        prospectsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list: ProspectData[] = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                setAllProspects(list);
            }
        });

        return () => prospectsRef.off();
    }, []);

    // Filter Logic
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setResults([]);
            return;
        }

        const lowerTerm = searchTerm.toLowerCase();
        const filtered = allProspects.filter(p => {
            const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
            const email = (p.email || '').toLowerCase();
            const fullPhone = `${p.phoneCode || ''}${p.phone || ''}`.replace(/\s/g, '');
            const phone = p.phone || '';

            return fullName.includes(lowerTerm) ||
                email.includes(lowerTerm) ||
                fullPhone.includes(lowerTerm) ||
                phone.includes(lowerTerm);
        });

        setResults(filtered);
    }, [searchTerm, allProspects]);

    // Click Outside Logic
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (record: ProspectData) => {
        onOpenRecord(record);
        setShowDropdown(false);
        setSearchTerm('');
    };

    return (
        <header className="h-[50px] bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0 z-50">
            {/* Left: Logo */}
            <div className="flex items-center gap-4 w-64">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        <span className="text-black text-lg">🐝</span>
                    </div>
                    <span className="font-semibold text-lg text-gray-700 tracking-tight">smartBeemo<span className="text-xs align-top">™</span></span>
                </div>
            </div>

            {/* Center: Global Search */}
            <div className="flex-1 max-w-2xl px-4 relative" ref={dropdownRef}>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm shadow-sm transition-shadow"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                    />
                </div>

                {/* Search Results Dropdown */}
                {showDropdown && searchTerm && (
                    <div className="absolute top-full left-4 right-4 bg-white border border-gray-200 rounded-b-md shadow-lg mt-1 max-h-80 overflow-y-auto z-[60]">
                        {results.length > 0 ? (
                            <ul>
                                <li className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-50 uppercase border-b border-gray-100">
                                    Resultados ({results.length})
                                </li>
                                {results.map((prospect) => (
                                    <li
                                        key={prospect.id}
                                        onClick={() => handleSelect(prospect)}
                                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-50 flex items-center gap-3 transition-colors group"
                                    >
                                        <div className="w-8 h-8 bg-[#7f8de1] rounded-[4px] flex items-center justify-center shrink-0">
                                            <Book size={16} className="text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-blue-600 font-medium group-hover:underline">
                                                {prospect.firstName} {prospect.lastName}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {prospect.program} • {prospect.email}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No se encontraron resultados
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 sm:gap-4 text-[#747474] pr-2">

                {/* Favorites Split Button */}
                <div className="flex items-center h-[30px] bg-white border border-[#c9c7c5] rounded-[4px] overflow-hidden ml-1">
                    <button className="px-2 h-full hover:bg-gray-100 border-r border-[#c9c7c5] flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#747474" strokeWidth="2.5" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </button>
                    <button className="px-1.5 h-full hover:bg-gray-100 flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#747474">
                            <path d="M4 8L12 16L20 8Z" />
                        </svg>
                    </button>
                </div>

                {/* Global Actions (Plus) */}
                <button className="w-[30px] h-[30px] bg-[#969492] hover:bg-[#747474] rounded-[4px] flex items-center justify-center transition-colors shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
                        <path d="M14 6H8V0H6v6H0v2h6v6h2V8h6V6z" />
                    </svg>
                </button>

                {/* Trailhead Icon */}
                <button className="w-8 h-8 hover:bg-gray-100 rounded text-[#747474] flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#747474">
                        <path d="M12.9,4A5.9,5.9,0,0,0,7.2,8.8,4.5,4.5,0,0,0,8,17.7h.2l1.3-2.2,1.4,2.2H16.8A4.5,4.5,0,0,0,16.8,8.8V8.7A5.9,5.9,0,0,0,12.9,4Zm-2,9.3L8.4,9.6A.6.6,0,0,0,7.5,9.7L5.7,12.8a.5.5,0,0,0,.4.8h4.3ZM14.5,13l1.8-3.1a.6.6,0,0,1,.8,0l1.8,3.1a.5.5,0,0,1-.4.8h-4.3a.5.5,0,0,1-.4-.8Z" />
                        <path d="M11.7,13.5c-1.3,2.1.7,3,.4,4.9a.3.3,0,0,0,.3.3h.1a.3.3,0,0,0,.3-.2c.3-2.1,2.8-2.7,1.2-4.9a.2.2,0,0,0-.3,0Z" />
                    </svg>
                </button>

                {/* Help */}
                <button className="w-8 h-8 hover:bg-gray-100 rounded text-[#747474] flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#747474">
                        <path d="M12.1,5.5c-2.2,0-3.9,1.6-4.1,3.8H10c0.1-1.1,1-1.8,2-1.8c1.1,0,1.9,0.8,1.9,1.9c0,0.8-0.4,1.4-1.1,1.9 c-1.3,0.9-2.2,2.3-2.2,3.9v0.5h2v-0.5c0-1.1,0.6-2.1,1.5-2.7c1-0.7,1.7-1.7,1.7-2.9C15.9,7.1,14.2,5.5,12.1,5.5z" />
                        <circle cx="12" cy="18" r="1.5" />
                    </svg>
                </button>

                {/* Setup (Gear + Lightning) */}
                <button className="w-8 h-8 hover:bg-gray-100 rounded text-[#747474] flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#747474">
                        <path d="M20.6,10.9l-1.4-0.2c-0.3-0.9-0.7-1.8-1.2-2.5l0.9-1.2c0.2-0.3,0.2-0.8-0.2-1.1l-1.3-1.3c-0.3-0.3-0.8-0.3-1.1-0.2 l-1.2,0.9c-0.8-0.5-1.6-0.9-2.5-1.2l-0.2-1.4C12.3,2.3,12,2,11.6,2h-1.8c-0.4,0-0.8,0.3-0.8,0.7l-0.2,1.4c-0.9,0.3-1.8,0.7-2.5,1.2 l-1.2-0.9c-0.3-0.2-0.8-0.2-1.1,0.2L2.7,5.9c-0.3,0.3-0.3,0.8-0.2,1.1l0.9,1.2C2.9,9.1,2.5,9.9,2.2,10.8l-1.4,0.2 C0.4,11.1,0.1,11.4,0.1,11.8v1.8c0,0.4,0.3,0.8,0.7,0.8l1.4,0.2c0.3,0.9,0.7,1.8,1.2,2.5l-0.9,1.2c-0.2,0.3-0.2,0.8,0.2,1.1 l1.3,1.3c0.3,0.3,0.8,0.3,1.1,0.2l1.2-0.9c0.8,0.5,1.6,0.9,2.5,1.2l0.2,1.4C9.1,21.7,9.4,22,9.8,22h1.8c0.4,0,0.8-0.3,0.8-0.7 l0.2-1.4c0.9-0.3,1.8-0.7,2.5-1.2l1.2,0.9c0.3,0.2,0.8,0.2,1.1-0.2l1.3-1.3c0.3-0.3,0.3-0.8,0.2-1.1l-0.9-1.2 c0.5-0.8,0.9-1.6,1.2-2.5l1.4-0.2c0.4-0.1,0.7-0.4,0.7-0.8v-1.8C21.4,11.3,21,10.9,20.6,10.9z M12,16.5c-2.5,0-4.5-2-4.5-4.5 s2-4.5,4.5-4.5s4.5,2,4.5,4.5S14.5,16.5,12,16.5z" />
                        <polygon points="12.5,7.5 9.5,12.5 12,12.5 11.5,15.5 14.5,10.5 12,10.5" />
                    </svg>
                </button>

                {/* Bell */}
                <button className="w-8 h-8 hover:bg-gray-100 rounded text-[#747474] flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#747474">
                        <path d="M19.7,14l-1.8-1.5c-0.4-0.3-0.6-0.8-0.6-1.3V8.8c0-2.6-2-4.8-4.5-5.2 V3c0-0.5-0.4-1-1-1c-0.5,0-1,0.4-1,1v0.5C8.2,4,6.2,6.2,6.2,8.8v2.4c0,0.5-0.2,1-0.6,1.4 L3.8,14c-0.4,0.3-0.7,0.8-0.7,1.3c0,0.8,0.7,1.5,1.5,1.5h14.8c0.8,0,1.5-0.7,1.5-1.5 C20.9,14.8,20.4,14.3,19.7,14z M12,21c1.5,0,2.8-1.1,2.9-2.6h-5.8C9.2,19.9,10.5,21,12,21z" />
                    </svg>
                </button>

                {/* Astro User Profile */}
                <div className="relative ml-1 cursor-pointer" ref={userMenuRef}>
                    <div
                        className="w-[34px] h-[34px] rounded-full overflow-hidden flex items-center justify-center hover:opacity-90 transition-opacity"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
                            <circle cx="50" cy="50" r="48" fill="#5A6E8B" stroke="#c9c7c5" strokeWidth="2.5" />
                            <ellipse cx="50" cy="65" rx="23" ry="28" fill="white" />
                            <circle cx="35" cy="35" r="4.5" fill="white" />
                            <circle cx="65" cy="35" r="4.5" fill="white" />
                            <ellipse cx="50" cy="50" rx="7" ry="4.5" fill="#5A6E8B" />
                        </svg>
                    </div>

                    {/* User Menu Popover */}
                    {showUserMenu && user && (
                        <div className="fixed top-[50px] right-4 bg-white border border-gray-200 shadow-2xl rounded-md w-72 z-[10000] overflow-hidden font-sans cursor-default">
                            {/* Arrow Pointer */}
                            <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-t border-l border-gray-200 transform rotate-45"></div>

                            {/* Header Section */}
                            <div className="p-4 flex items-start justify-between border-b border-gray-200 relative bg-white">
                                <div className="flex gap-3">
                                    <div className="w-[48px] h-[48px] rounded-full overflow-hidden flex items-center justify-center bg-[#5A6E8B] shrink-0 border-2 border-transparent">
                                        <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
                                            <circle cx="50" cy="50" r="48" fill="#5A6E8B" />
                                            <ellipse cx="50" cy="65" rx="23" ry="28" fill="white" />
                                            <circle cx="35" cy="35" r="4.5" fill="white" />
                                            <circle cx="65" cy="35" r="4.5" fill="white" />
                                            <ellipse cx="50" cy="50" rx="7" ry="4.5" fill="#5A6E8B" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="font-semibold text-[15px] text-[#0176d3]">{user.firstName} {user.lastName}</h3>
                                        <p className="text-[13px] text-gray-700 font-medium mb-1">smartbeemo.my.salesforce.com</p>
                                        <div className="flex gap-3 text-[13px]">
                                            <a href="#" className="text-blue-600 hover:underline">Configuración</a>
                                            <button onClick={() => { setShowUserMenu(false); onLogout?.(); }} className="text-blue-600 hover:underline">Cerrar sesión</button>
                                        </div>
                                    </div>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600 absolute top-2 right-2" onClick={() => setShowUserMenu(false)}>
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Density Section */}
                            <div className="bg-[#f3f3f3] px-3 py-1.5 border-b border-gray-200 uppercase text-[11px] font-bold text-gray-600 tracking-wide">
                                DENSIDAD DE VISUALIZACIÓN
                            </div>
                            <div className="p-2 space-y-1">
                                <button className="w-full text-left px-2 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-[13px] font-bold text-[#181b25]">
                                    <Check size={14} className="text-black" /> Cómoda
                                </button>
                                <button className="w-full text-left px-2 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-[13px] text-gray-700">
                                    <span className="w-[14px]"></span> Compacta
                                </button>
                            </div>

                            {/* Options Section */}
                            <div className="bg-[#f3f3f3] px-3 py-1.5 border-y border-gray-200 uppercase text-[11px] font-bold text-gray-600 tracking-wide">
                                OPCIONES
                            </div>
                            <div className="p-3 bg-white space-y-2">
                                <a href="#" className="flex flex-col gap-0.5 group">
                                    <span className="text-[13px] text-blue-600 group-hover:underline flex items-center gap-1">Cambiar a Salesforce Classic <span className="w-3 h-3 rounded-full bg-gray-500 text-white flex items-center justify-center text-[10px] pb-0.5 opacity-80">i</span></span>
                                </a>
                                <a href="#" className="flex flex-col gap-0.5 group">
                                    <span className="text-[13px] text-blue-600 group-hover:underline">Agregar nombre de usuario</span>
                                </a>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
};