import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, Eye, EyeOff, MessageSquare, Minimize2, Maximize2, CheckCircle, Info, Phone, Voicemail, List, Settings, HelpCircle, Power, User, Clock, Bell, Circle, Ban, Headphones, Gauge, ChevronDown, Grid3x3, Menu, Pause, MicOff, ArrowDown, Users, ArrowRight, Calendar, FileText, CheckSquare, PhoneOff, UserPlus, Search } from 'lucide-react';
import { db } from '../firebaseConfig';
import { COUNTRIES } from './countries';

const STATION_TYPES = ['Softphone', 'PSTN', 'Gateway', 'None'];

const getEmailKey = (email: string) => btoa(email.toLowerCase().trim());

interface Five9LoginProps {
    onClose: () => void;
    onMinimize?: () => void;
}

export const Five9Login: React.FC<Five9LoginProps> = ({ onClose, onMinimize }) => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [view, setView] = useState<'login' | 'station' | 'station_check' | 'console' | 'new_call' | 'active_call' | 'transfer' | 'active_transfer' | 'disposition'>('login');

    // ── On mount: always start with no active session (view = 'login') ──
    // This clears any stale five9_status left from a previous page load,
    // ensuring the mobile number shows as plain black text until the user
    // actually logs in and reaches the console.
    useEffect(() => {
        localStorage.removeItem('five9_status');
        window.dispatchEvent(new Event('five9_status_changed'));
    }, []);
    const [stationType, setStationType] = useState('Softphone');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [activeCall, setActiveCall] = useState<{ name: string, number: string, relatedTo: string } | null>(null);
    const [callDuration, setCallDuration] = useState(0);
    const [callStatus, setCallStatus] = useState('');
    const ringtoneRef = useRef<any>(null);

    // Country Selector State
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.code === '+1') || COUNTRIES[0]);
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const [recentCalls, setRecentCalls] = useState<any[]>([]);
    const [selectedDisposition, setSelectedDisposition] = useState<string | null>(null);
    const [dispositionSearch, setDispositionSearch] = useState('');

    // ── Transfer view state ──
    const [transferSearch, setTransferSearch] = useState('');
    const [transferSelected, setTransferSelected] = useState<string | null>(null);
    const [transferType, setTransferType] = useState<'Warm' | 'Cold'>('Warm');
    const [showTransferDropdown, setShowTransferDropdown] = useState(false);
    const [transferHoldDuration, setTransferHoldDuration] = useState(0);
    const holdMusicRef = useRef<any>(null);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Console State
    const [elapsedTime, setElapsedTime] = useState(0);
    const [stats, setStats] = useState({
        calls: 0,
        answered: 0,
        aht: '0:00',
        missed: 0
    });
    const [status, setStatus] = useState('Not Ready');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    // Call Context State
    const [callDirection, setCallDirection] = useState<'manual' | 'simulated' | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    // Audio Devices State
    const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
    const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedInput, setSelectedInput] = useState('');
    const [selectedOutput, setSelectedOutput] = useState('');
    const [testSoundPlaying, setTestSoundPlaying] = useState(false);

    // Timer for Status duration (Persists across views)
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // ── Listen for click-to-dial events dispatched by RecordBody ──
    useEffect(() => {
        const handleDialEvent = (e: Event) => {
            const { number } = (e as CustomEvent).detail as { number: string };
            if (!number) return;
            setPhoneNumber(number);
            setView('new_call');
            // Small delay so the new_call view renders, then auto-dial
            setTimeout(() => {
                // Recreate handleDial inline to avoid stale closure
                window.dispatchEvent(new CustomEvent('five9:autodial'));
            }, 350);
        };
        window.addEventListener('five9:dial', handleDialEvent);
        return () => window.removeEventListener('five9:dial', handleDialEvent);
    }, []);

    // ── Listen for simulated incoming calls ──
    useEffect(() => {
        const handleIncomingSimulation = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (!detail) return;

            // 1. Force the Five9 modal to show up regardless of its current minimized state
            // If the parent component passed an onMaximize or similar we'd call it, 
            // but since it only has onMinimize/onClose, we dispatch a global event
            // that App.tsx could listen to if it controls visibility. Or we rely on the 
            // user having it open. For now, we just ensure the view forces open inside Five9.

            // 2. Setup the active call
            setActiveCall({
                name: detail.name,
                number: detail.number,
                relatedTo: detail.relatedTo
            });
            // 3. Auto-answer logic
            setStatus('On Call');
            setCallDirection('simulated');
            setCallStatus('Connected');
            setCallDuration(0);
            setView('active_call');

            // 4. Add to Recent Calls
            const newCall = {
                name: detail.name,
                number: detail.number,
                campaign: detail.campaign || '1. Premium evento',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setRecentCalls(prev => [newCall, ...prev]);
        };

        window.addEventListener('five9:incoming_simulation_call', handleIncomingSimulation);
        return () => window.removeEventListener('five9:incoming_simulation_call', handleIncomingSimulation);
    }, []);

    // ── Sync status to localStorage whenever view or status changes ──
    // This ensures 'Not Ready' (the default post-login status) is also persisted
    useEffect(() => {
        const activeViews = ['console', 'new_call', 'active_call'];
        if (activeViews.includes(view)) {
            localStorage.setItem('five9_status', status);
            window.dispatchEvent(new Event('five9_status_changed'));
        }
    }, [view, status]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatStateTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (view === 'station_check') {
            const getDevices = async () => {
                try {
                    await navigator.mediaDevices.getUserMedia({ audio: true }); // Request permission first
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const inputs = devices.filter(d => d.kind === 'audioinput');
                    const outputs = devices.filter(d => d.kind === 'audiooutput');

                    setInputDevices(inputs);
                    setOutputDevices(outputs);

                    if (inputs.length > 0) setSelectedInput(inputs[0].deviceId);
                    if (outputs.length > 0) setSelectedOutput(outputs[0].deviceId);
                } catch (e) {
                    console.error("Error fetching devices", e);
                }
            };
            getDevices();
            play3Tones();
        }
    }, [view]);

    const play3Tones = async () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const duration = 0.6; // Total duration
            const sampleRate = ctx.sampleRate;
            const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
            const data = buffer.getChannelData(0);

            // Generate 3 tones into the buffer
            const freqs = [400, 500, 600];
            const toneDuration = 0.2;

            for (let i = 0; i < freqs.length; i++) {
                const freq = freqs[i];
                const startSample = i * toneDuration * sampleRate;
                const endSample = (i + 1) * toneDuration * sampleRate;

                for (let j = startSample; j < endSample; j++) {
                    const t = (j - startSample) / sampleRate;
                    // Sine wave
                    let val = Math.sin(2 * Math.PI * freq * t);
                    // Envelope (decay)
                    val *= Math.max(0, 1 - (t / toneDuration));
                    data[Math.floor(j)] = val * 0.1; // Volume
                }
            }

            // Play the buffer natively (much more reliable across browsers than creating blobs dynamically)
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start();

        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    // Helper to convert AudioBuffer to WAV Blob
    const bufferToWave = (abuffer: AudioBuffer, len: number) => {
        const numOfChan = abuffer.numberOfChannels;
        const length = len * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        const channels = [];
        let i;
        let sample;
        let offset = 0;
        let pos = 0;

        // write WAVE header
        setUint32(0x46464952);                         // "RIFF"
        setUint32(length - 8);                         // file length - 8
        setUint32(0x45564157);                         // "WAVE"

        setUint32(0x20746d66);                         // "fmt " chunk
        setUint32(16);                                 // length = 16
        setUint16(1);                                  // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(abuffer.sampleRate);
        setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2);                      // block-align
        setUint16(16);                                 // 16-bit (hardcoded in this demo)

        setUint32(0x61746164);                         // "data" - chunk
        setUint32(length - pos - 4);                   // chunk length

        // write interleaved data
        for (i = 0; i < abuffer.numberOfChannels; i++)
            channels.push(abuffer.getChannelData(i));

        while (pos < len) {
            for (i = 0; i < numOfChan; i++) {             // interleave channels
                sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
                view.setInt16(44 + offset, sample, true);          // write 16-bit sample
                offset += 2;
            }
            pos++;
        }

        return new Blob([buffer], { type: "audio/wav" });

        function setUint16(data: any) {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        function setUint32(data: any) {
            view.setUint32(pos, data, true);
            pos += 4;
        }
    };

    const handleRestartStation = async () => {
        setLoading(true); // Reuse loading state or add new one if needed, here just blocking UI slightly
        // Simulate 2 seconds delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        setLoading(false);
        play3Tones();
    };

    const stopRingtone = () => {
        if (ringtoneRef.current) {
            ringtoneRef.current.stop();
            ringtoneRef.current = null;
        }
    };

    const playRingtone = () => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.value = 440;
        osc2.frequency.value = 480;

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        // Ring pattern: 1.5s on, 2.5s off (Total 4s cycle)
        const playCycle = () => {
            const now = ctx.currentTime;
            // Reset to 0 to be safe (or maintain off)
            gain.gain.setValueAtTime(0, now);
            // Start Ring
            gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
            // End Ring
            gain.gain.linearRampToValueAtTime(0, now + 1.6);
        };

        playCycle(); // First ring
        const interval = setInterval(playCycle, 4000); // Repeat every 4s

        osc1.start();
        osc2.start();

        ringtoneRef.current = {
            stop: () => {
                clearInterval(interval);
                try {
                    gain.gain.cancelScheduledValues(ctx.currentTime);
                    gain.gain.setValueAtTime(0, ctx.currentTime);
                    osc1.stop();
                    osc2.stop();
                    ctx.close();
                } catch (e) { }
            }
        };
    };

    const handleDial = async () => {
        setLoading(true);
        try {
            // Fetch prospects
            const snapshot = await db.ref('prospects').once('value');
            const data = snapshot.val();
            let matchedName = '';
            let relatedTo = '';

            const normalizedDialed = phoneNumber.replace(/\D/g, '');

            if (data) {
                Object.values(data).forEach((p: any) => {
                    if (p.phone) {
                        const normalizedStored = p.phone.replace(/\D/g, '');
                        // Check if one contains the other (handling formatting diffs)
                        if (normalizedStored.includes(normalizedDialed) || normalizedDialed.includes(normalizedStored)) {
                            matchedName = `${p.firstName} ${p.lastName}`;
                            relatedTo = `Estudiante: ${matchedName}`;
                        }
                    }
                });
            }

            setActiveCall({
                name: matchedName || phoneNumber,
                number: phoneNumber,
                relatedTo: relatedTo || 'Unknown'
            });
            setCallDirection('manual');
            setCallStatus('Dialing');
            setCallDuration(0);
            setView('active_call');

            // Add to Recent Calls
            const newCall = {
                name: matchedName || phoneNumber,
                number: phoneNumber,
                campaign: 'Manual Calls',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setRecentCalls(prev => [newCall, ...prev]);

            playRingtone();

        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    // ── Auto-dial trigger from click-to-dial ──
    useEffect(() => {
        const handler = () => { handleDial(); };
        window.addEventListener('five9:autodial', handler);
        return () => window.removeEventListener('five9:autodial', handler);
    }, [phoneNumber]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (view === 'active_call' || view === 'disposition') {
            if (callStatus === 'Connected' || callStatus === 'Dialing') {
                interval = setInterval(() => {
                    setCallDuration(prev => prev + 1);
                }, 1000);
            } else if (callStatus === 'Wrap Up') {
                interval = setInterval(() => {
                    setCallDuration(prev => {
                        if (prev <= 0) {
                            clearInterval(interval);
                            // Auto-transition
                            setView('console');
                            setStatus('Forzado');
                            // Removed setElapsedTime(0) to allow accumulated time 
                            // to persist if transitioning to forced wrap up.
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        } else if (view === 'active_transfer') {
            interval = setInterval(() => {
                setTransferHoldDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [view, callStatus]);

    // ── Hold Music generation (Elevator music) ──
    const playHoldMusic = () => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        // Harmonious chord arpeggio (Bossa/Jazz feel): Dm9 -> G13 -> Cmaj9
        const chords = [
            [293.66, 349.23, 440.00, 523.25, 659.25], // Dm9
            [392.00, 493.88, 587.33, 659.25, 880.00], // G13
            [261.63, 329.63, 392.00, 493.88, 587.33]  // Cmaj9
        ];
        let chordIndex = 0;
        let panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        let mainGain = ctx.createGain();
        mainGain.gain.value = 0.15; // Lower overall volume

        if (panner) panner.connect(mainGain);
        mainGain.connect(ctx.destination);

        const playArpeggio = () => {
            const currentChord = chords[chordIndex];
            const now = ctx.currentTime;

            currentChord.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
                osc.frequency.setValueAtTime(freq, now);

                // Add soft vibrato
                const lfo = ctx.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.value = 5;
                const lfoGain = ctx.createGain();
                lfoGain.gain.value = 3;
                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);
                lfo.start(now);

                osc.connect(gain);
                if (panner) gain.connect(panner);
                else gain.connect(mainGain);

                const startTime = now + (idx * 0.15); // arpeggiate timing
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.exponentialRampToValueAtTime(0.8 / currentChord.length, startTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

                osc.start(startTime);
                osc.stop(startTime + 1.2);
                lfo.stop(startTime + 1.2);
            });

            chordIndex = (chordIndex + 1) % chords.length;
        };

        const interval = setInterval(playArpeggio, 2000);
        playArpeggio();

        holdMusicRef.current = {
            stop: () => {
                clearInterval(interval);
                try { ctx.close(); } catch (e) { }
            }
        };
    };

    const stopHoldMusic = () => {
        if (holdMusicRef.current) {
            holdMusicRef.current.stop();
            holdMusicRef.current = null;
        }
    };

    const handleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const userId = getEmailKey(username);
            const snapshot = await db.ref(`users/${userId}`).once('value');
            const val = snapshot.val();

            if (val && val.password === password) {
                setCurrentUser(val);
                setView('station');
            } else {
                setError('Usuario o contraseña incorrectos');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    if (view === 'station') {
        return (
            <div className="fixed bottom-[36px] left-0 w-[400px] h-auto bg-white shadow-2xl border border-gray-300 rounded-tr-lg z-[60] flex flex-col font-sans animate-in slide-in-from-bottom-2 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white rounded-tr-lg">
                    <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <MessageSquare size={16} />
                        <span>Engage</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <button onClick={onMinimize} className="hover:text-gray-700"><Minimize2 size={14} /></button>
                        <button className="hover:text-gray-700"><ExternalLink size={14} /></button>
                    </div>
                </div>

                <div className="p-4 border-b border-[#0070d2]">
                    <h2 className="text-[#00396b] text-xl font-normal">Station Setup</h2>
                </div>

                <div className="p-4 bg-white min-h-[300px]">
                    <div className="mb-4">
                        <label className="block text-[#54698d] text-xs mb-1">Station Type</label>
                        <div className="flex border border-[#d8dde6] rounded overflow-hidden">
                            {STATION_TYPES.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setStationType(type)}
                                    className={`flex-1 py-1.5 text-sm font-normal transition-colors
                                        ${stationType === type
                                            ? 'bg-[#0070d2] text-white'
                                            : 'bg-white text-[#0070d2] hover:bg-gray-50 border-l first:border-l-0 border-[#d8dde6]'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <span className="text-[#54698d] text-sm">Station Number</span>
                        <span className="text-[#16325c] text-sm">Auto Assigned</span>
                    </div>
                </div>

                <div className="p-4 border-t border-[#d8dde6] bg-white flex justify-end gap-3 rounded-b-lg">
                    <button
                        onClick={() => setView('login')}
                        className="px-4 py-2 border border-[#d8dde6] text-[#0070d2] rounded text-sm hover:bg-gray-50 font-normal w-1/2"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => setView('station_check')}
                        className="px-4 py-2 bg-[#0070d2] text-white rounded text-sm hover:bg-[#005fb2] font-normal w-1/2"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'station_check') {
        return (
            <div className="fixed bottom-[36px] left-0 w-[600px] h-auto bg-white shadow-2xl border border-gray-300 rounded-tr-lg z-[60] flex flex-col font-sans animate-in slide-in-from-bottom-2 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white rounded-tr-lg">
                    <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <MessageSquare size={16} />
                        <span>Engage</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <button onClick={onMinimize} className="hover:text-gray-700"><Minimize2 size={14} /></button>
                        <button className="hover:text-gray-700"><ExternalLink size={14} /></button>
                    </div>
                </div>

                <div className="p-4 border-b border-[#0070d2] flex justify-between items-center bg-[#f4f6f9]">
                    <h2 className="text-[#16325c] text-lg font-normal">Station Check</h2>
                    <div className="flex items-center gap-1 text-[#04844b] text-xs font-bold">
                        <CheckCircle size={14} fill="#04844b" className="text-white" />
                        <span>Softphone Connected</span>
                    </div>
                </div>

                <div className="p-4 bg-white min-h-[300px]">
                    <div className="mb-4">
                        <label className="block text-[#54698d] text-xs mb-1">Output</label>
                        <div className="relative">
                            <select
                                value={selectedOutput}
                                onChange={(e) => setSelectedOutput(e.target.value)}
                                className="w-full border border-[#d8dde6] rounded px-3 py-2 text-sm text-[#16325c] appearance-none outline-none focus:border-[#0070d2] focus:ring-1 focus:ring-[#0070d2] bg-white cursor-pointer"
                            >
                                {outputDevices.length > 0 ? outputDevices.map(d => (
                                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${d.deviceId.slice(0, 5)}...`}</option>
                                )) : <option>Default Output Device</option>}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#54698d]"></div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-[#54698d] text-xs mb-1">Input</label>
                        <div className="relative">
                            <select
                                value={selectedInput}
                                onChange={(e) => setSelectedInput(e.target.value)}
                                className="w-full border border-[#d8dde6] rounded px-3 py-2 text-sm text-[#16325c] appearance-none outline-none focus:border-[#0070d2] focus:ring-1 focus:ring-[#0070d2] bg-white cursor-pointer"
                            >
                                {inputDevices.length > 0 ? inputDevices.map(d => (
                                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0, 5)}...`}</option>
                                )) : <option>Default Input Device</option>}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#54698d]"></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 text-[#54698d] text-xs leading-relaxed">
                        <Info size={16} className="shrink-0 mt-0.5" />
                        <div>
                            If you heard 3 tones or received a 'Softphone Connected' success message, you are successfully connected. <br />
                            Having trouble? Change audio devices above and <button onClick={handleRestartStation} className="text-[#0070d2] hover:underline bg-transparent border-none p-0 cursor-pointer">restart your station</button>.
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[#d8dde6] bg-white flex justify-end gap-3 rounded-b-lg">
                    <button
                        onClick={() => setView('login')}
                        className="px-4 py-2 border border-[#d8dde6] text-[#0070d2] rounded text-sm hover:bg-gray-50 font-normal w-1/2"
                    >
                        Log Out
                    </button>
                    <button
                        onClick={() => setView('console')}
                        className="px-4 py-2 bg-[#0070d2] text-white rounded text-sm hover:bg-[#005fb2] font-normal w-1/2"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        );
    }

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        setElapsedTime(0);
        setIsStatusDropdownOpen(false);
        // ── Broadcast to other components via localStorage ──
        localStorage.setItem('five9_status', newStatus);
        window.dispatchEvent(new Event('five9_status_changed'));
    };

    const getStatusColor = (s: string) => s.startsWith('Ready') ? 'bg-[#04844b]' : 'bg-[#c23934]';
    const getStatusHoverColor = (s: string) => s.startsWith('Ready') ? 'hover:bg-[#036e3f]' : 'hover:bg-[#a61a14]';
    const getStatusIconColor = (s: string) => s.startsWith('Ready') ? 'text-[#04844b]' : 'text-[#c23934]';

    if (view === 'console') {
        return (
            <div className="fixed bottom-[36px] left-0 w-[600px] h-auto bg-white shadow-2xl border border-gray-300 rounded-tr-lg z-[60] flex flex-col font-sans animate-in slide-in-from-bottom-2 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white rounded-tr-lg">
                    <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <MessageSquare size={16} />
                        <span>Engage</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <button onClick={onMinimize} className="hover:text-gray-700"><Minimize2 size={14} /></button>
                        <button className="hover:text-gray-700"><ExternalLink size={14} /></button>
                    </div>
                </div>

                {/* Agent Header */}
                <div className="bg-[#f4f6f9] p-2 flex items-center justify-between border-b border-gray-300 relative">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
                            <User size={24} />
                        </div>
                        <div>
                            <div className="text-[#16325c] font-bold text-sm">
                                {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Agent'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span className="truncate max-w-[120px]">{username}</span>
                                <span className="flex items-center gap-1"><Phone size={10} /> 1875</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 relative">
                        <button
                            onClick={() => {
                                setView('login');
                                setUsername('');
                                setPassword('');
                                setStatus('Not Ready');
                                setElapsedTime(0);
                                setCurrentUser(null);
                                // ── Clear session status so phone goes back to black ──
                                localStorage.removeItem('five9_status');
                                window.dispatchEvent(new Event('five9_status_changed'));
                            }}
                            className="p-1.5 border border-gray-300 rounded bg-white text-gray-600 hover:bg-gray-50"
                        >
                            <Power size={16} />
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                className={`flex items-center gap-2 ${getStatusColor(status)} text-white px-3 py-1.5 rounded text-sm font-medium ${getStatusHoverColor(status)} min-w-[160px] justify-between transition-colors`}
                            >
                                <div className="flex items-center gap-2">
                                    {status.startsWith('Ready') ?
                                        <CheckCircle size={14} className="bg-white text-[#04844b] rounded-full p-0.5" /> :
                                        <X size={14} className={`bg-white ${getStatusIconColor(status)} rounded-full p-0.5`} />
                                    }
                                    <span className="truncate max-w-[100px] text-left">{status}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span>{formatStateTime(elapsedTime)}</span>
                                    <ChevronDown size={14} />
                                </div>
                            </button>

                            {isStatusDropdownOpen && (
                                <div className="absolute right-0 top-full mt-1 w-64 bg-white shadow-lg border border-gray-200 rounded z-50 py-1 text-sm text-[#16325c]">
                                    <button onClick={() => handleStatusChange('Ready (Voice, Voicemail)')} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                                        <CheckCircle size={14} className="text-[#04844b]" fill="#04844b" color="white" /> Ready (Voice, Voicemail)
                                    </button>
                                    <button onClick={() => handleStatusChange('Ready for...')} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                                        <CheckCircle size={14} className="text-[#04844b]" fill="#04844b" color="white" /> Ready for...
                                    </button>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    {['Almuerzo', 'Baño', 'Break', 'Feedback', 'Forzado', 'Meeting', 'Seguimiento Fuera de Jornada', 'WhatsApp o Llamada Manual'].map(s => (
                                        <button key={s} onClick={() => handleStatusChange(s)} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                                            <X size={14} className="text-white bg-[#c23934] rounded-full p-0.5" /> {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex h-[350px]">
                    {/* Left Column - Menu */}
                    <div className="w-[40%] p-2 border-r border-gray-200 flex flex-col gap-2">
                        <button
                            onClick={() => {
                                setView('new_call');
                                setPhoneNumber('');
                            }}
                            className="bg-[#0070d2] text-white py-2 rounded text-sm font-bold shadow-sm hover:bg-[#005fb2] flex items-center justify-center gap-2 mb-2"
                        >
                            <Phone size={16} fill="white" /> New Call
                        </button>

                        <div className="flex flex-col border border-gray-300 rounded bg-white overflow-hidden">
                            <button className="px-4 py-2 text-[#0070d2] text-sm hover:bg-gray-50 text-center border-b border-gray-200">Missed Calls</button>
                            <button className="px-4 py-2 text-[#0070d2] text-sm hover:bg-gray-50 text-center border-b border-gray-200">Voicemail</button>
                            <button className="px-4 py-2 text-[#0070d2] text-sm hover:bg-gray-50 text-center border-b border-gray-200">Reminders</button>
                            <button className="px-4 py-2 text-[#0070d2] text-sm hover:bg-gray-50 text-center">Conversations</button>
                        </div>

                        <button className="mt-2 border border-gray-300 rounded text-[#0070d2] py-2 text-sm hover:bg-gray-50">
                            Add to DNC
                        </button>

                        <div className="mt-auto flex border border-gray-300 rounded overflow-hidden">
                            <button className="flex-1 py-2 text-[#0070d2] text-sm hover:bg-gray-50 border-r border-gray-300">Settings</button>
                            <button className="flex-1 py-2 text-[#0070d2] text-sm hover:bg-gray-50 flex items-center justify-center gap-1">Help <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[#0070d2]"></div></button>
                        </div>
                    </div>

                    {/* Right Column - Stats */}
                    <div className="w-[60%] flex flex-col">
                        <div className="flex border-b border-gray-300">
                            <button className="flex-1 py-2 text-[#0070d2] text-sm font-medium border-b-2 border-[#0070d2] bg-white flex items-center justify-center gap-2">
                                Me <Settings size={12} className="text-gray-500" />
                            </button>
                            <button className="flex-1 py-2 text-[#54698d] text-sm font-medium hover:bg-gray-50 bg-[#f4f6f9]">
                                Queue
                            </button>
                        </div>

                        <div className="grid grid-cols-2 grid-rows-2 h-full">
                            <div className="border-r border-b border-gray-200 flex flex-col items-center justify-center p-4">
                                <div className="text-4xl text-[#54698d] font-light">{stats.calls}</div>
                                <div className="text-xs text-[#0070d2] mt-1">Calls</div>
                            </div>
                            <div className="border-b border-gray-200 flex flex-col items-center justify-center p-4">
                                <div className="text-4xl text-[#54698d] font-light">{stats.answered}</div>
                                <div className="text-xs text-[#54698d] mt-1">Calls Answered</div>
                            </div>
                            <div className="border-r border-gray-200 flex flex-col items-center justify-center p-4">
                                <div className="text-4xl text-[#54698d] font-light">{stats.aht}</div>
                                <div className="text-xs text-[#54698d] mt-1">AHT</div>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4">
                                <div className="text-4xl text-[#54698d] font-light">{stats.missed}</div>
                                <div className="text-xs text-[#0070d2] mt-1">Missed Calls</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Status */}
                <div className="p-2 border-t border-gray-300 bg-white flex gap-3 text-gray-500">
                    <div className="p-1 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer">
                        <CheckCircle size={16} className="text-[#04844b]" />
                    </div>
                    <div className="p-1 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer">
                        <Headphones size={16} className="text-[#0070d2]" />
                    </div>
                    <div className="p-1 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer">
                        <Gauge size={16} className="text-[#0070d2]" />
                    </div>
                    <div className="ml-auto text-xs font-bold text-[#00396b] tracking-tight self-center" style={{ fontFamily: 'Arial, sans-serif' }}>
                        Five9
                    </div>
                </div>
            </div >
        );
    }

    if (view === 'new_call') {
        return (
            <div className="fixed bottom-[36px] left-0 w-[600px] h-auto bg-white shadow-2xl border border-gray-300 rounded-tr-lg z-[60] flex flex-col font-sans animate-in slide-in-from-bottom-2 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white rounded-tr-lg">
                    <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <MessageSquare size={16} />
                        <span>Engage</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <button onClick={onMinimize} className="hover:text-gray-700"><Minimize2 size={14} /></button>
                        <button className="hover:text-gray-700"><ExternalLink size={14} /></button>
                    </div>
                </div>

                {/* New Call Content */}
                <div className="bg-[#f4f6f9] border-b border-gray-300 flex items-center px-4 py-3 gap-3">
                    <div className="relative">
                        <Menu size={24} className="text-[#54698d]" />
                        <div className="absolute -top-1 -right-1 bg-[#c23934] rounded-full p-0.5">
                            <X size={8} className="text-white" strokeWidth={3} />
                        </div>
                    </div>
                    <h2 className="text-[#16325c] text-lg font-normal">New Call</h2>
                </div>

                <div className="p-4 bg-white min-h-[300px] flex font-sans">
                    {/* Left Column - Inputs */}
                    <div className="w-[60%] pr-4 border-r border-transparent">
                        <div className="mb-1">
                            <label className="text-[#54698d] text-xs font-normal">Type Number</label>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <div className="relative w-24">
                                <button
                                    className="w-full border border-[#d8dde6] rounded px-2 py-1.5 text-sm text-[#16325c] flex items-center justify-between bg-white focus:border-[#0070d2] outline-none"
                                    onClick={() => setIsCountryOpen(!isCountryOpen)}
                                >
                                    <span className="truncate">{selectedCountry.code}</span>
                                    <ChevronDown size={14} className="text-[#54698d]" />
                                </button>

                                {isCountryOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[#d8dde6] rounded shadow-lg z-50 flex flex-col max-h-60 animate-in fade-in zoom-in-95 duration-100">
                                        <div className="p-2 border-b border-[#d8dde6] sticky top-0 bg-white">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search country..."
                                                    className="w-full border border-[#d8dde6] rounded pl-8 pr-2 py-1 text-sm outline-none focus:border-[#0070d2]"
                                                    autoFocus
                                                    value={countrySearch}
                                                    onChange={(e) => setCountrySearch(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="overflow-y-auto flex-1">
                                            {COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch)).map(c => (
                                                <div
                                                    key={c.name}
                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
                                                    onClick={() => {
                                                        setSelectedCountry(c);
                                                        setIsCountryOpen(false);
                                                        setCountrySearch('');
                                                    }}
                                                >
                                                    <span className="text-base">{c.flag}</span>
                                                    <span className="flex-1 truncate text-[#16325c]">{c.name}</span>
                                                    <span className="text-gray-500 text-xs font-mono">{c.code}</span>
                                                </div>
                                            ))}
                                            {COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch)).length === 0 && (
                                                <div className="p-3 text-center text-gray-500 text-xs">No matches found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Type name or number"
                                    className="w-full border border-[#0070d2] rounded px-3 py-1.5 text-sm outline-none shadow-[0_0_0_1px_#0070d2] text-[#16325c] pr-8"
                                    autoFocus
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^[0-9+]*$/.test(val)) { // Only numbers and +
                                            setPhoneNumber(val);
                                        }
                                    }}
                                />
                                <Grid3x3 size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#54698d] cursor-pointer" />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-[#54698d] text-xs mb-1 font-normal">Campaign</label>
                            <div className="relative">
                                <select className="w-full border border-[#16325c] rounded px-3 py-1.5 text-sm text-[#0070d2] appearance-none outline-none focus:border-[#0070d2] bg-white cursor-pointer font-medium">
                                    <option>Manual Calls</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#0070d2]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - List Placeholder */}
                    <div className="w-[40%] pl-4 flex flex-col">
                        <div className="flex gap-3 text-xs mb-2 border-b border-transparent">
                            <span className="text-[#0070d2] cursor-pointer hover:underline font-normal">Contacts</span>
                            <span className="text-[#16325c] font-bold border-b-2 border-[#16325c] pb-1 cursor-pointer">Recent Calls</span>
                        </div>

                        {recentCalls.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <span className="text-[#54698d] text-xl font-light">No recent calls</span>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto max-h-[250px] pr-1">
                                {recentCalls.map((call, idx) => (
                                    <div
                                        key={idx}
                                        className="flex justify-between items-start py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 group"
                                        onClick={() => setPhoneNumber(call.number)}
                                        title={`Call ${call.number}`}
                                    >
                                        <div>
                                            <div className="text-[#0070d2] text-sm font-medium group-hover:underline">{call.name}</div>
                                            <div className="text-[#54698d] text-xs">{call.campaign}</div>
                                        </div>
                                        <div className="text-[#54698d] text-xs">{call.time}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-[#d8dde6] bg-white flex justify-end gap-3 rounded-b-lg">
                    <button
                        onClick={() => setView('console')}
                        className="px-4 py-2 border border-[#d8dde6] text-[#0070d2] rounded text-sm hover:bg-gray-50 font-normal w-1/2"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDial}
                        className={`px-4 py-2 text-white rounded text-sm font-normal w-1/2 transition-colors ${phoneNumber.length >= 8
                            ? 'bg-[#0070d2] hover:bg-[#005fb2]'
                            : 'bg-[#d8dde6] cursor-not-allowed'
                            }`}
                        disabled={phoneNumber.length < 8}
                    >
                        Dial
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'active_call' && activeCall) {
        return (
            <div className="fixed bottom-[36px] left-0 w-[600px] h-auto bg-white shadow-2xl border border-gray-300 rounded-tr-lg z-[60] flex flex-col font-sans animate-in slide-in-from-bottom-2 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white rounded-tr-lg">
                    <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <MessageSquare size={16} />
                        <span>Engage</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <button onClick={onMinimize} className="hover:text-gray-700"><Minimize2 size={14} /></button>
                        <button className="hover:text-gray-700"><ExternalLink size={14} /></button>
                    </div>
                </div>

                {/* Call Header */}
                <div className="bg-[#f4f6f9] p-4 flex items-center gap-4 border-b border-[#d8dde6]">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm ${callStatus === 'Wrap Up' ? 'bg-[#d8dde6]' : 'bg-[#0070d2]'}`}>
                        <Phone size={24} fill="white" className={callStatus === 'Wrap Up' ? 'text-white' : 'rotate-90'} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-[#54698d] text-xs">
                            <span className={callStatus === 'Wrap Up' ? 'text-black' : ''}>
                                Agent Call: {callStatus}
                            </span>
                            <span className={`flex items-center gap-1 ${callStatus === 'Wrap Up' ? 'text-[#c23934]' : ''}`}>
                                <Clock size={12} />
                                <span>{callStatus === 'Wrap Up' ? '-' : ''}{formatTime(callDuration)}</span>
                            </span>
                        </div>
                        <div className="text-[#16325c] text-xl font-normal">
                            {activeCall.name}
                        </div>
                    </div>
                    <div className="ml-auto flex gap-4 text-sm font-medium text-[#54698d]">
                        <div className="border-b-2 border-[#0070d2] text-[#16325c] pb-1 cursor-pointer">Interaction</div>
                        <div className="cursor-pointer hover:text-[#16325c]">Timeline</div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 flex gap-4 bg-white min-h-[300px]">
                    {/* Controls (Left) */}
                    <div className="w-1/2 flex flex-col gap-2">
                        <div className="flex gap-2">
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#54698d] hover:bg-gray-50 disabled:opacity-50">
                                <Pause size={16} fill="currentColor" />
                                <span className="text-[10px] mt-1">Hold</span>
                            </button>
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#54698d] hover:bg-gray-50">
                                <MicOff size={16} />
                                <span className="text-[10px] mt-1">Mute</span>
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#54698d] hover:bg-gray-50">
                                <ArrowDown size={16} />
                                <span className="text-[10px] mt-1">Park</span>
                            </button>
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#54698d] hover:bg-gray-50">
                                <UserPlus size={16} />
                                <span className="text-[10px] mt-1">Conference...</span>
                            </button>
                            <button
                                className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#54698d] hover:bg-gray-50"
                                onClick={() => {
                                    setTransferSearch('');
                                    setTransferSelected(null);
                                    setTransferType('Warm');
                                    setShowTransferDropdown(false);
                                    setView('transfer');
                                }}
                            >
                                <ArrowRight size={16} />
                                <span className="text-[10px] mt-1">Transfer...</span>
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#54698d] hover:bg-gray-50">
                                <MessageSquare size={16} />
                                <span className="text-[10px] mt-1">IM</span>
                            </button>
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#0070d2] bg-[#f4f6f9] border-[#0070d2]">
                                <Calendar size={16} />
                                <span className="text-[10px] mt-1">Reminder</span>
                            </button>
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#54698d] hover:bg-gray-50">
                                <Circle size={16} />
                                <span className="text-[10px] mt-1">Record</span>
                            </button>
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#54698d] hover:bg-gray-50">
                                <Grid3x3 size={16} />
                                <span className="text-[10px] mt-1">Keypad</span>
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 flex items-center justify-center gap-2 p-2 border border-[#d8dde6] rounded bg-white text-[#54698d] hover:bg-gray-50 text-xs font-medium">
                                <List size={14} /> Script
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 p-2 border border-[#d8dde6] rounded bg-white text-[#54698d] hover:bg-gray-50 text-xs font-medium">
                                <CheckSquare size={14} /> Worksheet
                            </button>
                        </div>
                    </div>

                    {/* Details (Right) */}
                    <div className="w-1/2 border border-[#d8dde6] rounded flex flex-col">
                        <div className="flex border-b border-[#d8dde6]">
                            <button className="flex-1 py-1.5 text-[#0070d2] border-b-2 border-[#0070d2] flex justify-center"><Info size={16} /></button>
                            <button className="flex-1 py-1.5 text-[#54698d] flex justify-center"><FileText size={16} /></button>
                        </div>
                        <div className="p-3 flex-1">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[#54698d] text-xs">Details (2)</span>
                                <span className="text-[#0070d2] text-xs cursor-pointer">Grid</span>
                            </div>

                            <div className="mb-3">
                                <label className="text-[#54698d] text-xs block">Campaign</label>
                                <div className="text-[#16325c] font-bold text-sm">
                                    {/* Muestra la campaña del cliente simulado si existe, sino Manual Calls */}
                                    {recentCalls.find(c => c.number === activeCall.number)?.campaign || 'Manual Calls'}
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="text-[#54698d] text-xs block">Phone</label>
                                <div className="text-[#16325c] font-bold text-sm">{activeCall.number}</div>
                            </div>

                            <div className="mt-4">
                                <label className="text-[#54698d] text-xs block mb-1">Related to</label>
                                <div className="border border-[#d8dde6] rounded px-3 py-1.5 text-sm text-[#0070d2] flex justify-between items-center cursor-pointer hover:border-[#0070d2]">
                                    <span className="truncate">{activeCall.relatedTo}</span>
                                    <ChevronDown size={14} className="text-[#54698d]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-[#d8dde6] bg-white flex gap-3">
                    {callStatus === 'Wrap Up' ? (
                        <div className="flex items-center justify-center gap-2 bg-white text-[#54698d] border border-gray-200 px-4 py-2 rounded shadow-sm flex-1 text-sm font-medium cursor-default">
                            <PhoneOff size={16} /> Call Ended
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                stopRingtone();
                                setCallStatus('Wrap Up');
                                setCallDuration(60); // 1 minute countdown
                            }}
                            className="flex items-center gap-2 bg-white text-[#c23934] border border-[#d8dde6] px-4 py-2 rounded shadow-sm hover:bg-gray-50 flex-1 justify-center text-sm font-medium"
                        >
                            <PhoneOff size={16} className="rotate-225" /> End Call
                        </button>
                    )}

                    <button
                        className="bg-[#0070d2] text-white px-4 py-2 rounded shadow-sm hover:bg-[#005fb2] flex-1 text-sm font-medium"
                        onClick={() => setView('disposition')}
                    >
                        Set Disposition...
                    </button>
                </div>
            </div>
        );
    }

    // ── Transfer campaigns list (filterable) ──
    const TRANSFER_CAMPAIGNS = [
        '0 Activaciones Outbound',
        'Activacion',
        'Activaciones Rocketfy',
        'OFF Reactivacion Suscr...',
        'Inbound Support',
        'Retención Premium',
        'Ventas Internacionales',
        'Soporte Técnico',
    ];

    if (view === 'transfer' && activeCall) {
        const filteredCampaigns = TRANSFER_CAMPAIGNS.filter(c =>
            c.toLowerCase().includes(transferSearch.toLowerCase())
        );

        return (
            <div className="fixed bottom-[36px] left-0 w-[600px] h-auto bg-white shadow-2xl border border-gray-300 rounded-tr-lg z-[60] flex flex-col font-sans animate-in slide-in-from-bottom-2 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white rounded-tr-lg">
                    <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <MessageSquare size={16} />
                        <span>Engage</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <button onClick={onMinimize} className="hover:text-gray-700"><Minimize2 size={14} /></button>
                        <button className="hover:text-gray-700"><ExternalLink size={14} /></button>
                    </div>
                </div>

                {/* Call Header with Transfer tab */}
                <div className="bg-[#f4f6f9] p-3 flex items-center gap-3 border-b border-[#d8dde6]">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-[#0070d2] shadow-sm shrink-0">
                        <Phone size={20} fill="white" className="rotate-90" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[#54698d] text-xs">
                            <span>Agent Call: {callStatus}</span>
                            <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {formatTime(callDuration)}
                            </span>
                        </div>
                        <div className="text-[#16325c] text-base font-normal truncate">{activeCall.name}</div>
                    </div>
                    <div className="ml-auto shrink-0">
                        <div className="border-b-2 border-[#0070d2] text-[#16325c] text-sm font-medium pb-1 px-1">Transfer</div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 bg-white" style={{ minHeight: '340px' }}>
                    {/* Left column */}
                    <div className="w-[48%] p-4 border-r border-[#d8dde6] flex flex-col gap-3">
                        {/* Type Number label + tabs */}
                        <div className="flex items-center justify-between">
                            <span className="text-[#54698d] text-xs font-normal">Type Number</span>
                            <div className="flex gap-3 text-xs">
                                <span className="text-[#0070d2] cursor-pointer hover:underline">Contacts</span>
                                <span className="text-[#0070d2] cursor-pointer hover:underline">Recent Contacts</span>
                            </div>
                        </div>

                        {/* Search input row */}
                        <div className="flex gap-2 relative">
                            {/* Country code */}
                            <button className="border border-[#d8dde6] rounded px-2 py-1.5 text-sm text-[#16325c] flex items-center gap-1 bg-white shrink-0">
                                <span>+1</span>
                                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[#54698d]" />
                            </button>
                            {/* Search input */}
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={transferSearch}
                                    onChange={(e) => {
                                        setTransferSearch(e.target.value);
                                        setTransferSelected(null);
                                        setShowTransferDropdown(true);
                                    }}
                                    onFocus={() => setShowTransferDropdown(true)}
                                    placeholder="Search campaign or number..."
                                    className="w-full border border-[#0070d2] rounded px-3 py-1.5 text-sm text-[#16325c] outline-none"
                                    style={{ borderWidth: transferSelected ? '1px' : '2px' }}
                                />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[#54698d] hover:text-[#0070d2]">
                                    <Grid3x3 size={14} />
                                </button>

                                {/* Autocomplete dropdown */}
                                {showTransferDropdown && transferSearch && filteredCampaigns.length > 0 && !transferSelected && (
                                    <div className="absolute left-0 top-full mt-0.5 w-full bg-white border border-[#d8dde6] shadow-lg rounded z-50 overflow-hidden">
                                        {filteredCampaigns.map((c) => (
                                            <div
                                                key={c}
                                                className="px-3 py-2 text-sm text-[#16325c] hover:bg-[#f4f6f9] cursor-pointer"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setTransferSelected(c);
                                                    setTransferSearch(c);
                                                    setShowTransferDropdown(false);
                                                }}
                                            >
                                                {c}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Select Transfer Type — only visible when a campaign is selected */}
                        {transferSelected && (
                            <div>
                                <div className="text-[#54698d] text-xs mb-2">Select Transfer Type</div>
                                <div className="flex border border-[#d8dde6] rounded overflow-hidden">
                                    <button
                                        onClick={() => setTransferType('Warm')}
                                        className={`flex-1 py-2 text-sm font-medium transition-colors ${transferType === 'Warm'
                                            ? 'bg-[#0070d2] text-white'
                                            : 'bg-white text-[#0070d2] hover:bg-gray-50'
                                            }`}
                                    >
                                        Warm
                                    </button>
                                    <button
                                        onClick={() => setTransferType('Cold')}
                                        className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-[#d8dde6] ${transferType === 'Cold'
                                            ? 'bg-[#0070d2] text-white'
                                            : 'bg-white text-[#0070d2] hover:bg-gray-50'
                                            }`}
                                    >
                                        Cold
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right column — Transfers / Calls tabs */}
                    <div className="flex-1 p-4 flex flex-col">
                        <div className="flex border-b border-[#d8dde6] mb-3">
                            <button className="px-3 pb-2 text-sm font-medium text-[#0070d2] border-b-2 border-[#0070d2]">Transfers</button>
                            <button className="px-3 pb-2 text-sm font-normal text-[#54698d] hover:text-[#16325c]">Calls</button>
                        </div>
                        {/* Empty state */}
                        <div className="flex-1" />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-[#d8dde6] bg-white flex gap-3">
                    <button
                        onClick={() => setView('active_call')}
                        className="flex-1 py-2 px-4 border border-[#d8dde6] rounded text-[#0070d2] text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!transferSelected}
                        onClick={() => {
                            stopRingtone();
                            setView('active_transfer');
                            setCallStatus('On Hold');
                            setTransferHoldDuration(0);
                            playHoldMusic();
                        }}
                        className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${transferSelected
                            ? 'bg-[#0070d2] text-white hover:bg-[#005fb2] cursor-pointer'
                            : 'bg-[#d8dde6] text-[#706e6b] cursor-not-allowed'
                            }`}
                    >
                        Initiate Transfer
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'active_transfer' && activeCall) {
        return (
            <div className="fixed bottom-[36px] left-0 w-[600px] h-auto bg-white shadow-2xl border border-gray-300 rounded-tr-lg z-[60] flex flex-col font-sans animate-in slide-in-from-bottom-2 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white rounded-tr-lg">
                    <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <MessageSquare size={16} />
                        <span>Engage</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <button onClick={onMinimize} className="hover:text-gray-700"><Minimize2 size={14} /></button>
                        <button className="hover:text-gray-700"><ExternalLink size={14} /></button>
                    </div>
                </div>

                {/* Call Header with Transfer tab (On Hold state) */}
                <div className="bg-[#f4f6f9] p-3 flex items-center gap-3 border-b border-[#d8dde6]">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-[#c23934] shadow-sm shrink-0">
                        <Pause size={20} fill="white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[#54698d] text-xs">
                            <span>Agent Call: On Hold</span>
                            <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {formatTime(callDuration)}
                            </span>
                        </div>
                        <div className="text-[#16325c] text-base font-normal truncate">{activeCall.name}</div>
                    </div>
                    <div className="ml-auto shrink-0 flex gap-4 text-sm font-medium text-[#54698d]">
                        <div className="cursor-pointer hover:text-[#16325c] pb-1 px-1">Interaction</div>
                        <div className="cursor-pointer hover:text-[#16325c] pb-1 px-1">Timeline</div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 bg-white" style={{ minHeight: '340px' }}>
                    {/* Left column — Disabled call controls */}
                    <div className="w-[48%] p-4 border-r border-[#d8dde6] flex flex-col gap-2">
                        <div className="flex gap-2">
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-[#f3f3f3] text-[#b0adab] cursor-not-allowed">
                                <Pause size={16} fill="currentColor" />
                                <span className="text-[10px] mt-1">Unhold</span>
                            </button>
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#0070d2]">
                                <MicOff size={16} />
                                <span className="text-[10px] mt-1">Mute</span>
                            </button>
                        </div>
                        <div className="flex gap-2 opacity-50 pointer-events-none">
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#54698d]">
                                <ArrowDown size={16} />
                                <span className="text-[10px] mt-1">Park</span>
                            </button>
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#54698d]">
                                <UserPlus size={16} />
                                <span className="text-[10px] mt-1">Conference...</span>
                            </button>
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-[#f4f6f9] text-[#0070d2] border-[#0070d2]">
                                <ArrowRight size={16} />
                                <span className="text-[10px] mt-1">Transfer...</span>
                            </button>
                        </div>
                        <div className="flex gap-2 opacity-50 pointer-events-none">
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#54698d]">
                                <MessageSquare size={16} />
                                <span className="text-[10px] mt-1">IM</span>
                            </button>
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#0070d2]">
                                <Calendar size={16} />
                                <span className="text-[10px] mt-1">Reminder</span>
                            </button>
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#54698d]">
                                <Circle size={16} />
                                <span className="text-[10px] mt-1">Record</span>
                            </button>
                            <button className="flex-1 flex flex-col items-center justify-center p-2 border border-[#d8dde6] rounded bg-white text-[#54698d]">
                                <Grid3x3 size={16} />
                                <span className="text-[10px] mt-1">Keypad</span>
                            </button>
                        </div>
                        <div className="flex gap-2 mt-auto opacity-50 pointer-events-none">
                            <button className="flex-1 flex items-center justify-center gap-2 p-2 border border-[#d8dde6] rounded bg-white text-[#54698d] text-xs font-medium">
                                <List size={14} /> Script
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 p-2 border border-[#d8dde6] rounded bg-white text-[#54698d] text-xs font-medium">
                                <CheckSquare size={14} /> Worksheet
                            </button>
                        </div>
                    </div>

                    {/* Right column — Active Transfer Controls */}
                    <div className="flex-1 p-4 flex flex-col gap-4">
                        <div className="flex border border-[#d8dde6] rounded-t border-b-0 overflow-hidden text-[#0070d2]">
                            <button className="flex-1 py-1.5 flex justify-center border-b-2 border-[#0070d2] bg-white"><ArrowRight size={16} /></button>
                            <button className="flex-1 py-1.5 flex justify-center border-b border-[#d8dde6] bg-[#f4f6f9] text-[#54698d]"><Info size={16} /></button>
                            <button className="flex-1 py-1.5 flex justify-center border-b border-[#d8dde6] border-r-0 bg-[#f4f6f9] text-[#54698d]"><FileText size={16} /></button>
                        </div>

                        <div className="-mt-4 border border-[#d8dde6] border-t-0 rounded-b p-3 flex flex-col gap-3">
                            <div>
                                <div className="text-[#54698d] text-xs mb-1">Warm Transfer</div>
                                <div className="border border-[#d8dde6] rounded px-3 py-2 text-sm text-[#16325c] bg-[#f4f6f9] cursor-not-allowed">
                                    {transferSelected}
                                </div>
                            </div>

                            <button className="flex items-center justify-center gap-2 w-full py-2 border border-[#d8dde6] rounded text-[#0070d2] text-sm font-medium hover:bg-gray-50 transition-colors mt-2">
                                <ArrowRight size={14} className="rotate-180" /> Toggle Hold {formatTime(transferHoldDuration)}
                            </button>

                            <button
                                onClick={() => {
                                    stopRingtone();
                                    stopHoldMusic();
                                    setView('console');
                                    setActiveCall(null);
                                    setCallStatus('');

                                    // Make Complete Transfer behave like End Interaction
                                    // Go back to ready status automatically to trigger the next simulation
                                    // and accumulate the time spent on the transfer/call.
                                    const readyStatus = 'Ready (Voice, Voicemail)';
                                    setStatus(readyStatus);
                                    localStorage.setItem('five9_status', readyStatus);
                                    window.dispatchEvent(new Event('five9_status_changed'));
                                }}
                                className="w-full py-2 bg-[#0070d2] text-white rounded text-sm font-medium hover:bg-[#005fb2] transition-colors mt-1"
                            >
                                Complete Transfer
                            </button>

                            <button
                                onClick={() => {
                                    stopHoldMusic();
                                    setView('transfer');
                                    setCallStatus('Connected');
                                }}
                                className="w-full py-2 border border-[#d8dde6] text-[#0070d2] rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-[#d8dde6] bg-white flex justify-between gap-3">
                    <button className="flex-1 py-2 flex items-center justify-center gap-2 border border-[#d8dde6] rounded text-[#b0adab] bg-white text-sm font-medium cursor-not-allowed">
                        <PhoneOff size={16} className="rotate-225" /> End Call
                    </button>
                    <button className="flex-1 py-2 rounded text-[#b0adab] bg-[#f3f3f3] text-sm font-medium cursor-not-allowed border border-[#d8dde6]">
                        Set Disposition...
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'disposition') {
        const manualDispositions = ['Do Not Call', 'Llamada Manual'];
        // Simulated Disposition Tree Structure based on user screenshots
        const simulatedDispositions = [
            { id: 'dnc', label: 'Do Not Call', type: 'option' },
            { id: 'recycle', label: 'Recycle', type: 'option' },
            {
                id: 'sin_gestion', label: 'SIN GESTION', type: 'category', children: [
                    { id: 'buzon', label: 'Buzon de Voz', type: 'option' },
                    { id: 'contesta_otra', label: 'Contesta otra persona', type: 'option' },
                    { id: 'llamada_muda', label: 'Llamada Muda', type: 'option' },
                    { id: 'mala_comunicacion', label: 'Mala Comunicacion', type: 'option' },
                    { id: 'lead_no_disponible', label: 'Lead no disponible', type: 'option' }
                ]
            },
            {
                id: 'gestionado', label: 'GESTIONADO', type: 'category', children: [
                    { id: 'agendado', label: 'Agendado', type: 'option' },
                    { id: 'asignados', label: 'Asignados', type: 'option' },
                    { id: 'informado', label: 'Informado', type: 'option' }
                ]
            },
            {
                id: 'no_calificado', label: 'NO CALIFICADO', type: 'category', children: [
                    { id: 'estudiante_fuera_perfil', label: 'Estudiante Fuera de Perfil', type: 'option' },
                ]
            },
            {
                id: 'venta_cerrada', label: 'VENTA CERRADA', type: 'category', children: [
                    { id: 'matricula_exitosa', label: 'Matricula Exitosa', type: 'option' },
                ]
            }
        ];

        const toggleCategory = (categoryId: string) => {
            setExpandedCategories(prev => ({
                ...prev,
                [categoryId]: !prev[categoryId]
            }));
        };
        return (
            <div className="fixed bottom-[36px] left-0 w-[600px] h-auto bg-white shadow-2xl border border-gray-300 rounded-tr-lg z-[60] flex flex-col font-sans animate-in slide-in-from-bottom-2 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white rounded-tr-lg">
                    <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <MessageSquare size={16} />
                        <span>Engage</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <button onClick={onMinimize} className="hover:text-gray-700"><Minimize2 size={14} /></button>
                        <button className="hover:text-gray-700"><ExternalLink size={14} /></button>
                    </div>
                </div>

                {/* Call Header (Same as Active Call) */}
                <div className="bg-[#f4f6f9] p-4 flex items-center gap-4 border-b border-[#d8dde6]">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm ${callStatus === 'Wrap Up' ? 'bg-[#d8dde6]' : 'bg-[#0070d2]'}`}>
                        <Phone size={24} fill="white" className={callStatus === 'Wrap Up' ? 'text-white' : 'rotate-90'} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-[#54698d] text-xs">
                            <span className={callStatus === 'Wrap Up' ? 'text-black' : ''}>
                                Agent Call: {callStatus}
                            </span>
                            <span className={`flex items-center gap-1 ${callStatus === 'Wrap Up' ? 'text-[#c23934]' : ''}`}>
                                <Clock size={12} />
                                <span>{callStatus === 'Wrap Up' ? '-' : ''}{formatTime(Math.abs(callDuration))}</span>
                            </span>
                        </div>
                        <div className="text-[#16325c] text-xl font-normal">
                            {activeCall?.name}
                        </div>
                    </div>
                    <div className="ml-auto flex gap-4 text-sm font-medium text-[#54698d]">
                        <div className="border-b-2 border-[#0070d2] text-[#16325c] pb-1 cursor-pointer">Interaction</div>
                        <div className="cursor-pointer hover:text-[#16325c]">Timeline</div>
                    </div>
                </div>

                {/* Disposition Body */}
                <div className="p-4 flex gap-4 bg-white min-h-[300px]">
                    {/* Left: Select Disposition */}
                    <div className="w-1/2 flex flex-col">
                        <label className="text-[#54698d] text-sm mb-2">Select Disposition</label>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full border border-[#0070d2] rounded px-3 py-1.5 text-sm outline-none mb-3"
                            autoFocus
                            value={dispositionSearch}
                            onChange={(e) => setDispositionSearch(e.target.value)}
                        />
                        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                            {callDirection === 'manual' ? (
                                manualDispositions.filter(d => d.toLowerCase().includes(dispositionSearch.toLowerCase())).map(d => (
                                    <label key={d} className="flex items-center gap-2 cursor-pointer group" onClick={() => setSelectedDisposition(d)}>
                                        <div
                                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedDisposition === d ? 'border-[#0070d2] bg-[#0070d2]' : 'border-gray-400 group-hover:border-[#0070d2]'}`}
                                        >
                                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                        </div>
                                        <span className={`text-sm ${selectedDisposition === d ? 'font-bold text-[#16325c]' : 'text-[#16325c]'}`}>{d}</span>
                                    </label>
                                ))
                            ) : (
                                // Render Simulated Dispositions Tree
                                simulatedDispositions.map((node: any) => {
                                    if (node.type === 'option') {
                                        if (dispositionSearch && !node.label.toLowerCase().includes(dispositionSearch.toLowerCase())) return null;
                                        return (
                                            <label key={node.id} className="flex items-center gap-2 cursor-pointer group" onClick={() => setSelectedDisposition(node.label)}>
                                                <div
                                                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedDisposition === node.label ? 'border-[#0070d2] bg-[#0070d2]' : 'border-gray-400 group-hover:border-[#0070d2]'}`}
                                                >
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                </div>
                                                <span className={`text-sm ${selectedDisposition === node.label ? 'font-bold text-[#16325c]' : 'text-[#16325c]'}`}>{node.label}</span>
                                            </label>
                                        );
                                    } else if (node.type === 'category') {
                                        // If searching, check if any child matches
                                        const searchLower = dispositionSearch.toLowerCase();
                                        const matchingChildren = node.children.filter((child: any) => child.label.toLowerCase().includes(searchLower));

                                        if (dispositionSearch && matchingChildren.length === 0 && !node.label.toLowerCase().includes(searchLower)) return null;

                                        // Auto-expand if searching and there are matches inside
                                        const isExpanded = dispositionSearch ? matchingChildren.length > 0 : expandedCategories[node.id];
                                        const childrenToRender = dispositionSearch && !node.label.toLowerCase().includes(searchLower) ? matchingChildren : node.children;

                                        return (
                                            <div key={node.id} className="flex flex-col">
                                                <div
                                                    onClick={() => toggleCategory(node.id)}
                                                    className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 py-1"
                                                >
                                                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                                    <span className="text-sm text-[#54698d] uppercase">{node.label}</span>
                                                </div>
                                                {isExpanded && (
                                                    <div className="pl-6 flex flex-col gap-2 mt-1 border-l border-dotted border-gray-300 ml-1.5">
                                                        {childrenToRender.map((child: any) => (
                                                            <label key={child.id} className="flex items-center gap-2 cursor-pointer group" onClick={() => setSelectedDisposition(child.label)}>
                                                                <div
                                                                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedDisposition === child.label ? 'border-[#0070d2] bg-[#0070d2]' : 'border-gray-400 group-hover:border-[#0070d2]'}`}
                                                                >
                                                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                                </div>
                                                                <span className={`text-sm ${selectedDisposition === child.label ? 'font-bold text-[#16325c]' : 'text-[#16325c]'}`}>{child.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                })
                            )}
                        </div>
                    </div>

                    {/* Right: Quick lookup */}
                    <div className="w-1/2 flex flex-col pl-4 border-l border-gray-200">
                        <label className="text-[#54698d] text-sm mb-2">Quick lookup</label>
                        <div className="flex border border-gray-300 rounded mb-3 overflow-hidden">
                            <button className="flex-1 py-1.5 text-[#0070d2] text-sm font-medium bg-white hover:bg-gray-50 text-center border-b-2 border-[#0070d2]">Recent</button>
                            <button className="flex-1 py-1.5 text-[#54698d] text-sm font-medium bg-[#f4f6f9] hover:bg-gray-50 text-center border-b border-gray-200">Frequent</button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setSelectedDisposition('Llamada Manual')}>
                                <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedDisposition === 'Llamada Manual' ? 'border-[#0070d2] bg-[#0070d2]' : 'border-gray-400 group-hover:border-[#0070d2]'}`}
                                >
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                                <span className={`text-sm ${selectedDisposition === 'Llamada Manual' ? 'font-bold text-[#16325c]' : 'text-[#16325c]'}`}>Llamada Manual</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#d8dde6] bg-white flex justify-between gap-3 rounded-b-lg">
                    <button
                        onClick={() => setView('active_call')}
                        className="px-4 py-2 border border-[#d8dde6] text-[#0070d2] rounded text-sm hover:bg-gray-50 font-normal w-1/2"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            // End Interaction
                            stopRingtone(); // Force stop ringtone just in case
                            setView('console');
                            setActiveCall(null);
                            setSelectedDisposition(null);
                            setDispositionSearch('');

                            // Check if simulation is active globally using localStorage or rely on App.tsx logic? 
                            // Always go back to ready on end interaction if it was a simulated call, 
                            // Actually, just going back to 'Ready' is the standard behaviour required here
                            const readyStatus = 'Ready (Voice, Voicemail)';
                            setStatus(readyStatus);
                            // We DO NOT reset elapsedTime to 0 here.
                            // The user requested that the time spent on the call should be ADDED
                            // to the time they already had in "Ready" status.
                            // Since `elapsedTime` keeps counting in the background during the call (because the interval in useEffect doesn't stop),
                            // just not resetting it will naturally preserve the total contiguous time (Ready + On Call + Ready again).
                            localStorage.setItem('five9_status', readyStatus);
                            window.dispatchEvent(new Event('five9_status_changed'));
                        }}
                        className={`px-4 py-2 text-white rounded text-sm font-normal w-1/2 transition-colors ${selectedDisposition ? 'bg-[#0070d2] hover:bg-[#005fb2]' : 'bg-[#d8dde6] cursor-not-allowed'}`}
                        disabled={!selectedDisposition}
                    >
                        End Interaction
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-[36px] left-0 w-[400px] h-auto pb-4 bg-white shadow-2xl border border-gray-300 rounded-tr-lg z-[60] flex flex-col font-sans animate-in slide-in-from-bottom-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white rounded-tr-lg">
                <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                    <MessageSquare size={16} />
                    <span>Engage</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                    <button onClick={onMinimize} className="hover:text-gray-700"><div className="w-3 h-0.5 bg-current"></div></button>
                    <button className="hover:text-gray-700"><ExternalLink size={14} /></button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center pt-8 px-8 bg-white">
                {/* Logo */}
                <div className="mb-2">
                    <span className="text-[#2b5bf7] text-5xl font-bold tracking-tight" style={{ fontFamily: 'Arial, sans-serif' }}>Five9</span>
                </div>
                {error && (
                    <div className="text-[#c23934] text-xs text-center mb-6 font-medium px-4">
                        <span className="font-bold">!</span> {error}
                    </div>
                )}



                {/* Form */}
                <div className="w-full border border-gray-300 rounded p-6 shadow-sm">
                    <div className="mb-4">
                        <label className="block text-gray-500 text-xs font-medium mb-1">Username</label>
                        <input
                            type="text"
                            className="w-full border border-gray-400 rounded px-2 py-1.5 text-sm outline-none focus:border-[#0070d2] focus:ring-1 focus:ring-[#0070d2] transition-all"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="mb-6 relative">
                        <label className="block text-gray-500 text-xs font-medium mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={passwordVisible ? "text" : "password"}
                                className="w-full border border-gray-400 rounded px-2 py-1.5 text-sm outline-none focus:border-[#0070d2] focus:ring-1 focus:ring-[#0070d2] transition-all pr-8"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            />
                            <button
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                            >
                                {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-[#0070d2] text-white font-medium py-2 rounded text-sm hover:bg-[#005fb2] transition-colors shadow-sm mb-4 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>

                    <div className="text-center">
                        <a href="#" className="text-[#0070d2] text-xs hover:underline">Forgot Your Password?</a>
                    </div>
                </div>
            </div>
        </div>
    );
};
