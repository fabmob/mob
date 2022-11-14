import React, { FC, useEffect, useState } from 'react';
import { PageProps, navigate } from 'gatsby';
import toast from 'react-hot-toast';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import * as yup from 'yup';

import Heading from '@components/Heading/Heading';
import Layout from '@components/Layout/Layout';
import Button from '@components/Button/Button';
import Stepper from '@components/Stepper/Stepper';
import InformationCard from '@components/InformationCard/InformationCard';
import List from '@components/List/List';

import { getAide } from '@api/AideService';
import {
  getMetadata,
  Metadata,
  postV1Subscription,
  postV1SubscriptionAttachments,
  postV1SubscriptionVerify,
  triggerSubscriptionMaasRedirect,
} from '@api/DemandeService';
import { getFunderCommunities } from '@api/FunderService';

import { Community } from '@utils/funders';
import { Incentive, SpecificFields } from '@utils/aides';
import { formatDate } from '@utils/helpers';

import SubscriptionSummary from './SubscriptionSummary/SubscriptionSummary';
import { CitizenCard } from '../request/components/CitizenCard/CitizenCard';
import FormStep from './FormStep';
import SendFileStep from './sendFIle/SendFileStep';
import { useUser } from '../../context';

import Strings from './locale/fr.json';

import './_process-subscription.scss';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import { matomoPageTracker } from '@utils/matomo';

interface Props {
  query: {
    incentiveId: string;
    metadataId?: string;
  };
  location?: PageProps['location'];
}

export interface User {
  birthdate: string;
  city: string;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  postcode: number;
  status: string;
}

