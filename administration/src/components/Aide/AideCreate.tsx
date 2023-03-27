/* eslint-disable */
import { FC } from 'react';
import {
  Create,
  CreateProps,
  SimpleForm,
  useCreateContext,
  useNotify,
  useRedirect,
  useRefresh,
  Record,
} from 'react-admin';

import AideCreateForm from './AideCreateForm';
import AidesMessages from '../../utils/Aide/fr.json';
import { errorFetching } from '../../utils/constant';
import { validateIncentiveForm, getFormData } from '../../utils/helpers';

const AideCreate: FC<CreateProps> = (props) => {
  const { save, record } = useCreateContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onSuccess = ({ data }) => {
    notify(
      AidesMessages['aides.create.success'].replace('{aidTitle}', data.title),
      'success'
    );
    redirect('/aides');
    refresh();
  };

  const onFailure = ({ message }) => {
    const result =
      message !== errorFetching.messageApi
        ? AidesMessages[message]
        : errorFetching.messageToDisplay;

    notify(result, 'error');
  };

  const transform = (data): Record => {
    delete data.emailDomainNames;
    delete data.hasManualAffiliation;

    if (data.eligibilityChecks && data.eligibilityChecks.length > 0) {
      return getFormData(data);
    }
    if (data.specificFields && !data.specificFields.length) {
      delete data.specificFields;
    }

    return { ...data };
  };

  return (
    <Create
      title={AidesMessages['aides.create.title']}
      {...props}
      onSuccess={onSuccess}
      onFailure={onFailure}
      transform={transform}
    >
      <SimpleForm validate={validateIncentiveForm}>
        <AideCreateForm save={save} record={record} />
      </SimpleForm>
    </Create>
  );
};

export default AideCreate;
