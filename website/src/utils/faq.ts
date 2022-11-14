export interface Question {
  title: string;
  answer: string;
}

export interface Bloc {
  blocTitle: string;
  questions: Question[];
}

export interface Category {
  categoryTitle: string;
  bloc: Bloc[];
}