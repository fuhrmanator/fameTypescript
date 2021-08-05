export abstract class Element {
    name!: string
}

export class Package extends Element {
    classes: Class[]
    extensions: Property[]
}

export class Class extends Element {
    isAbstract: boolean
    superclass: Class
    package: Package
    properties: Property[]

}

export class Property extends Element {
    class: Class
    isContainer : boolean
    isDerived : boolean
    isKey : boolean
    isMultivalued : boolean
    opposite: Property
    package: Package
    type: Class
    isComposite : boolean
}