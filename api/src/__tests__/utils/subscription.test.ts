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

    const convertedSF = convertSpecificFields(
      specificFields,
      'EL',
      '2023-01-10T13:45:06.540Z',
    );
    expect(convertedSF).to.containEql({
      journey_type: 'long',
      driving_license: '12345678',
      last_name_trunc: 'EL ',
      phone_trunc: '+331234567',
      datetime: '2022-12-03T00:00:00.000Z',
    });
  });

  it('convertSpecificFields : short distance', () => {
    const specificFields = {
      'Numéro de permis de conduire': '12345678',
      'Type de trajet': ['Court'],
      'Identifiant du   Trajet  ': '23456789',
    };

    const convertedSF = convertSpecificFields(
      specificFields,
      'LastName',
      '2023-01-10T13:45:06.540Z',
    );
    expect(convertedSF).to.containEql({
      journey_type: 'short',
      driving_license: '12345678',
      last_name_trunc: 'LAS',
      operator_journey_id: '23456789',
    });
  });

  it('convertSpecificFields : undefined specificFields', () => {
    const convertedSF = convertSpecificFields(
      undefined,
      'LastName',
      '2023-01-10T13:45:06.540Z',
    );
    expect(convertedSF).to.containEql({
      last_name_trunc: 'LAS',
    });
  });
});
