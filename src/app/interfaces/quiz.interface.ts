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
    category_title: string;
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
    player: number;
    score: number;
    time: number;
    created_at: string;
    updated_at: string;
    justUpdated: boolean;
}

export interface Response {
    scoreId: number;
    questionId: number;
    answerId: number;
    time: number;
    created_at: string;
}

export class ResponseModel {
    player_name: string;
    question_id: number;
    answer_id: number;
    time: number;

    constructor(data: { player_name: string; question_id: number; answer_id: number; time?: number }) {
        this.player_name = data.player_name;
        this.question_id = data.question_id;
        this.answer_id = data.answer_id;
        this.time = data.time ?? 0;
    }
}

export interface Player {
    id: number;
    name: string;
    active: boolean;
    created_at: string;
}

export interface Game {
    exists: boolean;
    player_id: number;
    score_id: number;
    quiz_completed: boolean;
    answered_questions: number[];
    remaining_questions: Question[];
    quiz: Quiz;
}