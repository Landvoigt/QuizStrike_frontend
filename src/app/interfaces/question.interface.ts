import { Answer } from "./answer.interface";

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
    transparent: boolean;
    answers: Answer[];
    active: boolean;
    created_at: string;
    updated_at: string;
}