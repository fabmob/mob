import * as React from 'react';
import { FC } from 'react';
import {
  Edit,
  EditProps,
  Record,
  useNotify,
  useRedirect,
  useRefresh,
} from 'react-admin';
import { errorFetching } from '../../utils/constant';
import AideForm from './AideEditForm';
import AidesMessages from '../../utils/Aide/fr.json';

const AideEdit: FC<EditProps> = (props) => {
  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onSuccess = ({ data }): void => {
    notify(
      AidesMessages['aides.edit.success'].replace('{aidTitle}', data.title),
      'success'
    );
    redirect('/aides');
    refresh();
  };

  const onFailure = ({ message }): void => {
    const result =
      message !== errorFetching.messageApi
        ? AidesMessages[message]
        : errorFetching.messageToDisplay;

    notify(result, 'error');
  };

  const transform = (data): Record => {
    if (!data.isMCMStaff) {
      return { ...data, specificFields: undefined };
    }
    return { ...data, subscriptionLink: data.subscriptionLink };
  };

  return (
    <Edit
      title={AidesMessages['aides.edit.title']}
      onFailure={onFailure}
      mutationMode="pessimistic"
      onSuccess={onSuccess}
      transform={transform}
      {...props}
    >
      <AideForm />
    </Edit>
  );
};

export default AideEdit;
