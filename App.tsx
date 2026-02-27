import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { SubHeader } from './components/SubHeader';
import { RecordHeader } from './components/RecordHeader';
import { RecordBody } from './components/RecordBody';
import { UtilityBar } from './components/UtilityBar';
import { NewTaskModal } from './components/NewTaskModal';
import { Dashboard } from './components/Dashboard';
import { CasosListView } from './components/CasosListView';
import { NewCaseWizard } from './components/NewCaseWizard';
import { StudentsListView } from './components/StudentsListView';
import { DraggableTrainingButton } from './components/DraggableTrainingButton';
import { Five9Login } from './components/Five9Login';
import { OpportunityDetailView } from './components/OpportunityDetailView';
import { HistoryFullView } from './components/HistoryFullView';
import { StatusCron } from './components/StatusCron';
import { db } from './firebaseConfig';
import { ChevronDown, Check, Trash2, Lock, AlertTriangle, X, Loader2, Download, Phone, User as UserIcon } from 'lucide-react';

// --- Types ---
export interface ProspectData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    country: string;
    phoneCode: string;
    phone: string;
    program: string;
    daysCreation: number;
    createdAt: string;
    status?: string;
    statusUpdatedAt?: string;
    owner?: string;
    origin?: string;
    type?: 'record' | 'new-case' | 'opportunity';
    label?: string;
    opportunityData?: any;
}

export interface User {
    firstName: string;
    lastName: string;
    email: string;
}

export interface FavoriteContext {
    id: string; // e.g. 'students_mis_agendados'
    name: string; // e.g. 'Mis Agendados'
    subtitle: string; // e.g. 'Estudiantes'
    path: {
        view: 'record' | 'dashboard' | 'list' | 'students-list';
        subView?: string; // e.g. the specific list filter
    };
}

// --- Constants for Registration ---
const PROGRAMS = [
    "Combo Tian Rodríguez",
    "Libera tus finanzas en 6 pasos",
    "Fundamentos de inversión y portafolio",
    "Vibe Marketing",
    "Cash flow infinito",
    "Aprende de tus créditos y págales en tiempo récord"
];

