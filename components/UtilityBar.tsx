import React, { useState, useEffect } from 'react';
import { Phone, Clock, FileText, Zap, List, UserPlus, MessageSquare, CheckSquare } from 'lucide-react';
import { ReferidoPanel } from './ReferidoPanel';
import { Five9Login } from './Five9Login';
import { User as UserType, ProspectData } from '../App';

const UtilityItem = ({ icon: Icon, label, onClick, isActive, className }: { icon: any, label: string, onClick?: () => void, isActive?: boolean, className?: string }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 h-full transition-colors font-medium text-xs border-r border-transparent ${isActive ? 'bg-white text-blue-600 border-l border-r-gray-200 border-l-gray-200 shadow-[0_-2px_0_0_#0070d2_inset]' : 'text-gray-700 hover:bg-black/10'} ${className}`}
    >
        <Icon size={16} />
        <span>{label}</span>
    </button>
);

export const UtilityBar: React.FC<{ currentUser: UserType | null, onOpenRecord: (record: ProspectData) => void }> = ({ currentUser, onOpenRecord }) => {
    const [isReferidoOpen, setIsReferidoOpen] = useState(false);
    const [isFive9Mounted, setIsFive9Mounted] = useState(false);
    const [isFive9Visible, setIsFive9Visible] = useState(false);

    const toggleFive9 = () => {
        if (!isFive9Mounted) {
            setIsFive9Mounted(true);
            setIsFive9Visible(true);
        } else {
            setIsFive9Visible(!isFive9Visible);
        }
    };

    // ── Auto-open Five9 when a click-to-dial event fires ──
    useEffect(() => {
        const handler = () => {
            if (!isFive9Mounted) {
                setIsFive9Mounted(true);
            }
            setIsFive9Visible(true);
        };
        window.addEventListener('five9:dial', handler);
        window.addEventListener('five9:maximize', handler);
        window.addEventListener('five9:incoming_simulation_call', handler);

        return () => {
            window.removeEventListener('five9:dial', handler);
            window.removeEventListener('five9:maximize', handler);
            window.removeEventListener('five9:incoming_simulation_call', handler);
        };
    }, [isFive9Mounted]);

    return (
        <div className="h-[35px] bg-[#f3f3f3] border-t border-gray-300 flex items-center px-2 shrink-0 justify-start fixed bottom-0 w-full z-50 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
            <div className="relative h-full">
                <UtilityItem
                    icon={Phone}
                    label="Five9"
                    onClick={toggleFive9}
                    isActive={isFive9Visible}
                />
                {isFive9Mounted && (
                    <div style={{ display: isFive9Visible ? 'block' : 'none' }}>
                        <Five9Login
                            onClose={() => setIsFive9Visible(false)}
                            onMinimize={() => setIsFive9Visible(false)}
                        />
                    </div>
                )}
            </div>
            <UtilityItem icon={Clock} label="History" />
            <UtilityItem icon={FileText} label="Notes" />
            <UtilityItem icon={Zap} label="List View" />
            <UtilityItem icon={List} label="Omni-Channel" />
            <UtilityItem icon={CheckSquare} label="To Do List" />
            <UtilityItem icon={MessageSquare} label="whatsapp" />

            {/* Referido Item Container (Relative for positioning panel) */}
            <div className="relative h-full">
                <UtilityItem
                    icon={UserPlus}
                    label="Referido"
                    onClick={() => setIsReferidoOpen(!isReferidoOpen)}
                    isActive={isReferidoOpen}
                />
                {isReferidoOpen && (
                    <ReferidoPanel
                        currentUser={currentUser}
                        onOpenRecord={onOpenRecord}
                        onClose={() => setIsReferidoOpen(false)}
                    />
                )}
            </div>
        </div>
    );
};