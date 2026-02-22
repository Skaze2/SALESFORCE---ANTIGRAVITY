import React, { useEffect } from 'react';
import { db } from '../firebaseConfig';

const CHECK_INTERVAL = 60 * 1000; // Check every 1 minute

export const StatusCron: React.FC = () => {
    useEffect(() => {
        const checkStatuses = async () => {
            try {
                const snapshot = await db.ref('prospects').once('value');
                const prospects = snapshot.val();
                if (!prospects) return;

                const now = new Date();
                const updates: Record<string, any> = {};

                for (const id in prospects) {
                    const prospect = prospects[id];
                    const status = prospect.status;
                    const updatedAtStr = prospect.statusUpdatedAt || prospect.createdAt;

                    if (!status || !updatedAtStr) continue;

                    const updatedAt = new Date(updatedAtStr);
                    const diffMs = now.getTime() - updatedAt.getTime();
                    const hoursPassed = diffMs / (1000 * 60 * 60);

                    let shouldDowngrade = false;

                    if (status === 'Agendado' && hoursPassed >= 24) {
                        shouldDowngrade = true;
                    } else if (status === 'Asignado' && hoursPassed >= 48) {
                        shouldDowngrade = true;
                    } else if (status === 'En llamada' && hoursPassed >= 1) {
                        shouldDowngrade = true;
                    }

                    if (shouldDowngrade) {
                        const newStatus = 'SQL';
                        const newOwner = 'Administrador Salesforce';

                        const dateStr = now.toLocaleString('es-CO', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: 'numeric', minute: '2-digit', hour12: true
                        }).replace(',', '');

                        // Generate history events
                        const historyRef = db.ref(`history/${id}`);

                        await historyRef.push({
                            date: dateStr,
                            field: 'Estado',
                            user: 'Sistema Automático',
                            original: status,
                            new: newStatus,
                            createdAt: now.toISOString()
                        });

                        await historyRef.push({
                            date: dateStr,
                            field: 'Propietario de la cuenta',
                            user: 'Sistema Automático',
                            original: prospect.owner || 'Administrador Salesforce',
                            new: newOwner,
                            createdAt: new Date(now.getTime() + 1).toISOString()
                        });

                        // Queue updates for the prospect
                        updates[`${id}/status`] = newStatus;
                        updates[`${id}/owner`] = newOwner;
                        updates[`${id}/statusUpdatedAt`] = now.toISOString();
                    }
                }

                if (Object.keys(updates).length > 0) {
                    await db.ref('prospects').update(updates);
                    console.log('Automated status downgrades completed:', updates);
                }
            } catch (err) {
                console.error("Error running status cron:", err);
            }
        };

        // Run immediately on mount
        checkStatuses();

        // And then periodically
        const intervalId = setInterval(checkStatuses, CHECK_INTERVAL);

        return () => clearInterval(intervalId);
    }, []);

    return null; // This component doesn't render anything
};
