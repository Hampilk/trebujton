import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useStoreRoute = (): boolean => {
    const storeRoutes = ['/football-store', '/brand-store', '/product'];
    const location = useLocation();
    const [isStoreRoute, setIsStoreRoute] = useState(false);

    useEffect(() => {
        setIsStoreRoute(storeRoutes.includes(location.pathname));

        return () => {
            setIsStoreRoute(false);
        };
    }, [location, storeRoutes]);

    return isStoreRoute;
};

export default useStoreRoute;
