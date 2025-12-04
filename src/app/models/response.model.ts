export class QuestionStartModel {
    player_name: string;
    quiz_id: number;

    constructor(player: string, quiz: number) {
        this.player_name = player;
        this.quiz_id = quiz;
    }
}

export class QuestionFinishModel {
    response_id: number;
    answer_id: number | null;
    time: number;

    constructor(data: { response_id: number; answer_id: number | null; time?: number }) {
        this.response_id = data.response_id;
        this.answer_id = data.answer_id;
        this.time = data.time ?? 0;
    }
}