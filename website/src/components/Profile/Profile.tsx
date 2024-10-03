import React, { FC, useState, useEffect } from 'react';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';
import { useMutation } from 'react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import FileSaver from 'file-saver';
import { useMatomo } from '@datapunt/matomo-tracker-react';

import Layout from '@components/Layout/Layout';
import ScrollTopButton from '@components/ScrollTopButton/ScrollTopButton';
import Table from '@components/Table/Table';
import TextField from '@components/TextField/TextField';
import Button from '@components/Button/Button';
import LoginFC from '@components/LoginFC/LoginFC';
import TooltipInfoIcon from '@components/TooltipInfoIcon/TooltipInfoIcon';
import ProfessionalForm from '@components/Form/ProfessionalForm/ProfessionalForm';
import SelectField from '@components/SelectField/SelectField';
import ModalComponent, { ParamsModal } from '@components/Modal/Modal';
import SVG from '@components/SVG/SVG';

import {
  getConsentsById,
  deleteConsent,
  updateCitizenById,
  downloadRgpdFileXlsx,
  deleteCitizenAccount,
} from '@api/CitizenService';
import { UserFunder, getUserFunderCommunities } from '@api/UserFunderService';
import { getFunders } from '@api/FunderService';

import { computeServerErrorsV2 } from '@utils/form';
import { Action, InputFormat } from '@utils/table';
import { formattedDateFile, firstCharUpper } from '@utils/helpers';
import { useGetFunder, useFromFranceConnect } from '@utils/keycloakUtils';
import {
  Citizen,
  Consent,
  AFFILIATION_STATUS,
  CitizenUpdate,
  CmsType,
} from '@utils/citoyens';
import {
  Funder,
  FUNDER_TYPE,
  isManager,
  isSupervisor,
  Community,
} from '@utils/funders';
import { UrlFc, URL_LOGOUT_FC, CertificationSource } from '@constants';
import { useSession, useUser } from '../../context';
import Strings from './locale/fr.json';
import schema from './schema';
import UserFunderProfile from './UserFunderProfile';
import { environment } from '@environment';
import { matomoPageTracker, matomoTrackEvent } from '@utils/matomo';

import './_profile.scss';

export interface User {
  gender: string;
  birthdate: string;
  city: string;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  postcode: number;
  status: string;
  enterpriseEmail: string | null;
  enterpriseEmailValue: string;
  enterpriseId: string | null;
  funderName: string;
  statusPhrase: string;
  affiliationStatusPhrase: string;
  roles: string[];
  rolesPhrase: string;
  communitiesPhrase: string;
  consents?: Consent[];
  affiliation: {
    id: string;
    citizenId: string;
    enterpriseId: string;
    enterpriseEmail: string;
    status: AFFILIATION_STATUS;
    companyNotFound: boolean;
    hasNoEnterpriseEmail: boolean;
  };
  identity: {
    gender: CmsType;
    lastName: CmsType;
    firstName: CmsType;
    birthDate: CmsType;
  };
}

interface CompanyOption {
  id: string;
  label: string;
  value: string;
}

interface ProfileProps {
  crumbs?: string;
}

interface EditProfileFormInput {
  city: string;
  postcode: number | string;
  status: string;
  funderName: string;
  statusPhrase: string;
  affiliationStatusPhrase: string;
  affiliation: {
    citizenId: string;
    enterpriseId: string | null | undefined;
    enterpriseEmail: string | null;
    companyNotFound: boolean;
    hasNoEnterpriseEmail: boolean;
    status?: AFFILIATION_STATUS;
  };
}

enum UserStatus {
  salarie = `Salarié`,
  etudiant = 'Étudiant',
  independantLiberal = 'Indépendant / Profession libérale',
  retraite = 'Retraité',
  sansEmploi = 'Sans emploi',
}

