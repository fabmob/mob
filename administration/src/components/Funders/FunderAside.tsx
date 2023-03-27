/* eslint-disable */
import { Box, Card, CardContent, CardHeader, Typography } from "@material-ui/core";
import FunderMessages from '../../utils/Funder/fr.json';

export const AsideFunder = () => (
  <Box flex="1" marginLeft={'1em'}>
    <Card>
    <CardHeader title={FunderMessages["funder.administration.nationale.aside.title"]} />
      <CardContent>
        <Typography component={'span'} variant="body2">
          <p>{FunderMessages["funder.administration.nationale.aside.message1"]}</p>
          <p>{FunderMessages["funder.administration.nationale.aside.message2"]}</p>
          <p>{FunderMessages["funder.administration.nationale.aside.message3"]}</p>
        </Typography>
      </CardContent>
      <CardHeader title={FunderMessages["funder.collectivites.aside.title"]} />
      <CardContent>
        <Typography component={'span'} variant="body2">
          <p>{FunderMessages["funder.collectivites.aside.message1"]}</p>
          <p>{FunderMessages["funder.collectivites.aside.message2"]}</p>
        </Typography>
      </CardContent>
      <CardHeader title={FunderMessages["funder.entreprise.aside.title"]} />
      <CardContent>
        <Typography component={'span'} variant="body2">
          <p>{FunderMessages["funder.entreprise.aside.message1"]}</p>
          <p>{FunderMessages["funder.entreprise.aside.message2"]}</p>
          <p>{FunderMessages["funder.entreprise.aside.message3"]}</p>
          <p>{FunderMessages["funder.entreprise.aside.message4"]}</p>
        </Typography>
      </CardContent>
      <CardHeader title={FunderMessages["funder.client.aside.title"]}/>
      <CardContent>
        <Typography component={'span'} variant="body2">
          <p>{FunderMessages["funder.client.aside.message1"]}</p>
          <p>{FunderMessages["funder.client.aside.message2"]}</p>
        </Typography>
      </CardContent>

    </Card>
  </Box>
);