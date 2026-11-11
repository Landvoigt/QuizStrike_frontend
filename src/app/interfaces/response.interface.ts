export interface QuestionFinishResult {
    status: string;
    correct: boolean;
    correct_answer_id: number | null;
    points: number;
    time: number;
    timed_out: boolean;
}
