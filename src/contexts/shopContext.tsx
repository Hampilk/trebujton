
import React, { ReactNode, FC, Dispatch, SetStateAction, createContext, useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
interface ShopContextValue {
    cartOpen: boolean;
    setCartOpen: Dispatch<SetStateAction<boolean>>;
    filtersOpen: boolean;
    setFiltersOpen: Dispatch<SetStateAction<boolean>>;
}

const ShopContext = createContext<ShopContextValue | undefined>(undefined);

interface ShopProviderProps {
    children: ReactNode;
}

export const ShopProvider: FC<ShopProviderProps> = ({ children }) => {
    const [cartOpen, setCartOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setFiltersOpen(false);
    }, [location]);

    useEffect(() => {
        if (filtersOpen) {
            document.documentElement.classList.add('no-scroll');
        } else {
            document.documentElement.classList.remove('no-scroll');
        }

        return () => {
            document.documentElement.classList.remove('no-scroll');
        }
    }, [filtersOpen]);

    const value: ShopContextValue = { cartOpen, setCartOpen, filtersOpen, setFiltersOpen };

    return (
        <ShopContext.Provider value={value}>
            {children}
        </ShopContext.Provider>
    );
};

export const useShopProvider = (): ShopContextValue => {
    const context = useContext(ShopContext);
    if (!context) {
        throw new Error('useShopProvider must be used within ShopProvider');
    }
    return context;
};