const COUNTRY_CODES = [
    { code: "+57", country: "Colombia", flag: "🇨🇴" },
    { code: "+1", country: "USA", flag: "🇺🇸" },
    { code: "+52", country: "México", flag: "🇲🇽" },
    { code: "+34", country: "España", flag: "🇪🇸" },
    { code: "+54", country: "Argentina", flag: "🇦🇷" },
    { code: "+56", country: "Chile", flag: "🇨🇱" },
    { code: "+51", country: "Perú", flag: "🇵🇪" },
    { code: "+593", country: "Ecuador", flag: "🇪🇨" },
    { code: "+507", country: "Panamá", flag: "🇵🇦" },
    { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
    { code: "+58", country: "Venezuela", flag: "🇻🇪" },
];

// --- Default Data (The original Ana record) ---
const DEFAULT_RECORD: ProspectData = {
    id: 'default_ana',
    firstName: 'Ana',
    lastName: 'Mis propias Finanzas Mis inversiones',
    email: 'an5ialmanza123@gmail.com',
    country: 'Colombia',
    phoneCode: '+57',
    phone: '3197107191',
    program: 'Libera tus finanzas en 6 pasos',
    daysCreation: 52,
    createdAt: new Date().toISOString(),
    status: 'Agendado',
    owner: 'Camila Patarroyo',
    type: 'record'
};

// --- Login Component ---
const Login = ({ onLoginSuccess }: { onLoginSuccess: (user: User) => void }) => {
    const [view, setView] = useState<'login' | 'pin' | 'register' | 'prospect_register'>('login');

    // Login States
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [pin, setPin] = useState('');

    // Update Credentials States
    const [regFirstName, setRegFirstName] = useState('');
    const [regLastName, setRegLastName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');

    // Prospect Registration States
    const [prospectName, setProspectName] = useState('');
    const [prospectLastName, setProspectLastName] = useState('');
    const [prospectEmail, setProspectEmail] = useState('');
    const [prospectCountryName, setProspectCountryName] = useState('Colombia');
    const [prospectPhoneCode, setProspectPhoneCode] = useState(COUNTRY_CODES[0]);
    const [prospectPhone, setProspectPhone] = useState('');
    const [prospectProgram, setProspectProgram] = useState('');
    const [daysCreation, setDaysCreation] = useState<number>(0);
    const [termsAccepted, setTermsAccepted] = useState(true);
    const [showCodeDropdown, setShowCodeDropdown] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const codeDropdownRef = useRef<HTMLDivElement>(null);

    // --- Reset/Trash State for Login Screen ---
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetPin, setResetPin] = useState('');
    const [resetError, setResetError] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    // --- Import State for Login Screen ---
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importStep, setImportStep] = useState<'pin' | 'form'>('pin');
    const [importPin, setImportPin] = useState('');
    const [importError, setImportError] = useState('');
    const [importDataText, setImportDataText] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);

    // Helper to sanitize email for Firebase Key
    const getEmailKey = (email: string) => btoa(email.toLowerCase().trim());

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (codeDropdownRef.current && !codeDropdownRef.current.contains(event.target as Node)) {
                setShowCodeDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userId = getEmailKey(username);
            const snapshot = await db.ref(`users/${userId}`).once('value');
            const val = snapshot.val();

            if (val && val.password === password) {
                const loggedUser = {
                    firstName: val.firstName,
                    lastName: val.lastName,
                    email: val.email
                };
                localStorage.setItem('salesforce_user', JSON.stringify(loggedUser));
                onLoginSuccess(loggedUser);
            } else {
                setError('Usuario o contraseña incorrectos. Si es tu primera vez, usa "Recuperar contraseña".');
            }
        } catch (err) {
            setError('Error de conexión con la base de datos.');
        } finally {
            setLoading(false);
        }
    };

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === '0000') {
            setView('register');
            setError('');
            setPin('');
        } else {
            setError('PIN incorrecto.');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userId = getEmailKey(regEmail);
            await db.ref(`users/${userId}`).set({
                firstName: regFirstName,
                lastName: regLastName,
                email: regEmail,
                password: regPassword
            });
            setMessage('Datos actualizados correctamente. Por favor inicia sesión.');
            setView('login');
            setUsername(regEmail);
            setPassword('');
            setRegFirstName('');
            setRegLastName('');
            setRegEmail('');
            setRegPassword('');
        } catch (err) {
            setError('No se pudieron guardar los datos.');
        } finally {
            setLoading(false);
        }
    };

    const handleProspectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prospectProgram) {
            setError('Por favor selecciona un programa de interés.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // Create a new prospect entry
            const newProspectRef = db.ref('prospects').push();
            await newProspectRef.set({
                firstName: prospectName,
                lastName: prospectLastName,
                email: prospectEmail,
                country: prospectCountryName,
                phoneCode: prospectPhoneCode.code,
                phone: prospectPhone,
                program: prospectProgram,
                daysCreation: daysCreation,
                createdAt: new Date().toISOString(),
                status: 'SQL', // Default state for new web leads
                owner: 'Administrador Salesforce' // Default owner for new web leads
            });

            setMessage('¡Gracias! Tu información ha sido registrada.');

            // Reset and go back to login after short delay
            setTimeout(() => {
                setView('login');
                setMessage('');
                setProspectName('');
                setProspectLastName('');
                setProspectEmail('');
                setProspectPhone('');
                setProspectProgram('');
                setDaysCreation(0);
            }, 2000);

        } catch (err) {
            setError('Error al registrar la información. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // --- Reset Database Logic ---
    const handleResetDatabase = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError('');

        if (resetPin !== '00944') {
            setResetError('PIN incorrecto. Acceso denegado.');
            return;
        }

        setIsResetting(true);

        try {
            // 1. Get current data snapshot
            const snapshot = await db.ref('prospects').once('value');
            const updates: { [key: string]: any } = {};

            // 2. Prepare updates for every prospect
            snapshot.forEach((child) => {
                const key = child.key;
                // Reset status to SQL and owner to Admin
                updates[`prospects/${key}/status`] = 'SQL';
                updates[`prospects/${key}/owner`] = 'Administrador Salesforce';
            });

            // 3. Atomic update
            if (Object.keys(updates).length > 0) {
                await db.ref().update(updates);
            }

            setResetSuccess(true);
            setTimeout(() => {
                setIsResetModalOpen(false);
                setResetSuccess(false);
                setResetPin('');
            }, 2000);

        } catch (err) {
            console.error(err);
            setResetError('Error al resetear la base de datos.');
        } finally {
            setIsResetting(false);
        }
    };

    // --- Import Logic ---
    const handleImportPinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setImportError('');
        if (importPin === '00944' || importPin === '*00944') {
            setImportStep('form');
        } else {
            setImportError('PIN incorrecto. Acceso denegado.');
        }
    };

    const handleImportDataSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setImportError('');
        if (!importDataText.trim()) return;

        setIsImporting(true);

        try {
            // Eliminar los leads de entrenamiento antiguos antes de cargar la lista nueva
            const snapshot = await db.ref('prospects').once('value');
            const data = snapshot.val();
            const updates: { [key: string]: any } = {};

            if (data) {
                Object.keys(data).forEach(key => {
                    if (data[key].label === 'Entrenamiento') {
                        updates[`prospects/${key}`] = null; // Mark for deletion
                    }
                });
            }

            const rows = importDataText.split('\n');

            let validCount = 0;
            for (const row of rows) {
                if (!row.trim()) continue; // Skip empty rows

                // Split by tabs or multiple spaces
                const columns = row.split(/\t| {2,}/).map(col => col.trim()).filter(col => col);

                // Expected: Nombre, Apellido, Correo, Teléfono, País, Programa, Días
                if (columns.length >= 7) {
                    const newRef = db.ref('prospects').push();
                    const key = newRef.key;
                    if (key) {
                        // Extract country code if present in the phone string
                        let phoneStr = columns[3] || '';
                        let code = '+57'; // Default
                        let phone = phoneStr;

                        const matchedCode = COUNTRY_CODES.find(c => phoneStr.startsWith(c.code));
                        if (matchedCode) {
                            code = matchedCode.code;
                            phone = phoneStr.substring(matchedCode.code.length).trim();
                        } else {
                            // Mapping common countries to default codes if user didn't provide +
                            const countryName = (columns[4] || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            if (countryName.includes('colombia')) code = '+57';
                            else if (countryName.includes('mexico')) code = '+52';
                            else if (countryName.includes('usa') || countryName.includes('estados unidos')) code = '+1';
                            else if (countryName.includes('espana')) code = '+34';
                            else if (countryName.includes('peru')) code = '+51';
                            else if (countryName.includes('ecuador')) code = '+593';
                            else if (countryName.includes('chile')) code = '+56';
                            else if (countryName.includes('argentina')) code = '+54';
                        }

                        // Generar días de creación aleatorios si no viene en CSV (0 a 14 días)
                        const parsedDays = parseInt(columns[6]);
                        const finalDays = isNaN(parsedDays) ? Math.floor(Math.random() * 15) : parsedDays;

                        updates[`prospects/${key}`] = {
                            firstName: columns[0] || '',
                            lastName: columns[1] || '',
                            email: columns[2] || '',
                            phoneCode: code,
                            phone: phone,
                            country: columns[4] || 'Colombia',
                            program: columns[5] || '',
                            daysCreation: finalDays,
                            createdAt: new Date().toISOString(),
                            status: 'SQL', // Default assigned status
                            owner: 'Administrador Salesforce',
                            label: 'Entrenamiento' // Secret internal label
                        };
                        validCount++;
                    }
                }
            }

            if (validCount > 0) {
                await db.ref().update(updates);
                setImportSuccess(true);
                setTimeout(() => {
                    setImportSuccess(false);
                    setIsImportModalOpen(false);
                    setImportDataText('');
                    setImportStep('pin');
                    setImportPin('');
                }, 3000);
            } else {
                setImportError('No se encontraron filas con el formato correcto (7 columnas requeridas).');
            }

        } catch (err) {
            console.error(err);
            setImportError('Error al importar los datos en la base de datos.');
        } finally {
            setIsImporting(false);
        }
    };

    // --- RENDER ---
    return (
        <div className={`min-h-screen relative ${view === 'prospect_register' ? 'bg-[#1a242f]' : 'bg-[#f4f6f9]'} flex flex-col items-center justify-center font-sans text-[#181b25] transition-colors duration-500`}>

            {/* === ADMIN BUTTONS (Top Right) === */}
            {view !== 'prospect_register' && (
                <div className="absolute top-4 right-4 flex gap-3 z-50">
                    <button
                        onClick={() => { setIsImportModalOpen(true); setImportStep('pin'); setImportPin(''); setImportError(''); }}
                        className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 border-2 border-blue-700"
                        title="Importar Datos"
                    >
                        <Download size={20} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => setIsResetModalOpen(true)}
                        className="w-10 h-10 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 border-2 border-yellow-600"
                        title="Restaurar Base de Datos (Admin)"
                    >
                        <Trash2 size={20} strokeWidth={2.5} />
                    </button>
                </div>
            )}

            {/* Logo Area (Only for Login Views) */}
            {view !== 'prospect_register' && (
                <div className="mb-6 flex items-center gap-2">
                    <div className="w-10 h-10 bg-yellow-400 rounded flex items-center justify-center text-white font-bold text-xs shadow-sm border-2 border-black">
                        <span className="text-black text-2xl">🐝</span>
                    </div>
                    <span className="font-normal text-3xl text-gray-700 tracking-tight">smartBeemo<span className="text-sm align-top">™</span></span>
                </div>
            )}

            {/* --- LOGIN VIEW --- */}
            {view === 'login' && (
                <div className="bg-white p-10 rounded-lg shadow-xl w-[380px] border border-gray-200">
                    <form onSubmit={handleLogin}>
                        {message && <div className="mb-4 text-green-600 text-sm text-center bg-green-50 p-2 rounded">{message}</div>}

                        <div className="mb-4">
                            <label className="block text-gray-600 text-sm mb-1">Username</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-[4px] px-3 py-2 text-base focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-shadow"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-600 text-sm mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full border border-gray-300 rounded-[4px] px-3 py-2 text-base focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-shadow"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && <div className="mb-4 text-red-600 text-sm text-center">{error}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#005fb2] hover:bg-[#004e92] text-white font-medium py-2 rounded-[4px] transition-colors shadow-sm disabled:opacity-50"
                        >
                            {loading ? 'Verificando...' : 'Log In'}
                        </button>

                        <div className="mt-4 flex items-center">
                            <input type="checkbox" id="remember" className="mr-2 h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500" />
                            <label htmlFor="remember" className="text-sm text-gray-600">Remember me</label>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => { setView('pin'); setError(''); setMessage(''); }}
                                className="text-[#005fb2] text-sm hover:underline text-left"
                            >
                                Recuperar contraseña
                            </button>

                            <button
                                type="button"
                                onClick={() => { setView('prospect_register'); setError(''); setMessage(''); }}
                                className="text-[#005fb2] text-sm hover:underline text-left font-medium mt-1"
                            >
                                Registrar candidato
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- PIN VIEW --- */}
            {view === 'pin' && (
                <div className="bg-white p-10 rounded-lg shadow-xl w-[380px] border border-gray-200">
                    <form onSubmit={handlePinSubmit}>
                        <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">Verificación de seguridad</h3>
                        <p className="text-sm text-gray-600 mb-4 text-center">Ingresa el PIN de administrador para restablecer tus credenciales.</p>

                        <div className="mb-6">
                            <label className="block text-gray-600 text-sm mb-1">PIN</label>
                            <input
                                type="password"
                                required
                                className="w-full border border-gray-300 rounded-[4px] px-3 py-2 text-base focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="****"
                            />
                        </div>

                        {error && <div className="mb-4 text-red-600 text-sm text-center">{error}</div>}

                        <button
                            type="submit"
                            className="w-full bg-[#005fb2] hover:bg-[#004e92] text-white font-medium py-2 rounded-[4px] transition-colors shadow-sm"
                        >
                            Verificar
                        </button>

                        <button
                            type="button"
                            onClick={() => { setView('login'); setError(''); }}
                            className="w-full mt-2 text-[#005fb2] text-sm hover:underline py-1"
                        >
                            Cancelar
                        </button>
                    </form>
                </div>
            )}

            {/* --- UPDATE CREDENTIALS VIEW --- */}
            {view === 'register' && (
                <div className="bg-white p-10 rounded-lg shadow-xl w-[380px] border border-gray-200">
                    <form onSubmit={handleRegister}>
                        <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">Actualizar Datos</h3>

                        <div className="flex gap-3 mb-4">
                            <div className="flex-1">
                                <label className="block text-gray-600 text-sm mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-[4px] px-3 py-2 text-base focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                                    value={regFirstName}
                                    onChange={(e) => setRegFirstName(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-gray-600 text-sm mb-1">Apellido</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-[4px] px-3 py-2 text-base focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                                    value={regLastName}
                                    onChange={(e) => setRegLastName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-600 text-sm mb-1">Correo corporativo</label>
                            <input
                                type="email"
                                required
                                className="w-full border border-gray-300 rounded-[4px] px-3 py-2 text-base focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-600 text-sm mb-1">Nueva contraseña</label>
                            <input
                                type="password"
                                required
                                className="w-full border border-gray-300 rounded-[4px] px-3 py-2 text-base focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                            />
                        </div>

                        {error && <div className="mb-4 text-red-600 text-sm text-center">{error}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#005fb2] hover:bg-[#004e92] text-white font-medium py-2 rounded-[4px] transition-colors shadow-sm"
                        >
                            {loading ? 'Guardando...' : 'Aceptar'}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setView('login'); setError(''); }}
                            className="w-full mt-2 text-[#005fb2] text-sm hover:underline py-1"
                        >
                            Cancelar
                        </button>
                    </form>
                </div>
            )}

            {/* --- PROSPECT REGISTER VIEW --- */}
            {view === 'prospect_register' && (
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-[480px] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className="p-8 pb-6">
                        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2 leading-tight">
                            ¡Recibe información y precios!
                        </h1>
                        <p className="text-gray-600 text-center text-sm mb-6 px-4">
                            Al enviar tu información, uno de nuestros asesores te contactará.
                        </p>

                        {message ? (
                            <div className="text-center py-10">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check size={32} className="text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">¡Registro Exitoso!</h3>
                                <p className="text-gray-600">{message}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleProspectSubmit} className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Nombre*"
                                            required
                                            value={prospectName}
                                            onChange={(e) => setProspectName(e.target.value)}
                                            className="w-full border border-gray-300 rounded px-4 py-3 text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Apellido*"
                                            required
                                            value={prospectLastName}
                                            onChange={(e) => setProspectLastName(e.target.value)}
                                            className="w-full border border-gray-300 rounded px-4 py-3 text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <input
                                        type="email"
                                        placeholder="Email*"
                                        required
                                        value={prospectEmail}
                                        onChange={(e) => setProspectEmail(e.target.value)}
                                        className="w-full border border-gray-300 rounded px-4 py-3 text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1/3">
                                        <input
                                            type="text"
                                            value={prospectCountryName}
                                            onChange={(e) => setProspectCountryName(e.target.value)}
                                            className="w-full border border-gray-300 rounded px-4 py-3 text-gray-700 outline-none bg-gray-50"
                                            placeholder="País"
                                        />
                                    </div>
                                    <div className="flex-1 flex gap-2">
                                        <div className="relative" ref={codeDropdownRef}>
                                            <button
                                                type="button"
                                                onClick={() => setShowCodeDropdown(!showCodeDropdown)}
                                                className="h-full px-2 border border-gray-300 rounded bg-[#f3f4f6] flex items-center gap-1 hover:bg-gray-200"
                                            >
                                                <span className="text-xl">{prospectPhoneCode.flag}</span>
                                                <span className="text-xs font-medium text-gray-600">{prospectPhoneCode.code}</span>
                                            </button>

                                            {showCodeDropdown && (
                                                <div className="absolute top-full left-0 mt-1 w-[160px] bg-white border border-gray-300 shadow-xl rounded z-50 max-h-48 overflow-y-auto">
                                                    {COUNTRY_CODES.map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => {
                                                                setProspectPhoneCode(item);
                                                                setShowCodeDropdown(false);
                                                            }}
                                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                                                        >
                                                            <span className="text-lg">{item.flag}</span>
                                                            <span className="text-sm text-gray-600 font-medium">{item.code}</span>
                                                            <span className="text-xs text-gray-400 truncate">{item.country}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="Teléfono*"
                                            required
                                            value={prospectPhone}
                                            onChange={(e) => setProspectPhone(e.target.value)}
                                            className="w-full border border-gray-300 rounded px-4 py-3 text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <select
                                        required
                                        value={prospectProgram}
                                        onChange={(e) => setProspectProgram(e.target.value)}
                                        className="w-full border border-gray-300 rounded px-4 py-3 text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
                                    >
                                        <option value="" disabled>¿Cuál es tu programa de interés?*</option>
                                        {PROGRAMS.map(prog => (
                                            <option key={prog} value={prog}>{prog}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                                </div>
                                <div className="relative">
                                    <label className="text-xs text-gray-500 ml-1 mb-1 block">Simulación: Días de creación (0-99)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="99"
                                        value={daysCreation}
                                        onChange={(e) => setDaysCreation(parseInt(e.target.value) || 0)}
                                        className="w-full border border-gray-300 rounded px-4 py-2 text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex items-start gap-2 mt-2">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            id="terms"
                                            checked={termsAccepted}
                                            onChange={(e) => setTermsAccepted(e.target.checked)}
                                            className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 checked:bg-gray-800 checked:border-gray-800 transition-all"
                                        />
                                        <Check size={10} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                    </div>
                                    <label htmlFor="terms" className="text-sm text-gray-600 italic cursor-pointer">
                                        Acepto recibir información vía <span className="text-[#25D366] font-bold">WhatsApp</span> y SMS.
                                    </label>
                                </div>
                                {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}
                                <button
                                    type="submit"
                                    disabled={loading || !termsAccepted}
                                    className="w-full bg-[#1e5af6] hover:bg-[#1546c9] text-white font-bold py-3 rounded-lg shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                >
                                    {loading ? 'Enviando...' : 'Quiero conocer precios'}
                                </button>
                            </form>
                        )}
                    </div>
                    <div className="bg-gray-50 p-6 text-[10px] text-gray-500 leading-tight border-t border-gray-100">
                        Al hacer clic, nos autoriza a contactarlo/la mediante un sistema automatizado de llamadas al teléfono indicado arriba con el fin de recibir información relevante sobre smartBeemo™, y acepta nuestros <a href="#" className="text-[#1e5af6] underline">Términos y Condiciones</a> y <a href="#" className="text-[#1e5af6] underline">Política de Privacidad</a>. Su consentimiento no constituye una condición de compra.
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setView('login')}
                                className="text-gray-400 hover:text-gray-600 underline"
                            >
                                Volver al inicio de sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- IMPORT MODAL --- */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-2xl w-[900px] max-w-[95vw] border border-gray-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-blue-500 p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <div className="bg-white p-1.5 rounded-full">
                                    <Download size={20} className="text-blue-600" />
                                </div>
                                <h3 className="font-bold">Importar Datos de Excel</h3>
                            </div>
                            <button onClick={() => setIsImportModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {importSuccess ? (
                                <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check size={32} className="text-green-600" />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-800">¡Importación Exitosa!</h4>
                                    <p className="text-sm text-gray-600 mt-2">Los datos se han cargado correctamente en la base de datos.</p>
                                </div>
                            ) : importStep === 'pin' ? (
                                <form onSubmit={handleImportPinSubmit}>
                                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                        Ingresa el PIN de administrador para acceder a la importación masiva.
                                    </p>

                                    <div className="mb-4 relative">
                                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">PIN de Autorización</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="password"
                                                className="w-full border-2 border-gray-300 rounded px-3 py-2 pl-9 text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all tracking-widest"
                                                placeholder="Ingresa el PIN"
                                                value={importPin}
                                                onChange={(e) => setImportPin(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        {importError && <div className="text-red-600 text-xs mt-1 font-medium flex items-center gap-1"><AlertTriangle size={10} /> {importError}</div>}
                                    </div>

                                    <div className="flex gap-3 justify-end mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsImportModalOpen(false)}
                                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!importPin}
                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded shadow-sm disabled:opacity-50 flex items-center gap-2"
                                        >
                                            Verificar
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleImportDataSubmit} className="flex flex-col h-full">
                                    <div className="mb-4">
                                        <h4 className="text-lg font-bold text-gray-800 mb-1">Pega tus datos aquí</h4>
                                        <p className="text-sm text-gray-500 mb-2">
                                            Asegúrate de copiar directamente desde Excel manteniendo el orden de las columnas:
                                        </p>
                                        <div className="flex gap-2 flex-wrap text-xs font-semibold">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Nombre</span>
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Apellido</span>
                                            <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Correo</span>
                                            <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Teléfono</span>
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">País</span>
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Programa</span>
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Días de creación</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-[300px] mb-4 relative group">
                                        <textarea
                                            className="w-full h-full min-h-[300px] border-2 border-indigo-100 bg-gray-50/50 rounded-xl p-4 text-sm focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all resize-none font-mono leading-relaxed text-gray-700 custom-scrollbar shadow-inner"
                                            placeholder="Ejemplo:&#10;Juan  Perez  juan@mail.com   3101234567  Colombia  Vibe Marketing  10&#10;Maria Gomez  maria@mail.com  5512345678  Mexico    Cash flow       5&#10;&#10;... pega cientos de filas aquí ..."
                                            value={importDataText}
                                            onChange={(e) => setImportDataText(e.target.value)}
                                            autoFocus
                                        />
                                        {!importDataText && (
                                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 group-focus-within:opacity-5 transition-opacity">
                                                <Download size={120} />
                                            </div>
                                        )}
                                        {importError && <div className="absolute bottom-2 left-2 right-2 bg-red-50 text-red-600 text-xs mt-1 font-medium flex items-center gap-1 p-2 rounded border border-red-200"><AlertTriangle size={14} /> {importError}</div>}
                                    </div>

                                    <div className="flex gap-3 justify-end mt-auto pt-4 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => setIsImportModalOpen(false)}
                                            className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            disabled={isImporting}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!importDataText.trim() || isImporting}
                                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2 transform active:scale-[0.98]"
                                        >
                                            {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                            {isImporting ? 'Procesando...' : 'Guardar y Procesar'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer (Only for Login Views) */}
            {view !== 'prospect_register' && (
                <div className="mt-8 text-xs text-gray-500">
                    © 2026 Salesforce, Inc. All rights reserved.
                </div>
            )}

            {/* --- RESET MODAL --- */}
            {isResetModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-2xl w-[400px] border border-gray-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-yellow-400 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-white p-1.5 rounded-full">
                                    <AlertTriangle size={20} className="text-yellow-600" />
                                </div>
                                <h3 className="font-bold text-gray-900">Restaurar Base de Datos</h3>
                            </div>
                            <button onClick={() => setIsResetModalOpen(false)} className="text-black/50 hover:text-black transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {resetSuccess ? (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check size={32} className="text-green-600" />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-800">¡Restauración Exitosa!</h4>
                                    <p className="text-sm text-gray-600 mt-2">Todos los leads han vuelto a estado SQL.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleResetDatabase}>
                                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                        Esta acción moverá <strong>todos los estudiantes</strong> al estado <span className="font-bold text-blue-600">SQL</span> y asignará el propietario a <span className="font-bold">Administrador Salesforce</span>.
                                    </p>
                                    <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded border border-gray-200">
                                        Esto se usa para dejar la plataforma limpia para entrenamientos.
                                    </p>

                                    <div className="mb-4 relative">
                                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">PIN de Autorización</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="password"
                                                className="w-full border-2 border-gray-300 rounded px-3 py-2 pl-9 text-base focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all"
                                                placeholder="Ingresa el PIN"
                                                value={resetPin}
                                                onChange={(e) => setResetPin(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        {resetError && <div className="text-red-600 text-xs mt-1 font-medium flex items-center gap-1"><AlertTriangle size={10} /> {resetError}</div>}
                                    </div>

                                    <div className="flex gap-3 justify-end mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsResetModalOpen(false)}
                                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isResetting || !resetPin}
                                            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-bold rounded shadow-sm disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isResetting && <Loader2 size={14} className="animate-spin" />}
                                            {isResetting ? 'Procesando...' : 'Restaurar Todo'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const App = () => {
    // 1. User State
    const [user, setUser] = useState<User | null>(() => {
        try {
            const savedUser = localStorage.getItem('salesforce_user');
            console.log("App Mounting - localStorage read:", savedUser);
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                console.log("App Mounting - parsed user:", parsed);
                return parsed;
            }
        } catch (e) {
            console.error("Error parsing user from local storage", e);
        }
        return null; // Return null if not found or parsing fails
    });

    // --- Simulation State ---
    const [isSimulationActive, setIsSimulationActive] = useState(false);
    const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ── On app boot: clear any stale Five9 session from localStorage ──
    // This ensures the mobile phone number always starts as black (non-clickable)
    // text on every page load, regardless of what was stored in a previous session.
    useEffect(() => {
        localStorage.removeItem('five9_status');
        window.dispatchEvent(new Event('five9_status_changed'));
    }, []);

    // 2. Navigation / Tabs State
    // Prefixes for per-user persistence
    const storagePrefix = user ? `salesforce_${(user as any).id || user.email || 'default'}` : 'salesforce_default';

    // Start with open tabs; initialize from localStorage if available
    const [tabs, setTabs] = useState<ProspectData[]>(() => {
        try {
            const savedTabs = localStorage.getItem(`${storagePrefix}_tabs`);
            return savedTabs ? JSON.parse(savedTabs) : [];
        } catch { return []; }
    });

    const [activeTabId, setActiveTabId] = useState<string>(() => {
        return localStorage.getItem(`${storagePrefix}_activeTabId`) || '';
    });

    const [currentView, setCurrentView] = useState<'record' | 'dashboard' | 'list' | 'students-list'>(() => {
        return (localStorage.getItem(`${storagePrefix}_currentView`) as any) || 'dashboard';
    });

    // Favorites State - initialize from user-specific key
    const [favorites, setFavorites] = useState<FavoriteContext[]>(() => {
        try {
            const saved = localStorage.getItem(`${storagePrefix}_favorites`);
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    // Track the active context to determine if it's already a favorite
    const [currentContext, setCurrentContext] = useState<FavoriteContext | null>(null);

    // Save tabs, active view state and favorites whenever they change
    useEffect(() => {
        if (!user) return;
        localStorage.setItem(`${storagePrefix}_tabs`, JSON.stringify(tabs));
        localStorage.setItem(`${storagePrefix}_activeTabId`, activeTabId);
        localStorage.setItem(`${storagePrefix}_currentView`, currentView);
        localStorage.setItem(`${storagePrefix}_favorites`, JSON.stringify(favorites));
    }, [tabs, activeTabId, currentView, favorites, storagePrefix, user]);

    const toggleFavorite = (context: FavoriteContext) => {
        setFavorites(prev => {
            const isFav = prev.some(f => f.id === context.id);
            return isFav ? prev.filter(f => f.id !== context.id) : [...prev, context];
        });
    };

    const navigateToFavorite = (fav: FavoriteContext) => {
        if (fav.path.view === 'students-list' && fav.path.subView) {
            const storageKey = user ? `students_view_${(user as any).id || user.email || 'default'}` : 'students_view_default';
            localStorage.setItem(storageKey, fav.path.subView);
            window.dispatchEvent(new CustomEvent('forceNavigateStudents', { detail: fav.path.subView }));
        }
        setCurrentView(fav.path.view);
    };

    // Sub-Tabs State for rendering secondary tabs under a record
    const [historyOpenFor, setHistoryOpenFor] = useState<string[]>([]);
    const [activeSubView, setActiveSubView] = useState<Record<string, 'main' | 'history'>>({});

    // 3. Modals State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskToast, setTaskToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

    const showTaskCreatedToast = (subject: string) => {
        setTaskToast({ visible: true, message: `Se creó la tarea "${subject}"` });
        setTimeout(() => setTaskToast({ visible: false, message: '' }), 4000);
    };

    // 4. Real-time Firebase listeners for open record tabs
    //    Whenever the set of open tabs changes, subscribe to each prospect's
    //    Firebase node so every agent sees status/owner updates instantly.
    useEffect(() => {
        const refs: { ref: any; listener: any }[] = [];

        tabs.forEach((tab) => {
            // Only subscribe to real prospect records (not wizard tabs)
            if (tab.type === 'new-case') return;

            // Listen to the specific record (whether it's real or simulated)
            const prospectRef = db.ref(`prospects/${tab.id}`);
            const listener = prospectRef.on('value', (snapshot: any) => {
                const val = snapshot.val();
                if (!val) return;
                // Merge Firebase data into the tab, preserving any local fields
                setTabs((prev) =>
                    prev.map((t) =>
                        t.id === tab.id
                            ? { ...t, status: val.status, owner: val.owner }
                            : t
                    )
                );
            });

            refs.push({ ref: prospectRef, listener });
        });

        // Cleanup: remove all listeners when tabs change or component unmounts
        return () => {
            refs.forEach(({ ref, listener }) => ref.off('value', listener));
        };
    }, [tabs.map((t) => t.id).join(',')]); // re-run only when the list of tab IDs changes

    // --- Simulation Logic ---
    // Usamos refs para mantener el estado actual de isSimulationActive en los event listeners
    // sin tener que recrearlos y perder el hilo de las referencias temporales
    const isSimulationActiveRef = useRef(isSimulationActive);
    useEffect(() => {
        isSimulationActiveRef.current = isSimulationActive;
    }, [isSimulationActive]);

    useEffect(() => {
        const handleStartSimulation = () => {
            setIsSimulationActive(true);
            // Check immediately if we are ready
            const status = localStorage.getItem('five9_status');
            if (status && status.startsWith('Ready')) {
                scheduleNextCall();
            }
        };

        const handleStopSimulation = () => {
            setIsSimulationActive(false);
            if (simulationTimerRef.current) {
                clearTimeout(simulationTimerRef.current);
                simulationTimerRef.current = null;
            }
        };

        const handleStatusChanged = () => {
            if (!isSimulationActiveRef.current) return;
            const status = localStorage.getItem('five9_status');
            // If went back to Ready, schedule a new simulated call
            if (status && status.startsWith('Ready')) {
                // Check if we don't already have one scheduled
                if (!simulationTimerRef.current) {
                    scheduleNextCall();
                }
            } else {
                // If not ready, clear any pending call
                if (simulationTimerRef.current) {
                    clearTimeout(simulationTimerRef.current);
                    simulationTimerRef.current = null;
                }
            }
        };

        window.addEventListener('five9:training_start_simulation', handleStartSimulation);
        window.addEventListener('five9:training_stop_simulation', handleStopSimulation);
        window.addEventListener('five9_status_changed', handleStatusChanged);

        return () => {
            window.removeEventListener('five9:training_start_simulation', handleStartSimulation);
            window.removeEventListener('five9:training_stop_simulation', handleStopSimulation);
            window.removeEventListener('five9_status_changed', handleStatusChanged);
            if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
        };
    }, []); // Dependencias vacías para mantener los mismos listeners y usar refs

    const scheduleNextCall = () => {
        if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);

        // Random time between 15 and 30 seconds
        const delay = Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000;

        simulationTimerRef.current = setTimeout(async () => {
            simulationTimerRef.current = null;
            // Only fire if still ready and simulation is still active
            const status = localStorage.getItem('five9_status');
            if (status && status.startsWith('Ready') && isSimulationActiveRef.current) {
                triggerSimulatedCall();
            }
        }, delay);
    };

    const triggerSimulatedCall = async () => {
        try {
            // Pick a random record from DB that has label 'Entrenamiento'
            const snapshot = await db.ref('prospects').once('value');
            const data = snapshot.val();
            let chosenRecord: ProspectData = DEFAULT_RECORD;

            if (data) {
                // Filter records with label 'Entrenamiento'
                const keys = Object.keys(data);
                const trainingKeys = keys.filter(key => data[key].label === 'Entrenamiento');

                if (trainingKeys.length > 0) {
                    const randomKey = trainingKeys[Math.floor(Math.random() * trainingKeys.length)];
                    // Generate a unique ID so each incoming call creates a brand new tab, 
                    // even if it's the exact same student from the database again
                    const uniqueSimId = `${randomKey}-sim-${Date.now()}`;
                    chosenRecord = { id: uniqueSimId, ...data[randomKey] } as ProspectData;
                }
            }

            // 1. Open the record in Salesforce view
            handleOpenRecord(chosenRecord);

            // 1.5. Force Five9 to be maximized via event to the UtilityBar
            window.dispatchEvent(new Event('five9:maximize'));

            // 2. Dispatch event to auto-answer in Five9
            const simulatedCallData = {
                name: `${chosenRecord.firstName} ${chosenRecord.lastName}`,
                number: chosenRecord.phone || '3197107191',
                relatedTo: `Estudiante: ${chosenRecord.firstName} ${chosenRecord.lastName}`,
                campaign: '1. Premium evento'
            };
            window.dispatchEvent(new CustomEvent('five9:incoming_simulation_call', { detail: simulatedCallData }));

        } catch (e) {
            console.error("Error triggering simulated call", e);
        }
    };

    // Handlers
    const handleLogin = (userData: User) => {
        setUser(userData);
    };

    const handleOpenRecord = (record: ProspectData) => {
        setTabs(prev => {
            const existing = prev.find(t => t.id === record.id);
            if (!existing) {
                return [record, ...prev];
            }
            return prev;
        });
        setActiveTabId(record.id);
        setCurrentView('record');
    };

    const handleTabClick = (id: string) => {
        setActiveTabId(id);
        const tab = tabs.find(t => t.id === id);
        if (tab?.type === 'new-case') {
            // Wizard is rendered via content logic
        } else {
            setCurrentView('record');
        }
    };

    const handleTabClose = (id: string) => {
        setTabs(prevTabs => {
            const newTabs = prevTabs.filter(t => t.id !== id);

            // Handle active tab switching logic inside the state setter
            // Wait, we can't easily do side effects directly in setTabs
            // Let's do it outside by getting the fresh tabs
            return newTabs;
        });

        // Safe fallback for setActiveTabId
        setTabs(prevTabs => {
            const newTabs = prevTabs.filter(t => t.id !== id);
            if (activeTabId === id) {
                if (newTabs.length > 0) {
                    const lastTab = newTabs[newTabs.length - 1];
                    setActiveTabId(lastTab.id);
                    if (lastTab.type !== 'new-case') setCurrentView('record');
                } else {
                    setCurrentView('dashboard');
                }
            }
            return newTabs;
        });

        // Also clean up sub-tabs
        setHistoryOpenFor(prev => prev.filter(tid => tid !== id));
        setActiveSubView(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const handleNavigate = (dest: string) => {
        if (dest === 'Inicio') setCurrentView('dashboard');
        else if (dest === 'Casos') setCurrentView('list');
        else if (dest === 'Estudiantes') setCurrentView('students-list');
        else setCurrentView('dashboard');
    };

    const handleNewCase = () => {
        const newTab: ProspectData = {
            id: `new-case-${Date.now()}`,
            firstName: 'Nuevo',
            lastName: 'Caso',
            email: '', country: '', phoneCode: '', phone: '', program: '', daysCreation: 0, createdAt: new Date().toISOString(),
            type: 'new-case'
        };
        setTabs([newTab, ...tabs]);
        setActiveTabId(newTab.id);
        setCurrentView('record'); // Wizard is rendered in 'record' slot if type is new-case
    };

    // If not logged in
    if (!user) {
        return <Login onLoginSuccess={handleLogin} />;
    }

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('salesforce_user');
        localStorage.removeItem('five9_status');
        window.dispatchEvent(new Event('five9_status_changed'));
    };

    // Determine content
    let content;
    const activeTab = tabs.find(t => t.id === activeTabId);

    if (currentView === 'dashboard') {
        content = <Dashboard />;
    } else if (currentView === 'list') {
        content = <CasosListView onNewCase={handleNewCase} />;
    } else if (currentView === 'students-list') {
        content = <StudentsListView
            currentUser={user}
            onOpenRecord={handleOpenRecord}
            onContextChange={setCurrentContext}
        />;
    } else if (activeTab?.type === 'new-case') {
        content = (
            <NewCaseWizard
                onCancel={() => handleTabClose(activeTab.id)}
                onSave={() => handleTabClose(activeTab.id)}
                currentUser={user}
            />
        );
    } else if (activeTab?.type === 'opportunity') {
        content = (
            <OpportunityDetailView
                opportunity={activeTab.opportunityData}
                onClose={() => handleTabClose(activeTab.id)}
            />
        );
    } else if (activeTab) {
        const isHistoryOpen = historyOpenFor.includes(activeTab.id);
        const subView = activeSubView[activeTab.id] || 'main';

        content = (
            <div className="flex flex-col h-full bg-[#eef1f6] relative">
                {/* Sub-Tabs Bar - Only show if a sub-tab is open */}
                {isHistoryOpen && (
                    <div className="h-[36px] bg-[#f3f3f3] border-b border-gray-300 flex items-end px-4 gap-1 shrink-0">
                        <div
                            onClick={() => setActiveSubView({ ...activeSubView, [activeTab.id]: 'main' })}
                            className={`h-[32px] px-4 flex items-center gap-2 border-t border-l border-r rounded-t-lg cursor-pointer transition-colors ${subView === 'main' ? 'bg-white border-gray-300 z-10' : 'bg-[#fafafa] border-transparent hover:bg-white'}`}
                        >
                            <UserIcon size={14} className={subView === 'main' ? 'text-[#7f8de1]' : 'text-gray-500'} />
                            <span className={`text-[13px] ${subView === 'main' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                {activeTab.firstName} {activeTab.lastName}
                            </span>
                        </div>

                        <div
                            onClick={() => setActiveSubView({ ...activeSubView, [activeTab.id]: 'history' })}
                            className={`h-[32px] px-4 flex items-center gap-2 border-t border-l border-r rounded-t-lg cursor-pointer group transition-colors ${subView === 'history' ? 'bg-white border-gray-300 z-10' : 'bg-[#fafafa] border-transparent hover:bg-white'}`}
                        >
                            <div className="bg-[#5c6bc0] p-[2px] rounded-sm shrink-0">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                            </div>
                            <span className={`text-[13px] ${subView === 'history' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                Historial...
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setHistoryOpenFor(historyOpenFor.filter(id => id !== activeTab.id));
                                    setActiveSubView(prev => {
                                        const next = { ...prev };
                                        delete next[activeTab.id];
                                        return next;
                                    });
                                }}
                                className="ml-1 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 group-hover:text-gray-600 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex-1 relative">
                    {subView === 'main' ? (
                        <div className="flex flex-col h-full bg-white relative">
                            <RecordHeader data={activeTab} onNewTaskClick={() => setIsTaskModalOpen(true)} />
                            <div className="flex-1 relative">
                                <RecordBody
                                    data={activeTab}
                                    currentUser={user}
                                    onUpdateRecord={(updated) => setTabs(tabs.map(t => t.id === updated.id ? updated : t))}
                                    onOpenRecord={handleOpenRecord}
                                    onOpenHistory={() => {
                                        if (!historyOpenFor.includes(activeTab.id)) {
                                            setHistoryOpenFor([...historyOpenFor, activeTab.id]);
                                        }
                                        setActiveSubView({ ...activeSubView, [activeTab.id]: 'history' });
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <HistoryFullView data={activeTab} />
                    )}
                </div>
            </div>
        );
    } else {
        content = <Dashboard />;
    }

    return (
        <div className="flex flex-col h-screen bg-white font-sans text-[#181b25]">
            <Header
                onOpenRecord={handleOpenRecord}
                onLogout={handleLogout}
                user={user}
                favorites={favorites}
                currentContext={currentContext}
                onToggleFavorite={toggleFavorite}
                onNavigateToFavorite={navigateToFavorite}
            />
            <SubHeader
                tabs={tabs}
                activeTabId={activeTabId}
                onTabClick={handleTabClick}
                onTabClose={handleTabClose}
                onNavigate={handleNavigate}
                currentView={currentView}
            />
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden relative bg-[#eef1f6]">
                {content}
            </div>
            <UtilityBar currentUser={user} onOpenRecord={handleOpenRecord} />
            <NewTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                prospectId={activeTabId || undefined}
                currentUser={user}
                onTaskCreated={showTaskCreatedToast}
            />
            {taskToast.visible && (
                <div className="fixed top-28 left-1/2 transform -translate-x-1/2 z-[200] flex items-center justify-between gap-4 bg-[#04844b] text-white px-4 py-3 rounded shadow-lg min-w-[480px] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#04844b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        <span className="font-semibold text-sm tracking-wide">{taskToast.message}</span>
                    </div>
                    <button onClick={() => setTaskToast({ visible: false, message: '' })} className="text-white/80 hover:text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
            )}

            <DraggableTrainingButton />
            <StatusCron />
        </div>
    );
};

export default App;