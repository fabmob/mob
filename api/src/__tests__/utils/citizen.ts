import {expect} from '@loopback/testlab';
import {composeWhere, parseScopes, preCheckFields} from '../../utils/citizen';

describe('Citizen functions', () => {
  describe('preCheckFields()', () => {
    it('returns original fields if all values are true', () => {
      const input = {identity: true, affiliation: true};
      const output = preCheckFields(input);
      expect(output).to.deepEqual(input);
    });

    it('adds missing properties to fields if all values are false', () => {
      const input = {identity: false, affiliation: false};
      const expectedOutput = {
        identity: false,
        affiliation: false,
        id: true,
        password: true,
        city: true,
        postcode: true,
        status: true,
        tos1: true,
        tos2: true,
        terms_and_conditions: true,
        personalInformation: true,
        dgfipInformation: true,
        updatedAt: true,
        isInactivityNotificationSent: true,
        lastLoginAt: true,
      };

      const output = preCheckFields(input);
      expect(output).to.deepEqual(expectedOutput);
    });
  });

  describe('parseScopes()', () => {
    it('disables CMS types if relevant scopes are not provided', () => {
      const scopes = ['openid'];
      const input = {identity: true, personalInformation: true};
      const output = parseScopes(scopes, input);
      expect(output).to.deepEqual({identity: false, personalInformation: false, dgfipInformation: false});
    });

    it('keeps identity enabled if relevant scopes are provided', () => {
      const scopes = ['openid', 'profile', 'email', 'urn:cms:fr-dgfip-information:read'];
      const input = {identity: true, personalInformation: true, dgfipInformation: true};
      const output = parseScopes(scopes, input);
      expect(output).to.deepEqual({identity: true, personalInformation: true, dgfipInformation: true});
    });
  });

  describe('composeWhere', () => {
    it('returns the expected where filter', () => {
      const fields = {
        city: true,
        postcode: true,
        status: false,
        identity: true,
        personalInformation: true,
        dgfipInformation: true,
        affiliation: false,
      };

      const expectedFilter = {
        where: {
          or: [
            {
              name: {
                inq: ['city', 'postcode'],
              },
            },
            {
              name: {
                inq: [
                  'identity.lastName',
                  'identity.firstName',
                  'identity.middleNames',
                  'identity.gender',
                  'identity.birthDate',
                  'identity.birthPlace',
                  'identity.birthCountry',
                ],
              },
            },
            {
              name: {
                inq: [
                  'personalInformation.email',
                  'personalInformation.primaryPostalAddress',
                  'personalInformation.secondaryPostalAddress',
                  'personalInformation.primaryPhoneNumber',
                  'personalInformation.secondaryPhoneNumber',
                ],
              },
            },
            {
              name: {
                inq: [
                  'dgfipInformation.declarant1',
                  'dgfipInformation.declarant2',
                  'dgfipInformation.taxNotices',
                ],
              },
            },
          ],
        },
      };

      const result = composeWhere(fields);

      expect(result).to.deepEqual(expectedFilter);
    });

    it('returns empty filter if fields are empty of all false', () => {
      const input = {};
      const output = composeWhere(input);
      expect(output).to.deepEqual({});
    });
  });
});
