import { Quiz } from "./quiz.interface";

export interface Category {
    id: number;
    title: string;
    quizzes: Quiz[];
    image: string;
    transparent: boolean;
    active: boolean;
    created_at: string;
    updated_at: string;
}