enum UserAffiliationStatus {
  A_AFFILIER = 'Affiliation non validée - Veuillez confirmer votre mail professionnel grâce au lien reçu.',
  AFFILIE = 'Affiliation validée',
  DESAFFILIE = 'Affiliation supprimée',
}

const ProfileContainer: React.FC<{
  isEditing: boolean;
  onSubmit: () => void;
}> = ({ isEditing, children, onSubmit }) => {
  return isEditing ? (
    <div className="mcm-mon-profil">
      <form id="edit-profile-form" onSubmit={onSubmit}>
        {children}
      </form>
    </div>
  ) : (
    <div className="mcm-mon-profil o-bg-wrapper mb-l">{children}</div>
  );
};

const Profile: FC<ProfileProps> = ({ crumbs }) => {
  const { keycloak } = useSession();
  const { citizen, userFunder, refetchCitizen } = useUser();
  const { trackEvent, trackPageView } = useMatomo();
  const { funderName } = useGetFunder();
  let isFromFranceConnect = useFromFranceConnect();

  const [userData, setUserData] = useState<User | undefined>(undefined);
  const [profileFormData, setProfileFormData] = useState<CitizenUpdate | null>(
    null
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [isShowModal, setShowModal] = useState<boolean>(false);
  const [modalParams, setModalParams] = useState<ParamsModal>({});
  const [consentClientId, setConsentClientId] = useState<string>('');

  const {
    register,
    setError,
    setValue,
    watch,
    control,
    reset,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EditProfileFormInput>({
    criteriaMode: 'all',
    resolver: yupResolver(schema),
    context: { companyOptions },
    defaultValues: {
      city: '',
      postcode: '',
      status: '',
      affiliation: {
        enterpriseId: '',
        companyNotFound: false,
        enterpriseEmail: '',
        hasNoEnterpriseEmail: false,
      },
    },
  });
  //source verification for franceconnect

  if (userData?.identity?.birthDate?.source === CertificationSource.FC) {
    isFromFranceConnect = true;
  }

  let enterpriseTipPhrase: string | null = null;
  if (userData?.affiliation?.status === AFFILIATION_STATUS.TO_AFFILIATE)
    enterpriseTipPhrase = Strings['profile.affiliation.to.affiliate.tip.text'];

  if (userData?.affiliation?.status === AFFILIATION_STATUS.AFFILIATED)
    enterpriseTipPhrase = Strings['profile.affiliation.affiliated.tip.text'];

  if (userData?.affiliation?.status === AFFILIATION_STATUS.DISAFFILIATED)
    enterpriseTipPhrase = Strings[
      'profile.affiliation.disaffiliated.tip.text'
    ].replace('{0}', userData.funderName);

  if (
    userData?.affiliation?.status === AFFILIATION_STATUS.UNKNOWN ||
    !userData?.affiliation
  )
    enterpriseTipPhrase = Strings['profile.affiliation.unknown.tip.text'];

  // handle the affiliation email request
  const resendAffiliationEmail = useMutation(
    (citizenData: object) => {
      return updateCitizenById(citizen?.id, citizenData);
    },
    {
      onSuccess: (data: any) => {
        if (data && data.error && data.error.message) {
          computeServerErrorsV2(data.error, setError, Strings);
        } else {
          toast.success(
            Strings['email.resend.affiliation.notification.success']
          );
        }
      },
      onError: (error: any) => {
        const { data } = error;
        if (data.error && data.error.details) {
          computeServerErrorsV2(data.error.details, setError, Strings);
        }
        computeServerErrorsV2(data.error, setError, Strings);
      },
    }
  );

  const actionList: Action = [
    {
      label: Strings['profile.form.update.button'],
      type: 'button',
      callback: () => {
        setIsEditing(true);
      },
    },
    {
      label: Strings['profile.form.resend.affiliation.button'],
      type: 'button',
      callback: () => {
        const data = {
          city: userData?.city,
          postcode: userData?.postcode,
          status: userData?.status,
          affiliation: {
            id: userData?.affiliation.id,
            citizenId: userData?.id,
            enterpriseId: userData?.affiliation?.enterpriseId,
            enterpriseEmail: userData?.affiliation?.enterpriseEmail,
            status: AFFILIATION_STATUS.TO_AFFILIATE,
          },
        };

        resendAffiliationEmail.mutate(data);
      },
    },
  ];

  const statusOptions = [
    { value: 'salarie', label: Strings['profile.status.employee'] },
    { value: 'etudiant', label: Strings['profile.status.student'] },
    { value: 'independantLiberal', label: Strings['profile.status.liberal'] },
    { value: 'retraite', label: Strings['profile.status.retiree'] },
    { value: 'sansEmploi', label: Strings['profile.status.unemployed'] },
  ];

  const identityList: InputFormat = [
    {
      label: Strings['profile.label.gender'],
      json: 'gender',
      type: 'text',
    },
    { label: Strings['profile.label.name'], json: 'lastName', type: 'text' },
    {
      label: Strings['profile.label.lastName'],
      json: 'firstName',
      type: 'text',
    },
    {
      label: Strings['profile.label.birthDate'],
      json: 'birthdate',
      type: 'date',
    },
    { label: Strings['profile.label.family.status'], json: '', type: 'text' },
    {
      label: Strings['profile.citizen.label.email'],
      json: 'email',
      type: 'text',
    },
  ];

  const addressList: InputFormat = [
    {
      label: Strings['profile.label.city'],
      json: 'city',
      type: 'text',
      actionList,
      actionId: 0,
    },
    {
      label: Strings['profile.label.postCode'],
      json: 'postcode',
      type: 'text',
      actionList,
      actionId: 0,
    },
  ];

  const proActivityList: InputFormat = [
    {
      label: Strings['profile.label.pro.status1'],
      json: 'statusPhrase',
      type: 'text',
      actionList,
      actionId: 0,
    },
  ];

  const companyActivityList: InputFormat = [
    {
      label: Strings['profile.label.enterprise'],
      json: 'funderName',
      type: 'text',
      actionList,
      actionId: 0,
    },
    {
      label: Strings['profile.label.pro.email'],
      json: 'enterpriseEmailValue',
      type: 'text',
      actionList,
      actionId: 0,
    },
    {
      label: Strings['profile.label.affiliation.status'],
      json: 'affiliationStatusPhrase',
      type: 'text',
      actionList:
        userData?.affiliation?.status === AFFILIATION_STATUS.TO_AFFILIATE &&
        userData?.affiliation?.enterpriseEmail
          ? actionList
          : null,
      actionId: 1,
    },
  ];

  const sanitizeCitizenData = async (saniCitizen: Citizen) => {
    let sanitizedCitizenData: User = { ...saniCitizen };
    const consentsData = await getConsentsById(saniCitizen.id);
    const enterpriseList = await getFunders<Funder[]>([FUNDER_TYPE.ENTERPRISE]);
    const company: Funder = enterpriseList.find(
      (item: { id: string }) =>
        item.id === saniCitizen.affiliation?.enterpriseId
    );
    setCompanyOptions(
      enterpriseList.map((enterprise: Funder) => {
        if (enterprise.id === saniCitizen.affiliation?.enterpriseId) {
          company.name = enterprise.name;
        }
        return {
          id: enterprise.id,
          label: enterprise.name,
          value: enterprise.name,
        };
      })
    );
    sanitizedCitizenData.gender = firstCharUpper(
      sanitizedCitizenData.identity.gender.value === 2
        ? Strings['profile.label.gender.female']
        : Strings['profile.label.gender.male']
    );
    sanitizedCitizenData.lastName = firstCharUpper(
      sanitizedCitizenData.identity.lastName.value
    );
    sanitizedCitizenData.firstName = firstCharUpper(
      sanitizedCitizenData.identity.firstName.value
    );
    sanitizedCitizenData.birthdate =
      sanitizedCitizenData.identity.birthDate.value;
    sanitizedCitizenData.email = saniCitizen.personalInformation.email.value;
    sanitizedCitizenData.city = sanitizedCitizenData.city || '-';
    sanitizedCitizenData.postcode = sanitizedCitizenData.postcode || '-';
    sanitizedCitizenData.statusPhrase = sanitizedCitizenData.status
      ? UserStatus[saniCitizen.status as keyof typeof UserStatus]
      : '-';
    sanitizedCitizenData.funderName = company?.name || '-';
    sanitizedCitizenData.enterpriseEmailValue =
      saniCitizen.affiliation?.enterpriseEmail || '-';
    sanitizedCitizenData.affiliationStatusPhrase =
      saniCitizen.affiliation?.status === 'A_AFFILIER' ? (
        saniCitizen.affiliation?.enterpriseEmail ? (
          <>
            {UserAffiliationStatus.A_AFFILIER}
            <div className="profile-icon statut-icon">
              <TooltipInfoIcon
                tooltipContent={Strings['profile.tooltip.refresh.page']}
                iconName="information"
                iconSize={20}
              />
            </div>
          </>
        ) : (
          Strings['profile.phrase.not.affiliated.waiting']
        )
      ) : (
        UserAffiliationStatus[
          saniCitizen.affiliation?.status as keyof typeof UserAffiliationStatus
        ] || Strings['profile.phrase.not.affiliated']
      );

    sanitizedCitizenData.consents = consentsData;
    setUserData(sanitizedCitizenData);
  };

  const sanitizeUserFunderData = async (saniUserFunder: UserFunder) => {
    const { communityIds } = saniUserFunder;
    let sanitizedUserFunderData: User = { ...saniUserFunder };
    sanitizedUserFunderData.funderName = funderName || '-';
    const userFunderRoles = [];

    isSupervisor(saniUserFunder) &&
      userFunderRoles.push(Strings['profile.supervisor.role.text']);
    isManager(saniUserFunder) &&
      userFunderRoles.push(Strings['profile.manager.role.text']);

    sanitizedUserFunderData.rolesPhrase = userFunderRoles.join(', ');

    if (communityIds) {
      const userFunderCommunities = await getUserFunderCommunities(
        saniUserFunder
      );
      sanitizedUserFunderData.communitiesPhrase = userFunderCommunities
        .map((community: Community) => {
          return community.name;
        })
        .join(', ');
    }
    setUserData(sanitizedUserFunderData);
  };

  /**
   * use the react query mutation tu handle the request state
   */
  const updateCitizenMutation = useMutation(
    (citizenData: CitizenUpdate) => {
      return updateCitizenById(citizen?.id, citizenData);
    },
    {
      onSuccess: (data: any) => {
        if (data && data.error && data.error.message) {
          computeServerErrorsV2(data.error, setError, Strings);
        } else {
          if (modalParams.id === 'affiliation') {
            matomoTrackEvent(
              'disaffiliateFromEnterprise',
              trackEvent,
              userData?.affiliation?.enterpriseId
            );
          }
          toast.success(Strings['update.notification.success']);
          refetchCitizen();
          sanitizeCitizenData({ ...citizen, ...profileFormData });
          setIsEditing(false);
          setProfileFormData(null);
          setModalParams({});
          setShowModal(false);
          reset();
        }
      },
      onError: (error: any) => {
        const { data } = error;
        if (data.error && data.error.details) {
          computeServerErrorsV2(data.error.details, setError, Strings);
        }
        computeServerErrorsV2(data.error, setError, Strings);
      },
    }
  );

  /**
   * handle the form submit action
   */
  const onSubmit = async (userFormData: CitizenUpdate): Promise<void> => {
    updateCitizenMutation.mutate(userFormData);
    setProfileFormData(null);
  };

  /**
   * pre-submit form through modal confirmation
   * @param formData the user from data
   */
  const preSubmitForm = (formData: EditProfileFormInput) => {
    if (isDirty) {
      const company = companyOptions.find(
        (item: { value: string }) =>
          item.value === formData.affiliation.enterpriseId
      );
      const updatedCitizen: CitizenUpdate = {
        ...formData,
        postcode: formData.postcode.toString(),
        affiliation: {
          id: userData!.affiliation?.id,
          citizenId: userData!.id,
          status: userData!.affiliation?.status || AFFILIATION_STATUS.UNKNOWN,
          enterpriseEmail: formData.affiliation.enterpriseEmail || '',
          enterpriseId: company?.id || '',
        },
      };
      const currentEnterprise = userData?.affiliation?.enterpriseId || '';
      const currentProEmail = userData?.affiliation?.enterpriseEmail || '';

      const hasEnterpriseIdChange =
        currentEnterprise !== updatedCitizen.affiliation.enterpriseId;
      const hasEnterpriseEmailChange =
        currentProEmail !== updatedCitizen.affiliation.enterpriseEmail;

      if (hasEnterpriseIdChange || hasEnterpriseEmailChange) {
        if (
          updatedCitizen.affiliation.enterpriseEmail !== '' &&
          updatedCitizen.affiliation.enterpriseId !== ''
        ) {
          if (
            updatedCitizen.affiliation.status === AFFILIATION_STATUS.UNKNOWN
          ) {
            updatedCitizen.affiliation.status = AFFILIATION_STATUS.TO_AFFILIATE;
            setProfileFormData(updatedCitizen);
            onSubmit(updatedCitizen);
          } else {
            updatedCitizen.affiliation.status = AFFILIATION_STATUS.TO_AFFILIATE;
            setProfileFormData(updatedCitizen);
            userData?.affiliation
              ? onSetModalParams('affiliation')
              : onSubmit(updatedCitizen);
          }
        } else {
          if (
            updatedCitizen.affiliation.status !== AFFILIATION_STATUS.UNKNOWN
          ) {
            updatedCitizen.affiliation.status = AFFILIATION_STATUS.UNKNOWN;
            setProfileFormData(updatedCitizen);
            userData?.affiliation
              ? onSetModalParams('affiliation')
              : onSubmit(updatedCitizen);
          } else {
            setProfileFormData(updatedCitizen);
            onSubmit(updatedCitizen);
          }
        }
      } else {
        setProfileFormData(updatedCitizen);
        onSubmit(updatedCitizen);
      }
    }
  };

  /**
   * handle the user data download file
   */
  const downlodRgpdFileXlsx = async () => {
    try {
      if (!citizen) {
        return;
      }
      // prepare file for download
      const file = await downloadRgpdFileXlsx(citizen.id);
      const blob = new Blob([file]);
      const today = new Date();
      const fileName = `MCM_Data_Export_${formattedDateFile(today)}.xlsx`;
      FileSaver.saveAs(blob, fileName);
      matomoTrackEvent('downloadPersonalData', trackEvent, userData?.id);
    } catch (err) {}
  };

  /**
   * MODAL
   *
   *
   *
   * handle Api call, its result (Close Modal and disconnect citizen) and error
   */
  const onValidateAccountDeletion = () => {
    deleteCitizenAccount(userData?.id)
      .then(() => {
        setShowModal(false);
        keycloak?.logout();

        // Disconnect from FranceConnect
        if (isFromFranceConnect) {
          const fcURL =
            environment.LANDSCAPE === 'production'
              ? new URL(`${UrlFc.URL_FC_PROD}${URL_LOGOUT_FC}`)
              : new URL(`${UrlFc.URL_FC_DEV}${URL_LOGOUT_FC}`);

          fcURL.searchParams.append(
            'id_token_hint',
            keycloak?.tokenParsed?.FEDERATED_ID_TOKEN
          );
          fcURL.searchParams.append(
            'post_logout_redirect_uri',
            `${window.location.origin}/mon-profil`
          );

          window.location.href = fcURL.href;
        }
      })
      .then(() => {
        matomoTrackEvent('deleteCitizenAccount', trackEvent, userData?.status);
        toast.success(Strings['citizen.deleteAccount.toaster']);
      })
      .catch((err: string) => {});
  };

  /**
   * call the delete consent service
   * @param clientId the id of the consented client
   *
   */
  const onValidateConsentDeletion = (clientId: string) => {
    deleteConsent(userData?.id, clientId)
      .then(() => {
        if (userData) {
          matomoTrackEvent('deleteLinkedAccount', trackEvent, consentClientId);
          const consentList =
            userData?.consents?.filter((object) => {
              return object.clientId !== clientId;
            }) || [];

          setUserData({
            ...userData,
            consents: consentList,
          });
        }
      })
      .catch((err: string) => err);
    setShowModal(false);
  };

  /**
   * affiliation modal params
   * delete account modal params
   */
  const modalAccountParams = {
    affiliation: {
      id: 'affiliation',
      title: Strings['profile.modal.disaffiliation.confirm.title'],
      submitBtn: {
        label: Strings['profile.modal.validate.button'],
        onClick: () => onSubmit(profileFormData),
      },
      cancelBtn: {
        label: Strings['profile.modal.cancel.button'],
        onClick: '',
      },
    },
    deleteAccount: {
      id: 'delete',
      title: Strings['citizen.deleteAccount.modal.title'],
      subtitle: Strings['citizen.deleteAccount.modal.subtitle'],
      submitBtn: {
        label: Strings['citizen.deleteAccount.modal.confirmDelete'],
        onClick: () => onValidateAccountDeletion(),
      },
      cancelBtn: {
        label: Strings['citizen.deleteAccount.modal.cancelBtn'],
        onClick: '',
      },
    },
    deleteConsent: {
      id: 'consent',
      title: Strings['citizen.deleteConsent.modal.title'],
      subtitle: Strings['citizen.deleteConsent.modal.subtitle'],
      submitBtn: {
        label: Strings['citizen.deleteAccount.modal.confirmDelete'],
        onClick: () => {
          onValidateConsentDeletion(consentClientId);
        },
      },
      cancelBtn: {
        label: Strings['citizen.deleteAccount.modal.cancelBtn'],
        onClick: '',
      },
    },
  };

  /**
   * set the modal params based on display mode (affiliation | delete)
   */
  const onSetModalParams = (modalMode: string) => {
    setModalParams(modalAccountParams[modalMode]);
    setShowModal(true);
  };

  /**
   * open the confirmation modal
   */
  const openModal = () => {
    onSetModalParams('deleteAccount');
  };

  /**
   * close the confirmation modal
   */
  const closeModal = () => {
    setShowModal(false);
  };

  /**
   * open the consentConfirmation modal
   */
  const openConsentModal = () => {
    onSetModalParams('deleteConsent');
  };

  useEffect(() => {
    matomoPageTracker(trackPageView, 'Mon profil', 2);
    return () => {};
  }, []);

  useEffect(() => {
    if (citizen) {
      sanitizeCitizenData(citizen);
    }
    if (userFunder) {
      sanitizeUserFunderData(userFunder);
    }
  }, []);
  /**
   * in edit mode spread the use data in the form fields
   */
  useEffect(() => {
    if (isEditing && userData) {
      /**
       * get the used status key name
       */
      const statusKeyName: string =
        Object.keys(UserStatus).find(
          (key) =>
            UserStatus[key as keyof typeof UserStatus] === userData.statusPhrase
        ) || '';

      /**
       * set the form values
       */
      setValue('city', userData.city !== '-' ? userData.city : '');
      setValue('postcode', userData.postcode !== '-' ? userData.postcode : '');
      setValue('status', statusKeyName);
      setValue(
        'affiliation.enterpriseId',
        userData.funderName === '-' ? '' : userData.funderName
      );
      setValue('affiliation.companyNotFound', userData.funderName === '-');
      setValue(
        'affiliation.enterpriseEmail',
        userData.enterpriseEmailValue === '-'
          ? ''
          : userData.affiliation.enterpriseEmail
      );
      setValue(
        'affiliation.hasNoEnterpriseEmail',
        userData?.enterpriseEmailValue === '-'
      );
    }
  }, [isEditing]);

  /**
   * reload the affiliation modal data when the modal param id changes
   */
  useEffect(() => {
    if (modalParams.id === 'affiliation') {
      onSetModalParams('affiliation');
    }
  }, [modalParams.id]);

  /**
   * use the updated value of the consentClientId hook state to delete Consent
   */
  useEffect(() => {
    setModalParams(modalAccountParams['deleteConsent']);
  }, [consentClientId]);

  /**
   * RENDER
   *
   *
   *
   *
   */
  return (
    <Layout
      footer={{
        imageFilename: 'man-riding-bike.jpg',
      }}
      className="profile-width"
      pageTitle={Strings['profile.my.profile']}
    >
      {userData && (
        <ModalComponent
          params={modalParams}
          isShowModal={isShowModal}
          closeModal={closeModal}
        >
          {modalParams.id === 'affiliation' ? (
            <p>
              {Strings['profile.modal.disaffiliation.confirm.text'].replace(
                '{0}',
                userData.funderName
              )}
            </p>
          ) : (
            <p>
              {modalParams.id === 'consent'
                ? Strings['citizen.deleteConsent.modal.body']
                : Strings['citizen.deleteAccount.modal.body']}
            </p>
          )}
        </ModalComponent>
      )}

      {crumbs && <Breadcrumb crumbs={crumbs} crumbSeparator=" > " />}

      {userData && (
        <ProfileContainer
          isEditing={isEditing}
          onSubmit={handleSubmit(preSubmitForm)}
        >
          <div className="profile-title-container">
            <h1 data-testid="profile-title">{Strings['profile.my.profile']}</h1>
          </div>
          {citizen && (
            <>
              <div className="profile-form-title-container">
                <h2>{Strings['profile.form.title.identity']}</h2>
                <div className="identity-container">
                  {isFromFranceConnect ? (
                    <SVG icon="identityChecked" size="30" />
                  ) : (
                    <SVG icon="identityUnchecked" size="30" />
                  )}
                </div>
              </div>
              <LoginFC
                isFCCitizen={isFromFranceConnect}
                contentText={{
                  notExtendedMessage:
                    Strings['profile.unextended.login.FC.message'],
                  extendedQuestion:
                    Strings['profile.Extended.login.FC.question'],
                  extendedMessage1:
                    Strings['profile.Extended.login.FC.message1'],
                  extendedMessage2:
                    Strings['profile.Extended.login.FC.message2'],
                }}
              />

              <Table inputFormatList={identityList} data={userData} />
              <h2>{Strings['profile.form.title.address']}</h2>
              {isEditing ? (
                <>
                  <div className="mcm-row-container">
                    <label htmlFor="city" className="mcm-row-label">
                      {Strings['profile.label.city']}
                    </label>
                    <TextField
                      id="city"
                      type="text"
                      {...register('city')}
                      errors={errors}
                      placeholder="Paris"
                      required
                      classnames="table-field-container"
                    />
                    <div className="mcm-edit-row-margin" />
                  </div>

                  <div className="mcm-row-container">
                    <label htmlFor="postcode" className="mcm-row-label">
                      {Strings['profile.label.postCode']}
                    </label>
                    <TextField
                      id="postcode"
                      type="text"
                      {...register('postcode')}
                      errors={errors}
                      placeholder="75000"
                      required
                      classnames="table-field-container"
                    />
                    <div className="mcm-edit-row-margin" />
                  </div>
                </>
              ) : (
                <Table inputFormatList={addressList} data={userData} />
              )}

              <h2>{Strings['profile.form.title.pro.activity']}</h2>
              {isEditing ? (
                <>
                  <div className="mcm-row-container">
                    <label htmlFor="status" className="mcm-row-label">
                      {Strings['profile.label.pro.status1']}
                    </label>
                    <SelectField
                      id="status"
                      label={Strings['profile.label.pro.status2']}
                      name="status"
                      options={statusOptions}
                      errors={errors}
                      control={control}
                      required
                    />
                    <div className="mcm-edit-row-margin" />
                  </div>
                </>
              ) : (
                <Table inputFormatList={proActivityList} data={userData} />
              )}

              <div className="horizontal">
                <h2>{Strings['profile.form.title.enterprise']}</h2>
                <div className="profile-icon">
                  <TooltipInfoIcon
                    iconName="information"
                    iconSize={20}
                    tooltipContent={enterpriseTipPhrase}
                  />
                </div>
              </div>
              {isEditing ? (
                <div className="mcm-profile-pro-form">
                  <div className="pro-form-content">
                    <ProfessionalForm
                      register={register}
                      control={control}
                      errors={errors}
                      companyOptions={companyOptions}
                      watch={watch}
                    />
                  </div>
                </div>
              ) : (
                <Table inputFormatList={companyActivityList} data={userData} />
              )}

              <div className="horizontal">
                <h2>{Strings['profile.form.title.linked.accounts']}</h2>
                <div className="profile-icon">
                  <TooltipInfoIcon
                    tooltipContent={Strings['profile.tooltip.linked.accounts']}
                    iconName="information"
                    iconSize={20}
                  />
                </div>
              </div>

              {userData.consents?.length ? (
                userData.consents?.map((consent: Consent) => (
                  <div key={userData.id} className="mcm-consent-row-container">
                    <p className="mcm-consent-row-label">{consent.name}</p>
                    <div className="actif">
                      <SVG
                        className="form-tooltip__icon"
                        size={20}
                        icon="success"
                      />
                      <div>{Strings['citizen.consent.actif']}</div>
                    </div>
                    <div className="mcm-consent-row-action">
                      <button
                        type="button"
                        onClick={() => {
                          setConsentClientId(consent.clientId);
                          openConsentModal();
                        }}
                      >
                        {Strings['citizen.delete.button']}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <p className="empty-consents">
                    {Strings['citizen.empty.consents']}
                  </p>
                  <p className="empty-consents">
                    {Strings['citizen.who.to.link.account']}
                  </p>
                </>
              )}

              <div className="mcm-download-rgpd">
                <a href="#" onClick={downlodRgpdFileXlsx}>
                  <SVG
                    icon="download-xlsx"
                    className="svg-download"
                    size={45}
                  />
                  <span>
                    {Strings['citizen.download.personal.informations']}
                  </span>
                </a>
              </div>

              <div
                aria-hidden="true"
                className="delete-account-button"
                onClick={openModal}
              >
                {Strings['citizen.deleteAccount.button']}
              </div>

              {isEditing && (
                <div className="btn-group">
                  <div>
                    <Button classnames="mb-m mt-m" disabled={!isDirty} submit>
                      {Strings['profile.form.submit.button']}
                    </Button>
                  </div>

                  <div>
                    <Button
                      secondary
                      classnames="mb-m mt-m"
                      onClick={() => {
                        setIsEditing(false);
                      }}
                    >
                      {Strings['profile.form.cancel.button']}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          {userFunder && <UserFunderProfile userFunder={userData} />}
        </ProfileContainer>
      )}
      <ScrollTopButton />
    </Layout>
  );
};

export default Profile;
