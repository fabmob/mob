import { useKeycloak } from '@react-keycloak/web';
import { head, last } from 'lodash';
import { FunderType, Roles } from '../constants';
import { INCENTIVE_TYPE } from './demandes';

export function useRoleAccepted(role: string): boolean {
  const { keycloak } = useKeycloak();
  if (
    keycloak &&
    keycloak.token &&
    keycloak.realmAccess &&
    keycloak.realmAccess.roles
  ) {
    return keycloak.realmAccess.roles.includes(role);
  }
  return false;
}

export function useGetFunder(): any {
  const { keycloak } = useKeycloak();

  let funder: {
    funderName: string | undefined;
    funderType: string | undefined;
    incentiveType: string | undefined;
  } = {
    funderName: undefined,
    funderType: undefined,
    incentiveType: undefined,
  };

  if (keycloak && keycloak.tokenParsed && keycloak.tokenParsed.membership) {
    const {
      tokenParsed: { membership },
    } = keycloak;

    const funderType = membership.find(
      (elt: string) =>
        elt.startsWith('/collectivités') || elt.startsWith('/entreprises')
    );
    const funderTypeArray =
      funderType &&
      funderType.split('/').filter((elt: string) => elt && elt !== '');
    if (funderTypeArray && funderTypeArray.length > 1) {
      funder = {
        funderName: last(funderTypeArray),
        funderType: head(funderTypeArray),
        incentiveType:
          head(funderTypeArray) === FunderType.ENTERPRISES
            ? INCENTIVE_TYPE.EMPLOYER_INCENTIVE
            : INCENTIVE_TYPE.TERRITORY_INCENTIVE,
      };
    }
  }

  return funder;
}

export function useGetIdUser(): string | undefined {
  const { keycloak } = useKeycloak();

  return keycloak && keycloak.idTokenParsed && keycloak.idTokenParsed.sub;
}

export function checkIfCitizen(keycloak: any): boolean {
  return !!keycloak?.tokenParsed?.membership?.includes('/citoyens');
}

export function isCitizen(): boolean {
  return useRoleAccepted(Roles.CITIZENS);
}

export function isFunder(): boolean {
  return useRoleAccepted(Roles.FUNDERS);
}

export function isContentEditor(): boolean {
  return useRoleAccepted(Roles.CONTENT_EDITOR);
}
