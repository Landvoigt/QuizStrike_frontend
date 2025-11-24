import { Question } from "./question.interface";
import { Quiz } from "./quiz.interface";

export interface Game {
    exists: boolean;
    player_id: number;
    score_id: number;
    quiz_completed: boolean;
    answered_questions: number[] | null;
    remaining_questions: Question[] | null;
    quiz: Quiz;
}