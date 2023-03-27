/* eslint-disable */

import { Box, Card, CardContent, CardHeader, Typography } from "@material-ui/core";
import CommuityMessage from '../../utils/Community/fr.json';

export const AsideCommunity = () => (
  <Box flex="1" marginLeft={'1em'}>
    <Card>
      <CardHeader title={CommuityMessage["communities.aside.title"]} />
      <CardContent>
        <Typography component={'span'} variant="body2">
          <p>{CommuityMessage["communities.aside.message1"]}</p>
          <p>{CommuityMessage["communities.aside.message2"]}</p>
          <p>{CommuityMessage["communities.aside.message3"]}</p>

        </Typography>
      </CardContent>
    </Card>
  </Box>
);