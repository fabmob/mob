import React, { FC } from 'react';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';
import { graphql, PageProps } from 'gatsby';
import ReactMarkdown from 'react-markdown';
import Layout from '@components/Layout/Layout';
import ScrollTopButton from '@components/ScrollTopButton/ScrollTopButton';
import List from '@components/List/List';
import Button from '@components/Button/Button';
import Image from '@components/Image/Image';
import PartnerList from '@components/PartnerList/PartnerList';
import { partnersList } from '@utils/partners';
import SectionWithImage from '@components/SectionWithImage/SectionWithImage';
import Strings from './locale/fr.json';

interface Props extends PageProps {
  pageContext: { breadcrumb: { crumbs: string } };
}

const DecouvrirLeProjet: FC<Props> = ({ pageContext, data }) => {
  const {
    breadcrumb: { crumbs },
  } = pageContext;
  // @ts-ignore
  const { frontmatter } = data.markdownRemark;
  const {
    title: pageTitle,
    description: pageDescription,
    subtitle: pageSubtitle,
    subText: pageSubText,
    cardSection,
    linkSection,
  } = frontmatter;

  const renderCards = () => {
    return cardSection.cards.map(
      // @ts-ignore
      ({ title: cardTitle, subtitle, list, button }, index) => {
        const uniqueKey = `card-${index}`;

        return (
          <div key={uniqueKey} className="mcm-benefit-card">
            <h3 className="mcm-benefit-card__title h2">{cardTitle}</h3>
            <p className="mcm-benefit-card__desc">{subtitle}</p>
            <span className="mcm-benefit-card__list">
              <List items={list} marker="check" />
            </span>
            <span className="mcm-benefit-card__action">
              <Button>
                <a href={button.href}>{button.label}</a>
              </Button>
            </span>
          </div>
        );
      }
    );
  };
  const PDFLinks = () => {
    // @ts-ignore
    return linkSection.links.map(({ label, url }) => {
      const uniqueKey = `link-${label}`;
      // At least one of the two fields "file" or "url" must be filled to generate a link
      if (url) {
        return (
          <a
            key={uniqueKey}
            // If file is not defined, user has filled the URL field, we take its value instead.
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            {label}
          </a>
        );
      }
      return null;
    });
  };

  return (
    <Layout
      className="mcm-projet-page"
      fullWidth
      footer={{
        imageFilename: 'man-riding-bike.jpg',
        isVisibleOnMobile: false,
      }}
    >
      <div className="mcm-container__main">
        <Breadcrumb crumbs={crumbs} crumbSeparator=" > " />
        <SectionWithImage
          className="section-title o-bg-wrapper"
          imgFilename="trees.jpg"
        >
          <h1 className="mb-s">{pageTitle}</h1>
          <ReactMarkdown>{pageDescription}</ReactMarkdown>
        </SectionWithImage>
        <SectionWithImage imgFilename="woman-yellow-coat.jpg" imageLeft>
          <h2 className="mb-s">{pageSubtitle}</h2>
          <ReactMarkdown>{pageSubText}</ReactMarkdown>
        </SectionWithImage>
      </div>

      <div className="mcm-panel mcm-panel--benefits highlighting">
        <div className="mcm-container__main">
          <h2 className="heading">
            <Image filename="social.svg" />
            <span className="sectionContent">{cardSection.title}</span>
          </h2>
          {cardSection && <div className="mcm-benefits">{renderCards()}</div>}
        </div>
      </div>

      <div className="mcm-container__main">
        {linkSection && (
          <div className="mcm-panel mcm-panel--resources">
            <h2 className="heading">
              <Image filename="docs.svg" />
              <span className="sectionContent">{linkSection.title}</span>
            </h2>
            <List items={PDFLinks()} marker="arrow" relaxed />
          </div>
        )}
        <div className="mob-pattern">
          <div className="mob-pattern__svg" />
        </div>

        <h2 className="mb-m mt-m">{Strings['project.partner']}</h2>
        <PartnerList partners={partnersList} />
      </div>
      <ScrollTopButton />
    </Layout>
  );
};

export default DecouvrirLeProjet;

export const queryProjet = graphql`
  query queryProjet($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        title
        description
        subtitle
        subText
        cardSection {
          title
          cards {
            title
            subtitle
            list
            button {
              href
              label
            }
          }
        }
        linkSection {
          title
          links {
            label
            url
          }
        }
      }
    }
  }
`;
