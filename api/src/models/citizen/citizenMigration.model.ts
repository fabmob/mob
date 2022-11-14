import {model} from '@loopback/repository';
import {Citizen} from './citizen.model';

@model({
  settings: {strict: false, mongodb: {collection: 'Citizen'}},
})
export class CitizenMigration extends Citizen {
  constructor(data?: CitizenMigration) {
    super(data);
  }
}

export interface CitizenMigrationRelations {}

export type CitizenMigrationWithRelations = CitizenMigration & CitizenMigrationRelations;
