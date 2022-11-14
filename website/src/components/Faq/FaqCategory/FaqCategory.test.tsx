import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import FaqCategory from './FaqCategory';

describe('<FaqCategory />', () => {


    const categoryTitle = "test";
    const bloc = {blocTitle: "test", questions:[{ title: "test", answer: "test" }]};

    test('renders FaqCategory with content', async () => {
        const { findByText, getByText } = render(
            <FaqCategory
                categoryTitle={categoryTitle}
                bloc={bloc}
            />
        );
        expect(getByText('test')).toBeInTheDocument();
        const showCategorytBtn = await findByText('test');
        fireEvent.click(showCategorytBtn);
        expect(await findByText('test')).toBeInTheDocument();
    });
});
