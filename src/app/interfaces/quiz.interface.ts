export interface Quiz {
    id: number;
    title: string;
    description: string;
    question_count: number;
    image: string | null;
    transparent: boolean;
    active: boolean;
    created_at: string;
    updated_at: string;
}