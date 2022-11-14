import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {orderBy, head} from 'lodash';

import {
  Collectivity,
  CollectivityRelations,
  Enterprise,
  EnterpriseRelations,
} from '../models';

import {CollectivityRepository} from '../repositories';
import {EnterpriseRepository} from '../repositories';

import {FUNDER_TYPE, IFunder} from '../utils';

@injectable({scope: BindingScope.TRANSIENT})
export class FunderService {
  constructor(
    @repository(CollectivityRepository)
    public collectivityRepository: CollectivityRepository,
    @repository(EnterpriseRepository)
    public enterpriseRepository: EnterpriseRepository,
  ) {}
  async getFunders() {
    const enterprises: IFunder[] = await this.enterpriseRepository.find({
      fields: {name: true, id: true, emailFormat: true, hasManualAffiliation: true},
    });
    const colletivites: (Collectivity & CollectivityRelations)[] =
      await this.collectivityRepository.find({
        fields: {name: true, id: true},
      });

    const funders = enterprises
      .map((elt: IFunder) => ({...elt, funderType: FUNDER_TYPE.enterprise}))
      .concat(
        colletivites.map((elt: any) => ({
          ...elt,
          funderType: FUNDER_TYPE.collectivity,
        })),
      );

    return orderBy(funders, ['name', 'funderType'], ['asc']);
  }

  async getFunderByName(name: string, funderType: FUNDER_TYPE) {
    if (funderType === FUNDER_TYPE.enterprise) {
      const enterprises: any[] = (
        await this.enterpriseRepository.find({
          where: {name},
          fields: {name: true, id: true, emailFormat: true},
        })
      ).map((elt: any) => ({...elt, funderType: FUNDER_TYPE.enterprise}));
      return head(enterprises);
    }

    const colletivites: Collectivity[] | {funderType: FUNDER_TYPE}[] = (
      await this.collectivityRepository.find({
        where: {name},
        fields: {name: true, id: true},
      })
    ).map((elt: Collectivity & CollectivityRelations) => ({
      ...elt,
      funderType: FUNDER_TYPE.collectivity,
    }));

    return head(colletivites);
  }
}
