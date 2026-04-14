/**
 * ID de suscripción único por checkout (solo demo; no es una URL real ejecutable).
 * Formato alineado con ejemplos tipo: chk_-xxx-sim-prospectPart_timestamp
 */
export function generateSmartbeemoSubscriptionId(prospectId: string): string {
    // Solo alfanuméricos: evita duplicar "-sim-" cuando el prospectId ya incluye guiones o sufijos -sim-
    const safeProspect = String(prospectId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32) || 'lead';
    const rand =
        Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).slice(2, 8);
    const t = Date.now();
    return `chk_-${rand}-sim-${safeProspect}_${t}`;
}

export function buildCheckoutPaymentUrl(subscriptionId: string): string {
    return `https://smartbeemo.com/checkout/?subscriptionid=${encodeURIComponent(subscriptionId)}`;
}
