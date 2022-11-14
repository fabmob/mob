import React, { FC, useEffect, useState } from 'react';
import { Link } from 'gatsby';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import Layout from '@components/Layout/Layout';
import ScrollTopButton from '@components/ScrollTopButton/ScrollTopButton';

import Strings from './locale/fr.json';
import Checkbox from '../components/Checkbox/Checkbox';

interface PersonalDataInfosProps {
  pageContext: { breadcrumb: { crumbs: string } };
}

const PersonalDataInfos: FC<PersonalDataInfosProps> = ({ pageContext }) => {
  const [isExclude, setIsExclude] = useState<boolean>(
    localStorage.getItem('excludeTraking') === 'true' ? true : false
  );

  // the form data protection text
  const CheckBoxInOfDataProtection = () => {
    return (
      <p>
        {`${Strings['consent.data.out.check']} `}
        <span aria-hidden="true"> *</span>
      </p>
    );
  };
  const CheckBoxOutOfDataProtection = () => {
    return <p>{`${Strings['consent.data.in.check']} `}</p>;
  };

  // Check if the user have consent before to tracking
  useEffect(() => {
    const consentTracking = localStorage.getItem('excludeTraking');
    consentTracking === 'true' ? setIsExclude(true) : setIsExclude(false);
  }, []);

  // If the user don't want to be tracking concent true
  const { pushInstruction } = useMatomo();
  const MatomoConsentComponent: FC = () => (
    <>
      <div className="checkbox-radio">
        {isExclude ? (
          <>
            <p>{`${Strings['consent.description.data.out.analytics']} `}</p>
            <Checkbox
              type="checkbox"
              id="checkIn"
              checked={false}
              name="exclude1"
              onChange={() => {
                setIsExclude(false);
                pushInstruction('forgetUserOptOut');
                localStorage.setItem('excludeTraking', 'false');
              }}
              children={<CheckBoxInOfDataProtection />}
            />
          </>
        ) : (
          <>
            <p>{`${Strings['consent.description.data.in.analytics']} `}</p>
            <Checkbox
              type="checkbox"
              id="checkOut"
              checked={true}
              name="exclude2"
              onChange={() => {
                setIsExclude(true);
                pushInstruction('optUserOut');
                localStorage.setItem('excludeTraking', 'true');
              }}
              children={<CheckBoxOutOfDataProtection />}
            />
          </>
        )}
      </div>
    </>
  );

  const {
    breadcrumb: { crumbs },
  } = pageContext;

  return (
    <Layout>
      <Breadcrumb crumbs={crumbs} crumbSeparator=" > " />
      <div className="mcm-informations-text mcm-personal-data o-bg-wrapper">
        <h1 className="mb-s">{Strings['personal.data.title']}</h1>

        <h2>{Strings['personal.data.part1.title']}</h2>
        <p>{Strings['personal.data.part1.paragraphe1']}</p>
        <p>{Strings['personal.data.part1.paragraphe2']}</p>

        <h2>{Strings['personal.data.part2.title']}</h2>
        <p>{Strings['personal.data.part2.paragraphe1']}</p>
        <p>{Strings['personal.data.part2.paragraphe2.description']} </p>
        <ul>
          <li>{Strings['personal.data.part2.paragraphe2.item1']}</li>
          <li>{Strings['personal.data.part2.paragraphe2.item2']} </li>
          <li>{Strings['personal.data.part2.paragraphe2.item3']}</li>
        </ul>
        <p>{Strings['personal.data.part2.paragraphe3.description']} </p>
        <ul>
          <li>{Strings['personal.data.part2.paragraphe3.item1']} </li>
          <li>{Strings['personal.data.part2.paragraphe3.item2']}</li>
          <li>{Strings['personal.data.part2.paragraphe3.item3']} </li>
          <li>{Strings['personal.data.part2.paragraphe3.item4']} </li>
        </ul>
        <p>{Strings['personal.data.part2.paragraphe3']}</p>

        <h2>{Strings['personal.data.part3.title']}</h2>
        <p>{Strings['personal.data.part3.paragraphe1']}</p>
        <p>{Strings['personal.data.part3.paragraphe2']}</p>
        <p>{Strings['personal.data.part3.paragraphe3']}</p>

        <h2>{Strings['personal.data.part4.title']}</h2>
        <p>{Strings['personal.data.part4.paragraphe1']}</p>
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
        <p>{Strings['personal.data.part4.paragraphe3']}</p>
        <p>{Strings['personal.data.part4.paragraphe4']}</p>
        <p>{Strings['personal.data.part4.paragraphe5']}</p>

        <h2>{Strings['personal.data.part5.title']}</h2>
        <p>{Strings['personal.data.part5.paragraphe1.description']}</p>
        <ul>
          <li>{Strings['personal.data.part5.paragraphe1.item1']}</li>
          <li>{Strings['personal.data.part5.paragraphe1.item2']}</li>
          <li>{Strings['personal.data.part5.paragraphe1.item3']}</li>
          <li>{Strings['personal.data.part5.paragraphe1.item4']}</li>
          <li>{Strings['personal.data.part5.paragraphe1.item5']}</li>
          <li>{Strings['personal.data.part5.paragraphe1.item6']}</li>
          <li>{Strings['personal.data.part5.paragraphe1.item7']}</li>
        </ul>
         <ReactMarkdown
          children={Strings['personal.data.part5.paragraphe2']}
          remarkPlugins={[remarkGfm]}
        />
        <p>{Strings['personal.data.part5.paragraphe3']}</p>

        <h2>{Strings['personal.data.part6.title']}</h2>
        <p>{Strings['personal.data.part6.paragraphe1']}</p>

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

        <h2>{Strings['personal.data.part8.title']}</h2>
        <MatomoConsentComponent />
      </div>

      <ScrollTopButton />
    </Layout>
  );
};

export default PersonalDataInfos;
