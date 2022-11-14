import { getEntreprisesList, EntrepriseName } from '@api/EntrepriseService';
import { CompanyOption } from 'src/components/Form/SignUpForm';

const getEnterpriseName = (enterpriseId: string, companyOptions: object[]) => {
  return companyOptions.find((company) => enterpriseId === company.id)?.value;
};

const getMatomoData = async (setMatomoUrl: any) => {
  const response = await fetch('/analytics.json');
  const data: { url: string } = await response.json();
  if (Object.keys(data).length) {
    setMatomoUrl(data.url);
  }
};

const matomoPageTracker = (
  trackPageView: (customDimensions: any) => void,
  dataTrack: string,
  idCustomDimensions: number
) => {
  trackPageView({
    documentTitle: 'MoB - Pages tracking',
    customDimensions: [
      {
        id: idCustomDimensions,
        value: dataTrack,
      },
    ],
  });
};

// Event account creation in  SignUpForm/index.tsx
const matomoAccountCreation = (
  trackPageView: (customDimensions: any) => void,
  userData: {
    city: string;
    postcode: string;
    status: string;
    birthdate: string;
    affiliation: {
      enterpriseId: string;
      enterpriseEmail: string;
    };
  },
  companyOptions: object[]
): void => {
  const { city, postcode, status, birthdate, affiliation } = userData,
    companyName = getEnterpriseName(affiliation.enterpriseId, companyOptions),
    today = new Date(),
    birthDate = new Date(birthdate),
    citizenAge = today.getFullYear() - birthDate.getFullYear(),
    affiliationStatus =
      affiliation.enterpriseId && affiliation.enterpriseEmail ? 'Oui' : 'Non',
    pageViewData = `Ville : ${city}, Code Postal : ${postcode}, Age : ${citizenAge}, Statut Professionnel : ${status}, Entreprise : ${
      companyName || "Pas d'entreprise"
    }, Affiliation : ${affiliationStatus}`;
  // Get tracker page view function
  trackPageView({
    documentTitle: "MoB - Formulaire d'inscription",
    customDimensions: [
      {
        id: 1,
        value: pageViewData,
      },
    ],
  });
};

const matomoTrackEvent = async (
  trackerType: string,
  trackEvent: ({
    documentTitle: string,
    category: string,
    name: string,
    action: string,
  }) => void,
  params: string
) => {
  let company: CompanyOption[] = [];
  await getEntreprisesList<EntrepriseName[]>().then(
    (result: EntrepriseName[]) => {
      result.forEach((item) =>
        company.push({
          id: item.id,
          value: item.name,
          label: item.name,
          formats: item.emailFormat,
        })
      );
    },
    (error: any) => {}
  );
  const companyData = getEnterpriseName(params, company) ?? '';
  // Type of track available
  const trackerTypeLib: { [key: string]: { [key: string]: string } } = {
    // Event validate affiliation in Inscription.tsx
    inscription: {
      documentTitle: 'Inscription',
      category: 'Inscription',
      action: 'Inscription',
      name: `1- Inscription à Mob : ${params}`,
    },
    // Event delete citizen account in profile.tsx
    deleteCitizenAccount: {
      documentTitle: 'Suppression compte',
      category: 'Suppression compte',
      action: 'Suppression compte',
      name: `2- Suppression d'un compte citoyen au status : ${params}`,
    },
    // Event download personal data RGPD in profile.tsx
    downloadPersonalData: {
      documentTitle: 'Téléchargement RGPD',
      category: 'Téléchargement RGPD',
      action: 'Téléchargement RGPD',
      name: `3- Téléchargement des données personnelles de citoyen`,
    },
    // Event validate affiliation in InscriptionPageAffiliation.tsx
    validateAffiliation: {
      documentTitle: 'Affiliation',
      category: 'Affiliation',
      action: 'Affiliation',
      name: `4- Affiliation à l'entreprise ${companyData}`,
    },
    // Event disaffiliate in profile.tsx
    disaffiliateFromEnterprise: {
      documentTitle: 'Désaffiliation',
      category: 'Désaffiliation',
      action: 'Désaffiliation',
      name: `5- Désaffiliation de l'entreprise ${companyData}`,
    },
    // Event delete linked account in profile.tsx
    deleteLinkedAccount: {
      documentTitle: 'Suppression de liaison de compte',
      category: 'Suppression de liaison de compte',
      action: `Suppression liaison compte`,
      name: `6- Suppression de liaison de compte  : ${params}`,
    },
  };
  // Get tracker event function
  // set the tracker event with good type
  trackEvent({
    documentTitle: trackerTypeLib[trackerType].documentTitle,
    category: trackerTypeLib[trackerType].category,
    action: trackerTypeLib[trackerType].action,
    name: trackerTypeLib[trackerType].name,
  });
};

export {
  getMatomoData,
  matomoAccountCreation,
  matomoTrackEvent,
  matomoPageTracker,
};
