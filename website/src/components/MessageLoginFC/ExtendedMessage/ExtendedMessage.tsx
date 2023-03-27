import React, { FC } from 'react';
import SVG from '@components/SVG/SVG';
import Strings from '../../../components/LoginFC/locale/fr.json';
import { useSession } from '../../../context';

interface Props{
  redirectionURL:string;
  contentText:ContentTextObject; 
  onToggle:() => void;
}


const ExtendedMessage: FC<Props> = ({onToggle, redirectionURL,contentText}) => {
  const { keycloak } = useSession();
return (
 
    <div className={`insert_content_container responsive_content`}>  
        <div>
        <p className="responsive_align">{contentText.extendedQuestion}</p>
        <p className="responsive_align">{contentText.extendedMessage1}</p>
        <p className="responsive_align">{contentText.extendedMessage2}</p>
      </div>
      <div className="fc_buttons_container">
        <button
          type="button"
          aria-label="fc_link"
          className="franceconnect_link"
          onClick={() => {
            keycloak?.logout({
              redirectUri: redirectionURL,
            });
          }}
        ></button>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://franceconnect.gouv.fr"
        >
          {Strings['what.is.fc']}
        </a>
      </div>
      <button
        type="button"
        aria-label="arrow_btn"
        className="arrow_button_up"
        onClick={onToggle}
      >
        <SVG icon="arrow-up" size={50} />
      </button>
    </div>
    )}

export default ExtendedMessage;