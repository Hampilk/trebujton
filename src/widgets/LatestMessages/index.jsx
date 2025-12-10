// styling
import styles from './styles.module.scss';

// components
import Spring from '@components/Spring';
import ChatMessage from '@components/ChatMessage';
import DateSeparator from '@ui/DateSeparator';
import ScrollContainer from '@components/ScrollContainer';

// hooks
import useMeasure from 'react-use-measure';

// utils
import dayjs from 'dayjs';

// data placeholder
import chat from '@db/chat';

const LatestMessages = ({ 
  title = "Latest messages",
  maxHeight = 400,
  showDateSeparator = true,
  maxMessages = 50,
  showHeader = true 
}) => {
    const [ref, {height}] = useMeasure();
    
    // Apply max messages limit if specified
    const limitedChat = maxMessages ? chat.slice(0, maxMessages) : chat;
    const uniqueDates = [...new Set(limitedChat.map((item) => dayjs(item.timestamp).format('DD.MM.YY')))];

    const messagesByDate = uniqueDates.map((date) => {
        return limitedChat.filter((item) => dayjs(item.timestamp).format('DD.MM.YY') === date);
    });

    return (
        <Spring className="card h-2">
            {showHeader && <h3 className={styles.header} ref={ref}>{title}</h3>}
            <ScrollContainer height={showHeader ? height : maxHeight} bg="widget-bg">
                <div className={`${styles.main} track d-flex flex-column g-10`}>
                    {
                        uniqueDates.map((date, index) => {
                            const isToday = dayjs().format('DD.MM.YY') === date;
                            return (
                                <div key={index}>
                                    {showDateSeparator && <DateSeparator date={isToday ? 'Today' : date} />}
                                    <div className={styles.main_group}>
                                        {
                                            messagesByDate[index].map((message, messageIndex) => {
                                                return (
                                                    <ChatMessage key={messageIndex} index={messageIndex} {...message} />
                                                )
                                            })
                                        }
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </ScrollContainer>
        </Spring>
    )
}

LatestMessages.meta = {
  id: "messages",
  name: "Latest Messages",
  category: "Communication",
  defaultSize: { w: 3, h: 3 },
  props: {
    title: { type: "string", default: "Latest messages", description: "Widget title" },
    maxHeight: { type: "number", default: 400, description: "Maximum height in pixels" },
    showDateSeparator: { type: "boolean", default: true, description: "Whether to show date separators" },
    maxMessages: { type: "number", default: 50, description: "Maximum number of messages to display" },
    showHeader: { type: "boolean", default: true, description: "Whether to show header" }
  }
};

export default LatestMessages