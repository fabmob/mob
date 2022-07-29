import {injectable, BindingScope} from '@loopback/core';

@injectable({scope: BindingScope.TRANSIENT})
export class IncentiveService {
  /**
   * Convert specific fields into json schema
   * Specific Fields must not be empty else return empty object
   * Return object
   * @params title: string
   * @params specificFields: any[]
   */
  convertSpecificFields(title: string, specificFields: any[]): Object {
    const jsonSchema: any = {
      properties: {},
    };
    const requiredObj: string[] = [];
    if (specificFields.length > 0) {
      specificFields.forEach(
        (field: {
          inputFormat: string;
          title: string;
          choiceList: {
            possibleChoicesNumber: number;
            inputChoiceList: [{inputChoice: string}];
          };
        }) => {
          const obj: any = {};
          if (field.inputFormat === 'Date') {
            obj[field.title] = {type: 'string', format: 'date'};
          } else if (field.inputFormat === 'Numerique') {
            obj[field.title] = {type: 'number'};
          } else if (field.inputFormat === 'Texte') {
            obj[field.title] = {type: 'string', minLength: 1};
          } else if (field.inputFormat === 'listeChoix') {
            obj[field.title] = {
              type: 'array',
              maxItems: field.choiceList.possibleChoicesNumber,
              items: [{enum: []}],
            };
            field.choiceList.inputChoiceList.forEach(element => {
              obj[field.title].items[0].enum.push(element.inputChoice);
            });
          }
          if (obj[field.title]) {
            jsonSchema.properties[field.title] = obj[field.title];
            requiredObj.push(field.title);
          }
        },
      );
      // jsonSchema["$schema"] = "http://json-schema.org/draft-07/schema#";
      // jsonSchema["$id"] = "http://yourdomain.com/schemas/myschema.json";
      jsonSchema['title'] = title;
      jsonSchema['type'] = 'object';
      jsonSchema['required'] = requiredObj;
      jsonSchema['additionalProperties'] = false;
      return jsonSchema;
    }
    return {};
  }
}
