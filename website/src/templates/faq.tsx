import React, { FC, useEffect, useState } from 'react';
import Layout from '@components/Layout/Layout';
import Strings from '../pages/locale/fr.json';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';
import FaqCategory from '../components/Faq/FaqCategory/FaqCategory';
import ScrollTopButton from '@components/ScrollTopButton/ScrollTopButton';
import { Category } from '../utils/faq';
import { matomoPageTracker } from '@utils/matomo';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import { graphql, PageProps } from 'gatsby';

interface FaqProps extends PageProps {
  pageContext: { breadcrumb: { crumbs: string } };
}
const faqPage: FC<FaqProps> = ({ pageContext, data }) => {
  const {
    breadcrumb: { crumbs },
  } = pageContext;
  const { trackPageView } = useMatomo();
  useEffect(() => {
    matomoPageTracker(trackPageView, 'Foire aux questions', 2);
    return () => {};
  }, []);
  const { frontmatter } = data.markdownRemark;
  const { faqItems } = frontmatter;

  return (
    <Layout
      footer={{
        imageFilename: 'man-riding-bike.jpg',
        isVisibleOnMobile: true,
      }}
    >
      <Breadcrumb crumbs={crumbs} crumbSeparator=" > " />
      <div className="mcm-informations-text mcm-CGU o-bg-wrapper">
        <h1 className="mb-m">{Strings['faq.page.title']}</h1>
        <div className="faq-container">
          {faqItems?.length > 0 && (
            <>
              {faqItems?.map((category: Category) => (
                <FaqCategory
                  key={category.categoryTitle}
                  categoryTitle={category.categoryTitle}
                  bloc={category.bloc}
                />
              ))}
            </>
          )}
        </div>
      </div>
      <ScrollTopButton />
    </Layout>
  );
};
export default faqPage;
export const queryFaq = graphql`
  query queryFaq($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        faqItems {
          categoryTitle
          bloc {
            blocTitle
            questions {
              title
              answer
            }
          }
        }
      }
    }
  }
`;
