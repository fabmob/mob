import {model, property} from '@loopback/repository';
@model({settings: {idInjection: false}})
export class InputChoiceList {
  @property({
    description: `Choix possible`,
    jsonSchema: {
      example: 'Marié',
    },
  })
  inputChoice: string;

  constructor() {}
}

@model({settings: {idInjection: false}})
export class ChoiceList {
  @property({
    description: `Nombre de choix possible si la donnée à saisir est une liste de choix`,
    jsonSchema: {
      example: 1,
    },
  })
  possibleChoicesNumber: number;

  @property.array(InputChoiceList)
  inputChoiceList: InputChoiceList[];

  constructor() {}
}

@model({settings: {idInjection: false}})
export class SpecificField {
  @property({
    description: `Titre du champ spécifique`,
    jsonSchema: {
      example: 'Statut marital',
    },
  })
  title: string;

  @property({
    description: `Type de la donnée à saisir`,
    jsonSchema: {
      example: 'listeChoix',
    },
  })
  inputFormat: string;

  @property(ChoiceList)
  choiceList?: ChoiceList;

  constructor() {}
}
