import React, { FC, useState } from 'react';

import { redirectionURL } from '@utils/loginFC';
import './_LoginFC.scss';


import { useUser } from '../../context';
import ExtendedMessage from '../MessageLoginFC/ExtendedMessage/ExtendedMessage';
import FCCitizen from '../MessageLoginFC/FCCitizenMessage/FCCitizenMessage';
import NotExtendedMessages from '../MessageLoginFC/NotExtendedMessages/NotExtendedMessages';


export interface ContentTextObject {
  notExtendedMessage: string;
  extendedQuestion: string;
  extendedMessage1: string;
  extendedMessage2: string;
}

interface InsertProps {
  isFCCitizen: boolean;
  contentText:ContentTextObject;

}


const LoginFC: FC<InsertProps> = ({ isFCCitizen,contentText }) => {

  const { isInsertOpen, closeInsertFC } = useUser();

  const [isExtended, setIsExtended] = useState<boolean>(false);


  return isInsertOpen ? (
    <div className="insert_container">
      {isFCCitizen ? (
        <FCCitizen 
        onToggle={() => closeInsertFC()}
         />
      ) : isExtended ? (
        <ExtendedMessage
        onToggle={() => setIsExtended(!isExtended)}        
        redirectionURL={redirectionURL}    
        contentText={contentText}
        />
        
      ) : (
        <NotExtendedMessages
        onToggle={() => setIsExtended(!isExtended)}
        contentText={contentText}
         />
      )}
    </div>
  ) : null;
};

export default LoginFC;



