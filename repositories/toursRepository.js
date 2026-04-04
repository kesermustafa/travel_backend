import BaseRepository from "./BaseRepository.js";
import Tours from "../model/Tours.js";


class ToursRepository extends BaseRepository {
    constructor() {
        super(Tours);
    }

}

export default new ToursRepository();