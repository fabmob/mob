import {service} from '@loopback/core';
import {MigrationScript, migrationScript} from 'loopback4-migration';
import {repository} from '@loopback/repository';

import {KeycloakService} from '../services';
import {Citizen, UserEntity, UserEntityRelations} from '../models';
import {UserEntityRepository} from '../repositories';
import {GROUPS, logger} from '../utils';

import {credentials} from '../constants';
import ClientScopeRepresentation from 'keycloak-admin/lib/defs/clientScopeRepresentation';

const clientScopes: ClientScopeRepresentation[] = [
  {
    id: 'cb5b1719-756f-4360-9e51-31488c7a7c31',
    name: 'urn:cms:driving-licence:read',
    description: "A person's driving license information",
    protocol: 'openid-connect',
    attributes: {
      'include.in.token.scope': 'true',
      'display.on.consent.screen': 'true',
      'consent.screen.text': '${consentDrivingLicence}',
    },
    protocolMappers: [
      {
        id: '1e2b4ba4-a736-4f1e-ba43-cadbcbd69196',
        name: 'dateOfIssue',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'drivingLicence.dateOfIssue',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.drivingLicence.dateOfIssue',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'db34644a-8d0a-4277-b0cf-ba832cae6011',
        name: 'dateOfValidity',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'drivingLicence.dateOfValidity',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.drivingLicence.dateOfValidity',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '41f2c200-5605-4769-bf03-665c13d96550',
        name: 'issuingCountry',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'drivingLicence.issuingCountry',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.drivingLicence.issuingCountry',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '0fa03ce2-c9d1-4911-860e-b73d69e5ffe3',
        name: 'number',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'drivingLicence.number',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.drivingLicence.number',
          'jsonType.label': 'JSON',
        },
      },
    ],
  },
  {
    id: '0376b3ac-f440-49cb-bec4-a3f108e16dd5',
    name: 'urn:cms:fr-dgfip-information:read',
    description: 'OpenID Connect built-in scope: dgfip-information',
    protocol: 'openid-connect',
    attributes: {
      'include.in.token.scope': 'true',
      'display.on.consent.screen': 'true',
      'consent.screen.text': '${consentDgfip}',
    },
    protocolMappers: [
      {
        id: '41534fdc-5192-4744-a3cc-906e021aa32f',
        name: 'declarant2.birthDate',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant2.birthDate',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant2.birthDate',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '58d6bfab-37b5-4eed-9812-0da4676e40ac',
        name: 'declarant1.lastName',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant1.lastName',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant1.lastName',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '14a1eeca-2eed-4629-bc68-44aa63adb871',
        name: 'declarant2.birthName',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant2.birthName',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant2.birthName',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'f9367d17-bd48-482c-be46-3d93c3c28608',
        name: 'declarant2.birthCountry',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant2.birthCountry',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant2.birthCountry',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '16386ae2-cb10-49a6-9b76-cdc9caaed010',
        name: 'declarant1.primaryPostalAddress',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant1.primaryPostalAddress',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant1.primaryPostalAddress',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'a6b95399-764f-451d-befe-9ba1c485f174',
        name: 'taxNotices',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          multivalued: 'true',
          'user.attribute': 'frenchDgfipInformation.taxNotices',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.taxNotices',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '4d28bf84-1fb2-49bc-926c-407a4317cdde',
        name: 'declarant2.primaryPhoneNumber',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant2.primaryPhoneNumber',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant2.primaryPhoneNumber',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '30142c24-d68d-4ff1-b38f-91c2f4241e7f',
        name: 'declarant1.firstName',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant1.firstName',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant1.firstName',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '64a6244c-85be-4005-9ceb-5d43b1c1e5d1',
        name: 'declarant2',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant2',
          'id.token.claim': 'true',
          'access.token.claim': 'true',
          'claim.name': 'cms.frenchDgfipInformation.declarant2',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'a4f7fbb7-bdfd-4e81-b3e7-d0b7ac0f091d',
        name: 'declarant1.middleNames',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant1.middleNames',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant1.middleNames',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '66e34e80-5117-4c3f-a9be-da13b35a7503',
        name: 'declarant1.primaryPhoneNumber',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant1.primaryPhoneNumber',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant1.primaryPhoneNumber',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '04a24f32-b6fb-47ae-b598-b6ef698dfb0e',
        name: 'declarant2.middleNames',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant2.middleNames',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant2.middleNames',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'dcebe4ff-5587-4200-984b-a21a3ec41775',
        name: 'declarant1.email',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant1.email',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant1.email',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'e6bda0bc-5e30-4bef-8222-3556d26516d4',
        name: 'declarant2.primaryPostalAddress',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant2.primaryPostalAddress',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant2.primaryPostalAddress',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '568a6a4b-096c-48ac-ab80-f8271d7d873e',
        name: 'declarant2.email',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant2.email',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant2.email',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'e6c01827-f2c7-4596-89f4-3dd3aa3eef30',
        name: 'declarant1.birthPlace',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant1.birthPlace',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant1.birthPlace',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '9ae60674-f481-4a32-b3bb-ebbef622a306',
        name: 'declarant1.secondaryPostalAddress',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant1.secondaryPostalAddress',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant1.secondaryPostalAddress',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '9f6a7ca6-4515-4436-988e-45b5fb3e948b',
        name: 'declarant2.lastName',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant2.lastName',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant2.lastName',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'bbb3d647-8c14-4d01-80ca-74759f12cb3b',
        name: 'declarant2.firstName',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant2.firstName',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant2.firstName',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'bf22ab71-ca69-4647-8896-a8384dc47641',
        name: 'declarant1.birthCountry',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant1.birthCountry',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant1.birthCountry',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'de50765b-f082-49db-b1af-e4b52f724b0e',
        name: 'declarant1.birthName',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant1.birthName',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant1.birthName',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'de3f388c-bf5b-4bac-877b-5fcf660ff042',
        name: 'declarant1.birthDate',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant1.birthDate',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant1.birthDate',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'fe137504-2012-49d6-8b29-8a4f8e8bce37',
        name: 'declarant2.birthPlace',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant2.birthPlace',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant2.birthPlace',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '2765c9ed-1db2-4797-9a8d-6088cb5a2a75',
        name: 'declarant1',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant1',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant1',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '33eb812d-ad8a-4d8c-b5a3-46f4e829314b',
        name: 'declarant2.secondaryPostalAddress',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'frenchDgfipInformation.declarant2.secondaryPostalAddress',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.frenchDgfipInformation.declarant2.secondaryPostalAddress',
          'jsonType.label': 'JSON',
        },
      },
    ],
  },
  {
    id: '6d6b6d5b-c19b-4f99-ac96-d98b7795072a',
    name: 'urn:cms:identity:read',
    description: 'OpenID Connect built-in scope: identity',
    protocol: 'openid-connect',
    attributes: {
      'include.in.token.scope': 'true',
      'display.on.consent.screen': 'true',
      'consent.screen.text': '${consentIdentity}',
    },
    protocolMappers: [
      {
        id: '227295c7-025f-4243-886d-bf6c97729054',
        name: 'gender',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'identity.gender',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.identity.gender',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'ae664043-bd8b-4733-a639-9f96f1b8df8e',
        name: 'birthDate',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'identity.birthDate',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.identity.birthDate',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '9d091b84-028d-4fa7-b687-0d44b4f20ce3',
        name: 'firstName',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'identity.firstName',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.identity.firstName',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '62e3b799-cb8b-4c8f-9be4-5352028f6215',
        name: 'middleNames',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'identity.middleNames',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.identity.middleNames',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'cf6c95a9-5c67-47d7-8a81-3531fed5208a',
        name: 'birthCountry',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'identity.birthCountry',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.identity.birthCountry',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'f77fe6d9-e635-4de1-b474-fd4ac39ed617',
        name: 'birthPlace',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'identity.birthPlace',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.identity.birthPlace',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '2a1dcb2d-d9f7-48d3-aefe-a722a9a090a1',
        name: 'lastName',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'identity.lastName',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.identity.lastName',
          'jsonType.label': 'JSON',
        },
      },
    ],
  },
  {
    id: 'e46741a6-8c25-4a86-9037-ad92467d9fdf',
    name: 'urn:cms:personal-information:read',
    description: 'OpenID Connect built-in scope: personal-information',
    protocol: 'openid-connect',
    attributes: {
      'include.in.token.scope': 'true',
      'display.on.consent.screen': 'true',
      'consent.screen.text': '${consentPersonalInformation}',
    },
    protocolMappers: [
      {
        id: '36174c1d-50a9-4c82-800a-8f20d7ce93ca',
        name: 'secondaryPostalAddress',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'personalInformation.secondaryPostalAddress',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.personalInformation.secondaryPostalAddress',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '5f82f4ee-638e-41fe-bda0-5af1e659400d',
        name: 'secondaryPhoneNumber',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'personalInformation.secondaryPhoneNumber',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.personalInformation.secondaryPhoneNumber',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '6854d718-5654-49fa-8d5a-a24cb739db1a',
        name: 'email',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'personalInformation.email',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.personalInformation.email',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: 'e27e02d0-79f8-4c06-bc40-4aae0e94413d',
        name: 'primaryPhoneNumber',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'personalInformation.primaryPhoneNumber',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.personalInformation.primaryPhoneNumber',
          'jsonType.label': 'JSON',
        },
      },
      {
        id: '0bf8f225-7638-4e2f-a079-c9151e525e2f',
        name: 'primaryPostalAddress',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'userinfo.token.claim': 'true',
          'user.attribute': 'personalInformation.primaryPostalAddress',
          'id.token.claim': 'false',
          'access.token.claim': 'false',
          'claim.name': 'cms.personalInformation.primaryPostalAddress',
          'jsonType.label': 'JSON',
        },
      },
    ],
  },
];

