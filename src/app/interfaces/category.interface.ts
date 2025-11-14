import { Quiz } from "./quiz.interface";

export interface Category {
    id: number;
    title: string;
    quizzes: Quiz[];
    active: boolean;
    created_at: string;
    updated_at: string;
}