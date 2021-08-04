import { RefEnum, Superclass } from "../src/quicktype/TypeScriptMMInterfaces"

export class Test {
    _name?: string
    get name() {
        return this._name
    }
    set name(n: string | undefined) {
        this._name = n
    }
}

export class FMElement {

    owner?: FMElement

    name?: string

    fullname? = () : string =>  {
        return ''
    }
}

export class FM3Type extends FMElement implements Superclass {
    ref: number | RefEnum
    
}