@migrationScript()
export class MigrationScript1160 implements MigrationScript {
  version = '1.16.0';
  scriptName = MigrationScript1160.name;
  description =
    'Automatisation of keycloak clientScopes creation and Convert user updatedAt attribute to timestamp';

  constructor(
    @repository(UserEntityRepository)
    private userEntityRepository: UserEntityRepository,
    @service(KeycloakService)
    private keycloakService: KeycloakService,
  ) {}

  async up(): Promise<void> {
    logger.info(`${MigrationScript1160.name} - Started`);

    logger.info(`${MigrationScript1160.name} - Create keycloak clientScopes - Started`);

    await Promise.allSettled(
      clientScopes.map(async (scope: ClientScopeRepresentation) => {
        await this.keycloakService.keycloakAdmin
          .auth(credentials)
          .then(() => this.keycloakService.keycloakAdmin.clientScopes.create(scope))
          .catch(err => err);
        logger.info(
          `${MigrationScript1160.name} - ClientScope ${scope.name}  is Created`,
        );
      }),
    );

    logger.info(
      `${MigrationScript1160.name} - Convert user updatedAt attribute to timestamp - Started`,
    );

    const citizensWithAttributes: (UserEntity & UserEntityRelations)[] =
      await this.userEntityRepository.searchUserWithAttributesByFilter(
        {},
        GROUPS.citizens,
      );

    await Promise.allSettled(
      citizensWithAttributes.map(async citizenWithAttributes => {
        const citizen: Citizen = citizenWithAttributes.toCitizen();
        await this.keycloakService.updateUserKC(citizenWithAttributes.id, citizen);
        logger.info(
          `${MigrationScript1160.name} - updatedAt attribute converted to timestamp \
           for citizen ${citizenWithAttributes.firstName} ${citizenWithAttributes.lastName}`,
        );
      }),
    );

    logger.info(`${MigrationScript1160.name} - Completed`);
  }
}
