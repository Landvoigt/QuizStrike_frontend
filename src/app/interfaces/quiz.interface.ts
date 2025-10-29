export interface Quiz {
    id: number;
    title: string;
    description: string;
    questions: Question[];
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Question {
    id: number;
    quizId: number;
    title: string;
    description: string;
    categoryId: number;
    time: number;
    points: number;
    image: string;
    answers: Answer[];
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Answer {
    id: number;
    questionId: number;
    text: string;
    correct: boolean;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    title: string;
    quizzes: Quiz[];
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Score {
    id: number;
    quizId: number;         
    playerId: number;
    score: number;
    time: number;
    created_at: string;
    updated_at: string;
}

export interface Response {
    scoreId: number;
    questionId: number;
    answerId: number;
    time: number;
    created_at: string;
}

export interface Player {
    id: number;
    name: string;
    active: boolean;
    created_at: string;
}