const ProcessSubscription: FC<Props> = ({ query, location }) => {
  const { citizen } = useUser();
  const { trackPageView } = useMatomo();

  /**
   * stepper content
   */
  const stepperContent: string[] = [
    Strings['subscription.stepper.first.step'],
    Strings['subscription.stepper.second.step'],
    Strings['subscription.stepper.third.step'],
  ];

  const informationCardList: string[] = [
    Strings['subscription.information.card.list.first.element'],
    Strings['subscription.information.card.list.second.element'],
    Strings['subscription.information.card.list.third.element'],
    Strings['subscription.information.card.list.forth.element'],
  ];

  const [step, setStep] = useState(0);
  const [incentiveId] = useState<string>(query.incentiveId);
  const [metadataId] = useState<string | undefined>(query.metadataId);
  const [incentive, setIncentive] = useState<Incentive>();
  const [subscriptionId, setSubscriptionId] = useState<string>();
  const [attachmentMetadata, setAttachmentMetadata] =
    useState<{ fileName: string }[]>();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [incentiveSpecificFields, setIncentiveSpecificFields] = useState<
    object[]
  >([]);
  const [attachment, setAttachment] = useState<
    { path: string; name: string }[]
  >([]);
  const [summarySpecificFields, setSummarySpecificFields] = useState<{
    [key: string]: string | string[];
  }>({});

  const [btnLabel, setBtnLabel] = useState<string>(
    Strings['subscription.next']
  );
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [birthdateErrors, setBirthDateErrors] = useState<boolean>(false);

  /**
   * Create an object for yup control
   * @returns object
   */
  const yupShape = () => {
    let result = {};
    if (incentive) {
      incentiveSpecificFields?.forEach((element: SpecificFields) => {
        if (element.inputFormat === 'Date') {
          result = {
            ...result,
            [element.name]: yup
              .string()
              .required(Strings['subscription.error.required'])
              .nullable(),
          };
        } else if (element.inputFormat === 'Numerique') {
          result = {
            ...result,
            [element.name]: yup
              .string()
              .required(Strings['subscription.error.required'])
              .matches(/^[0-9]/, Strings['subscription.error.number']),
          };
        } else if (element.inputFormat === 'listeChoix') {
          result = {
            ...result,
            [element.name]: yup
              .array()
              .test(
                'Required listeChoix',
                Strings['subscription.error.required'],
                (value) => value && value?.length > 0
              ),
          };
        } else {
          result = {
            ...result,
            [element.name]: yup
              .string()
              .required(Strings['subscription.error.required']),
          };
        }
      });
      return {
        ...result,
        community: yup
          .string()
          .test(
            'Required Community',
            Strings['subscription.error.required'],
            (value) => (value ? true : communities?.length <= 1)
          ),
        consent: yup
          .bool()
          .oneOf([true], Strings['citizens.error.consent.false']),
      };
    }
  };

  const schema = yup.object().shape({
    ...yupShape(),
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm<object>({
    criteriaMode: 'all',
    resolver: yupResolver(schema),
  });

  /**
   * get incentive's funder communities
   * @param funderId incentive funder's id
   */
  const getCommunities = async (funderId: string) => {
    const communitiesData = await getFunderCommunities(funderId);
    setCommunities([...communitiesData]);
  };

  /**
   * Get incentive data by id
   */
  const getIncentiveResponse = async () => {
    try {
      const result: Incentive = await getAide(incentiveId);
      setIncentive(result);
    } catch {
      navigate('/');
    }
  };

  /**
   * Call service getIncentive by id
   */
  useEffect(() => {
    if (incentiveId) {
      getIncentiveResponse();
    } else {
      navigate('/');
    }
  }, [incentiveId]);

  useEffect(() => {
    if (incentive) {
      const temp = (incentive?.specificFields || []).map(
        (elm: SpecificFields) => ({
          ...elm,
          name: elm.title
            .replace(/(?!\w|\s)./g, '')
            .replace(/\s/g, '')
            .toLowerCase(),
        })
      );
      const newTemps: object[] = [...temp];
      setIncentiveSpecificFields(newTemps);
    }
  }, [incentive]);

  /**
   * get incentive funder communities
   */
  useEffect(() => {
    if (incentive?.funderId) {
      getCommunities(incentive?.funderId);
    }
  }, [incentive]);

  /**
   * get metadata by id
   */
  const getMetaDataResponse = async () => {
    try {
      const result: Metadata = await getMetadata(metadataId);
      setAttachmentMetadata(result.attachmentMetadata);
    } catch (error) {
      navigate('/');
    }
  };
  /**
   * Get meta data by id
   */
  useEffect(() => {
    if (metadataId) {
      getMetaDataResponse();
    }
  }, [metadataId]);

  /**
   * handle the subscription to an incentive
   * @param formData subscription form data
   */
  const onSubmit = (formData: {
    [key: string]: string | string[];
  }): Promise<void> => {
    if (step === 0 && !birthdateErrors) {
      let selectedCommunityId;
      if (formData?.community) {
        selectedCommunityId = communities?.filter(
          (comm) => comm.name === formData?.community
        )?.[0].id;
      } else if (communities.length === 1) {
        selectedCommunityId = communities?.[0].id;
      }

      let formatData = {};
      incentiveSpecificFields.forEach((element: object) => {
        if (element.inputFormat === 'listeChoix') {
          const values = formData[element.name].map((el: object) => el.value);
          formatData = { ...formatData, [element.title]: [...values] };
        } else if (element.inputFormat === 'Date') {
          const dateValue = formatDate(formData[element.name]);
          formatData = {
            ...formatData,
            [element.title]: format(new Date(dateValue), 'yyyy-MM-dd'),
          };
        } else if (element.inputFormat === 'Numerique') {
          formatData = {
            ...formatData,
            [element.title]: parseInt(formData[element.name]),
          };
        } else {
          formatData = {
            ...formatData,
            [element.title]: formData[element.name],
          };
        }
      });

      const formatedData = {
        ...formatData,
        incentiveId: incentive?.id,
        communityId: selectedCommunityId,
        consent: true,
      };

      if (!selectedCommunityId) {
        delete formatedData.communityId;
      }

      postV1Subscription({
        ...formatedData,
      }).then((result: { id: string }) => {
        setSubscriptionId(result?.id);
        setStep(1);
        {
          incentive?.attachments
            ? setBtnLabel(Strings['subscription.send.justif'])
            : setBtnLabel(Strings['subscription.next']);
        }
      });
    }
  };

  const getDateErrors = (dateErrors: boolean) => {
    setBirthDateErrors(dateErrors);
  };

  /**
   * Handle steps and associated api calls
   * @param step SUBSCRIPTION_STEP
   */
  const handleStep = (nextStep: number) => {
    window.scrollTo(0, 0);
    if (nextStep === 1) {
      const executeHandleSubmit = handleSubmit(
        (formData: { [key: string]: string | string[] }) => {
          setSummarySpecificFields(formData);
          onSubmit(formData);
        }
      );
      executeHandleSubmit();
    }
    if (nextStep === 2) {
      if (metadataId || attachment.length) {
        setIsDisabled(true);
        const formData = new FormData();
        metadataId &&
          formData.append('data', JSON.stringify({ metadataId: metadataId }));
        attachment.forEach((element) => {
          formData.append('files', element);
        });
        postV1SubscriptionAttachments(subscriptionId, formData)
          .then(() => {
            toast.success(Strings['subscription.justif.success.message']);
            setBtnLabel(Strings['subscription.next']);
          })
          .then(() => {
            setStep(2);
            setIsDisabled(false);
          })
          .catch((err: any) => {
            setIsDisabled(false);
          });

      } else {
        setStep(2);
        setBtnLabel(Strings['subscription.next']);
      }
    }
    if (nextStep === 3) {
      postV1SubscriptionVerify(subscriptionId).then(() => {
        navigate('/mon-dashboard/', { replace: true });
        triggerSubscriptionMaasRedirect();
        matomoPageTracker(
          trackPageView,
          `Souscription à l'aide ${incentive?.title}`,
          3
        );
        toast.success(
          ` ${Strings['process.subscription.toast.success.verify.part1']} ${incentive?.title}  ${Strings['process.subscription.toast.success.verify.part2']}`,
          { duration: 5000 }
        );
      });
    }
  };

  const breadCrumb = [
    {
      pathname: '/',
      crumbLabel: Strings['subscription.breadcrumb.first.part'],
    },
    {
      pathname: `/aide-page/?id=${incentive?.id}`,
      crumbLabel: Strings['subscription.breadcrumb.second.part'],
    },
    {
      pathname: '#',
      crumbLabel: Strings['subscription.breadcrumb.third.part'],
    },
  ];

  return (
    <>
      {incentive ? (
        <Layout
          footer={{
            imageFilename: 'man-riding-bike.jpg',
            isVisibleOnMobile: true,
          }}
          pageTitle={Strings['subscription.title']}
        >
          {location && <Breadcrumb crumbs={breadCrumb} crumbSeparator=" > " />}

          <div className="mcm-subscription">
            <div className="mcm-subscription__main">
              <section className="page-container">
                <div className="request-body o-bg-wrapper">
                  <Heading level="h1" className="">
                    {Strings['subscription.title']}
                  </Heading>
                </div>
              </section>
              <div>
                <Heading level="h2" className="">
                  {incentive?.title}
                </Heading>
                <Heading level="h3" className="">
                  {`${Strings['subscription.funder']} : ${incentive?.funderName}`}
                </Heading>
              </div>
              <Stepper contents={stepperContent} activeStep={step} />

              {step === 0 && (
                <>
                  <FormStep
                    communities={communities}
                    incentiveSpecificFields={incentiveSpecificFields}
                    register={register}
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    getDateErrors={getDateErrors}
                  />
                </>
              )}
              {step === 1 && (
                <>
                  <SendFileStep
                    attachmentMetadata={attachmentMetadata}
                    attachments={incentive?.attachments}
                    getAttachment={setAttachment}
                  />
                </>
              )}
              {step === 2 && (
                <>
                  <SubscriptionSummary
                    incentiveSpecificFields={incentiveSpecificFields}
                    specificFields={summarySpecificFields}
                    attachmentMetadata={attachmentMetadata}
                    importedFiles={attachment}
                  ></SubscriptionSummary>
                </>
              )}
            </div>
            <div className="mcm-subscription__sidebar">
              {citizen && step !== 1 && (
                <>
                  <CitizenCard
                    identity={{
                      ...citizen,
                      isCitizenDeleted: false,
                      firstName: citizen.identity.firstName.value,
                      lastName: citizen.identity.lastName.value,
                      birthdate: citizen.identity.birthDate.value,
                    }}
                    showSummary={false}
                  />
                  <div className="profil-info">
                    <span>{`${Strings['subscription.profil.info']}`}</span>
                  </div>
                </>
              )}
              {step === 1 && (
                <InformationCard
                  title={Strings['subscription.information.card.title']}
                  withBorder
                >
                  <div>
                    <p className="additional-info__body">
                      {Strings['subscription.information.card.body']}
                    </p>
                    <div className="card_list">
                      <List items={informationCardList} />
                    </div>
                  </div>
                  <div className="card_info">
                    <Heading level="p">
                      {Strings['subscription.information.card.info']}
                    </Heading>
                  </div>
                </InformationCard>
              )}
            </div>
            <div className="mt-m">
              <Button
                primary
                onClick={() => handleStep(step + 1)}
                disabled={isDisabled}
              >
                {btnLabel}
              </Button>
              <span className="required">{`${Strings['subscription.required']}`}</span>
            </div>
          </div>
        </Layout>
      ) : null}
    </>
  );
};

export default ProcessSubscription;
