import {expect, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';
import sinon from 'sinon';
import {Readable} from 'stream';
import axios from 'axios';
import {ClamavService} from '../../services';
import {ValidationError} from '../../validationError';

describe('Clamav ', async () => {
  let clamav: ClamavService, axiosStub: StubbedInstanceWithSinonAccessor<any>;
  beforeEach(() => {
    clamav = new ClamavService();
  });
  afterEach(() => {
    axiosStub.restore();
  });
  it('clamavService: successfull', async () => {
    axiosStub = sinon.stub(axios, 'post').resolves(Promise.resolve(response));
    const res = await clamav.checkCorruptedFiles(fileListNbFileError);
    expect(res).to.equal(true);
  });
  it('clamavService: virus is detected', async () => {
    axiosStub = sinon.stub(axios, 'post').resolves(Promise.resolve(responseFail));
    const res = await clamav.checkCorruptedFiles(fileListNbFileError);
    expect(res).to.equal(false);
  });

  it('clamavService: axios url fail', async () => {
    axiosStub = sinon.stub(axios, 'post').rejects();
    try {
      await clamav.fileScan(file);
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
  const fileListNbFileError: any[] = [file, file, file];
});
const errorUrl: any = new ValidationError('Antivirus server not found', '/antivirus');

const response = {
  data: {
    data: {
      result: [{name: 'fileName', is_infected: false, viruses: []}],
    },
  },
};
const responseFail = {
  data: {
    data: {
      result: [{name: 'fileName', is_infected: true, viruses: []}],
    },
  },
};
