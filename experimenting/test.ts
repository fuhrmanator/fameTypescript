export class Test {
    _name?: string
    get name() {
        return this._name
    }
    set name(n: string | undefined) {
        this._name = n
    }
}