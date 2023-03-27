
import React, { FC } from 'react';
import SVG from '@components/SVG/SVG';
import Strings from '../../LoginFC/locale/fr.json';


interface Props{
  onToggle:() => void; 
   }



const FCCitizen: FC<Props> = ({onToggle}) => (
<div className="insert_content_container fc_insert_padding">
          <SVG icon="success" size={20} />
          <p className="FC_checked_message">
            {Strings['profile.certified.FC.identity.message']}
          </p>
          <button
            type="button"
            aria-label="close_button"
            onClick={onToggle}
          >
            <SVG icon="close" size={35} />
          </button>
        </div>
)

export default FCCitizen;
