export enum StatusCode {
  Success = 200,
  Created = 201,
  NoContent = 204,
  ContentDifferent = 210,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  PreconditionFailed = 412,
  UnprocessableEntity = 422,
  InternalServerError = 500,
}

export enum ResourceName {
  Enterprise = 'Enterprise',
  Collectivity = 'Collectivity',
  Community = 'Community',
  Citizen = 'Citizen',
  Client = 'Client',
  Account = 'Account',
  Affiliation = 'Affiliation',
  Disaffiliation = 'Disaffiliation',
  Funder = 'Funder',
  Subscription = 'Subscription',
  Incentive = 'Incentive',
  Attachments = 'Subscription Attachments',
  AttachmentsType = 'Type of subscription Attachments',
  ProfessionalEmail = 'Professional Email',
  PersonalEmail = 'Personal Email',
  Reason = 'Reason',
  Payment = 'Payment',
  User = 'User',
  Buffer = 'Buffer',
  Antivirus = 'Antivirus',
  Email = 'Email',
  Metadata = 'Metadata',
  Contact = 'Contact',
  rabbitmq = 'Rabbitmq',
  ResendAffiliation = 'Resend Affiliation',
  UniqueProfessionalEmail = 'Unique Professional Email',
}
