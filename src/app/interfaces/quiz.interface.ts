import { Question } from "./question.interface";

export interface Quiz {
    id: number;
    title: string;
    description: string;
    questions: Question[];
    active: boolean;
    created_at: string;
    updated_at: string;
}