import {injectable, BindingScope, service} from '@loopback/core';
import {removeWhiteSpace} from '../controllers/utils/helpers';
import {Territory} from '../models';
import {TerritoryRepository} from '../repositories';
import {Logger, SCALE, ResourceName} from '../utils';

import {ConflictError} from '../validationError';

const TERRITORY_SCALE_INSEE_VALIDATION = {
  [SCALE.MUNICIPALITY]: {
    minItems: 1,
    maxItems: 1,
    inseeValueLength: [5],
  },
  [SCALE.AGGLOMERATION]: {
    minItems: 2,
    maxItems: undefined,
    inseeValueLength: [5],
  },
  [SCALE.COUNTY]: {
    minItems: 1,
    maxItems: 1,
    inseeValueLength: [2, 3],
  },
  [SCALE.REGION]: {
    minItems: 1,
    maxItems: 1,
    inseeValueLength: [2],
  },
  [SCALE.NATIONAL]: {
    minItems: 0,
    maxItems: 0,
    inseeValueLength: [0],
  },
};
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
    Logger.debug(TerritoryService.name, this.createTerritory.name, 'Case-sensitive Match', result);
    /**
     * Throw an error if the territory name is duplicated.
     * Otherwise create the territory.
     */
    if (result) {
      throw new ConflictError(
        TerritoryService.name,
        this.createTerritory.name,
        'territory.name.error.unique',
        '/territoryName',
        ResourceName.Territory,
        territory.name,
      );
    }
    return this.territoryRepository.create(territory);
  }

  /**
   * Check if provided inseeCodeList has valid pattern
   * @param inseeValueList string[]
   * @returns Boolean
   */
  isValidInseeCodePattern(inseeValueList: string[]): Boolean {
    const regex = new RegExp(/\d/);
    return Boolean(inseeValueList?.find((inseeValue: string) => inseeValue?.match(regex)));
  }

  /**
   * Check if provided inseeCodeList has duplicated values
   * @param inseeValueList string[]
   * @returns Boolean
   */
  hasDuplicatedValues(inseeValueList?: string[]): Boolean {
    if (!inseeValueList) {
      return false;
    }
    const valueSet: Set<string> = new Set(inseeValueList);
    return inseeValueList?.length !== valueSet.size;
  }

  /**
   * Validate if scale and inseeValueList match
   * @param scale SCALE
   * @param inseeValueList string[]
   * @returns Boolean
   */
  isValidScaleInseeCodeValidation(scale: SCALE, inseeValueList: string[]): Boolean {
    const scaleInsee: {
      minItems: number;
      maxItems: number | undefined;
      inseeValueLength: number[];
    } = TERRITORY_SCALE_INSEE_VALIDATION[scale];

    if (
      inseeValueList.length < scaleInsee.minItems ||
      (scaleInsee.maxItems && inseeValueList.length > scaleInsee.maxItems)
    ) {
      return false;
    }

    const inseeValueLengthList: number[] = inseeValueList.map((inseeValue: string) => {
      return inseeValue.length;
    });

    if (
      inseeValueLengthList.filter(
        (inseeValueLength: number) => !scaleInsee.inseeValueLength.includes(inseeValueLength),
      ).length
    ) {
      return false;
    }
    return true;
  }
}
