import {IncentiveService} from '../../services';
import {expect, sinon} from '@loopback/testlab';
import {createIncentive} from '../dataFactory';
import {EligibilityCheck} from '../../models';

describe('Incentive services', () => {
  let incentiveService: any = null;

  beforeEach(() => {
    incentiveService = new IncentiveService();
  });

  it('convertSpecificFields : successful', () => {
    const specificFields = [
      {title: 'un nombre', inputFormat: 'Numerique', isRequired: true},
      {title: 'un text', inputFormat: 'Texte', isRequired: true},
      {title: 'une date', inputFormat: 'Date', isRequired: true},
      {
        title: 'une liste de choix',
        inputFormat: 'listeChoix',
        choiceList: {
          possibleChoicesNumber: 2,
          inputChoiceList: [{inputChoice: 'banane'}, {inputChoice: 'cerise'}],
        },
        isRequired: true,
      },
    ];
    const incentiveTitle = '1';
    const response = incentiveService.convertSpecificFields(incentiveTitle, specificFields);
    // expect(response["$schema"]).to.equal("http://json-schema.org/draft-07/schema#");
    // expect(response["$id"]).to.equal("http://yourdomain.com/schemas/myschema.json");
    expect(response['title']).to.equal(incentiveTitle);
    expect(response['type']).to.equal('object');
    expect(response['required']).to.deepEqual(['un nombre', 'un text', 'une date', 'une liste de choix']);
    expect(response['properties']).to.deepEqual({
      'un nombre': {type: 'number'},
      'un text': {type: 'string', minLength: 1},
      'une date': {type: 'string', format: 'date'},
      'une liste de choix': {
        type: 'array',
        maxItems: 2,
        minItems: 1,
        items: [{enum: ['banane', 'cerise']}],
      },
    });
  });

  it('convertSpecificFields : successful return empty object', () => {
    const specificFields: any[] = [];
    const incentiveTitle = '1';
    const response = incentiveService.convertSpecificFields(incentiveTitle, specificFields);
    expect(response).to.deepEqual({});
  });

  it('getIncentiveIdsToAdd : successful', () => {
    const currentIdList = ['id1', 'id2'];
    const updatedIdList = ['id1', 'id2', 'id3'];
    const response = incentiveService.getIncentiveIdsToAdd(currentIdList, updatedIdList);
    expect(response).to.deepEqual(['id3']);
  });

  it('getIncentiveIdsToAdd : returns empty list if no changes', () => {
    const currentIdList = ['id1', 'id2'];
    const updatedIdList = ['id1', 'id2'];
    const response = incentiveService.getIncentiveIdsToAdd(currentIdList, updatedIdList);
    expect(response).to.deepEqual([]);
  });

  it('getIncentiveIdsToAdd : returns empty list if only removed', () => {
    const currentIdList = ['id1', 'id2'];
    const updatedIdList = ['id1'];
    const response = incentiveService.getIncentiveIdsToAdd(currentIdList, updatedIdList);
    expect(response).to.deepEqual([]);
  });

  it('getIncentiveIdsToDelete : successful', () => {
    const currentIdList = ['id1', 'id2'];
    const updatedIdList = ['id1'];
    const response = incentiveService.getIncentiveIdsToDelete(currentIdList, updatedIdList);
    expect(response).to.deepEqual(['id2']);
  });

  it('getIncentiveIdsToDelete : returns empty list if no changes', () => {
    const currentIdList = ['id1', 'id2'];
    const updatedIdList = ['id1', 'id2'];
    const response = incentiveService.getIncentiveIdsToDelete(currentIdList, updatedIdList);
    expect(response).to.deepEqual([]);
  });

  it('getIncentiveIdsToDelete : returns empty list if only added', () => {
    const currentIdList = ['id1'];
    const updatedIdList = ['id1', 'id2'];
    const response = incentiveService.getIncentiveIdsToDelete(currentIdList, updatedIdList);
    expect(response).to.deepEqual([]);
  });

  it('addIncentiveToExclusions : successful with no eligibilityCheck', () => {
    const incentive = createIncentive({eligibilityChecks: undefined});
    const response = incentiveService.addIncentiveToExclusions(
      incentive.eligibilityChecks,
      incentive,
      'uuid-exclusion',
      true,
    );
    expect(response).to.deepEqual([
      new EligibilityCheck({
        id: 'uuid-exclusion',
        value: [incentive.id],
        active: true,
      }),
    ]);
  });

  it('addIncentiveToExclusions : successful with no exclusion control', () => {
    const incentive = createIncentive({
      eligibilityChecks: [
        new EligibilityCheck({
          id: 'uuid-fc',
          value: [],
          active: true,
        }),
      ],
    });
    const response = incentiveService.addIncentiveToExclusions(
      incentive.eligibilityChecks,
      incentive,
      'uuid-exclusion',
      true,
    );
    expect(response).to.deepEqual([
      new EligibilityCheck({
        id: 'uuid-fc',
        value: [],
        active: true,
      }),
      new EligibilityCheck({
        id: 'uuid-exclusion',
        value: [incentive.id],
        active: true,
      }),
    ]);
  });

  it('addIncentiveToExclusions : successful with exclusion control', () => {
    const incentive = createIncentive({
      eligibilityChecks: [
        new EligibilityCheck({
          id: 'uuid-fc',
          value: [],
          active: true,
        }),
        new EligibilityCheck({
          id: 'uuid-exclusion',
          value: ['test'],
          active: true,
        }),
      ],
    });
    const response = incentiveService.addIncentiveToExclusions(
      incentive.eligibilityChecks,
      incentive,
      'uuid-exclusion',
      true,
    );
    expect(response).to.deepEqual([
      new EligibilityCheck({
        id: 'uuid-fc',
        value: [],
        active: true,
      }),
      new EligibilityCheck({
        id: 'uuid-exclusion',
        value: ['test', incentive.id],
        active: true,
      }),
    ]);
  });

  it('removeIncentiveFromExclusions : successful with 1 item in exclusion list and control FC', () => {
    const incentiveToExcludeId = 'uuid-aide1';
    const incentiveToExclude = createIncentive({
      id: incentiveToExcludeId,
    });
    const incentiveToUpdate = createIncentive({
      id: 'uuid-delete1',
      eligibilityChecks: [
        new EligibilityCheck({
          id: 'uuid-fc',
          value: [],
          active: true,
        }),
        new EligibilityCheck({
          id: 'uuid-exclusion',
          value: [incentiveToExclude.id],
          active: true,
        }),
      ],
    });
    const response = incentiveService.removeIncentiveFromExclusions(
      incentiveToUpdate,
      incentiveToExclude,
      'uuid-exclusion',
    );
    expect(response).to.deepEqual(incentiveToUpdate);
  });
  it('removeIncentiveFromExclusions : successful with 2 items in exclusion list', () => {
    const incentiveToExcludeId = 'uuid-aide1';
    const incentiveToExclude = createIncentive({
      id: incentiveToExcludeId,
    });
    const incentiveToUpdate = createIncentive({
      id: 'uuid-delete1',
      eligibilityChecks: [
        new EligibilityCheck({
          id: 'uuid-exclusion',
          value: ['test', incentiveToExclude.id],
          active: true,
        }),
      ],
    });
    const response = incentiveService.removeIncentiveFromExclusions(
      incentiveToUpdate,
      incentiveToExclude,
      'uuid-exclusion',
    );
    expect(response).to.deepEqual(incentiveToUpdate);
  });
  it('removeIncentiveFromExclusions : successful with 1 item in exclusion list and no other control', () => {
    const incentiveToExcludeId = 'uuid-aide1';
    const incentiveToExclude = createIncentive({
      id: incentiveToExcludeId,
    });
    const incentiveToUpdate = createIncentive({
      id: 'uuid-delete1',
      eligibilityChecks: [
        new EligibilityCheck({
          id: 'uuid-exclusion',
          value: [incentiveToExclude.id],
          active: true,
        }),
      ],
    });
    const response = incentiveService.removeIncentiveFromExclusions(
      incentiveToUpdate,
      incentiveToExclude,
      'uuid-exclusion',
    );
    expect(response).to.deepEqual(incentiveToUpdate);
  });
});
