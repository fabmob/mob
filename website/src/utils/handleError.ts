// We export the toaster config
import toast from 'react-hot-toast';

import { StatusCode } from './https';

import Strings from './locale/fr.json';

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
      case StatusCode.BadRequest:
        if (resourceName === 'Subscription Attachments') {
          message = Strings['handle.error.message.justification.size'];
        } else {
          message = Strings['handle.error.message.main.justification.badRequest'];
        }
        break;
      case StatusCode.NotFound:
        // TODO set the appropriate message once we have it
        if (resourceName === 'Incentive') {
          message = Strings['handle.error.message.aides.unavailable'];
        } else {
          message = `${Strings['handle.error.message.resource.unavailable.part1']} ${resourceName} ${Strings['handle.error.message.resource.unavailable.part2']}`;
        }
        break;
      case StatusCode.Conflict:
        if (resourceName === 'Affiliation Already Treated') {
          message = Strings['handle.error.message.treated.affiliation'];
        } else {
          // TODO set the appropriate message once we have it
          message = `${Strings['handle.error.message.justification.conflict.part1']} ${resourceName}${Strings['handle.error.message.justification.conflict.part2']}`;
        }
        break;
      case StatusCode.UnsupportedMediaType:
        if (resourceName === 'Type of subscription Attachments') {
          message = Strings['handle.error.message.justification.type'];
        } else {
          message = `${Strings['handle.error.message.justification.unsupportedMediaType']}`;
        }
        break;
      case StatusCode.UnprocessableEntity:
        if (resourceName === 'Disaffiliation') {
          message = Strings['handle.error.message.afilliation'];
        } else if (resourceName === 'Antivirus') {
          message = Strings['handle.error.message.justification.corrupt'];
        } else if (resourceName === 'Encryption Key') {
          message = Strings['handle.error.message.encryptionKey'];
        } else {
          // TODO set the appropriate message once we have it
          message = `${Strings['handle.error.message.justification.probleme.part1']} ${resourceName}${Strings['handle.error.message.justification.probleme.part2']}`;
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
