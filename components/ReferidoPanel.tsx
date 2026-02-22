import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, Minus, ExternalLink, ChevronDown, Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import { db } from '../firebaseConfig';
import { User as UserType, ProspectData } from '../App';

interface ReferidoPanelProps {
  currentUser: UserType | null;
  onOpenRecord: (record: ProspectData) => void;
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
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key.length === 1) {
        const char = e.key.toLowerCase();
        const newBuffer = searchBuffer + char;
        setSearchBuffer(newBuffer);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
          setSearchBuffer("");
        }, 2000);

        const match = options.find(opt => opt.toLowerCase().startsWith(newBuffer));
        if (match) {
          const index = options.indexOf(match);
          const itemElement = listRef.current?.children[index] as HTMLElement;
          if (itemElement) {
            itemElement.scrollIntoView({ block: 'nearest' });
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
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border border-gray-300 rounded-[4px] h-8 px-2 text-sm flex items-center justify-between bg-white cursor-pointer ${isOpen ? 'ring-1 ring-blue-500 border-blue-500' : ''}`}
      >
        <span className="truncate select-none">{value}</span>
        <div className="flex flex-col">
          <ChevronDown size={12} className="text-gray-500" />
        </div>
      </div>
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
                  setSearchBuffer("");
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

export const ReferidoPanel: React.FC<ReferidoPanelProps> = ({ currentUser, onOpenRecord, onClose }) => {
  // Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("--Ninguno--");
  const [code, setCode] = useState("--Ninguno--");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!currentUser) return;
    if (!firstName || !lastName || !email || !phone || country === "--Ninguno--" || code === "--Ninguno--") {
      setErrorMessage("Por favor complete todos los campos obligatorios.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const userFullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();

      // 1. Quota Check (5 Asignado, 5 Agendado)
      const snapshot = await db.ref('prospects').once('value');
      const prospects = snapshot.val() || {};

      const myProspects = Object.values(prospects).filter((p: any) => p.owner === userFullName);
      const countAsignado = myProspects.filter((p: any) => p.status === 'Asignado').length;
      const countAgendado = myProspects.filter((p: any) => p.status === 'Agendado').length;

      let finalStatus = "";
      if (countAsignado < 5) {
        finalStatus = "Asignado";
      } else if (countAgendado < 5) {
        finalStatus = "Agendado";
      } else {
        setErrorMessage("No tienes cupos disponibles en Agendado o Asignado para reservar este nuevo cliente.");
        setIsLoading(false);
        return;
      }

      // 2. Create Record
      const newProspectRef = db.ref('prospects').push();
      const now = new Date().toISOString();

      const newRecordData: ProspectData = {
        id: newProspectRef.key as string,
        firstName,
        lastName,
        email,
        country,
        phoneCode: code.split(' ').pop() || "",
        phone,
        status: finalStatus as any, // Cast to match ProspectData status type
        owner: userFullName,
        daysCreation: 0,
        createdAt: now,
        statusUpdatedAt: now,
        program: "N/A",
        origin: "N/A"
      };

      await newProspectRef.set(newRecordData);

      // 3. Optional: Add Initial History
      const dateStr = new Date().toLocaleString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      }).replace(',', '');

      await db.ref(`history/${newProspectRef.key}`).push({
        date: dateStr,
        field: 'Creado',
        user: userFullName,
        original: '-',
        new: 'Registro Referido',
        createdAt: now
      });

      // 4. Auto-open and Close
      onOpenRecord(newRecordData);
      onClose();
    } catch (err) {
      console.error("Error creating referral:", err);
      setErrorMessage("Ocurrió un error al crear el referido. Por favor intente de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-gray-500 hover:text-gray-700">
            <Minus size={14} strokeWidth={3} />
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 bg-white flex-1 overflow-y-auto max-h-[500px]">
        <h2 className="text-center text-[#ffc107] text-xl font-bold mb-4 tracking-wide">
          Referido
        </h2>

        {errorMessage && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <span className="text-xs text-red-700 font-medium">{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Row 1: Nombre / Apellido */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">
                <span className="text-red-500 mr-1">*</span>Nombre
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded-[4px] h-8 px-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">
                <span className="text-red-500 mr-1">*</span>Apellido
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded-[4px] h-8 px-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Row 2: Email / País */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">
                <span className="text-red-500 mr-1">*</span>Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-[4px] h-8 px-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
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
              <input
                type="text"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val)) {
                    setPhone(val);
                  }
                }}
                className="w-full border border-gray-300 rounded-[4px] h-8 px-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 bg-white rounded-b-lg flex justify-end">
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className={`bg-[#1b5297] text-white text-sm font-medium px-4 py-1.5 rounded-[4px] hover:bg-blue-800 shadow-sm transition-colors flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          {isLoading ? 'Creando...' : 'Crear'}
        </button>
      </div>
    </div>
  );
};