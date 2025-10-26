export interface Quiz {
    id: number;
    title: string;
    description: string;
    questions: Question[];
    createdAt: string;
    updatedAt: string;
}

export interface Question {
    id: number;
    quizId: number;
    title: string;
    description: string;
    categoryId: number;
    time: number;

    // options: Option[];
    // correctOptionId: number;
    // createdAt: string;
    // updatedAt: string;
}