import { Question } from "./question.interface";
import { Quiz } from "./quiz.interface";

export interface Game {
    exists: boolean;
    player_id: number;
    score_id: number;
    quiz_completed: boolean;
    answered_questions: number;
    total_questions: number;
    quiz: Quiz;
}

export interface QuestionStart {
    quiz_completed: boolean;
    response_id: number;
    question: Question;
    remaining_questions: number;
    answered_questions: number;
    total_questions: number;
}