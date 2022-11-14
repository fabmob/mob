import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import ContactForm from './ContactForm';
import axios from 'axios';
import { screen } from '@testing-library/dom';

jest.unmock('axios');

afterEach(cleanup);

const contactMock = {
  firstName: 'Roger',
  lastName: 'Dupond',
  userType: 'citoyen',
  birthdate: '2000-12-12',
  email: 'roger.dupond@tintin.fr',
  postcode: '68100',
  message: 'Voici mon message',
  tos: true,
};

const dataError = {
  errors: {
    id: 'contact.error.email.format',
    message: "L'email n'est pas au bon format",
    code: 20007,
  },
};

jest.mock('axios', () => {
  const mAxiosInstance = {
    post: jest
      .fn()
      .mockReturnValueOnce(
        // test  1
        Promise.resolve({
          data: contactMock,
        })
      )
      .mockReturnValueOnce(
        // test 2
        Promise.resolve({
          data: dataError,
        })
      )
      .mockRejectedValueOnce(
        // test 3
        Promise.resolve({
          data: contactMock,
        })
      ),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };
  return {
    create: jest.fn(() => mAxiosInstance),
  };
});

describe('<ContactForm />', () => {
  test('Submit form with contactMock', async () => {
    const { getByText, getByLabelText, getByTestId } = render(<ContactForm />);

    // fill the form
    await act(async () => {
      fireEvent.click(getByLabelText('Un.e citoyen.ne'));
    });
    await act(async () => {
      fireEvent.change(getByLabelText('Nom *'), {
        target: { value: contactMock.lastName },
      });
    });
    await act(async () => {
      fireEvent.change(getByLabelText('Prénom *'), {
        target: { value: contactMock.firstName },
      });
    });
    await act(async () => {
      fireEvent.change(getByLabelText('Email *'), {
        target: { value: contactMock.email },
      });
    });
    await act(async () => {
      fireEvent.change(getByLabelText('Code postal *'), {
        target: { value: contactMock.postcode },
      });
    });
    await act(async () => {
      fireEvent.click(getByTestId('checkbox-test').querySelector('#tos')!);
    });
    // submit
    await act(async () => {
      fireEvent.click(getByText('Envoyer'));
    });

    expect(axios.create).toHaveBeenCalledTimes(1);
  });

  test('Submit form with return error', async () => {
    const { getByText, getByLabelText, getByTestId } = render(<ContactForm />);

    // fill the form
    await act(async () => {
      fireEvent.click(getByLabelText('Un.e citoyen.ne'));
    });
    await act(async () => {
      fireEvent.change(getByLabelText('Nom *'), {
        target: { value: contactMock.lastName },
      });
    });
    await act(async () => {
      fireEvent.change(getByLabelText('Prénom *'), {
        target: { value: contactMock.firstName },
      });
    });
    await act(async () => {
      fireEvent.change(getByLabelText('Email *'), {
        target: { value: contactMock.email },
      });
    });
    await act(async () => {
      fireEvent.change(getByLabelText('Code postal *'), {
        target: { value: contactMock.postcode },
      });
    });
    await act(async () => {
      fireEvent.click(getByTestId('checkbox-test').querySelector('#tos')!);
    });
    // submit
    await act(async () => {
      fireEvent.click(getByText('Envoyer'));
    });

    expect(axios.create).toHaveBeenCalledTimes(1);
  });

  test('Submit form with return error', async () => {
    const { getByText, getByLabelText, getByTestId } = render(<ContactForm />);

    // fill the form
    await act(async () => {
      fireEvent.click(getByLabelText('Un.e citoyen.ne'));
    });
    await act(async () => {
      fireEvent.change(getByLabelText('Nom *'), {
        target: { value: contactMock.lastName },
      });
    });
    await act(async () => {
      fireEvent.change(getByLabelText('Prénom *'), {
        target: { value: contactMock.firstName },
      });
    });
    await act(async () => {
      fireEvent.change(getByLabelText('Email *'), {
        target: { value: contactMock.email },
      });
    });
    await act(async () => {
      fireEvent.change(getByLabelText('Code postal *'), {
        target: { value: contactMock.postcode },
      });
    });
    await act(async () => {
      fireEvent.click(getByTestId('checkbox-test').querySelector('#tos')!);
    });
    // submit
    await act(async () => {
      fireEvent.click(getByText('Envoyer'));
    });

    expect(axios.create).toHaveBeenCalledTimes(1);
  });
});
