/* eslint-disable */

import { Box, Card, CardContent, CardHeader, Typography } from "@material-ui/core";
import UtilisateurMessages from '../../utils/Utilisateur/fr.json';

export const AsideUtilisateur = () => (
  <Box flex="1" marginLeft={'1em'}>
    <Card>
      <CardHeader title={UtilisateurMessages["utilisateur.aside.title"]} />
      <CardContent>
        <Typography component={'span'} variant="body2">
          <p>{UtilisateurMessages["utilisateur.aside.message1"]}</p>
          <p>{UtilisateurMessages["utilisateur.aside.message2"]}</p>
          <p>{UtilisateurMessages["utilisateur.aside.message3"]}</p>
          <p>{UtilisateurMessages["utilisateur.aside.message4"]}</p>

          
        </Typography>
      </CardContent>
    </Card>
  </Box>
);