import { Class, ClassFM3, Package, Property, Superclass } from './TypeScriptMMInterfaces_fromQuicktype'

export class TSClass implements Class {
    FM3: ClassFM3;
    id: number;
    name: string;
    package: Package;
    properties?: Property[] = [];
    traits?: Package[] = [];
    abstract?: boolean = false;
    superclass?: Superclass = null;

    constructor(id: number, name: string, pkg: Package) { this.id = id; this.name = name; this.package = pkg}

    addProperty(p: Property) { this.properties.push(p) }
    addTrait(p: Package) { this.traits.push(p) }
}
