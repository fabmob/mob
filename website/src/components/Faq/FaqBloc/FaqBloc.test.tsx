import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import FaqBloc from './FaqBloc';

describe('<FaqBloc />', () => {


    const blocTitle = "blocTitle";
    const questions = [{ title: "question", answer: "answer" }];

    test('renders FaqBloc with content', async () => {
        const { findByText, getByText } = render(
            <FaqBloc
                blocTitle={blocTitle}
                questions={questions}
            />
        );
        expect(getByText("blocTitle")).toBeInTheDocument();
        const showBlocBtn = await findByText('blocTitle');
        fireEvent.click(showBlocBtn);
        expect(await findByText('blocTitle')).toBeInTheDocument();
    });
});
