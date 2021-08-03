Look at diffs in latest (NG) FameJava and pascalerni:

- https://github.com/moosetechnology/FameJava/compare/master...pascalerni:master

- Many.Setter uses Collection<? extends --TYPE-->, but I think it will just work with Set<--TYPE--> in TypeScript (but not sure!)

- Trait properties have to be accessors. Look at https://github.com/moosetechnology/FameJava/blob/master/src/ch/akuhn/fame/codegen/CodeGeneration.java to see how it's handled in the `acceptTrait` method

- how to deal with optional types without putting "| undefined" everywhere (defeating the null-safe aspects of TypeScript)

This compiles, but is it what we want:

```TypeScript
export class Test {
    _name?: string
    get name() {
        return this._name
    }
    set name(n: string | undefined) {
        this._name = n
    }
}
```