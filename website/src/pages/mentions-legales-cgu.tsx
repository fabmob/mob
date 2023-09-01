import React, { FC } from 'react';
import { Link } from 'gatsby';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';
import Layout from '../components/Layout/Layout';
import ScrollTopButton from '../components/ScrollTopButton/ScrollTopButton';
import Strings from './locale/fr.json';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
        <h1 className="mb-s">{Strings['cgu.title']}</h1>
        <p>{Strings['cgu.welcome.title']}</p>
        <p>
          <b>{Strings['cgu.infos.title']}</b>
        </p>
        <p>
          {Strings['cgu.infos.part1.line1']}
          <br></br>
          {Strings['cgu.infos.part1.line2']}
          <br></br>
          {Strings['cgu.infos.part1.line3']}
          <br></br>
          {Strings['cgu.infos.part1.line4']}
        </p>
        <p>{Strings['cgu.infos.and']}</p>
        <p>
          {Strings['cgu.infos.part2.line1']}
          <br></br>
          {Strings['cgu.infos.part2.line2']}
          <br></br>
          {Strings['cgu.infos.part2.line3']}
          <br></br>
          {Strings['cgu.infos.part2.line4']}
        </p>
        <p>
          <b>{Strings['cgu.infos.host']}</b>
        </p>
        <p>
          {Strings['cgu.infos.host.line1']}
          <br></br>
          {Strings['cgu.infos.host.line2']}
          <br></br>
          {Strings['cgu.infos.host.line3']}
        </p>

        <h2>{Strings['cgu.infos.mob.title']}</h2>
        <p>{Strings['cgu.infos.mob.parag1']}</p>
        <p>{Strings['cgu.infos.mob.parag2']}</p>
        <ul className="list-style">
          <li>{Strings['cgu.infos.mob.list.part1']}</li>
          <li>{Strings['cgu.infos.mob.list.part2']}</li>
        </ul>
        <p>{Strings['cgu.infos.mob.parag3']}</p>
        <p>{Strings['cgu.infos.mob.parag4']}</p>
        <p>{Strings['cgu.infos.mob.parag5']}</p>

        <h2>{Strings['cgu.part1.title']}</h2>
        <p>{Strings['cgu.part1.paragraphe1']}</p>
        <p>{Strings['cgu.part1.paragraphe2']}</p>
        <p>{Strings['cgu.part1.paragraphe3']}</p>
        <p>{Strings['cgu.part1.paragraphe4']}</p>

        <h2>{Strings['cgu.part2.title']}</h2>
        <p>{Strings['cgu.part2.paragraphe1']}</p>
        <ul>
          <li>
            <b>{Strings['cgu.part2.paragraphe1.line1']}</b>
            {Strings['cgu.part2.paragraphe2']}
          </li>
          <li>
            <b>{Strings['cgu.part2.paragraphe1.line2']}</b>
            {Strings['cgu.part2.paragraphe3']}
          </li>
          <li>
            <b>{Strings['cgu.part2.paragraphe1.line3']}</b>
            {Strings['cgu.part2.paragraphe4']}
          </li>
          <li>
            <b>{Strings['cgu.part2.paragraphe1.line4']}</b>
            {Strings['cgu.part2.paragraphe5']}
          </li>
          <li>
            <b>{Strings['cgu.part2.paragraphe1.line5']}</b>
            {Strings['cgu.part2.paragraphe6']}
          </li>
          <li>
            <b>{Strings['cgu.part2.paragraphe1.line6']}</b>
            {Strings['cgu.part2.paragraphe7']}
          </li>
          <li>
            <b>{Strings['cgu.part2.paragraphe1.line7']}</b>
            {Strings['cgu.part2.paragraphe8.part1']}
            <Link
              id="mentions-legales-charte"
              to="/"
              className="link-in-text_blue"
            >
              {Strings['cgu.part2.paragraphe8.link']}
            </Link>
            {Strings['cgu.part2.paragraphe8.part2']}
          </li>
          <li>
            <b>{Strings['cgu.part2.paragraphe1.line8']}</b>
            {Strings['cgu.part2.paragraphe9']}
          </li>
          <li>
            <b>{Strings['cgu.part2.paragraphe1.line9']}</b>
            {Strings['cgu.part2.paragraphe10']}
          </li>
          <li>
            <b>{Strings['cgu.part2.paragraphe1.line10']}</b>
            {Strings['cgu.part2.paragraphe11']}
          </li>
          <li>
            <b>{Strings['cgu.part2.paragraphe1.line11']}</b>
            {Strings['cgu.part2.paragraphe12']}
          </li>
        </ul>

        <h2>{Strings['cgu.part3.title']}</h2>
        <p>
          {Strings['cgu.part3.paragraphe1.part1']}
          {Strings['cgu.part3.paragraphe1.part2']}
          {Strings['cgu.part3.paragraphe1.part3']}
        </p>
        <p>{Strings['cgu.part3.paragraphe2']}</p>
        <p>{Strings['cgu.part3.paragraphe3']}</p>
        <ul>
          <li>{Strings['cgu.part3.paragraphe3.list1']}</li>
          <li>{Strings['cgu.part3.paragraphe3.list2']}</li>
          <li>{Strings['cgu.part3.paragraphe3.list3']}</li>
        </ul>
        <p>{Strings['cgu.part3.paragraphe4']}</p>
        <ul>
          <li>{Strings['cgu.part3.paragraphe4.list1']}</li>
          <li>{Strings['cgu.part3.paragraphe4.list2']}</li>
          <li>{Strings['cgu.part3.paragraphe4.list3']}</li>
          <li>{Strings['cgu.part3.paragraphe4.list4']}</li>
          <li>{Strings['cgu.part3.paragraphe4.list5']}</li>
          <li>{Strings['cgu.part3.paragraphe4.list6']}</li>
          <li>{Strings['cgu.part3.paragraphe4.list7']}</li>
        </ul>
        <p>{Strings['cgu.part3.paragraphe5']}</p>
        <ul>
          <li>{Strings['cgu.part3.paragraphe5.list1']}</li>
          <li>{Strings['cgu.part3.paragraphe5.list2']}</li>
          <li>{Strings['cgu.part3.paragraphe5.list3']}</li>
          <li>{Strings['cgu.part3.paragraphe5.list4']}</li>
          <li>{Strings['cgu.part3.paragraphe5.list5']}</li>
          <li>{Strings['cgu.part3.paragraphe5.list6']}</li>
        </ul>

        <h2>{Strings['cgu.part4.title']}</h2>
        <p>{Strings['cgu.part4.paragraphe1']}</p>
        <p>{Strings['cgu.part4.paragraphe2']}</p>
        <p>{Strings['cgu.part4.paragraphe3']}</p>
        <ul>
          <li>{Strings['cgu.part4.list1']}</li>
          <li>{Strings['cgu.part4.list2']}</li>
          <li>{Strings['cgu.part4.list3']}</li>
        </ul>
        <p>{Strings['cgu.part4.paragraphe4']}</p>

        <h2>{Strings['cgu.part5.title']}</h2>
        <p>
          <b>{Strings['cgu.part5.paragraphe.part1']}</b>
          {Strings['cgu.part5.paragraphe.part2']}
          <b>{Strings['cgu.part5.paragraphe.part3']}</b>
          {Strings['cgu.part5.paragraphe.part4']}
          <b>{Strings['cgu.part5.paragraphe.part5']}</b>
          {Strings['cgu.part5.paragraphe.part6']}
        </p>

        <h2>{Strings['cgu.part6.title']}</h2>
        <p>{Strings['cgu.part6.paragraphe1']}</p>
        <p>{Strings['cgu.part6.paragraphe2']}</p>
        <ReactMarkdown
          children={Strings['cgu.part6.paragraphe3']}
          remarkPlugins={[remarkGfm]}
        />
        <p>{Strings['cgu.part6.paragraphe4']}</p>

        <h2>{Strings['cgu.part7.title']}</h2>
        <p>{Strings['cgu.part7.paragraphe1']}</p>
        <p>
          {Strings['cgu.part7.paragraphe2.line1']}
          <b>{Strings['cgu.part7.paragraphe2.line2']}</b>
          {Strings['cgu.part7.paragraphe2.line3']}
          <b>{Strings['cgu.part7.paragraphe2.line4']}</b>
          {Strings['cgu.part7.paragraphe2.line5']}
        </p>
        <p>
          {Strings['cgu.part7.paragraphe3.line1']}
          <b>{Strings['cgu.part7.paragraphe3.line2']}</b>
          {Strings['cgu.part7.paragraphe3.line3']}
        </p>
        <h2>{Strings['cgu.part8.title']}</h2>
        <p>
          {Strings['cgu.part8.paragraphe1']}{' '}
          <Link
            id="mentions-legales-charte"
            to="/charte-protection-donnees-personnelles"
            className="link-in-text_blue"
          >
            {Strings['cgu.part8.paragraphe1.link']}
          </Link>
        </p>
        <h2>{Strings['cgu.part9.title']}</h2>
        <p>
          <b>{Strings['cgu.part9.paragraphe1.line1']}</b>
          {Strings['cgu.part9.paragraphe1.line2']}
          <b>{Strings['cgu.part9.paragraphe1.line3']}</b>
          {Strings['cgu.part9.paragraphe1.line4']}
        </p>
        <h2>{Strings['cgu.part10.title']}</h2>
        <p>{Strings['cgu.part10.paragraphe1']}</p>
        <ReactMarkdown
          children={Strings['cgu.part10.paragraphe2']}
          remarkPlugins={[remarkGfm]}
        />

        <h2>{Strings['cgu.part11.title']}</h2>
        <p>{Strings['cgu.part11.paragraphe1.line1']}</p>
        <p>{Strings['cgu.part11.paragraphe1.line2']}</p>
      </div>
      <ScrollTopButton />
    </Layout>
  );
};

export default CGU;
