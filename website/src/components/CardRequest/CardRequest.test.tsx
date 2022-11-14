import React from 'react';
import * as Gatsby from 'gatsby';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import CardRequest from './CardRequest';
import {
  Subscription,
  FREQUENCY_VALUE,
  INCENTIVE_TYPE,
  REASON_REJECT_LABEL,
  REASON_REJECT_VALUE,
  MultiplePayment,
  PAYMENT_VALUE,
  SinglePayment,
  STATUS,
} from '@utils/demandes';
import { transportMapping } from '@utils/aides';
import { format } from 'date-fns';

import { BreakpointProvider, QueriesObject } from 'gatsby-plugin-breakpoints';

const useStaticQuery = jest.spyOn(Gatsby, 'useStaticQuery');
useStaticQuery.mockImplementation(() => ({
  data: {
    edges: [
      {
        node: {
          relativePath: 'aide-multiple.svg',
          childImageSharp: {
            fluid: {
              aspectRatio: 1,
              src: 'src',
              srcSet: 'srcSet',
              sizes: 'sizes',
            },
          },
        },
      },
      {
        node: {
          relativePath: 'transportsCommun.svg',
          childImageSharp: {
            fluid: {
              aspectRatio: 1,
              src: 'src',
              srcSet: 'srcSet',
              sizes: 'sizes',
            },
          },
        },
      },
      {
        node: {
          relativePath: 'velo.svg',
          childImageSharp: {
            fluid: {
              aspectRatio: 1,
              src: 'src',
              srcSet: 'srcSet',
              sizes: 'sizes',
            },
          },
        },
      },
      {
        node: {
          relativePath: 'voiture.svg',
          childImageSharp: {
            fluid: {
              aspectRatio: 1,
              src: 'src',
              srcSet: 'srcSet',
              sizes: 'sizes',
            },
          },
        },
      },
      {
        node: {
          relativePath: 'libreService.svg',
          childImageSharp: {
            fluid: {
              aspectRatio: 1,
              src: 'src',
              srcSet: 'srcSet',
              sizes: 'sizes',
            },
          },
        },
      },
      {
        node: {
          relativePath: 'electrique.svg',
          childImageSharp: {
            fluid: {
              aspectRatio: 1,
              src: 'src',
              srcSet: 'srcSet',
              sizes: 'sizes',
            },
          },
        },
      },
      {
        node: {
          relativePath: 'autopartage.svg',
          childImageSharp: {
            fluid: {
              aspectRatio: 1,
              src: 'src',
              srcSet: 'srcSet',
              sizes: 'sizes',
            },
          },
        },
      },
      {
        node: {
          relativePath: 'covoiturage.svg',
          childImageSharp: {
            fluid: {
              aspectRatio: 1,
              src: 'src',
              srcSet: 'srcSet',
              sizes: 'sizes',
            },
          },
        },
      },
    ],
  },
}));

