import {IncentiveService} from '../../services';
import {expect} from '@loopback/testlab';

describe('Incentive services', () => {
  let as: any = null;

  beforeEach(() => {
    as = new IncentiveService();
  });

  it('convertSpecificFields : successful', () => {
    const specificFields = [
      {title: 'un nombre', inputFormat: 'Numerique'},
      {title: 'un text', inputFormat: 'Texte'},
      {title: 'une date', inputFormat: 'Date'},
      {
        title: 'une liste de choix',
        inputFormat: 'listeChoix',
        choiceList: {
          possibleChoicesNumber: 2,
          inputChoiceList: [{inputChoice: 'banane'}, {inputChoice: 'cerise'}],
        },
      },
    ];
    const incentiveTitle = '1';
    const response = as.convertSpecificFields(incentiveTitle, specificFields);
    // expect(response["$schema"]).to.equal("http://json-schema.org/draft-07/schema#");
    // expect(response["$id"]).to.equal("http://yourdomain.com/schemas/myschema.json");
    expect(response['title']).to.equal(incentiveTitle);
    expect(response['type']).to.equal('object');
    expect(response['required']).to.deepEqual([
      'un nombre',
      'un text',
      'une date',
      'une liste de choix',
    ]);
    expect(response['properties']).to.deepEqual({
      'un nombre': {type: 'number'},
      'un text': {type: 'string', minLength: 1},
      'une date': {type: 'string', format: 'date'},
      'une liste de choix': {
        type: 'array',
        maxItems: 2,
        items: [{enum: ['banane', 'cerise']}],
      },
    });
  });

  it('convertSpecificFields : successful return empty object', () => {
    const specificFields: any[] = [];
    const incentiveTitle = '1';
    const response = as.convertSpecificFields(incentiveTitle, specificFields);
    // expect(response["$schema"]).to.equal("http://json-schema.org/draft-07/schema#");
    // expect(response["$id"]).to.equal("http://yourdomain.com/schemas/myschema.json");
    expect(response).to.deepEqual({});
  });
});
