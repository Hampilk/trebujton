// styles
import 'react-big-calendar/lib/css/react-big-calendar.css'

// styled components
import {StyledEventsCalendar, Header} from './styles';

// components
import Spring from '@components/Spring';
import {Calendar, momentLocalizer} from 'react-big-calendar';
import ViewNavigator from './ViewNavigator';
import Navigator from './Navigator';
import Event from './Event';

// hooks
import {useState, useEffect} from 'react';
import {useWindowSize} from 'react-use';
import {useThemeProvider} from '@contexts/themeContext';

// utils
import moment from 'moment';

// hooks
import { useAllEvents } from '@hooks/useEvents';
import LoadingScreen from '@components/LoadingScreen';

const EventsCalendar = ({ 
  currentView = 'day',
  showTime = true,
  title = 'Events Calendar',
  minHour = 8,
  maxHour = 22
}) => {
    const {direction} = useThemeProvider();
    const [currentDate, setCurrentDate] = useState(moment().toDate());
    const [currentTime, setCurrentTime] = useState(moment().format('HH:mm'));
    const {width} = useWindowSize();
    const localizer = momentLocalizer(moment);
    
    // Get events from Supabase
    const { data: events, isLoading, error } = useAllEvents();

    useEffect(() => {
        if (showTime) {
            const interval = setInterval(() => {
                setCurrentTime(moment().format('HH:mm'));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [currentTime, showTime]);

    const handleNavigation = (action) => {
        switch (action) {
            case 'NEXT':
                setCurrentDate(moment(currentDate).add(1, currentView).toDate());
                break;
            case 'PREV':
                setCurrentDate(moment(currentDate).subtract(1, currentView).toDate());
                break;
            default:
                setCurrentDate(moment().toDate());
        }
    }

    const getWeek = (date) => {
        const start = moment(date).startOf('week');
        const end = moment(date).endOf('week');
        return [start, end];
    }

    const getTitleFormat = () => {
        switch (currentView) {
            case 'month':
                return 'MMMM YYYY';
            case 'week':
                return width < 768 ? 'DD.MM.YY' : 'DD MMMM YYYY';
            case 'day':
                return 'DD MMMM YYYY';
            default:
                return 'MMMM YYYY';
        }
    }

    const getDayFormat = () => {
        switch (true) {
            case width < 768:
                return 'D';
            case width < 1600:
                return 'ddd, D';
            default:
                return 'dddd D MMMM';
        }
    }

    // Show loading state
    if (isLoading) {
        return (
            <Spring className="card h-fit card-padded">
                <div className="flex items-center justify-center h-32">
                    <LoadingScreen />
                </div>
            </Spring>
        );
    }

    // Show error state
    if (error) {
        return (
            <Spring className="card h-fit card-padded">
                <div className="text-center text-red-500 p-4">
                    Error loading events: {error.message}
                </div>
            </Spring>
        );
    }

    // Transform events to match expected format
    const transformedEvents = (events || []).map(event => ({
        name: event.title,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        allDay: event.is_all_day,
        type: event.type || 'other'
    }));

    const config = {
        as: Calendar,
        className: currentView,
        views: ['month', 'week', 'day'],
        view: currentView,
        date: currentDate,
        localizer: localizer,
        startAccessor: 'start',
        endAccessor: 'end',
        onNavigate: handleNavigation,
        onView: setCurrentView,
        min: moment().startOf('year').set({hour: minHour, minute: 0}).toDate(),
        max: moment().endOf('year').set({hour: maxHour, minute: 0}).toDate(),
        step: 30,
        events: transformedEvents,
        formats: {
            timeGutterFormat: 'HH:mm',
            dayFormat: getDayFormat(),
        },
        components: {
            toolbar: ({date}) => <Header data-view={currentView} dir={direction}>
                <Navigator date={date} handler={handleNavigation}/>
                <h3 className="date">
                    {
                        currentView === 'week' && getWeek(date).map((date, index) => {
                                return (
                                    <span key={index}>
                                    {date.format(getTitleFormat(date))}
                                        {index === 0 ? ' - ' : null}
                                </span>
                                )
                            }
                        )
                    }
                    {
                        currentView === 'month' && moment(date).format(getTitleFormat(date))
                    }
                    {
                        currentView === 'day' && `${moment(date).format(getTitleFormat(date))}${showTime ? `, ${currentTime}` : ''}`
                    }
                </h3>
                <ViewNavigator current={currentView} handler={setCurrentView}/>
            </Header>,
            event: ({event}) => <Event event={event} view={currentView}/>
        },
        selectable: currentView !== 'day',
        messages: {
            showMore: (total) => `+ ${total}`,
        },
    }

    return (
        <Spring className="card h-fit card-padded">
            <StyledEventsCalendar {...config}/>
        </Spring>
    )
}

EventsCalendar.meta = {
  id: "calendar",
  name: "Events Calendar",
  category: "Utility",
  defaultSize: { w: 4, h: 4 },
  props: {
    currentView: { type: "string", default: "day", description: "Current calendar view (month, week, day)" },
    showTime: { type: "boolean", default: true, description: "Whether to show current time" },
    title: { type: "string", default: "Events Calendar", description: "Calendar title" },
    minHour: { type: "number", default: 8, description: "Minimum hour to display" },
    maxHour: { type: "number", default: 22, description: "Maximum hour to display" }
  }
};

export default EventsCalendar