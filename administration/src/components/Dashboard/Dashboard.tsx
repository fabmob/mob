import * as React from 'react';
import { Card, CardContent, CardHeader, Typography } from '@material-ui/core';
import DashbordMessages from '../../utils/Dashboard/fr.json';

/* eslint-disable */
const Dashboard: React.FC = () => (
  <Card>
    <CardHeader
      title={`Bienvenue sur le portail
      d'administration de Mon Compte Mobilité`}
    />
    <CardContent>
      <Typography component={'span'} variant="body2">
          <p>{DashbordMessages['dashbord.tittle']}</p>
          <p>{DashbordMessages['dashbord.global']}</p>
          <ul>
            <li>{DashbordMessages['dashbord.global.list1']}</li>
            <li>{DashbordMessages['dashbord.global.list2']}</li>
            <li>{DashbordMessages['dashbord.global.list3']}</li>
            <li>{DashbordMessages['dashbord.global.list4']}</li>
          </ul>
          <p>{DashbordMessages['dashbord.create.territories']}</p>
          <ol>
            <li>{DashbordMessages['dashbord.create.territories.list1']}</li>
            <li>{DashbordMessages['dashbord.create.territories.list2']}</li>
            <li>{DashbordMessages['dashbord.create.territories.list3']}</li>
            <li>{DashbordMessages['dashbord.create.territories.list4']}</li>
          </ol>
          <p>{DashbordMessages['dashbord.create.entreprises']}</p>
          <ol>
            <li>{DashbordMessages['dashbord.create.entreprises.list1']}</li>
            <li>{DashbordMessages['dashbord.create.entreprises.list2']}</li>
            <li>{DashbordMessages['dashbord.create.entreprises.list3']}</li>
            <li>{DashbordMessages['dashbord.create.entreprises.list4']}</li>
          </ol>
          </Typography>
      Version : {process.env.REACT_APP_PACKAGE_VERSION || '1.0.0'}
    </CardContent>
  </Card>
);
export default Dashboard;
