
import { useState, MouseEvent } from 'react';
interface UseSubmenuReturn {
    anchorEl: HTMLElement | null;
    open: boolean;
    handleClick: (event: MouseEvent<HTMLElement>) => void;
    handleClose: () => void;
}

const useSubmenu = (): UseSubmenuReturn => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: MouseEvent<HTMLElement>): void => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = (): void => {
        setAnchorEl(null);
    };

    return { anchorEl, open, handleClick, handleClose };
};

export default useSubmenu;