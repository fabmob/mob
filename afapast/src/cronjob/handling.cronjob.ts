import {service} from '@loopback/core';
import {CronJob, cronJob} from '@loopback/cron';

import {MobService} from '../services';
import { repository } from '@loopback/repository';
import { TrackedIncentivesRepository, VoucherRepository } from '../repositories';
import { VOUCHER_STATUS } from '../models/voucher.model';
import { MailService } from '../services/mail.service';

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

@cronJob()
export class HandlingCronJob extends CronJob {
  // Cron's type

  constructor(
    @service(MobService)
    public mobService: MobService,
    @service(MailService)
    public mailService: MailService,
    @repository(TrackedIncentivesRepository)
    public trackedIncentivesRepository : TrackedIncentivesRepository,
    @repository(VoucherRepository)
    public voucherRepository : VoucherRepository,
  ) {
    super({
      name: 'subscription-job',
      onTick: async () => {
        await this.performJob();
      },
      cronTime: '* * * * *', // every minute
      start: false,
    });
  }

  /**
   * Perform cron job
   */
  private async performJob(): Promise<void> {
    console.debug("doing the job !")
    const trackedIncentives = await this.trackedIncentivesRepository.find()
    for (let i = 0; i < trackedIncentives.length; i++) {
      const trackedIncentive = trackedIncentives[i];
      const subscriptions = await this.mobService.subscriptionsFind(trackedIncentive.incentiveId, "VALIDEE")
      console.debug(subscriptions.length + " subs loaded from api")

      let nbSubsHandled = 0
      for (let j = 0; j < subscriptions.length; j++) {
        const subscription = subscriptions[j];

        if (process.env.MINIMAL_SUBSCRIPTION_START_DATE && subscription.updatedAt < process.env.MINIMAL_SUBSCRIPTION_START_DATE) {
          // Sub is too old, ignore it
          continue
        }
        // Check if sub was already handled
        const voucherGiven = await this.voucherRepository.find({
          where: {
            subscriptionId: subscription.id
          }
        })
        if (voucherGiven.length > 0) {
          // skip subscription already handled
          continue
        }
        console.debug("Found one sub to be handled : " + subscription.id)
        // Get a voucher
        const vouchers = await this.voucherRepository.find({
          where: {
            status: VOUCHER_STATUS.UNUSED
          },
          limit: 1
        })
        if (!vouchers || vouchers.length === 0) {
          // Uh oh, not enough vouchers :(
          console.error("Not enough vouchers")
          return
        }
        const voucher = vouchers[0]
        console.debug("Got an unused voucher : " + voucher.id)

        // MAIL !
        await this.mailService.sendMailAsHtml(subscription.email, "Votre bon de réduction Airweb", "voucher-airweb", {
          username: capitalize(subscription.firstName),
          voucher: voucher.value
        })
        console.debug("mail sent to " + subscription.email)

        // If mail ok, mark the voucher as used
        await this.voucherRepository.updateById(voucher.id, {
          status: VOUCHER_STATUS.USED,
          subscriptionId: subscription.id,
          citizenId: subscription.citizenId,
          incentiveId: trackedIncentive.incentiveId,
        })

        console.log("voucher updated")

        nbSubsHandled++
      }

      await this.trackedIncentivesRepository.updateById(trackedIncentive.id, {
        lastNbSubs: subscriptions.length,
        nbSubsHandled: (trackedIncentive.nbSubsHandled || 0) + nbSubsHandled,
        lastReadTime: new Date().toISOString()
      })
      console.debug("Incentive updated, added " + nbSubsHandled + " subs handled")
    }

  }
}

