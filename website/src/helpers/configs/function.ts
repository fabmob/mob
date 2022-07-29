export function mapListWithOptions(list: any[], optionsList: any[]): any[] {
  const newOptionList: any[] = [];
  list.forEach((el) => {
    let optionExist = false;
    optionsList.forEach((option) => {
      if (option.value === el) {
        newOptionList.push(option);
        optionExist = true;
      }
    });
    if (!optionExist) {
      newOptionList.push({ value: el, label: el });
    }
  });
  return newOptionList;
}

export function transformDateToInput(dateToInput: string): string {
  const date = dateToInput.split('-');
  return `${date[2]}/${date[1]}/${date[0]}`;
}
