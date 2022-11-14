import React, { FC } from 'react';
import ContactForm from '../components/Form/ContactForm/ContactForm';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';
import Layout from '../components/Layout/Layout';
import PartnerList from '../components/PartnerList/PartnerList';
import { partnersList } from '../utils/partners';
import SectionWithImage from '../components/SectionWithImage/SectionWithImage';
import Strings from './locale/fr.json';

interface RechercheProps {
  pageContext: { breadcrumb: { crumbs: string } };
}

const Recherche: FC<RechercheProps> = ({ pageContext }) => {
  const {
    breadcrumb: { crumbs },
  } = pageContext;

  return (
    <Layout
      footer={{
        imageFilename: 'man-riding-bike.jpg',
        isVisibleOnMobile: true,
      }}
      pageTitle={Strings['contact.title']}
    >
      <div className="mcm-contact">
        <Breadcrumb crumbs={crumbs} crumbSeparator=" > " />
        <SectionWithImage className="o-bg-wrapper" imgFilename="trees.jpg">
          <h1 className="mb-s">{Strings['contact.title']}</h1>
          <p className="mb-s">
            {Strings['contact.item1']}
          </p>
          <p className="mb-s">
            {Strings['contact.item2']}
          </p>
          <ContactForm />
        </SectionWithImage>
        <section>
          <h2 className="mb-m mt-m">{Strings['contact.all.partners']}</h2>
          <PartnerList partners={partnersList} />
        </section>
      </div>
    </Layout>
  );
};

export default Recherche;
