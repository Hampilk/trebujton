
import { useLocation } from 'react-router-dom';
const useAuthRoute = (): boolean => {
    const location = useLocation();
    return ['/login', '/sign-up'].includes(location.pathname);
};

export default useAuthRoute;