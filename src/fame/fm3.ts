export abstract class Element {
    name!: string
    // abstract get fullname(): string
    // abstract get owner(): Element
    constructor(name: string) {
        this.name = name
    }
}

export class Package extends Element {
    classes: Class[]
    extensions: Property[]
}

export class Class extends Element {
    isAbstract: boolean
    superclass?: Class
    package: Package
    properties: Property[] = []
    get allProperties(): Property[] {
        if (this.superclass) 
            return this.properties.concat(this.superclass.allProperties)
        else
            return this.properties
    }
    get isPrimitive() {
        return (this.name === "Number" || this.name === "String") //etc
    }
    get isRoot() {
        return superclass == undefined
    }
    constructor(name: string, isAbstract: boolean = false, pkg: Package) {
        super(name)
        this.isAbstract = isAbstract
        this.package = pkg
    }
}

export class Property extends Element {
    class: Class
    isContainer: boolean
    isDerived: boolean
    isKey: boolean
    isMultivalued: boolean
    opposite: Property
    package: Package
    type: Class
    isComposite(): boolean
}