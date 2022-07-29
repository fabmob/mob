import * as React from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';

const Dashboard: React.FC = () => (
  <Card>
    <CardHeader title="Welcome to the administration" />
    <CardContent>Content de vous revoir</CardContent>
  </Card>
);
export default Dashboard;
