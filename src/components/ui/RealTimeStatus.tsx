import React, { useState, useEffect } from 'react';
import { realTimeManager } from '../../utils/realTimeManager';

const RealTimeStatus: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    useEffect(() => {
        // Set up callbacks to track real-time status
        const originalCallbacks = realTimeManager['callbacks'];
        
        realTimeManager.setCallbacks({
            ...originalCallbacks,
            onMessagesUpdate: (messages) => {
                originalCallbacks.onMessagesUpdate?.(messages);
                setLastUpdate(new Date());
                setIsConnected(true);
            },
            onAnnouncementsUpdate: (announcements) => {
                originalCallbacks.onAnnouncementsUpdate?.(announcements);
                setLastUpdate(new Date());
                setIsConnected(true);
            }
        });

        // Check if polling is active
        const checkStatus = () => {
            const isPolling = realTimeManager['isPolling'];
            setIsConnected(isPolling);
        };

        checkStatus();
        const interval = setInterval(checkStatus, 5000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    if (!isConnected) {
        return null; // Don't show anything if not connected
    }

    return (
        <div className="fixed top-4 right-4 z-50">
            <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs shadow-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Updates Active</span>
                {lastUpdate && (
                    <span className="text-green-600">
                        {lastUpdate.toLocaleTimeString()}
                    </span>
                )}
            </div>
        </div>
    );
};

export default RealTimeStatus;
