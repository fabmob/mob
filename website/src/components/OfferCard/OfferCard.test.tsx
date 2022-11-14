import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { mockUseKeycloak } from '@utils/mockKeycloak';
import { waitFor } from '@testing-library/dom';

import OfferCard from './OfferCard';

jest.mock('../../context', () => {
  return {
    useSession: () => mockUseKeycloak,
  };
});

const mockedData = {
  incentiveList: [
    {
      incentiveId: '6160336d48773b25b0ec316e',
      incentiveTitle: "Bonus Ecologique pour l'achat d'un vélo électrique",
      totalSubscriptionsCount: 1,
      validatedSubscriptionPercentage: 100,
    },
  ],
  totalCitizensCount: 1,
};

afterEach(cleanup);

describe('OfferCard Component', () => {
  test('renders totalValue = 1 and one offer card', async () => {
    const { getByText, container } = render(
      <OfferCard dataList={mockedData} />
    );

    await waitFor(() => {
      expect(
        getByText("Bonus Ecologique pour l'achat d'un vélo électrique")
      ).toBeInTheDocument();
      expect(
        getByText(
          "1 citoyen sur 1 ayant validé une demande bénéficie de l'aide"
        )
      ).toBeInTheDocument();
      expect(getByText('100%')).toBeInTheDocument();
      expect(container.getElementsByClassName('mcm-offer-card').length).toBe(1);
    });
  });
});
