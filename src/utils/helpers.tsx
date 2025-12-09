
import { Text } from 'recharts';
import dayjs from 'dayjs';
import CLUBS from '@constants/clubs';
export const numFormatter = (num: number, decimals: number = 0): string | number => {
    if (num > 999 && num < 1000000) {
        return (num / 1000).toFixed(decimals) + 'k';
    } else if (num > 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num < 900) {
        return num;
    }
    return num;
};

export const getRandomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export function addZero(num: number): string {
    return num < 10 ? '0' + num : String(num);
}

export const generateGridPoints = (id: string, gutter: number = 20, axis: 'x' | 'y' = 'y'): number[] => {
    const element = document.getElementById(id);
    if (!element) return [];
    
    const gridWidth = element.offsetWidth;
    const gridHeight = element.offsetHeight;

    const points: number[] = [];
    for (let i = 0; i < (axis === 'y' ? gridWidth : gridHeight); i += gutter) {
        points.push(i);
    }
    return points;
};

export const preventDefault = (): void => {
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e: Event) => e.preventDefault());
    });
    document.querySelectorAll('a[href="#"]').forEach(a => {
        a.addEventListener('click', (e: Event) => e.preventDefault());
    });
};

interface ClubInfo {
    id: string;
    name: string;
    shortName: string;
    country: string;
    city: string;
    color: string;
    logo: any;
}

export const getClubInfo = (id: string): ClubInfo | undefined => {
    return CLUBS.find((club: ClubInfo) => club.id === id);
};

interface DayInfo {
    date: string;
    weekday: string;
}

export const getMonthDays = (month?: number, year?: number): DayInfo[] => {
    const currentMonth = month ?? dayjs().month();
    const currentYear = year ?? dayjs().year();
    
    const days: DayInfo[] = [];
    const daysInMonth = dayjs(`${currentYear}-${currentMonth + 1}`).daysInMonth();
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({
            date: dayjs(`${currentYear}-${currentMonth + 1}-${i}`).format('DD'),
            weekday: dayjs(`${currentYear}-${currentMonth + 1}-${i}`).format('dd')
        });
    }
    return days;
}

interface PolarAngleAxisProps {
    payload: any;
    x: number;
    y: number;
    cx: number;
    cy: number;
    [key: string]: any;
}

export const renderPolarAngleAxis = ({payload, x, y, cx, cy, ...rest}: PolarAngleAxisProps): JSX.Element => {
    return (
        <Text
            {...rest}
            verticalAnchor="middle"
            textAnchor="middle"
            y={y + (y - cy) / 8}
            x={x + (x - cx) / 5}
            fill="var(--btn-text)"
        >
            {payload.value}
        </Text>
    );
};

export const modifyCardNumber = (cardNumber: string): string => {
    const lastDigits = cardNumber.substring(8);
    const maskedDigits = "**** ";

    const modifiedCardNumber = maskedDigits + lastDigits.slice(-4);

    return modifiedCardNumber;
};