import React, { FC } from 'react';
import { PageProps } from 'gatsby';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';

import Layout from '@components/Layout/Layout';
import Heading from '@components/Heading/Heading';
import DemandesDashboard from './DemandesDashboard/DemandesDashboard';
import CitizenDashboard from './CitizenDashboard/CitizenDashboard';
import { useGetFunder } from '../../../utils/keycloakUtils';

import './_mon-dashboard.scss';

const MonDashboardPage: FC<PageProps> = ({ pageContext }) => {
  const { funderName } = useGetFunder();

  /**
   * VARIABLES
   *
   *
   *
   *
   */
  const {
    breadcrumb: { crumbs },
  } = pageContext;

  /**
   * RENDER
   *
   *
   *
   *
   */
  return (
    <Layout>
      <Breadcrumb crumbs={crumbs} crumbSeparator=" > " />

      <div className="mcm-mon-dashboard o-bg-wrapper-right">
        <Heading like="h2">Mon tableau de bord</Heading>
        <Heading like="h1">{funderName}</Heading>

        <div className="mcm-section">
          <DemandesDashboard />
        </div>

        <div className="mcm-section">
          <CitizenDashboard />
        </div>
      </div>
    </Layout>
  );
};

export default MonDashboardPage;
