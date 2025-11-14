export interface Answer {
    id: number;
    questionId: number;
    text: string;
    correct: boolean;
    active: boolean;
    created_at: string;
    updated_at: string;
}