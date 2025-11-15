export interface Response {
    scoreId: number;
    questionId: number;
    answerId: number | null;
    time: number;
    created_at: string;
}