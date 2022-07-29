import React, { FC } from 'react';
import { Link } from 'gatsby';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';
import Layout from '../components/Layout/Layout';
import ScrollTopButton from '../components/ScrollTopButton/ScrollTopButton';
import Strings from './locale/fr.json';

interface PersonalDataInfosProps {
  pageContext: { breadcrumb: { crumbs: string } };
}

const PersonalDataInfos: FC<PersonalDataInfosProps> = ({ pageContext }) => {
  const {
    breadcrumb: { crumbs },
  } = pageContext;

  return (
    <Layout>
      <Breadcrumb crumbs={crumbs} crumbSeparator=" > " />
      <div className="mcm-informations-text mcm-personal-data o-bg-wrapper">
        <h1 className="mb-s">{Strings['personal.data.title']}</h1>

        <h2>{Strings['personal.data.part1.title']}</h2>
        <p>
          {Strings['personal.data.part1.paragraphe1']}
        </p>
        <p>
          {Strings['personal.data.part1.paragraphe2']}
        </p>

        <h2>{Strings['personal.data.part2.title']}</h2>
        <p>
          {Strings['personal.data.part2.paragraphe1']}
        </p>
        <p>
          {Strings['personal.data.part2.paragraphe2.description']}{' '}
        </p>
        <ul>
          <li>
            {Strings['personal.data.part2.paragraphe2.item1']}
          </li>
          <li>
            {Strings['personal.data.part2.paragraphe2.item2']}{' '}
          </li>
          <li>{Strings['personal.data.part2.paragraphe2.item3']}</li>
        </ul>
        <p>
          {Strings['personal.data.part2.paragraphe3.description']}{' '}
        </p>
        <ul>
          <li>
            {Strings['personal.data.part2.paragraphe3.item1']}{' '}
          </li>
          <li>{Strings['personal.data.part2.paragraphe3.item2']}</li>
          <li>
            {Strings['personal.data.part2.paragraphe3.item3']}{' '}
          </li>
          <li>
            {Strings['personal.data.part2.paragraphe3.item4']}{' '}
          </li>
        </ul>
        <p>
          {Strings['personal.data.part2.paragraphe3']}
        </p>

        <h2>{Strings['personal.data.part3.title']}</h2>
        <p>
          {Strings['personal.data.part3.paragraphe1']}
        </p>
        <p>
          {Strings['personal.data.part3.paragraphe2']}
        </p>
        <p>
          {Strings['personal.data.part3.paragraphe3']}
        </p>

        <h2>{Strings['personal.data.part4.title']}</h2>
        <p>
          {Strings['personal.data.part4.paragraphe1']}
        </p>
        <p>
          {Strings['personal.data.part4.paragraphe2']}{' '}
          <a
            id="go-capgemini-go"
            href="https://www.capgemini.com/wp-content/uploads/2017/06/Capgemini-Binding-Corporate-Rules.pdf"
            className="link-in-text_blue"
            target="_blank"
          >
            {Strings['personal.data.part4.paragraphe2.link']}
          </a>
          .
        </p>
        <p>
          {Strings['personal.data.part4.paragraphe3']}
        </p>
        <p>
          {Strings['personal.data.part4.paragraphe4']}
        </p>
        <p>
          {Strings['personal.data.part4.paragraphe5']}
        </p>

        <h2>{Strings['personal.data.part5.title']}</h2>
        <p>
          {Strings['personal.data.part5.paragraphe1.description']}
        </p>
        <ul>
          <li>
            {Strings['personal.data.part5.paragraphe1.item1']}
          </li>
          <li>
            {Strings['personal.data.part5.paragraphe1.item2']}
          </li>
          <li>
            {Strings['personal.data.part5.paragraphe1.item3']}
          </li>
          <li>
            {Strings['personal.data.part5.paragraphe1.item4']}
          </li>
          <li>
            {Strings['personal.data.part5.paragraphe1.item5']}
          </li>
          <li>
            {Strings['personal.data.part5.paragraphe1.item6']}
          </li>
          <li>
            {Strings['personal.data.part5.paragraphe1.item7']}
          </li>
        </ul>
        <p>
          {Strings['personal.data.part5.paragraphe2']}
        </p>
        <p>
          {Strings['personal.data.part5.paragraphe3']}
        </p>

        <h2>{Strings['personal.data.part6.title']}</h2>
        <p>
          {Strings['personal.data.part6.paragraphe1']}
        </p>

        <h2>{Strings['personal.data.part7.title']}</h2>
        <p>
          {Strings['personal.data.part7.paragraphe1']}{' '}
          <Link
            id="politique-gestion-cookies"
            to="/politique-gestion-cookies"
            className="link-in-text_blue"
          >
            {Strings['personal.data.part7.paragraphe1.link']}
          </Link>
          .
        </p>
      </div>
      <ScrollTopButton />
    </Layout>
  );
};

export default PersonalDataInfos;
