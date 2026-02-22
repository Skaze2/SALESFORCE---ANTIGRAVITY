import React from 'react';
import { X, Lock, Mail, CreditCard, Info } from 'lucide-react';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        firstName?: string;
        lastName?: string;
        email?: string;
    };
    checkoutData: {
        productName: string;
        initialFee: number | string;
        quotaValue: number | string;
        quotasCount: number | string;
        currency: string;
        nextQuotaDate?: string;
    } | null;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, data, checkoutData }) => {
    if (!isOpen) return null;

    // Helper for formatting money if it's a number
    const formatValue = (val: number | string) => {
        if (typeof val === 'number') {
            return new Intl.NumberFormat('es-CO').format(val);
        }
        return val;
    };

    return (
        <div className="fixed inset-0 z-[99999] bg-white animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center overflow-hidden">
            {/* Header */}
            <div className="w-full h-[70px] border-b border-gray-200 bg-white flex items-center justify-center relative shrink-0">
                <div className="flex items-center justify-center gap-1">
                    <span className="text-3xl relative top-[2px]">🐝</span>
                    <span className="font-bold text-[28px] text-gray-900 tracking-tight ml-1 font-sans">
                        beemo<span className="text-sm align-top relative -top-[4px] ml-0.5 font-medium">™</span>
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="absolute right-6 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Content Area - Scrolling */}
            <div className="w-full flex-1 overflow-y-auto bg-[#fafafa] flex flex-col items-center py-10">
                {/* Branding Section */}
                <div className="w-full max-w-[800px] mb-12 px-6 flex flex-col items-center text-center shrink-0">
                    <button className="w-full bg-[#E31D2D] hover:bg-[#c91d25] text-white font-bold text-[18px] py-4 px-6 rounded-lg transition-colors shadow-md uppercase tracking-wide">
                        Adquiere esta oferta por tiempo limitado
                    </button>

                    <p className="mt-8 text-[16px] text-gray-700 max-w-[700px] leading-relaxed font-medium">
                        En nuestra llamada, mencionaste tu interés en nuestros programas. Te invito a que adquieras esta oferta inigualable que transformará tu futuro.
                    </p>
                </div>

                <div className="w-full max-w-[1100px] px-6 flex flex-col md:flex-row gap-8">
                    {/* Left Column: Billing Details */}
                    <div className="flex-[0_0_65%] bg-white rounded-md shadow-sm border border-gray-200 p-8 self-start">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 font-sans">Datos de facturación</h2>
                        <div className="border-t border-gray-200 mb-6"></div>

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-800 text-sm">Pago con Tarjeta de Crédito</h3>
                            <div className="flex gap-2">
                                <div className="h-6 w-10 bg-[#1434CB] rounded text-white text-[10px] font-bold flex items-center justify-center">VISA</div>
                                <div className="h-6 w-10 bg-[#EB001B] rounded flex items-center justify-center relative overflow-hidden"><div className="w-6 h-6 rounded-full bg-[#F79E1B] absolute right-[-5px] opacity-80"></div></div>
                                <div className="h-6 w-10 bg-[#2874C2] rounded text-white text-[8px] font-bold flex flex-col items-center justify-center leading-none"><span>AM</span><span>EX</span></div>
                                <div className="h-6 w-10 border border-gray-300 rounded bg-white text-orange-500 text-[8px] font-bold flex items-center justify-center">DISCOVER</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[13px] text-gray-600 mb-1">País <span className="text-red-500">*</span></label>
                                <select className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white">
                                    <option>Colombia</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[13px] text-gray-600 mb-1">Correo Electrónico <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input type="email" value={data.email || ''} readOnly className="w-full border border-gray-300 rounded pl-9 pr-3 py-2.5 text-sm outline-none bg-gray-50" />
                                    <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[13px] text-gray-600 mb-1">Nombre del Tarjetahabiente <span className="text-red-500">*</span></label>
                                <input type="text" defaultValue={`${data.firstName || ''} ${data.lastName || ''}`.trim()} className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[13px] text-gray-600 mb-1">Número de Tarjeta <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input type="text" className="w-full border border-gray-300 rounded pl-9 pr-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                                    <CreditCard className="absolute left-3 top-3 text-gray-400" size={16} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-[13px] text-gray-600 mb-1">Fecha de Caducidad</label>
                                    <select className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-blue-500 outline-none">
                                        <option>Mes</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[13px] text-gray-600 mb-1">&nbsp;</label>
                                    <select className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-blue-500 outline-none">
                                        <option>Año</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[13px] text-gray-600 mb-1">Código de Seguridad <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input type="text" className="w-full border border-gray-300 rounded pl-9 pr-3 py-2.5 text-sm focus:border-blue-500 outline-none" placeholder="CVV" />
                                        <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
                                    </div>
                                    <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-[8px] font-bold text-gray-600 border border-gray-300 shrink-0">CVV</div>
                                </div>
                            </div>
                        </div>

                        <button className="w-full bg-[#1b44c8] hover:bg-blue-800 text-white font-bold py-3 mt-4 rounded transition-colors text-sm shadow-sm">
                            Realizar Pago
                        </button>

                        <div className="mt-8">
                            <h4 className="font-bold text-gray-800 mb-4 text-sm">También puedes pagar usando:</h4>
                            <button className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 rounded flex items-center justify-center gap-2 transition-colors">
                                <span className="text-xl font-bold">G</span> Pay
                            </button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 text-[11px] text-gray-500 text-justify leading-relaxed">
                            Al finalizar el pago, confirmas que estás de acuerdo con que smartBeemo realice cargos automáticos a tu método de pago registrado para renovar tu suscripción de acuerdo con el plan seleccionado. smartBeemo no almacena detalles completos de tarjetas en sus servidores.
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="flex-[0_0_35%] self-start space-y-6">
                        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 font-sans">Resumen del pedido</h2>
                            <div className="border-t border-gray-200 mb-4"></div>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-start">
                                    <div className="text-[13px] text-gray-700">
                                        {checkoutData?.productName || 'Beemo Pro - 12 meses'}<br />
                                        <span className="text-gray-400">Pago Inicial:</span>
                                    </div>
                                    <div className="font-bold text-[13px] text-gray-800 text-right">
                                        {checkoutData ? `${checkoutData.currency} $${formatValue(checkoutData.initialFee)}` : 'COP $159.900'}
                                    </div>
                                </div>
                                <div className="flex justify-between items-start">
                                    <div className="text-[13px] text-gray-700 uppercase">
                                        Cuotas Pendientes:<br />
                                        <span className="text-gray-400 capitalize">Valor: {checkoutData?.quotasCount || 11} x</span>
                                    </div>
                                    <div className="font-bold text-[13px] text-gray-800 text-right">
                                        {checkoutData ? `${checkoutData.currency} $${formatValue(checkoutData.quotaValue)}` : 'COP $130.827,27'}
                                    </div>
                                </div>
                                <div className="text-[13px] text-green-700 font-semibold pt-2 bg-green-50 p-2 rounded flex items-center gap-1">
                                    <Info size={14} /> Bono: Accede 12 meses a Beemo PRO
                                </div>
                            </div>

                            <div className="border-t border-gray-200 my-4"></div>
                            <div className="flex justify-between items-center mb-6">
                                <div className="font-bold text-sm text-gray-800 uppercase">Total a pagar ahora:</div>
                                <div className="font-bold text-lg text-gray-900">
                                    {checkoutData ? `${checkoutData.currency} $${formatValue(checkoutData.initialFee)}` : 'COP $159.900'}
                                </div>
                            </div>

                            <div className="bg-[#f8f9fa] rounded p-4 text-[13px] text-gray-700 space-y-2 mb-4">
                                <div className="flex justify-between"><span>Periodo inicial:</span><span className="font-bold">12 meses</span></div>
                                <div className="flex justify-between"><span>Tipo de pago:</span><span className="font-bold">Cuotas</span></div>
                                <div className="flex justify-between"><span>Próximo cobro:</span><span className="font-bold">
                                    {checkoutData?.nextQuotaDate || (() => {
                                        const d = new Date();
                                        return new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
                                    })()}
                                </span></div>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6 space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#e8f5e9] rounded-full border-2 border-green-700 flex items-center justify-center shrink-0">
                                    <Lock size={16} className="text-green-800" fill="currentColor" />
                                </div>
                                <div className="font-bold text-[13px] text-gray-800 leading-tight uppercase">Su información es<br />100% segura</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#e8f5e9] rounded-full border-2 border-green-700 flex items-center justify-center shrink-0">
                                    <span className="text-base">👍</span>
                                </div>
                                <div className="font-bold text-[13px] text-gray-800 leading-tight uppercase">Ambiente seguro<br />y autenticado</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#e8f5e9] rounded-full border-2 border-green-700 flex items-center justify-center shrink-0 relative">
                                    <span className="text-lg relative -top-0.5">🎖️</span>
                                </div>
                                <div className="font-bold text-[13px] text-gray-800 leading-tight uppercase">Contenido 100%<br />revisado y aprobado</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
