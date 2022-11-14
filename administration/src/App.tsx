/* eslint-disable */
import { Admin, Resource, resolveBrowserLocale } from 'react-admin';
import polyglotI18nProvider from 'ra-i18n-polyglot';
import frenchMessages from 'ra-language-french';
import { QueryClient, QueryClientProvider } from 'react-query';

import dataProvider from './api/provider/dataProvider';
import AuthProvider from './modules/Auth/authProvider';
import { KeycloakProviderInit } from './components/Keycloak/KeycloakProviderInit';
import LogoutButton from './components/LoginForm/LogoutButton';
import Dashboard from './components/Dashboard/Dashboard';
import AccessRole from './components/Access/AccessRole';
import EntrepriseForm from './components/Entreprises';
import CollectiviteForm from './components/Collectivites/CollectiviteForm';
import CollectiviteList from './components/Collectivites/CollectiviteList';
import CommunateForm from './components/Communautes';
import Aide from './components/Aide';
import UtilisateurForm from './components/utilisateurs';
import customTheme from './components/customTheme/customTheme';
import TerritoryForm from './components/Territories';

const queryClient = new QueryClient();

const messages = {
  fr: frenchMessages,
};

const i18nProvider = polyglotI18nProvider(
  (locale) => (messages[locale] ? messages[locale] : messages.fr),
  resolveBrowserLocale()
);

function App(): JSX.Element {
  return (
    <KeycloakProviderInit>
      <QueryClientProvider client={queryClient}>
        <AccessRole>
          <Admin
            dataProvider={dataProvider}
            authProvider={AuthProvider}
            dashboard={Dashboard}
            logoutButton={LogoutButton}
            i18nProvider={i18nProvider}
            theme={customTheme}
          >
            <Resource
              name="collectivites"
              options={{ label: 'Collectivités' }}
              list={CollectiviteList}
              create={CollectiviteForm}
            />
            <Resource
              name="entreprises"
              options={{ label: 'Entreprises' }}
              {...EntrepriseForm}
            />
            <Resource name="aides" options={{ label: 'Aides' }} {...Aide} />
            <Resource
              name="communautes"
              options={{ label: 'Communautés' }}
              {...CommunateForm}
            />
            <Resource
              name="utilisateurs"
              options={{ label: 'Utilisateurs financeur' }}
              {...UtilisateurForm}
            />
            <Resource
              name="territoires"
              options={{ label: 'Territoires' }}
              {...TerritoryForm}
            />
          </Admin>
        </AccessRole>
      </QueryClientProvider>
    </KeycloakProviderInit>
  );
}

export default App;
