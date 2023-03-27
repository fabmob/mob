
import React, { FC } from 'react';
import SVG from '@components/SVG/SVG';
import { ContentTextObject } from 'src/components/LoginFC/LoginFC';


interface Props{   
    contentText:ContentTextObject;
    onToggle:() => void; 
  }

const NotExtendedMessages: FC<Props> = ({onToggle,contentText}) =>{ 
  return (
<div className="insert_content_container">
          <p>{contentText.notExtendedMessage}</p>
          <button
            type="button"
            aria-label="arrow_btn"
            className="arrow_button_down"
            onClick={ onToggle}
          >
            <SVG icon="arrow-down" size={50} />
          </button>
        </div>
)}

export default NotExtendedMessages;
