import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import RequestConfirm from './RequestConfirm';

afterEach(cleanup);
describe('<RequestConfirm />', () => {
  const renderComponent = () => {
    return render(<RequestConfirm />);
  };

  test('It should render the RequestConfirm and redirect to /administrer-demandes onClick', async () => {
    const utils = renderComponent();
    const redirectBtn = await utils.findByRole('button', {
      name: `Administrer d'autres aides`,
    });
    expect(redirectBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(redirectBtn);
    });
  });
});
