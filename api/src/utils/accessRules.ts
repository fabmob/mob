const canAccessHisSubscriptionData = (
  tokenUserId: string,
  subscriptionUserId: string,
): boolean => {
  return tokenUserId === subscriptionUserId;
};

export {canAccessHisSubscriptionData};
