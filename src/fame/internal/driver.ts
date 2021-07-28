import { SetWithOpposite } from "./setWithOpposite";

const incomingAccesses = new class extends SetWithOpposite<String> {
    setOpposite(value: String): this {
        console.log(`setOpposite: ${value}`)
        return this
    }
    clearOpposite(value: String): this {
        console.log(`clearOpposite: ${value}`)
        return this
    }
}

let entity = new String('Fred')

incomingAccesses.add(entity)

entity = new String('Nancy')

incomingAccesses.add(entity)

incomingAccesses.forEach(element => {
    console.log(`foreach element: ${element}`)
});

incomingAccesses.delete(entity)

for (const entry of incomingAccesses) {
    console.log(entry)
}

console.log('values()')
for (const a of incomingAccesses.values() ){
    console.log(a)
}

console.log('keys()')
for (const a of incomingAccesses.keys() ){
    console.log(a)
}

console.log('entries()')
for (const a of incomingAccesses.entries() ){
    console.log(a)
}
