import {expect} from '@loopback/testlab';
import {convertSpecificFields} from '../../utils/subscription';

describe('Subscription functions', () => {
  it('convertSpecificFields : long distance', () => {
    const specificFields = {
      'Numéro de permis de conduire': '12345678',
      'Type de trajet': ['Long'],
      'Numéro de téléphone': '0123456789',
      'Date de partage des frais': '3/12/2022',
      test: 34,
    };

    const convertedSF = convertSpecificFields(specificFields, 'EL', '2023-01-10T13:45:06.540Z');
    expect(convertedSF).to.containEql({
      journey_type: 'long',
      driving_license: '12345678',
      last_name_trunc: 'EL ',
      phone_trunc: '+331234567',
      datetime: '2022-12-03T00:00:00.000Z',
    });
  });

  it('convertSpecificFields : removes accent and truncate last name at 3 characters', () => {
    const convertedSF1 = convertSpecificFields({}, 'Guérin', '2023-01-10T13:45:06.540Z');
    const convertedSF2 = convertSpecificFields({}, 'garric', '2023-01-10T13:45:06.540Z');
    const convertedSF3 = convertSpecificFields({}, 'de souza', '2023-01-10T13:45:06.540Z');
    const convertedSF4 = convertSpecificFields({}, 'Lê', '2023-01-10T13:45:06.540Z');

    expect(convertedSF1).to.containEql({last_name_trunc: 'GUE'});
    expect(convertedSF2).to.containEql({last_name_trunc: 'GAR'});
    expect(convertedSF3).to.containEql({last_name_trunc: 'DE '});
    expect(convertedSF4).to.containEql({last_name_trunc: 'LE '});
  });

  it('convertSpecificFields : short distance', () => {
    const specificFields = {
      'Numéro de permis de conduire': '12345678',
      'Type de trajet': ['Court'],
      'Identifiant du   Trajet  ': '23456789',
    };

    const convertedSF = convertSpecificFields(specificFields, 'LastName', '2023-01-10T13:45:06.540Z');
    expect(convertedSF).to.containEql({
      journey_type: 'short',
      driving_license: '12345678',
      last_name_trunc: 'LAS',
      operator_journey_id: '23456789',
    });
  });

  it('convertSpecificFields: compute the identity key for short journey', () => {
    const specificFields = {
      'Type de trajet': ['Court'],
      'Numéro de téléphone': '0701020304',
    };

    const convertedSF = convertSpecificFields(
      specificFields,
      "D'Hérûg-de-l'Hérault",
      '2023-01-10T13:45:06.540Z',
    );
    expect(convertedSF).to.containEql({
      identity_key: 'f44ff5364363e53da750d8b7b44fa3176ea36228c5f951a9c1e606c915093d30',
      last_name_trunc: 'D H',
      journey_type: 'short',
    });
  });

  it('convertSpecificFields: compute the identity key for long journey', () => {
    const specificFields = {
      'Type de trajet': ['Long'],
      'Numéro de téléphone': '0701020304',
    };

    const convertedSF = convertSpecificFields(
      specificFields,
      "D'Hérûg-de-l'Hérault",
      '2023-01-10T13:45:06.540Z',
    );
    expect(convertedSF).to.containEql({
      identity_key: 'f44ff5364363e53da750d8b7b44fa3176ea36228c5f951a9c1e606c915093d30',
      last_name_trunc: 'D H',
      phone_trunc: '+337010203',
      journey_type: 'long',
    });
  });

  it('convertSpecificFields : undefined specificFields', () => {
    const convertedSF = convertSpecificFields(undefined, 'LastName', '2023-01-10T13:45:06.540Z');
    expect(convertedSF).to.containEql({
      last_name_trunc: 'LAS',
    });
  });
});
