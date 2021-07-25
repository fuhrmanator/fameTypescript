import { Class, RefEnum, TypeScriptMM } from './quicktype/TypeScriptMMInterfaces'

export class FamixReferences {
    map: Map<number | RefEnum, any>
    constructor(mm: TypeScriptMM[]) {
        this.map = new Map()
        for (const entry of mm) {
            if (this.map.has(entry.id)) throw new Error(`${entry.id} already in reference map as ${JSON.stringify(this.map.get(entry.id))}`)
            this.map.set(entry.id, entry)
            for (const cls of entry.classes) {
                if (this.map.has(cls.id)) throw new Error(`${cls.id} already in reference map as ${JSON.stringify(this.map.get(cls.id))}`)
                this.map.set(cls.id, cls)
            }
        }    
    }
    nameForRef(ref: number | RefEnum) : string {
        if (this.map.has(ref)) {
            return this.map.get(ref).name as string
        }
        else throw new Error(`${ref} not found in reference map.`)
    }
    sourcePathForClassRef(ref: number | RefEnum) : string {
        if (this.map.has(ref)) {
            const entry: Class = this.map.get(ref)
            const packageName = this.nameForRef(entry.package.ref)
            return `${packageName}/${entry.name}` as string
        }
        else throw new Error(`${ref} not found in reference map.`)
    }
}

function typeScriptFilePath(c: Class): string {
    const s = c.name;
    const filename = typeScriptFileName(s);
    return `../${c.package.ref}/${filename}`;
}

function typeScriptFileName(s: string) {
    return s.charAt(0).toLowerCase() + s.substring(1);
}
