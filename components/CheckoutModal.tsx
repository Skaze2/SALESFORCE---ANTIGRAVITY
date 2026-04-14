import React, { useEffect, useState, useMemo, useRef } from 'react';
import { X, Lock, Mail, CreditCard, Info, Check } from 'lucide-react';
import { db } from '../firebaseConfig';
import { generateSmartbeemoSubscriptionId, buildCheckoutPaymentUrl } from '../utils/checkoutIds';

const FIXED_PAYMENT_ALERT =
    'Ha ocurrido un error al intentar crear tu método de pago. Por favor, inténtalo nuevamente.';

const STAGE_WON = 'Ganada verificada';

/** Solo la oportunidad cuyo subscriptionId (o paymentLink) coincide con el pago simulado. */
async function markOpportunityStageForPositivePayment(
    prospectId: string,
    subscriptionId: string | undefined,
    paymentLink: string
): Promise<void> {
    if (!prospectId || !paymentLink) return;
    try {
        const snap = await db.ref(`opportunities/${prospectId}`).once('value');
        const val = snap.val() as Record<string, Record<string, unknown>> | null;
        if (!val || typeof val !== 'object') return;

        const updates: Record<string, unknown> = {};
        const now = new Date().toISOString();

        for (const [key, opp] of Object.entries(val)) {
            if (!opp || typeof opp !== 'object') continue;
            const sid = opp.subscriptionId as string | undefined;
            const plink = opp.paymentLink as string | undefined;
            const matchBySub = subscriptionId && sid === subscriptionId;
            const matchByLink = plink && plink === paymentLink;
            if (matchBySub || matchByLink) {
                updates[`${key}/stage`] = STAGE_WON;
                updates[`${key}/stageUpdatedAt`] = now;
            }
        }

        if (Object.keys(updates).length > 0) {
            await db.ref(`opportunities/${prospectId}`).update(updates);
        }
    } catch (e) {
        console.error('markOpportunityStageForPositivePayment:', e);
    }
}

const RANDOM_GATEWAY_ERRORS: string[] = [
    '[GatewayTransactionError] Transaction declined.NOK - Expired card',
    '[GatewayTransactionError] Transaction declined.NOK - Insufficient funds',
    '[CardProcessorError] CVV mismatch — código 82',
    '[IssuerDecline] Do not honor — contact your bank',
    '[FraudScreen] Suspicious activity detected — transaction blocked',
    '[3DSecureError] Authentication failed — try another card',
    '[BINValidationError] Card type not supported for this merchant',
    '[VelocityLimit] Too many attempts — wait before retrying',
    '[ExpiredCard] The card expiration date is invalid',
];

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Prospect / lead id — required to persist checkout simulation en Firebase */
    prospectId?: string;
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
        subscriptionId?: string;
        paymentLink?: string;
        paymentStatus?: string;
    } | null;
}

