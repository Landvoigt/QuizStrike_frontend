import { Answer } from "./answer.interface";
import { Category } from "./category.interface";

export interface Question {
    id: number;
    quizId: number;
    title: string;
    description: string;
    category: Category;
    time: number;
    points: number;
    image: string;
    transparent: boolean;
    answers: Answer[];
    active: boolean;
    created_at: string;
    updated_at: string;
}