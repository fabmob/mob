// We export the toaster config
import toast from 'react-hot-toast';
import Strings from './locale/fr.json';

import { StatusCode } from './http';

const showToastrError = (err: any) => {
  let message = Strings['handle.error.message.main.retry'];

  if (
    err &&
    err.data &&
    err.data.error &&
    err.data.error.statusCode &&
    err.data.error.resourceName
  ) {
    const { resourceName } = err.data.error;
    switch (err.data.error.statusCode) {
      case StatusCode.PreconditionFailed:
        if (resourceName === 'Disaffiliation') {
          message = Strings['handle.error.message.afilliation'];
        } else if (resourceName === 'emailProfessionnel') {
          message = Strings['handle.error.message.profssional.mail'];
        } else if (resourceName === 'Subscription Attachments') {
          message = Strings['handle.error.message.justification.size'];
        } else if (resourceName === 'Type of subscription Attachments') {
          message = Strings['handle.error.message.justification.type'];
        } else {
          message = `${Strings['handle.error.message.justification.this']} ${resourceName} ${Strings['handle.error.message.justification.already.treated']}`;
        }
        break;

      case StatusCode.UnprocessableEntity:
        if (resourceName === 'Antivirus') {
          message = Strings['handle.error.message.justification.corrupt'];
        } else {
          // TODO set the appropriate message once we have it
          message = `${Strings['handle.error.message.justification.probleme.part1']} ${resourceName}${Strings['handle.error.message.justification.probleme.part2']}`;
        }
        break;

      case StatusCode.Conflict:
        // TODO set the appropriate message once we have it
        message = `${Strings['handle.error.message.justification.conflict.part1']} ${resourceName}${Strings['handle.error.message.justification.conflic.part2']}`;
        break;

      case StatusCode.NotFound:
        // TODO set the appropriate message once we have it
        if (resourceName === 'Incentive') {
          message = Strings['handle.error.message.aides.unavailable'];
        } else {
          message = `${Strings['handle.error.message.resource.unavailable.part1']} ${resourceName} ${Strings['handle.error.message.resource.unavailable.part2']}`;
        }
        break;

      default:
        break;
    }
  }

  toast.error(message);
};

export const handleError = (error: any = null, displayToastr = true): void => {
  if (displayToastr) {
    showToastrError(error);
  }
};
