export class ResponseModel {
    player_name: string;
    question_id: number;
    answer_id: number | null;
    time: number;

    constructor(data: { player_name: string; question_id: number; answer_id: number | null; time?: number }) {
        this.player_name = data.player_name;
        this.question_id = data.question_id;
        this.answer_id = data.answer_id;
        this.time = data.time ?? 0;
    }
}