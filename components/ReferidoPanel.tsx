import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, Minus, ExternalLink, ChevronDown, Check } from 'lucide-react';

interface ReferidoPanelProps {
  onClose: () => void;
}

// --- Data Lists ---

const COUNTRIES = [
  "--Ninguno--",
  "Argentina", "Bolivia", "Brasil", "Canadá", "Chile", 
  "Colombia", "Costa Rica", "Cuba", "Ecuador", "España", 
  "Estados Unidos", "Guatemala", "Honduras", "México", 
  "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico",
  "República Dominicana", "Uruguay", "Venezuela"
];

const COUNTRY_CODES = [
  "--Ninguno--",
  "Argentina +54", "Bolivia +591", "Brasil +55", "Canadá +1", "Chile +56", 
  "Colombia +57", "Costa Rica +506", "Cuba +53", "Ecuador +593", "España +34", 
  "Estados Unidos +1", "Guatemala +502", "Honduras +504", "México +52", 
  "Nicaragua +505", "Panamá +507", "Paraguay +595", "Perú +51", "Puerto Rico +1",
  "República Dominicana +1", "Uruguay +598", "Venezuela +58"
];

// --- Custom Searchable Select Component ---

interface SearchableSelectProps {
  label: string;
  required?: boolean;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ label, required, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchBuffer, setSearchBuffer] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Use ReturnType<typeof setTimeout> to avoid NodeJS namespace dependency
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keyboard Search Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Prevent default scrolling for space if we are searching (optional, but good UX)
      if (e.key.length === 1) {
        // e.preventDefault(); 
        const char = e.key.toLowerCase();
        
        // Update buffer
        const newBuffer = searchBuffer + char;
        setSearchBuffer(newBuffer);

        // Reset buffer timer (2 seconds rule)
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
          setSearchBuffer("");
        }, 2000);

        // Find match
        const match = options.find(opt => opt.toLowerCase().startsWith(newBuffer));
        if (match) {
            // Scroll to match
            const index = options.indexOf(match);
            const itemElement = listRef.current?.children[index] as HTMLElement;
            if (itemElement) {
                itemElement.scrollIntoView({ block: 'nearest' });
                // Optional: Auto-select or just highlight? Standard select highlights but doesn't commit until Enter usually.
                // For this UI, let's just highlight visually or move focus. 
                // To keep it simple and effective, we'll auto-select on type for immediate feedback 
                // OR just visual scroll. Let's do visual scroll + select to mimic standard select behavior mostly.
                onChange(match); 
            }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [isOpen, searchBuffer, options, onChange]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs text-gray-600 mb-1">
          {required && <span className="text-red-500 mr-1">*</span>}
          {label}
      </label>
      
      {/* Trigger Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border border-gray-300 rounded-[4px] h-8 px-2 text-sm flex items-center justify-between bg-white cursor-pointer ${isOpen ? 'ring-1 ring-blue-500 border-blue-500' : ''}`}
      >
        <span className="truncate select-none">{value}</span>
        <div className="flex flex-col">
            <ChevronDown size={12} className="text-gray-500" />
        </div>
      </div>

      {/* Dropdown List - UPDATED to open upwards (bottom-full) */}
      {isOpen && (
        <div 
            ref={listRef}
            className="absolute bottom-full left-0 w-full bg-white border border-gray-300 shadow-lg rounded max-h-48 overflow-y-auto z-50 mb-1"
        >
          {options.map((opt, idx) => {
            const isSelected = opt === value;
            return (
                <div 
                    key={idx}
                    onClick={() => {
                        onChange(opt);
                        setIsOpen(false);
                        setSearchBuffer(""); // Reset search on select
                    }}
                    className={`px-2 py-1.5 text-sm cursor-pointer select-none flex items-center justify-between
                        ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-800 hover:bg-blue-600 hover:text-white'}
                    `}
                >
                    <span>{opt}</span>
                </div>
            )
          })}
        </div>
      )}
    </div>
  );
};

// --- Main Panel Component ---

export const ReferidoPanel: React.FC<ReferidoPanelProps> = ({ onClose }) => {
  // Form States
  const [country, setCountry] = useState("--Ninguno--");
  const [code, setCode] = useState("--Ninguno--");

  return (
    // Fixed left-0 bottom-[35px] to stick to bottom left of screen
    <div className="fixed bottom-[35px] left-0 w-[340px] bg-white rounded-t-lg shadow-[0_0_10px_rgba(0,0,0,0.2)] border border-gray-300 flex flex-col font-sans z-[60]">
      {/* Window Header */}
      <div 
        onClick={onClose} 
        className="flex items-center justify-between px-3 py-2 bg-[#f3f3f3] rounded-t-lg border-b border-gray-300 shrink-0 h-9 cursor-pointer"
      >
        <div className="flex items-center gap-2">
            <UserPlus size={14} className="text-gray-600" />
            <span className="text-sm font-semibold text-gray-800">Referido</span>
        </div>
        <div className="flex items-center gap-3">
             <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <Minus size={14} strokeWidth={3} />
             </button>
             <button className="text-gray-500 hover:text-gray-700">
                <ExternalLink size={12} />
             </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 bg-white flex-1 overflow-y-auto max-h-[500px]">
        {/* Yellow Title */}
        <h2 className="text-center text-[#ffc107] text-xl font-bold mb-5 tracking-wide">
            Referido
        </h2>

        {/* Form Fields */}
        <div className="space-y-3">
            
            {/* Row 1: Nombre / Apellido */}
            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">
                        <span className="text-red-500 mr-1">*</span>Nombre
                    </label>
                    <input type="text" className="w-full border border-gray-300 rounded-[4px] h-8 px-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">
                        <span className="text-red-500 mr-1">*</span>Apellido
                    </label>
                    <input type="text" className="w-full border border-gray-300 rounded-[4px] h-8 px-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
            </div>

            {/* Row 2: Email / País */}
            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">
                        <span className="text-red-500 mr-1">*</span>Email
                    </label>
                    <input type="email" className="w-full border border-gray-300 rounded-[4px] h-8 px-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div className="flex-1">
                    <SearchableSelect 
                        label="País" 
                        required 
                        options={COUNTRIES} 
                        value={country} 
                        onChange={setCountry} 
                    />
                </div>
            </div>

            {/* Row 3: Código país / Móvil */}
            <div className="flex gap-3">
                <div className="flex-1">
                    <SearchableSelect 
                        label="Código país" 
                        required 
                        options={COUNTRY_CODES} 
                        value={code} 
                        onChange={setCode} 
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">
                        <span className="text-red-500 mr-1">*</span>Móvil
                    </label>
                    <input type="text" className="w-full border border-gray-300 rounded-[4px] h-8 px-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
            </div>

        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 bg-white rounded-b-lg flex justify-end">
          <button 
            className="bg-[#1b5297] text-white text-sm font-medium px-4 py-1.5 rounded-[4px] hover:bg-blue-800 shadow-sm transition-colors"
          >
              Crear
          </button>
      </div>
    </div>
  );
};