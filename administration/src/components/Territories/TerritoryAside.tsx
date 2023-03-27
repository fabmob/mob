/* eslint-disable */

import { Box, Card, CardContent, CardHeader, Typography } from "@material-ui/core";
import TerritoryMessages from '../../utils/Territory/fr.json';

export const Aside = () => (
  <Box flex="1" marginLeft={'1em'}>
    <Card>
      <CardHeader title={TerritoryMessages["territory.aside.title"]} />
      <CardContent>
        <Typography component={'span'} variant="body2">
          <p>{TerritoryMessages["territory.aside.scale.mandatory"]}</p>
          <p>{TerritoryMessages["territory.aside.inseeValueList.mandatory"]}</p>
          <ul>
            <li>{TerritoryMessages["territory.aside.inseeValueList.mandatory.list1"]}</li>
            <li>{TerritoryMessages["territory.aside.inseeValueList.mandatory.list2"]}</li>
            <li>{TerritoryMessages["territory.aside.inseeValueList.mandatory.list3"]}</li>
            <li>{TerritoryMessages["territory.aside.inseeValueList.mandatory.list4"]}</li>
            <li>{TerritoryMessages["territory.aside.inseeValueList.mandatory.list5"]}</li>
          </ul>
        </Typography>
      </CardContent>
    </Card>
  </Box>
);