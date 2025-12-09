import { useState, useEffect } from 'react';
import styles from './styles.module.scss';
import PropTypes from 'prop-types';

import Spring from '@components/Spring';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Pagination, Thumbs, Autoplay } from 'swiper';
import MatchScoreItem from '@components/MatchScoreItem';
import { DataStateMessage } from '@components/DataStateMessage';
import { SkeletonLoader } from '@components/SkeletonLoader';

import { useThemeProvider } from '@contexts/themeContext';
import { useLiveMatches } from '@/hooks/useMatches';
import { getClubInfo } from '@/utils/helpers';

import cover1 from '@assets/tickets/live1.webp';

const LiveMatches = ({ variant = 'big' }) => {
  const { direction } = useThemeProvider();
  const [mainSwiper, setMainSwiper] = useState<HTMLElement | null>(null);
  const [thumbsSwiper, setThumbsSwiper] = useState<HTMLElement | null>(null);
  const { data: matches = [], isLoading, error } = useLiveMatches();

  const thumbsParams = {
    slidesPerView: 1,
    breakpoints:
      variant === 'big'
        ? {
            768: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
          }
        : {},
  };

  useEffect(() => {
    if (mainSwiper && thumbsSwiper) {
      mainSwiper.changeLanguageDirection(direction);
      mainSwiper.update();
      thumbsSwiper.changeLanguageDirection(direction);
      thumbsSwiper.update();
    }
  }, [mainSwiper, thumbsSwiper, direction]);

  const transformedMatches = matches.map((match) => ({
    id: match.id,
    cover: cover1,
    team1: {
      id: match.home_team_id,
      score: match.home_score,
    },
    team2: {
      id: match.away_team_id,
      score: match.away_score,
    },
  }));

  if (isLoading) {
    return (
      <Spring className="card h-2 no-shadow p-relative">
        <span className={`${styles.live} tag tag--accent tag--overlay animated h6`}>
          Live
        </span>
        <div style={{ padding: '40px 20px', minHeight: '200px' }}>
          <SkeletonLoader count={3} height={100} />
        </div>
      </Spring>
    );
  }

  if (error) {
    return (
      <Spring className="card h-2 no-shadow p-relative">
        <span className={`${styles.live} tag tag--accent tag--overlay animated h6`}>
          Live
        </span>
        <DataStateMessage state="error" error={error} />
      </Spring>
    );
  }

  if (transformedMatches.length === 0) {
    return (
      <Spring className="card h-2 no-shadow p-relative">
        <span className={`${styles.live} tag tag--accent tag--overlay animated h6`}>
          Live
        </span>
        <DataStateMessage state="empty" message="No live matches available" />
      </Spring>
    );
  }

  return (
    <Spring className="card h-2 no-shadow p-relative">
      <span className={`${styles.live} tag tag--accent tag--overlay animated h6`}>
        Live
      </span>
      <Swiper
        className="h-100"
        modules={[EffectFade, Pagination, Thumbs, Autoplay]}
        autoplay={{ delay: 2500, disableOnInteraction: false }}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop={transformedMatches.length > 1}
        pagination={{ clickable: true, type: 'progressbar' }}
        onSwiper={(swiper) => setMainSwiper(swiper)}
        thumbs={{ swiper: thumbsSwiper }}
        speed={1500}
      >
        {transformedMatches.map((item) => (
          <SwiperSlide key={item.id}>
            <img className="h-100" src={item.cover} alt={item.id} />
          </SwiperSlide>
        ))}
      </Swiper>
      <div className={styles.thumbs}>
        <Swiper
          onSwiper={(swiper) => setThumbsSwiper(swiper)}
          watchSlidesProgress
          modules={[Autoplay]}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          speed={1500}
          {...thumbsParams}
        >
          {transformedMatches.map((item) => (
            <SwiperSlide className={styles.thumbs_slide} key={item.id}>
              <MatchScoreItem match={item} variant="thumb" />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </Spring>
  );
};

LiveMatches.propTypes = {
  variant: PropTypes.oneOf(['big', 'small']),
};

export default LiveMatches;