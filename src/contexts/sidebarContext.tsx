
import React, { ReactNode, FC, Dispatch, SetStateAction, createContext, useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
interface SidebarContextValue {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

interface SidebarProviderProps {
    children: ReactNode;
}

export const SidebarProvider: FC<SidebarProviderProps> = ({ children }) => {
    const [open, setOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setOpen(false);
    }, [location]);

    useEffect(() => {
        if (open) {
            document.documentElement.classList.add('no-scroll');
        } else {
            document.documentElement.classList.remove('no-scroll');
        }

        return () => {
            document.documentElement.classList.remove('no-scroll');
        }
    }, [open]);

    const value: SidebarContextValue = { open, setOpen };

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = (): SidebarContextValue => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within SidebarProvider');
    }
    return context;
};
