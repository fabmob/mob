import {injectable, BindingScope, service} from '@loopback/core';
import {removeWhiteSpace} from '../controllers/utils/helpers';
import {Territory} from '../models';
import {TerritoryRepository} from '../repositories';
import {ResourceName, StatusCode} from '../utils';

import {ValidationError} from '../validationError';

@injectable({scope: BindingScope.TRANSIENT})
export class TerritoryService {
  constructor(
    @service(TerritoryRepository)
    private territoryRepository: TerritoryRepository,
  ) {}

  async createTerritory(territory: Omit<Territory, 'id'>): Promise<Territory> {
    /**
     * Removing white spaces.
     * Exemple : "  Mulhouse   aglo " returns "Mulhouse aglo".
     */
    territory.name = removeWhiteSpace(territory.name);

    /**
     * Perform a case-insensitive search.
     */
    const result: Territory | null = await this.territoryRepository.findOne({
      where: {name: {regexp: `/^${territory.name}$/i`}},
    });

    /**
     * Throw an error if the territory name is duplicated.
     * Otherwise create the territory.
     */
    if (result) {
      throw new ValidationError(
        'territory.name.error.unique',
        '/territoryName',
        StatusCode.UnprocessableEntity,
        ResourceName.Territory,
      );
    }
    return this.territoryRepository.create(territory);
  }
}
