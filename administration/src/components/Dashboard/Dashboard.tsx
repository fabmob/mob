import * as React from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';

const Dashboard: React.FC = () => (
  <Card>
    <CardHeader
      title={`Bienvenue sur le portail
      d'administration de Mon Compte Mobilité`}
    />
    <CardContent>
      Version : {process.env.REACT_APP_PACKAGE_VERSION || '1.0.0'}
    </CardContent>
  </Card>
);
export default Dashboard;
