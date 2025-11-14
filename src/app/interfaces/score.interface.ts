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