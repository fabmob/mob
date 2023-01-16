import React from 'react';
import { format } from 'date-fns';
import { cleanup, render, screen } from '@testing-library/react';

import {
  CitizenCard,
  renderIdentitySection,
  renderSectionItem,
} from './CitizenCard';

jest.mock('../../../../components/Image/Image.tsx');

afterEach(cleanup);

describe('SectionItem', () => {
  test('SectionItem: basic label', () => {
    const label = 'Ville';
    const value = 'Londres';

    const resultRender = renderSectionItem(label, value);
    render(resultRender);

    expect(screen.queryByText(label)).toBeTruthy();
    expect(screen.queryByText(value)).toBeTruthy();
  });
});

describe('IdentitySection', () => {
  const birthdate = new Date();
  const city = 'paris';
  const postcode = '31000';
  const email = 'email@email.com';
  const affiliation = {
    enterpriseId: 'string',
    enterpriseEmail: 'string',
    status: 'string',
  };

  test('IdentitySection: all fields are present', () => {
    const inputTest = {
      birthdate,
      city,
      postcode,
      email,
    };

    const resultRender = renderIdentitySection(inputTest);
    render(resultRender);

    expect(screen.queryByText('Identité')).toBeTruthy();
    expect(
      screen.queryByText(format(birthdate, 'dd/MM/yyyy').toString())
    ).toBeTruthy();
    expect(screen.queryByText(city)).toBeTruthy();
    expect(screen.queryByText(postcode)).toBeTruthy();
    expect(screen.queryByText(email)).toBeTruthy();
  });

  test('IdentitySection: without postcode', () => {
    const inputTest = {
      birthdate,
      city,
      email,
    };

    const resultRender = renderIdentitySection(inputTest);
    render(resultRender);

    expect(
      screen.queryByText(format(birthdate, 'dd/MM/yyyy').toString())
    ).toBeTruthy();
    expect(screen.queryByText(city)).toBeTruthy();
    expect(screen.queryByText(postcode)).not.toBeTruthy();
    expect(screen.queryByText(email)).toBeTruthy();
  });

  test('IdentitySection: without city', () => {
    const inputTest = {
      birthdate,
      postcode,
      email,
    };

    const resultRender = renderIdentitySection(inputTest);
    render(resultRender);

    expect(
      screen.queryByText(format(birthdate, 'dd/MM/yyyy').toString())
    ).toBeTruthy();
    expect(screen.queryByText(city)).not.toBeTruthy();
    expect(screen.queryByText(postcode)).toBeTruthy();
    expect(screen.queryByText(email)).toBeTruthy();
  });

  test('IdentitySection: without email', () => {
    const inputTest = {
      birthdate,
      postcode,
      city,
    };

    const resultRender = renderIdentitySection(inputTest);
    render(resultRender);

    expect(
      screen.queryByText(format(birthdate, 'dd/MM/yyyy').toString())
    ).toBeTruthy();
    expect(screen.queryByText(city)).toBeTruthy();
    expect(screen.queryByText(postcode)).toBeTruthy();
    expect(screen.queryByText(email)).not.toBeTruthy();
  });

  test('IdentitySection: without birthdate', () => {
    const inputTest = {
      email,
      postcode,
      city,
    };

    const resultRender = renderIdentitySection(inputTest);
    render(resultRender);

    expect(
      screen.queryByText(format(birthdate, 'dd/MM/yyyy').toString())
    ).not.toBeTruthy();
    expect(screen.queryByText(city)).toBeTruthy();
    expect(screen.queryByText(postcode)).toBeTruthy();
    expect(screen.queryByText(email)).toBeTruthy();
  });

  test('IdentitySection: with Professionnal Email', () => {
    const inputTest = { birthdate, city, postcode, email, affiliation };

    const resultRender = renderIdentitySection(inputTest);
    render(resultRender);

    expect(
      screen.queryByText(format(birthdate, 'dd/MM/yyyy').toString())
    ).toBeTruthy();
    expect(screen.queryByText(city)).toBeTruthy();
    expect(screen.queryByText(postcode)).toBeTruthy();
    expect(screen.queryByText(email)).toBeTruthy();
    expect(screen.queryByText(affiliation?.enterpriseEmail)).toBeTruthy();
  });

  test('IdentitySection: without Professionnal Email', () => {
    const inputTest = { birthdate, city, postcode, email };

    const resultRender = renderIdentitySection(inputTest);
    render(resultRender);

    expect(
      screen.queryByText(format(birthdate, 'dd/MM/yyyy').toString())
    ).toBeTruthy();
    expect(screen.queryByText(city)).toBeTruthy();
    expect(screen.queryByText(postcode)).toBeTruthy();
    expect(screen.queryByText(email)).toBeTruthy();
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});

describe('CitizenCard', () => {
  const birthdate = new Date();
  const city = 'paris';
  const postcode = '31000';
  const email = 'email@email.com';
  const firstName = 'firstName';
  const lastName = 'lastName';

  test('CitizenCard: all fields are present', () => {
    const inputTest = {
      birthdate,
      city,
      postcode,
      email,
      lastName,
      firstName,
    };

    render(<CitizenCard identity={inputTest} showSummary />);

    expect(screen.queryByText('Identité')).toBeTruthy();
    expect(
      screen.queryByText(format(birthdate, 'dd/MM/yyyy').toString())
    ).toBeTruthy();
    expect(screen.queryByText(city)).toBeTruthy();
    expect(screen.queryByText(postcode)).toBeTruthy();
    expect(screen.queryByText(email)).toBeTruthy();
    expect(screen.queryByText('Récapitulatif des demandes')).toBeTruthy();
  });
});
