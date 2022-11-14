import {
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
  createStubInstance,
} from '@loopback/testlab';
import {AnyObject} from '@loopback/repository';

import {CronJobRepository} from '../../repositories';
import {CronJobService} from '../../services';
import {CronJob} from '../../models';

describe('CronJob services', () => {
  let cronJobService: any = null;
  let cronJobRepository: StubbedInstanceWithSinonAccessor<CronJobRepository>;

  beforeEach(() => {
    cronJobRepository = createStubInstance(CronJobRepository);
    cronJobService = new CronJobService(cronJobRepository);
  });

  it('getCronsLog: successfull', async () => {
    cronJobRepository.stubs.find.resolves([mockCronJobs]);

    const result = cronJobService
      .getCronsLog()
      .then((res: any) => res)
      .catch((err: any) => err);
    expect(result).deepEqual(mockCronJobsReturn);
  });

  it('createCronLog: successfull', async () => {
    cronJobRepository.stubs.create.resolves(mockCronJobs);

    const result = cronJobService
      .createCronLog()
      .then((res: any) => res)
      .catch((err: any) => err);
    expect(result).deepEqual(mockCronJobsReturn);
  });

  it('delete by id: successfull', async () => {
    const deleteCronByID = cronJobRepository.stubs.deleteById.resolves();
    await cronJobService.delCronLogById('123');
    sinon.assert.calledOnce(deleteCronByID);
  });

  const mockCronJobs = new CronJob({
    id: '12345',
    type: 'cronType',
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
  });

  const mockCronJobsReturn: Promise<AnyObject> = new Promise(() => {
    return [
      {
        id: '12345',
        type: 'cronType',
        createdAt: new Date('2021-04-06T09:01:30.778Z'),
      },
    ];
  });
});
