import axios from 'axios';
import {injectable, BindingScope} from '@loopback/core';

enum SUBSCRIPTION_STATUS {
  ERROR = 'ERREUR',
  TO_PROCESS = 'A_TRAITER',
  VALIDATED = 'VALIDEE',
  REJECTED = 'REJETEE',
  DRAFT = 'BROUILLON',
}
type Subscription = {
  id: string;
  incentiveId: string;
  funderName: string;
  incentiveType: string;
  incentiveTitle: string;
  incentiveTransportList: string[];
  citizenId: string;
  lastName: string;
  firstName: string;
  email: string;
  city?: string;
  postcode?: string;
  birthdate: string;
  communityId?: string;
  consent: boolean;
  status: SUBSCRIPTION_STATUS;
  createdAt: string;
  updatedAt: string;
  funderId: string;
  specificFields?: {[prop: string]: any};
  isCitizenDeleted: boolean;
  enterpriseEmail?: string;
}

// TODO: move params & URLs to env
async function getAccessToken(): Promise<string> {
  const tokenUrl = process.env.MOB_TOKEN_URL ?? 'http://localhost:9000/auth/realms/mcm/protocol/openid-connect/token'
  const client_id = process.env.MOB_CLIENT_ID ?? 'simulation-maas-backend'
  const client_secret = process.env.MOB_CLIENT_SECRET ?? '4x1zfk4p4d7ZdLPAsaWBhd5mu86n5ZWN'
  const data = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: client_id,
      client_secret: client_secret,
  });

  try {
      const response = await axios.post(tokenUrl, data.toString(), {
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
      });
      
      const accessToken = response.data.access_token;
      // console.log('Access Token:', accessToken);
      return accessToken;
  } catch (error) {
      console.error('Error fetching access token:', error.response ? error.response.data : error.message);
  }
  return ''
}
@injectable({scope: BindingScope.TRANSIENT})
export class MobService {
  constructor(/* Add @inject to inject parameters */) {}
  
  // TODO: handle errors ?
  public async subscriptionsFind(incentiveId?: string, status?: string) {
    const headers = {Authorization: `Bearer ${await getAccessToken()}`}
    const params : {incentiveId?: string, status?: string} = {} 
    if (incentiveId) {
      params.incentiveId = incentiveId
    }
    if (status) {
      params.status = status
    }
    const response = await axios.get(process.env.MOB_API_SUBSCRIPTION_URL ?? 'http://localhost:3000/v1/subscriptions', {headers: headers, params: params})
    return response.data as Subscription[]
  }
}
