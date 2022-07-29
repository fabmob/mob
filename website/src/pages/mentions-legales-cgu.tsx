import React, { FC } from 'react';
import { Link } from 'gatsby';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';
import Layout from '../components/Layout/Layout';
import ScrollTopButton from '../components/ScrollTopButton/ScrollTopButton';
import Strings from './locale/fr.json';

interface CGUProps {
  pageContext: { breadcrumb: { crumbs: string } };
}

const CGU: FC<CGUProps> = ({ pageContext }) => {
  const {
    breadcrumb: { crumbs },
  } = pageContext;

  return (
    <Layout>
      <Breadcrumb crumbs={crumbs} crumbSeparator=" > " />
      <div className="mcm-informations-text mcm-CGU o-bg-wrapper">
        <h1 className="mb-s">
          {Strings['cgu.title']}
        </h1>

        <p>
          <b>{Strings['cgu.infos.title']}</b>
        </p>
        <p>
          {Strings['cgu.infos.part1.line1']}<br></br>
          {Strings['cgu.infos.part1.line2']}<br></br>
          {Strings['cgu.infos.part1.line3']}<br></br>
          {Strings['cgu.infos.part1.line4']}<br></br>
          {Strings['cgu.infos.part1.line5']}
        </p>
        <p>{Strings['cgu.infos.and']}</p>
        <p>
          {Strings['cgu.infos.part2.line1']}<br></br>
          {Strings['cgu.infos.part2.line2']}
        </p>
        <p>
          <b>{Strings['cgu.infos.host']}</b>
        </p>
        <p>
          {Strings['cgu.infos.host.line1']}<br></br>
          {Strings['cgu.infos.host.line2']}<br></br>
          {Strings['cgu.infos.host.line3']}<br></br>
          {Strings['cgu.infos.host.line4']}
        </p>

        <h2>{Strings['cgu.part1.title']}</h2>
        <p>
          {Strings['cgu.part1.paragraphe1']}
        </p>

        <h2>{Strings['cgu.part2.title']}</h2>
        <p>
          {Strings['cgu.part2.paragraphe1']}
        </p>

        <h2>{Strings['cgu.part3.title']}</h2>
        <p>
          <b>
            {Strings['cgu.part3.paragraphe1.line1']}
          </b>
          {Strings['cgu.part3.paragraphe1.line2']}{' '}
          <b>{Strings['cgu.part3.paragraphe1.line3']}</b>
          {Strings['cgu.part3.paragraphe1.line4']}{' '}
          <b>{Strings['cgu.part3.paragraphe1.line5']}</b>
          {Strings['cgu.part3.paragraphe1.line6']}
        </p>

        <h2>{Strings['cgu.part4.title']}</h2>
        <p>
          {Strings['cgu.part4.paragraphe1']}
        </p>
        <p>
          {Strings['cgu.part4.paragraphe2']}
        </p>
        <p>
          {Strings['cgu.part4.paragraphe3']}
        </p>
        <p>
          {Strings['cgu.part4.paragraphe4']}
        </p>
        <p>
          {Strings['cgu.part4.paragraphe5']}
        </p>
        <p>
          {Strings['cgu.part4.paragraphe6']}
        </p>

        <h2>{Strings['cgu.part5.title']}</h2>
        <p>
          {Strings['cgu.part5.paragraphe1']}
        </p>
        <p>
          {Strings['cgu.part5.paragraphe2.line1']}
          <b>{Strings['cgu.part5.paragraphe2.line2']}</b>
          {Strings['cgu.part5.paragraphe2.line3']}
          <b>{Strings['cgu.part5.paragraphe2.line4']}</b>
          {Strings['cgu.part5.paragraphe2.line5']}
        </p>
        <p>
          {Strings['cgu.part5.paragraphe3.line1']}
          <br></br>
          {Strings['cgu.part5.paragraphe3.line2']}{' '}
          <b>
            {Strings['cgu.part5.paragraphe3.line3']}
          </b>
          {Strings['cgu.part5.paragraphe3.line4']}
        </p>

        <h2>{Strings['cgu.part6.title']}</h2>
        <p>
          {Strings['cgu.part6.paragraphe1']}{' '}
          <Link
            id="mentions-legales-charte"
            to="/charte-protection-donnees-personnelles"
            className="link-in-text_blue"
          >
            {Strings['cgu.part6.paragraphe1.link']}
          </Link>
          .
        </p>

        <h2>{Strings['cgu.part7.title']}</h2>
        <p>
          <b>
            {Strings['cgu.part7.paragraphe1.line1']}
          </b>
          {Strings['cgu.part7.paragraphe1.line2']}
          <b>{Strings['cgu.part7.paragraphe1.line3']}</b>
          {Strings['cgu.part7.paragraphe1.line4']}
        </p>

        <h2>{Strings['cgu.part8.title']}</h2>
        <p>
          {Strings['cgu.part8.paragraphe1.line1']}{' '}
          <b>
            {Strings['cgu.part8.paragraphe1.line2']}
          </b>
          {Strings['cgu.part8.paragraphe1.line3']}
        </p>

        <h2>{Strings['cgu.part9.title']}</h2>
        <p>
          <b>
            {Strings['cgu.part9.paragraphe1.line1']}
          </b>{' '}
          {Strings['cgu.part9.paragraphe1.line2']}{' '}
          <b>{Strings['cgu.part9.paragraphe1.line3']}</b>
          {Strings['cgu.part9.paragraphe1.line4']}
        </p>
      </div>
      <ScrollTopButton />
    </Layout>
  );
};

export default CGU;
