import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';

import Button from '../Button/Button';

import defaultPoster from '../../assets/images/image-video.png';
import play from '../../assets/svg/play-green.svg';
import classNames from 'classnames';
import Strings from './locale/fr.json';

import './_video-player.scss';

export interface VideoProps {
  children?: React.ReactNode;
  homePage?: boolean;
  url: string /** url of video */;
  poster?: string /** poster before displaying the video */;
}

const VideoPlayer: React.FC<VideoProps> = ({
  children,
  homePage = false,
  url,
  poster = defaultPoster,
}) => {
  const [start, setStart] = useState(false);

  const image = useRef<ReactPlayer>(null);

  const CSSClass = classNames('mcm-video', {
    'mcm-video--play': start,
  });

  const playVideo = () => {
    setStart(true);
  };

  const endVideo = () => {
    if (image.current) {
      setStart(false);
      image.current.showPreview();
    }
  };

  /**
   * If the video url changes, end up the player
   **/
  useEffect(() => {
    if (start) {
      endVideo();
    }
  }, [url]);

  return (
    <div className={CSSClass}>
      <ReactPlayer
        id="video"
        config={{ file: { attributes: { controlsList: 'nodownload' } } }}
        onContextMenu={(e: Event) => e.preventDefault()}
        url={url}
        width="100%"
        height="100%"
        playing={start}
        controls
        playIcon={<></>}
        ref={image}
        light={!start && poster}
        onEnded={endVideo}
      />
      <div className="mcm-hero__actions">
        <div className="mcm-container__main">
          {homePage ? (
            <div className="diplay">
              {children}
              <Button
                classnames="display__item"
                secondary
                inverted
                icon="play"
                onClick={() => playVideo()}
              >
                {Strings['play.video']}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              data-testid="button"
              onClick={() => playVideo()}
            >
              <img src={play} alt="" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default VideoPlayer;
