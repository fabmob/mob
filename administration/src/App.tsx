/* eslint-disable */
import {
  Admin,
  Resource,
  resolveBrowserLocale
} from 'react-admin';
import polyglotI18nProvider from 'ra-i18n-polyglot';
import frenchMessages from 'ra-language-french';
import { QueryClient, QueryClientProvider } from 'react-query';
import {
  Person,
  PeopleTwoTone,
  BusinessCenter,
  NoteOutlined,
  Map,
} from '@material-ui/icons';

import dataProvider from './api/provider/dataProvider';
import AuthProvider from './modules/Auth/authProvider';
import { KeycloakProviderInit } from './components/Keycloak/KeycloakProviderInit';
import LogoutButton from './components/LoginForm/LogoutButton';
import Dashboard from './components/Dashboard/Dashboard';
import AccessRole from './components/Access/AccessRole';
import Aide from './components/Aide';
import UtilisateurForm from './components/utilisateurs';
import customTheme from './components/customTheme/customTheme';
import TerritoryForm from './components/Territories';
import FunderForm from './components/Funders';
import CommunityForm from './components/Communities';

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
              name="territoires"
              options={{ label: 'Territoires' }}
              icon={Map}
              {...TerritoryForm}
            />
            <Resource
              name="financeurs"
              options={{ label: 'Financeurs' }}
              icon={BusinessCenter}
              {...FunderForm}
            />
            <Resource
              name="communautes"
              options={{ label: 'Communautés' }}
              icon={PeopleTwoTone}
              {...CommunityForm}
            />
            <Resource
              name="utilisateurs"
              options={{ label: 'Utilisateurs financeurs' }}
              icon={Person}
              {...UtilisateurForm}
            />
            <Resource
              name="aides"
              options={{ label: 'Aides' }}
              icon={NoteOutlined}
              {...Aide}
            />
          </Admin>
        </AccessRole>
      </QueryClientProvider>
    </KeycloakProviderInit>
  );
}

export default App;
