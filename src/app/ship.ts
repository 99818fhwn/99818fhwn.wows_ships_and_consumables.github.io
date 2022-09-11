import { Consumables } from "./consumables";

export class Ship {

    name : string;
    type : string;
    consumables : string[]; 

    constructor(name: string, type:  string, consumables : string[])
    {
        this.name = name;
        this.type = type;
        this.consumables = consumables;
    }
}