describe('<CardRequest />', () => {
  const request: Subscription = {
    id: '615c5273d58eff5f6e994e04',
    incentiveId: '615c5272d58eff37df994e03',
    funderName: 'Mulhouse',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    incentiveTitle: "Bonus Ecologique pour l'achat d'un vélo électrique",
    incentiveTransportList: ['voiture', 'libreService'],
    citizenId: '76a598e5-0e65-4383-8c06-4890f9f05a00',
    lastName: 'Rasovsky',
    firstName: 'Bob',
    email: 'bob.rasovsky@yopmail.com',
    status: STATUS.TO_PROCESS,
    createdAt: '2021-10-05T13:26:11.084Z',
    updatedAt: '2021-10-05T13:26:11.084Z',
    specificFields: {
      Commentaire: 'Je veux souscrire à cette aide immédiatement NOW',
      Date: '15/06/1992',
      'Salaire annuel brut': 32000,
      'Situation maritale': 'Marié.e',
    },
    subscriptionValidation: {
      mode: PAYMENT_VALUE.NONE,
    },
    city: 'Paris',
    postcode: '75000',
    birthdate: '1970-01-01T00:00:00.000Z',
    consent: true,
    subscriptionRejection: { type: REASON_REJECT_VALUE.CONDITION },
  };

  const queries: QueriesObject = {
    sm: '(min-width: 576px)',
    md: '(min-width: 768px)',
    l: '(min-width: 1024px)',
    xl: '(min-width: 1440px)',
    portrait: '(orientation: portrait)',
  };

  test('Check presence of elements that must appear for any request status.', () => {
    const { getByText } = render(<CardRequest request={request} />);
    expect(getByText(request.firstName)).toBeInTheDocument();
    expect(getByText(request.lastName.toUpperCase())).toBeInTheDocument();
    expect(getByText(request.incentiveTitle)).toBeInTheDocument();
  });

  test('Check all alt image', () => {
    const { rerender, getByAltText } = render(
      <CardRequest request={request} />
    );
    expect(getByAltText('Aide de type multiple')).toBeInTheDocument();

    for (const [key, value] of Object.entries(transportMapping)) {
      const lRequest = request;
      lRequest.incentiveTransportList = [key];
      rerender(<CardRequest request={lRequest} />);
      expect(getByAltText(`Aide de type ${value}`)).toBeInTheDocument();
    }
  });

  test('Displays card of a request to be processed', () => {
    const { getByText } = render(<CardRequest request={request} />);
    expect(
      getByText(
        `Le ${format(new Date(request.updatedAt!), "dd/MM/yyyy à H'h'mm")}`
      )
    ).toBeInTheDocument();
    expect(getByText('Traiter la demande')).toBeInTheDocument();
    expect(getByText('Traiter la demande').closest('a')).toHaveAttribute(
      'href',
      '/administrer-demandes/' + request.id
    );
  });
  test('Displays card of a validated request', () => {
    const lRequest = request;
    lRequest.status = STATUS.VALIDATED;
    const { rerender, getByText } = render(<CardRequest request={lRequest} />);
    expect(
      getByText(
        `Validée le ${format(
          new Date(lRequest.updatedAt!),
          "dd/MM/yyyy à H'h'mm"
        )}`
      )
    ).toBeInTheDocument();
    expect(getByText('Aucun versement')).toBeInTheDocument();
    lRequest.subscriptionValidation = {
      mode: PAYMENT_VALUE.SINGLE,
      amount: 999,
    } as SinglePayment;
    rerender(<CardRequest request={lRequest} />);
    expect(getByText('Financement unique')).toBeInTheDocument();
    lRequest.subscriptionValidation = {
      mode: PAYMENT_VALUE.MULTIPLE,
      frequency: FREQUENCY_VALUE.MONTHLY,
      amount: 999,
      lastPayment: '2021-12-31',
    } as MultiplePayment;
    rerender(<CardRequest request={lRequest} />);
    expect(
      getByText(
        `Fin du financement le ${format(
          new Date(
            (lRequest.subscriptionValidation as MultiplePayment).lastPayment
          ),
          'dd/MM/yyyy'
        )}`
      )
    ).toBeInTheDocument();
  });
  test('Displays card of a denied request', () => {
    const lRequest = request;
    lRequest.status = STATUS.REJECTED;
    const { rerender, getByText } = render(
      <BreakpointProvider queries={queries}>
        <CardRequest request={lRequest} />
      </BreakpointProvider>
    );
    expect(
      getByText(
        'Demandée le ' + format(new Date(lRequest.createdAt), 'dd/MM/yyyy')
      )
    ).toBeInTheDocument();
    expect(
      getByText(
        `Rejetée le ${format(
          new Date(lRequest.updatedAt!),
          "dd/MM/yyyy à H'h'mm"
        )}`
      )
    ).toBeInTheDocument();
    expect(
      getByText(REASON_REJECT_LABEL[lRequest.subscriptionRejection!.type])
    ).toBeInTheDocument();
    lRequest.subscriptionRejection!.type = REASON_REJECT_VALUE.MISSING_PROOF;
    rerender(
      <BreakpointProvider queries={queries}>
        <CardRequest request={lRequest} />
      </BreakpointProvider>
    );
    expect(
      getByText(REASON_REJECT_LABEL[lRequest.subscriptionRejection!.type])
    ).toBeInTheDocument();
    lRequest.subscriptionRejection!.type = REASON_REJECT_VALUE.INVALID_PROOF;
    rerender(
      <BreakpointProvider queries={queries}>
        <CardRequest request={lRequest} />
      </BreakpointProvider>
    );
    expect(
      getByText(REASON_REJECT_LABEL[lRequest.subscriptionRejection!.type])
    ).toBeInTheDocument();
    lRequest.subscriptionRejection = {
      type: REASON_REJECT_VALUE.OTHER,
      other: 'the reason',
    };
    rerender(
      <BreakpointProvider queries={queries}>
        <CardRequest request={lRequest} />
      </BreakpointProvider>
    );
    expect(getByText('Autre - the reason')).toBeInTheDocument();
  });
});
