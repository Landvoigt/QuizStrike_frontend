import { Question } from "./question.interface";
import { Quiz } from "./quiz.interface";

export interface Game {
    exists: boolean;
    player_id: number;
    score_id: number;
    quiz_completed: boolean;
    answered_questions: number[];
    remaining_questions: Question[];
    quiz: Quiz;
}