import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import TabsMenu from './TabsMenu';

const info = 'Voici une information à afficher dans un encart !';
const tabs = [
  {
    id: 1,
    tabLabel: "Conditions d'obtention",
    tabContent:
      'Praefectus principum acrius ne alienae incitationem ea consiliis fluminis parum efferatus idque discrimina consiliis praetorio adversando Caesar Augustum multorum respectu adfectans altius iras impetu ad quibus instar praetorio idque quibus instar contumaciae ne incertum sed qua mox eum quoddam lateret creberrime Caesar vero vertenda evibrabat eius considerans Caesar instar ut idque considerans congrueret respectu mente parum potestates cum discrimina principum actus ad eius efferatus non parum fluminis eum actus ut creberrime ut mente lateret qua discrimina suae ne mente Augustum celsae quoque Augustum irrevocabili ad praesens potestates iurgandoque vel opposita sed ferebatur velut adrogantis vel eum eius salutis congrueret qua velut evibrabat eius adversando vexillum fluminis parum evibrabat mitigabat augeri celsae irrevocabili quoddam salutis rabiem altius iurgandoque considerans incertum praetorio erigens maturitate considerans qua aliquotiens adfectans sine ne praesens impetu congrueret evibrabat potius Augustum ad adversando molliverunt acrius ferebatur actus celsae rabiem eius evibrabat alienae ne evibrabat adfectans ipse creberrime ad adrogantis adversando maturitate incitationem iurgandoque congrueret ad mox rapidi molliverunt acrius irrevocabili multorum consiliis eius cum ingenii discrimina quoque docens molliverunt ipse vexillum vexillum ut lateret parum sed incertum praesens ut praetorio fluminis vel aliquotiens erigens quibus praetorio vel lateret irrevocabili praetorio vel mitigabat eius idque rabiem praetorio consiliis. Praefectus principum acrius ne alienae incitationem ea consiliis fluminis parum efferatus idque discrimina consiliis praetorio adversando Caesar Augustum multorum respectu adfectans altius iras impetu ad quibus instar praetorio idque quibus instar contumaciae ne incertum sed qua mox eum quoddam lateret creberrime Caesar vero vertenda evibrabat eius considerans Caesar instar ut idque considerans congrueret respectu mente parum potestates cum',
  },
  {
    id: 2,
    tabLabel: 'Modalités de versement',
    tabContent: 'NA 2',
  },
  {
    id: 3,
    tabLabel: "Montant de l'aide",
    tabContent: 'NA 3',
  },
];

describe('TabsMenu component', () => {
  it('should render correctly the tabs and their content', () => {
    const { getByText } = render(<TabsMenu tabs={tabs} />);

    expect(getByText("Conditions d'obtention")).toBeInTheDocument();
    expect(getByText('Modalités de versement')).toBeInTheDocument();
    expect(getByText("Montant de l'aide")).toBeInTheDocument();

    expect(getByText(tabs[0].tabContent).closest('div')).toHaveStyle(
      'display: block'
    );
    expect(getByText('NA 2').closest('div')).toHaveStyle('display: none');
    expect(getByText('NA 3').closest('div')).toHaveStyle('display: none');

    fireEvent.click(getByText('Modalités de versement'));
    expect(getByText(tabs[0].tabContent).closest('div')).toHaveStyle(
      'display: none'
    );
    fireEvent.click(getByText('Voir plus'));
    expect(getByText('Voir moins')).toBeInTheDocument();

    expect(getByText('NA 2').closest('div')).toHaveStyle('display: block');
    expect(getByText('NA 3').closest('div')).toHaveStyle('display: none');
  });

  it('should render correctly the info block when the block is passed', () => {
    const { getByText } = render(<TabsMenu tabs={tabs} info={info} />);
    expect(
      getByText('Voici une information à afficher dans un encart !')
    ).toBeInTheDocument();
  });
});
