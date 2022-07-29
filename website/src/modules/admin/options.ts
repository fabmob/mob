const options = {
  transportsOptions: [
    { value: 'transportsCommun', label: 'Transports en communs' },
    { value: 'velo', label: 'Vélo' },
    { value: 'voiture', label: 'Voiture' },
    { value: 'libreService', label: '2 ou 3 roues en libre-service' },
    { value: 'electrique', label: '2 ou 3 roues électrique' },
    { value: 'autopartage', label: 'Autopartage' },
    { value: 'covoiturage', label: 'Covoiturage' },
  ],

  funderOptions: [
    { value: 'AideNationale', label: 'Aide nationale' },
    { value: 'AideTerritoire', label: 'Aide de mon territoire' },
    { value: 'AideEmployeur', label: 'Aide de mon employeur' },
  ],

  attachments: [
    { value: 'identite', label: "Pièce d'Identité" },
    {
      value: 'justificatifDomicile',
      label: 'Justificatif de domicile de moins de 3 mois',
    },
    { value: 'certificatMedical', label: 'Certificat médical' },
    { value: 'rib', label: 'RIB' },
    { value: 'attestationHonneur', label: "Attestation sur l'Honneur" },
    { value: 'factureAchat', label: "Facture d'achat" },
    {
      value: 'certificatImmatriculation',
      label: "Certificat d'immatriculation",
    },
    { value: 'justificatifEmancipation', label: "Justificatif d'émancipation" },
    {
      value: 'impositionRevenu',
      label: "Dernier avis d'imposition sur le revenu",
    },
    {
      value: 'situationPoleEmploi',
      label: 'Dernier relevé de situation Pôle Emploi',
    },
    { value: 'certificatScolarite', label: 'Certificat de Scolarité' },
  ],
};
  export default options