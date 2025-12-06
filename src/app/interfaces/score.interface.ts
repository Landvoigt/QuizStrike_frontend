import { Player } from "./player.interface";

export interface Score {
    id: number;
    quizId: number;
    player: Player;
    score: number;
    time: number;
    created_at: string;
    updated_at: string;
    justUpdated: boolean; move?: 'up' | 'down' | null;
}