type Phase = 'billing' | 'success' | 'paymentLink' | 'alreadyPaid';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
    isOpen,
    onClose,
    prospectId,
    data,
    checkoutData,
}) => {
    const [phase, setPhase] = useState<Phase>('billing');
    /** Estado en Firebase para este prospecto (simulación persistida) */
    const [liveCheckout, setLiveCheckout] = useState<{
        paymentStatus?: string;
        paymentLink?: string;
        subscriptionId?: string;
        paidAt?: string;
    } | null>(null);
    const [showSimulateDialog, setShowSimulateDialog] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [cardholderName, setCardholderName] = useState('');
    const [cvv, setCvv] = useState('');
    const [expMonth, setExpMonth] = useState('');
    const [expYear, setExpYear] = useState('');
    const [inlineError, setInlineError] = useState<string | null>(null);
    const [resolvedPaymentLink, setResolvedPaymentLink] = useState<string>('');
    const prevIsOpenRef = useRef(false);

    const displayLink = useMemo(() => {
        if (resolvedPaymentLink) return resolvedPaymentLink;
        if (liveCheckout?.paymentLink) return liveCheckout.paymentLink;
        if (checkoutData?.paymentLink) return checkoutData.paymentLink;
        const sid = liveCheckout?.subscriptionId ?? checkoutData?.subscriptionId;
        if (sid) return buildCheckoutPaymentUrl(sid);
        return '';
    }, [
        resolvedPaymentLink,
        liveCheckout?.paymentLink,
        liveCheckout?.subscriptionId,
        checkoutData?.paymentLink,
        checkoutData?.subscriptionId,
    ]);

    useEffect(() => {
        if (!isOpen || !prospectId) {
            return;
        }
        const ref = db.ref(`checkouts/${prospectId}`);
        const handler = ref.on('value', (snap) => {
            setLiveCheckout(snap.val() || null);
        });
        return () => {
            ref.off('value', handler);
        };
    }, [isOpen, prospectId]);

    const years = useMemo(() => {
        const y = new Date().getFullYear();
        return Array.from({ length: 16 }, (_, i) => String(y + i));
    }, []);

    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')), []);

    useEffect(() => {
        if (!isOpen) {
            setPhase('billing');
            setResolvedPaymentLink('');
            setShowSimulateDialog(false);
            setInlineError(null);
        }
    }, [isOpen]);

    // Solo al abrir el modal (transición cerrado → abierto): evita borrar el formulario cuando Firebase actualiza tras un pago fallido
    useEffect(() => {
        if (!isOpen) {
            prevIsOpenRef.current = false;
            return;
        }

        const justOpened = !prevIsOpenRef.current;
        prevIsOpenRef.current = true;

        setCardholderName(`${data.firstName || ''} ${data.lastName || ''}`.trim());

        if (!justOpened) return;

        setShowSimulateDialog(false);
        setInlineError(null);

        const paidFromProps = checkoutData?.paymentStatus === 'paid';

        if (paidFromProps) {
            const link =
                checkoutData?.paymentLink ||
                (checkoutData?.subscriptionId
                    ? buildCheckoutPaymentUrl(checkoutData.subscriptionId)
                    : '');
            if (link) setResolvedPaymentLink(link);
            setPhase((prev) => (prev === 'success' || prev === 'paymentLink' ? prev : 'alreadyPaid'));
            return;
        }

        setPhase('billing');
        setCardNumber('');
        setCvv('');
        setResolvedPaymentLink('');
        setExpMonth('');
        setExpYear('');
    }, [
        isOpen,
        data.firstName,
        data.lastName,
        checkoutData?.paymentStatus,
        checkoutData?.paymentLink,
        checkoutData?.subscriptionId,
    ]);

    // Firebase en tiempo real: si este checkout pasa a pagado, bloquear formulario (sin borrar mientras se escribe en otros estados)
    useEffect(() => {
        if (!isOpen) return;

        const paid =
            liveCheckout?.paymentStatus === 'paid' || checkoutData?.paymentStatus === 'paid';
        if (!paid) return;

        const linkForPaid =
            liveCheckout?.paymentLink ||
            checkoutData?.paymentLink ||
            (liveCheckout?.subscriptionId || checkoutData?.subscriptionId
                ? buildCheckoutPaymentUrl(
                      (liveCheckout?.subscriptionId || checkoutData?.subscriptionId) as string
                  )
                : '');

        if (linkForPaid) setResolvedPaymentLink(linkForPaid);
        setPhase((prev) => {
            if (prev === 'success' || prev === 'paymentLink') return prev;
            return 'alreadyPaid';
        });
    }, [
        isOpen,
        liveCheckout?.paymentStatus,
        liveCheckout?.paymentLink,
        liveCheckout?.subscriptionId,
        checkoutData?.paymentStatus,
        checkoutData?.paymentLink,
        checkoutData?.subscriptionId,
    ]);

    if (!isOpen) return null;

    const formatValue = (val: number | string) => {
        if (typeof val === 'number') {
            return new Intl.NumberFormat('es-CO').format(val);
        }
        return val;
    };

    const cardDigits = cardNumber.replace(/\D/g, '');

    const ensureSubscriptionAndLink = (): string => {
        if (checkoutData?.paymentLink) return checkoutData.paymentLink;
        if (checkoutData?.subscriptionId) return buildCheckoutPaymentUrl(checkoutData.subscriptionId);
        if (prospectId) {
            const sid = generateSmartbeemoSubscriptionId(prospectId);
            return buildCheckoutPaymentUrl(sid);
        }
        const sid = generateSmartbeemoSubscriptionId(`orphan-${Date.now()}`);
        return buildCheckoutPaymentUrl(sid);
    };

    const persistCheckoutPatch = async (patch: Record<string, unknown>) => {
        if (!prospectId) return;
        try {
            await db.ref(`checkouts/${prospectId}`).update(patch);
        } catch (e) {
            console.error('CheckoutModal Firebase update:', e);
        }
    };

    const handlePayClick = () => {
        setInlineError(null);
        if (cardDigits.length < 15) {
            window.alert('El número de tarjeta debe tener al menos 15 dígitos.');
            return;
        }
        setShowSimulateDialog(true);
    };

    const handleSimulateFailure = () => {
        setShowSimulateDialog(false);
        window.alert(FIXED_PAYMENT_ALERT);
        setInlineError(RANDOM_GATEWAY_ERRORS[Math.floor(Math.random() * RANDOM_GATEWAY_ERRORS.length)]);
        void persistCheckoutPatch({
            paymentStatus: 'failed',
            lastSimulation: 'negative',
            lastFailedAt: new Date().toISOString(),
        });
    };

    const handleSimulateSuccess = async () => {
        setShowSimulateDialog(false);
        const link = ensureSubscriptionAndLink();
        setResolvedPaymentLink(link);

        const subMatch = link.match(/subscriptionid=([^&]+)/);
        const subscriptionId = subMatch
            ? decodeURIComponent(subMatch[1])
            : checkoutData?.subscriptionId;

        await persistCheckoutPatch({
            paymentStatus: 'paid',
            lastSimulation: 'positive',
            paidAt: new Date().toISOString(),
            ...(subscriptionId ? { subscriptionId } : {}),
            paymentLink: link,
        });

        if (prospectId) {
            await markOpportunityStageForPositivePayment(prospectId, subscriptionId, link);
        }

        setPhase('success');
    };

    const firstName = (data.firstName || '').trim();

    const paidAtLabel = liveCheckout?.paidAt
        ? new Date(liveCheckout.paidAt).toLocaleString('es-CO', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : null;

    return (
        <div className="fixed inset-0 z-[99999] bg-white animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center overflow-hidden">
            {phase === 'alreadyPaid' && (
                <div className="flex flex-col flex-1 w-full max-w-2xl mx-auto px-6 py-8">
                    <div className="flex justify-end mb-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                            aria-label="Cerrar"
                        >
                            <X size={22} />
                        </button>
                    </div>
                    <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden flex flex-col flex-1">
                        <div className="flex items-center gap-4 p-6 border-b border-gray-200">
                            <div className="w-14 h-14 rounded-full bg-yellow-400 border-2 border-black flex items-center justify-center text-3xl shrink-0">
                                🐝
                            </div>
                            <h2 className="text-[#ffc107] text-2xl font-bold flex-1 text-center">Link de pago</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-2 text-[#04844b] font-bold text-sm">
                                <Check className="w-5 h-5 shrink-0" strokeWidth={3} />
                                Este enlace ya fue pagado (simulación positiva registrada).
                            </div>
                            <p className="text-sm text-gray-700">
                                No es necesario volver a ingresar datos de tarjeta. El detalle de la compra quedó asociado a
                                este checkout.
                            </p>
                            {paidAtLabel && (
                                <p className="text-xs text-gray-500">
                                    Registrado: <span className="font-medium text-gray-700">{paidAtLabel}</span>
                                </p>
                            )}
                            <div className="pt-2 border-t border-gray-100">
                                <span className="text-[#0070d2] underline text-sm font-medium">Link</span>
                                <p className="text-sm text-gray-800 break-all font-mono leading-relaxed mt-2">
                                    {displayLink || '—'}
                                </p>
                            </div>
                            <p className="text-sm text-gray-700">
                                Confirmación enviada al correo:{' '}
                                <span className="font-bold text-gray-900">{data.email || '—'}</span>
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-8 py-2 bg-[#16325c] text-white rounded font-bold text-sm hover:bg-[#0f2444]"
                            >
                                Finalizar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {phase === 'billing' && (
                <>
                    <div className="w-full h-[70px] border-b border-gray-200 bg-white flex items-center justify-center relative shrink-0">
                        <div className="flex items-center justify-center gap-1">
                            <span className="text-3xl relative top-[2px]">🐝</span>
                            <span className="font-bold text-[28px] text-gray-900 tracking-tight ml-1 font-sans">
                                beemo<span className="text-sm align-top relative -top-[4px] ml-0.5 font-medium">™</span>
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-6 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="w-full flex-1 overflow-y-auto bg-[#fafafa] flex flex-col items-center py-10">
                        {firstName && (
                            <p className="w-full max-w-[1100px] px-6 text-gray-800 text-sm mb-4">
                                Hola, <span className="font-semibold">{firstName}</span>
                            </p>
                        )}
                        <div className="w-full max-w-[800px] mb-12 px-6 flex flex-col items-center text-center shrink-0">
                            <button
                                type="button"
                                className="w-full bg-[#E31D2D] hover:bg-[#c91d25] text-white font-bold text-[18px] py-4 px-6 rounded-lg transition-colors shadow-md uppercase tracking-wide"
                            >
                                Adquiere esta oferta por tiempo limitado
                            </button>

                            <p className="mt-8 text-[16px] text-gray-700 max-w-[700px] leading-relaxed font-medium">
                                En nuestra llamada, mencionaste tu interés en nuestros programas. Te invito a que
                                adquieras esta oferta inigualable que transformará tu futuro.
                            </p>
                        </div>

                        <div className="w-full max-w-[1100px] px-6 flex flex-col md:flex-row gap-8">
                            <div className="flex-[0_0_65%] bg-white rounded-md shadow-sm border border-gray-200 p-8 self-start">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 font-sans">Datos de facturación</h2>
                                <div className="border-t border-gray-200 mb-6"></div>

                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-800 text-sm">Pago con Tarjeta de Crédito</h3>
                                    <div className="flex gap-2">
                                        <div className="h-6 w-10 bg-[#1434CB] rounded text-white text-[10px] font-bold flex items-center justify-center">
                                            VISA
                                        </div>
                                        <div className="h-6 w-10 bg-[#EB001B] rounded flex items-center justify-center relative overflow-hidden">
                                            <div className="w-6 h-6 rounded-full bg-[#F79E1B] absolute right-[-5px] opacity-80"></div>
                                        </div>
                                        <div className="h-6 w-10 bg-[#2874C2] rounded text-white text-[8px] font-bold flex flex-col items-center justify-center leading-none">
                                            <span>AM</span>
                                            <span>EX</span>
                                        </div>
                                        <div className="h-6 w-10 border border-gray-300 rounded bg-white text-orange-500 text-[8px] font-bold flex items-center justify-center">
                                            DISCOVER
                                        </div>
                                    </div>
                                </div>

                                {inlineError && (
                                    <p className="text-sm text-red-600 font-medium mb-4 leading-snug">{inlineError}</p>
                                )}

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-[13px] text-gray-600 mb-1">
                                            País <span className="text-red-500">*</span>
                                        </label>
                                        <select className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white">
                                            <option>Colombia</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-600 mb-1">
                                            Correo Electrónico <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={data.email || ''}
                                                readOnly
                                                className="w-full border border-gray-300 rounded pl-9 pr-3 py-2.5 text-sm outline-none bg-gray-50"
                                            />
                                            <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-600 mb-1">
                                            Nombre del Tarjetahabiente <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={cardholderName}
                                            onChange={(e) => setCardholderName(e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-600 mb-1">
                                            Número de Tarjeta <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="off"
                                                placeholder="Mínimo 15 dígitos"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                                                className="w-full border border-gray-300 rounded pl-9 pr-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                            <CreditCard className="absolute left-3 top-3 text-gray-400" size={16} />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="block text-[13px] text-gray-600 mb-1">Fecha de Caducidad</label>
                                            <select
                                                value={expMonth}
                                                onChange={(e) => setExpMonth(e.target.value)}
                                                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-blue-500 outline-none"
                                            >
                                                <option value="">Mes</option>
                                                {months.map((m) => (
                                                    <option key={m} value={m}>
                                                        {m}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[13px] text-gray-600 mb-1">&nbsp;</label>
                                            <select
                                                value={expYear}
                                                onChange={(e) => setExpYear(e.target.value)}
                                                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-blue-500 outline-none"
                                            >
                                                <option value="">Año</option>
                                                {years.map((y) => (
                                                    <option key={y} value={y}>
                                                        {y}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-600 mb-1">
                                            Código de Seguridad <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="password"
                                                    value={cvv}
                                                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                    className="w-full border border-gray-300 rounded pl-9 pr-3 py-2.5 text-sm focus:border-blue-500 outline-none"
                                                    placeholder="CVV"
                                                />
                                                <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
                                            </div>
                                            <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-[8px] font-bold text-gray-600 border border-gray-300 shrink-0">
                                                CVV
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handlePayClick}
                                    className="w-full bg-[#1b44c8] hover:bg-blue-800 text-white font-bold py-3 mt-4 rounded transition-colors text-sm shadow-sm"
                                >
                                    Realizar Pago
                                </button>

                                <div className="mt-8">
                                    <h4 className="font-bold text-gray-800 mb-4 text-sm">También puedes pagar usando:</h4>
                                    <button
                                        type="button"
                                        className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 rounded flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <span className="text-xl font-bold">G</span> Pay
                                    </button>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100 text-[11px] text-gray-500 text-justify leading-relaxed">
                                    Al finalizar el pago, confirmas que estás de acuerdo con que smartBeemo realice cargos
                                    automáticos a tu método de pago registrado para renovar tu suscripción de acuerdo con el
                                    plan seleccionado. smartBeemo no almacena detalles completos de tarjetas en sus servidores.
                                </div>
                            </div>

                            <div className="flex-[0_0_35%] self-start space-y-6">
                                <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4 font-sans">Resumen del pedido</h2>
                                    <div className="border-t border-gray-200 mb-4"></div>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-start">
                                            <div className="text-[13px] text-gray-700">
                                                {checkoutData?.productName || 'Beemo Pro - 12 meses'}
                                                <br />
                                                <span className="text-gray-400">Pago Inicial:</span>
                                            </div>
                                            <div className="font-bold text-[13px] text-gray-800 text-right">
                                                {checkoutData
                                                    ? `${checkoutData.currency} $${formatValue(checkoutData.initialFee)}`
                                                    : 'COP $159.900'}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <div className="text-[13px] text-gray-700 uppercase">
                                                Cuotas Pendientes:
                                                <br />
                                                <span className="text-gray-400 capitalize">
                                                    Valor: {checkoutData?.quotasCount || 11} x
                                                </span>
                                            </div>
                                            <div className="font-bold text-[13px] text-gray-800 text-right">
                                                {checkoutData
                                                    ? `${checkoutData.currency} $${formatValue(checkoutData.quotaValue)}`
                                                    : 'COP $130.827,27'}
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
                                            {checkoutData
                                                ? `${checkoutData.currency} $${formatValue(checkoutData.initialFee)}`
                                                : 'COP $159.900'}
                                        </div>
                                    </div>

                                    <div className="bg-[#f8f9fa] rounded p-4 text-[13px] text-gray-700 space-y-2 mb-4">
                                        <div className="flex justify-between">
                                            <span>Periodo inicial:</span>
                                            <span className="font-bold">12 meses</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tipo de pago:</span>
                                            <span className="font-bold">Cuotas</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Próximo cobro:</span>
                                            <span className="font-bold">
                                                {checkoutData?.nextQuotaDate ||
                                                    (() => {
                                                        const d = new Date();
                                                        return new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()).toLocaleDateString(
                                                            'es-CO',
                                                            { day: 'numeric', month: 'long', year: 'numeric' }
                                                        );
                                                    })()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6 space-y-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-[#e8f5e9] rounded-full border-2 border-green-700 flex items-center justify-center shrink-0">
                                            <Lock size={16} className="text-green-800" fill="currentColor" />
                                        </div>
                                        <div className="font-bold text-[13px] text-gray-800 leading-tight uppercase">
                                            Su información es
                                            <br />
                                            100% segura
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-[#e8f5e9] rounded-full border-2 border-green-700 flex items-center justify-center shrink-0">
                                            <span className="text-base">👍</span>
                                        </div>
                                        <div className="font-bold text-[13px] text-gray-800 leading-tight uppercase">
                                            Ambiente seguro
                                            <br />y autenticado
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-[#e8f5e9] rounded-full border-2 border-green-700 flex items-center justify-center shrink-0 relative">
                                            <span className="text-lg relative -top-0.5">🎖️</span>
                                        </div>
                                        <div className="font-bold text-[13px] text-gray-800 leading-tight uppercase">
                                            Contenido 100%
                                            <br />
                                            revisado y aprobado
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {showSimulateDialog && (
                        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 px-4">
                            <div
                                className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="sim-title"
                            >
                                <h3 id="sim-title" className="text-lg font-bold text-gray-900 mb-2 text-center">
                                    Simulación de pago
                                </h3>
                                <p className="text-sm text-gray-600 mb-6 text-center">
                                    Elige cómo simular la respuesta del gateway (demo).
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        type="button"
                                        onClick={handleSimulateSuccess}
                                        className="w-full py-3 rounded bg-[#04844b] hover:bg-[#036e3f] text-white font-bold text-sm"
                                    >
                                        Simular pago positivo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSimulateFailure}
                                        className="w-full py-3 rounded bg-[#c23934] hover:bg-[#a61a14] text-white font-bold text-sm"
                                    >
                                        Simular pago Fallido
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowSimulateDialog(false)}
                                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {phase === 'success' && (
                <div className="flex flex-col flex-1 w-full max-w-lg mx-auto px-6 py-12 items-center text-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="self-end mb-4 p-2 hover:bg-gray-100 rounded-full text-gray-500"
                        aria-label="Cerrar"
                    >
                        <X size={22} />
                    </button>
                    <div className="w-full border-b border-gray-200 pb-6 mb-8 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-4xl">🐝</span>
                            <span className="font-bold text-2xl text-gray-900">
                                beemo<span className="text-xs align-super">™</span>
                            </span>
                        </div>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-[#04844b] flex items-center justify-center mb-6">
                        <Check className="text-white w-9 h-9" strokeWidth={3} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Transacción exitosa</h2>
                    <p className="text-lg font-bold text-gray-900 mb-4">Tu pago ya fue realizado</p>
                    <p className="text-sm text-gray-600 mb-6">
                        Estamos emocionados de que hayas elegido Beemo.
                    </p>
                    <p className="text-sm text-gray-700">
                        El detalle de tu compra fue enviado al correo:{' '}
                        <span className="font-bold text-gray-900">{data.email || '—'}</span>
                    </p>
                    <button
                        type="button"
                        onClick={() => setPhase('paymentLink')}
                        className="mt-10 w-full max-w-xs py-3 rounded bg-[#16325c] text-white font-bold text-sm hover:bg-[#0f2444]"
                    >
                        Ver link de pago
                    </button>
                </div>
            )}

            {phase === 'paymentLink' && (
                <div className="flex flex-col flex-1 w-full max-w-2xl mx-auto px-6 py-8">
                    <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden flex flex-col flex-1">
                        <div className="flex items-center gap-4 p-6 border-b border-gray-200">
                            <div className="w-14 h-14 rounded-full bg-yellow-400 border-2 border-black flex items-center justify-center text-3xl shrink-0">
                                🐝
                            </div>
                            <h2 className="text-[#ffc107] text-2xl font-bold flex-1 text-center">Link de pago</h2>
                        </div>
                        <div className="p-6 flex flex-col sm:flex-row gap-6 items-start">
                            <span className="text-[#0070d2] underline text-sm font-medium shrink-0">Link</span>
                            <p className="text-sm text-gray-800 break-all font-mono leading-relaxed flex-1">
                                {displayLink || '—'}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-8 py-2 bg-[#16325c] text-white rounded font-bold text-sm hover:bg-[#0f2444]"
                            >
                                Finalizar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
