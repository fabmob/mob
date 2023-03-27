import {BindingScope, inject, injectable, service} from '@loopback/core';
import {AnyObject, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';

import {capitalize} from 'lodash';

import {WEBSITE_FQDN} from '../constants';
import {Affiliation, Citizen, User, Enterprise, Funder} from '../models';
import {
  AffiliationRepository,
  FunderRepository,
  SubscriptionRepository,
  UserRepository,
} from '../repositories';
import {AFFILIATION_STATUS, formatDateInFrenchNotation, ResourceName, SUBSCRIPTION_STATUS} from '../utils';
import {ConflictError, UnprocessableEntityError} from '../validationError';
import {AffiliationAccessTokenPayload, JwtService} from './jwt.service';
import {KeycloakService} from './keycloak.service';
import {MailService} from './mail.service';

@injectable({scope: BindingScope.TRANSIENT})
export class AffiliationService {
  constructor(
    @repository(AffiliationRepository)
    public affiliationRepository: AffiliationRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @repository(FunderRepository)
    public funderRepository: FunderRepository,
    @service(KeycloakService)
    public kcService: KeycloakService,
    @service(MailService)
    public mailService: MailService,
    @service(JwtService)
    public jwtService: JwtService,
    @inject(SecurityBindings.USER, {optional: true})
    private currentUser: UserProfile,
  ) {}

  /**
   * Check if the professional email is unique
   * @param professionalEmail
   * @returns true/false
   */
  async isEmailProExisting(professionalEmail: string): Promise<Boolean> {
    const result: Affiliation | null = await this.affiliationRepository.findOne({
      where: {enterpriseEmail: professionalEmail},
    });
    return Boolean(result);
  }

  /**
   * Check that the citizen profesionnel email is aligned with the
   * domains of the enterprise citizen want to be member
   * @returns true/false
   * @param emailCitizen string - citizen profesionnel email
   * @param enterpriseEmails[]: string[] - email patterns of the enterprise citizen want to be member
   */
  isValidEmailProPattern(emailCitizen: string, enterpriseEmails: string[]): Boolean {
    return enterpriseEmails.includes(emailCitizen.replace(/^.+@/, '@'));
  }

  /**
   * If the company accepts a manual affiliation, send an affiliation mail to that company's funders.
   * @param citizen
   * @param enterprise
   *
   */
  async sendManualAffiliationMail(citizen: Citizen, enterprise: Enterprise): Promise<void> {
    //  Get list of the enterprise funders
    const enterpriseFunders = await this.userRepository.find({
      where: {
        funderId: enterprise.id,
        canReceiveAffiliationMail: true,
      },
    });

    // List of funders who accept manual affiliation and who have an activated account
    const verifiedFunders: User[] = [];

    const creationDate = formatDateInFrenchNotation(new Date());
    const manualAffiliationLink = `${WEBSITE_FQDN}/gerer-salaries?tab=${AFFILIATION_STATUS.TO_AFFILIATE}`;

    await Promise.all(
      //  Loop through the existing funders in MongoDb and get the ones that have verified emails from keycloak.
      enterpriseFunders.map(async (el: User) => {
        const user = await this.kcService.getUser(el.id);
        if (user.emailVerified) {
          verifiedFunders.push(el);
        }
      }),
    );

    await Promise.all(
      //  Send an affiliation mail to each funder whose email address has been verified and who accept manual affiliation.
      verifiedFunders.map(async singleFunder =>
        this.mailService.sendMailAsHtml(
          singleFunder.email,
          `Vous avez une nouvelle demande d'affiliation !`,
          'funder-manual-affiliation-notification',
          {
            funderName: capitalize(enterprise.name),
            funderFirstName: capitalize(singleFunder.firstName),
            firstName: capitalize(citizen.identity.firstName.value),
            lastName: capitalize(citizen.identity.lastName.value),
            creationDate: creationDate,
            manualAffiliationLink: manualAffiliationLink,
          },
        ),
      ),
    );
  }

  /**
   * Send affiliation mail for salarie citizen
   *
   * @param mailService
   * @param citizen
   * @param funderNames
   */
  async sendAffiliationMail(mailService: MailService, citizen: Citizen, funderName: string) {
    const token = this.jwtService.generateAffiliationAccessToken(citizen);
    const affiliationLink = `${WEBSITE_FQDN}/inscription/association?token=${token}`;

    await mailService.sendMailAsHtml(
      citizen.affiliation!.enterpriseEmail!,
      `Bienvenue dans votre communauté moB ${funderName}`,
      'citizen-affiliation',
      {
        funderName: funderName,
        affiliationLink: affiliationLink,
        username: capitalize(citizen.identity.firstName.value),
      },
    );
  }

  /**
   * Send disaffiliation mail for salarie citizen
   * @param mailService
   * @param citizen
   *
   */
  async sendDisaffiliationMail(mailService: MailService, citizen: Citizen) {
    const incentiveLink = `${WEBSITE_FQDN}/recherche`;
    await mailService.sendMailAsHtml(
      citizen.personalInformation.email.value!,
      'Votre affiliation employeur vient d’être supprimée',
      'disaffiliation-citizen',
      {
        username: capitalize(citizen.identity.firstName.value),
        incentiveLink: incentiveLink,
      },
    );
  }

  /**
   * send reject affiliation email
   * @param citizen citizen data
   * @param enterpriseName entreprise to be affiliated to
   */
  async sendRejectedAffiliation(citizen: Citizen, enterpriseName: string) {
    await this.mailService.sendMailAsHtml(
      citizen.personalInformation.email.value!,
      "Votre demande d'affiliation a été refusée",
      'affiliation-rejection',
      {
        username: capitalize(citizen.identity.firstName.value),
        enterpriseName: capitalize(enterpriseName),
      },
    );
  }

  /**
   * send validated affiliation email
   * @param citizen citizen data
   * @param enterpriseName entreprise to be affiliated to
   */
  async sendValidatedAffiliation(citizen: Citizen, enterpriseName: string) {
    const websiteLink = `${WEBSITE_FQDN}/recherche`;
    await this.mailService.sendMailAsHtml(
      citizen.personalInformation.email.value!,
      "Votre demande d'affiliation a été acceptée !",
      'affiliation-validation',
      {
        username: capitalize(citizen.identity.firstName.value),
        enterpriseName: capitalize(enterpriseName),
        websiteLink,
      },
    );
  }

  /**
   * Check Affiliation and return citizen if all checks are ok
   * CheckList :
   * verify token /
   * verify citizen and enterprise in mongo /
   * verify match between token and mongo
   * verify affiliation status
   */
  async checkAffiliation(citizen: Citizen, token: string): Promise<Citizen> {
    // Verify token
    if (!this.jwtService.verifyAffiliationAccessToken(token)) {
      throw new UnprocessableEntityError(
        AffiliationService.name,
        this.checkAffiliation.name,
        'citizens.affiliation.not.valid',
        '/citizensAffiliationNotValid',
        ResourceName.Affiliation,
        token,
      );
    }

    const decodedToken: AffiliationAccessTokenPayload = this.jwtService.decodeAffiliationAccessToken(token);

    const enterprise: Enterprise | null = await this.funderRepository.getEnterpriseById(
      decodedToken.enterpriseId,
    );

    // Check if citizen and enterprise exists
    // Check if affiliation enterpriseId matches the token one
    if (
      !citizen ||
      !citizen?.affiliation ||
      citizen.affiliation.enterpriseId !== decodedToken.enterpriseId ||
      !enterprise
    ) {
      throw new UnprocessableEntityError(
        AffiliationService.name,
        this.checkAffiliation.name,
        'citizens.affiliation.not.valid',
        '/citizensAffiliationNotValid',
        ResourceName.Affiliation,
        {affiliation: citizen?.affiliation, enterpriseId: decodedToken.enterpriseId},
      );
    }

    // Check Affiliation status
    if (citizen.affiliation.status !== AFFILIATION_STATUS.TO_AFFILIATE) {
      throw new ConflictError(
        AffiliationService.name,
        this.checkAffiliation.name,
        'citizens.affiliation.bad.status',
        '/citizensAffiliationBadStatus',
        ResourceName.AffiliationBadStatus,
        citizen.affiliation.status,
        AFFILIATION_STATUS.TO_AFFILIATE,
      );
    }

    return citizen;
  }

  /**
   * Check Disaffiliation and return boolean if all checks are ok
   * CheckList :
   * verify citizen subscription
   */
  async checkDisaffiliation(citizenId: string): Promise<boolean> {
    const funder: Funder | null = await this.funderRepository.getFunderByNameAndType(
      this.currentUser.funderName!,
      this.currentUser.funderType!,
    );

    // Check Citizen demands
    const withParams: AnyObject[] = [
      {funderId: funder!.id},
      {status: SUBSCRIPTION_STATUS.TO_PROCESS},
      {citizenId: citizenId},
    ];

    const userId = this.currentUser.id;

    let communityIds: '' | string[] | null | undefined = null;

    communityIds = userId && (await this.userRepository.findOne({where: {id: userId}}))?.communityIds;

    if (communityIds && communityIds?.length > 0) {
      withParams.push({communityId: {inq: communityIds}});
    }

    const subscriptions = await this.subscriptionRepository.find({
      where: {
        and: withParams,
      },
    });

    return subscriptions?.length === 0;
  }
}
