import {expect, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';
import sinon from 'sinon';
import {Readable} from 'stream';
import NodeClam from 'clamscan';
import {ClamavService} from '../../services';
import {ValidationError} from '../../validationError';

describe('Clamav ', async () => {
  let clamav: ClamavService, nodeClamStub: StubbedInstanceWithSinonAccessor<any>;
  beforeEach(() => {
    clamav = new ClamavService();
  });
  afterEach(() => {
    nodeClamStub.restore();
  });
  it('clamavService: no virus', async () => {
    nodeClamStub = sinon.stub(NodeClam.prototype, 'init').resolves(
      Promise.resolve({
        scanStream: () => {
          return Promise.resolve(response);
        },
      }),
    );
    const res = await clamav.checkCorruptedFiles(fileList);
    expect(res).to.equal(true);
  });

  it('clamavService: virus', async () => {
    nodeClamStub = sinon.stub(NodeClam.prototype, 'init').resolves(
      Promise.resolve({
        scanStream: () => {
          return Promise.resolve(responseVirus);
        },
      }),
    );
    const res = await clamav.checkCorruptedFiles(fileList);
    expect(res).to.equal(false);
  });

  it('clamavService: init fail', async () => {
    try {
      nodeClamStub = sinon.stub(NodeClam.prototype, 'init').rejects({});
      await clamav.checkCorruptedFiles(fileList);
    } catch (err) {
      expect(err.message).to.equal(errorUrl.message);
    }
  });

  it('clamavService: scan stream fail', async () => {
    try {
      nodeClamStub = sinon.stub(NodeClam.prototype, 'init').resolves(
        Promise.resolve({
          scanStream: () => {
            return Promise.reject({});
          },
        }),
      );
      await clamav.checkCorruptedFiles(fileList);
    } catch (err) {
      expect(err.message).to.equal(errorUrl.message);
    }
  });

  const file: any = {
    originalname: 'test',
    buffer: Buffer.from('test de buffer'),
    mimetype: 'image/png',
    fieldname: 'test',
    size: 4000,
    encoding: '7bit',
    stream: new Readable(),
    destination: 'string',
    filename: 'fileName',
    path: 'test',
  };
  const fileList: any[] = [file, file, file];
});
const errorUrl: any = new ValidationError('Error during file list check', '/antivirus');

const response = {
  isInfected: false,
};
const responseVirus = {
  isInfected: true,
};
