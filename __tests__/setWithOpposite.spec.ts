import { SetWithOpposite } from "../src/fame/internal/setWithOpposite";

let testSet: Set<String>
let opposite = new String('')

beforeAll(() => {
  testSet = new class extends SetWithOpposite<String> {
    setOpposite(value: String): this {
      console.log(`clearOpposite: ${value}`)
      opposite = value
      return this
    }
    clearOpposite(value: String): this {
      console.log(`clearOpposite: ${value}`)
      opposite = new String('')
      return this
    }
  }

})

describe("SetWithOpposite", () => {
  let fred = new String('Fred')
  let wilma = new String('Wilma')

  it('should have size of 0', () => {
    expect(testSet.size).toBe(0)
  })

  it('should have size of 1 after an add', () => {
    testSet.add(fred)
    expect(testSet.size).toBe(1)
  })

  it('should set opposite after add', () => {
    expect(opposite).toBe(fred)
  })

  it('should have size of 1 after a duplicate add', () => {
    testSet.add(fred)
    expect(testSet.size).toBe(1)
  })

  it('should have size of 2 after a add of second entry', () => {
    testSet.add(wilma)
    expect(testSet.size).toBe(2)
  })

  it('should have fred and wilma values', () => {
    const set = new Set<String>([fred, wilma])
    for (const s of set) {
      expect(testSet.has).toBeTruthy
    }

    // function intersection(setA: Set<String>, setB: Set<String>) {
    //   let smallerSet = setA.size > setB.size ? setB : setA;
    //   let largerSet = setA.size > setB.size ? setA : setB;
    //   return new Set([...smallerSet].filter(element => largerSet.has(element)))
    // }
  })

  it('should have size of 1 after second entry deleted', () => {
    testSet.delete(wilma)
    expect(testSet.size).toBe(1)
  })

  it('should clear opposite after entry deleted', () => {
    expect(opposite).toEqual(new String(''))
  })

  it('should have size of 1 after second entry deleted', () => {
    testSet.delete(wilma)
    expect(testSet.size).toBe(1)
  })

  it('should have size of 0 after clear', () => {
    testSet.add(wilma) // to make opposite change
    expect(opposite).toBe(wilma)
    testSet.clear()
    expect(testSet.size).toBe(0)
  })

  it('opposite should change after clear', () => {
    testSet.add(wilma) // to make opposite change
    expect(opposite).toBe(wilma)
    testSet.clear()
    expect(opposite).toEqual(new String(''))
  })

  it('should have size of 2 with constructor with array of 2', () => {
    testSet = new class extends SetWithOpposite<String> {
      setOpposite(value: String): this {
        console.log(`clearOpposite: ${value}`)
        opposite = value
        return this
      }
      clearOpposite(value: String): this {
        console.log(`clearOpposite: ${value}`)
        opposite = new String('')
        return this
      }
    }([fred, wilma])
    expect(testSet.size).toBe(2)
  })

  it('opposite should change after constructor', () => {
    testSet = new class extends SetWithOpposite<String> {
      setOpposite(value: String): this {
        return this
      }
      clearOpposite(value: String): this {
        return this
      }
    }([fred,wilma])
    expect(opposite).toEqual(wilma)
  })

  it('should have elements added to it', () => {
    expect(testSet.has(wilma)).toBeTruthy
    expect(testSet.has(fred)).toBeTruthy
  })

  it('should iterate with forEach successfully', () => {
    testSet.forEach(element => {
      expect(testSet.has(element)).toBeTruthy
    });
  }) 

  it('should have usable entries()', () => {
    const entries = testSet.entries()
    expect(entries.next()).toEqual({done:false, value:[fred,fred]})
    expect(entries.next()).toEqual({done:false, value:[wilma,wilma]})
    expect(entries.next()).toEqual({done:true, value:undefined})
  })

  it('should have usable values()', () => {
    const iterator = testSet.values()
    expect(iterator.next()).toEqual({done:false, value:fred})
    expect(iterator.next()).toEqual({done:false, value:wilma})
    expect(iterator.next()).toEqual({done:true, value:undefined})
  })

  it('should have usable keys()', () => {
    const keys = testSet.keys()
    expect(keys.next()).toEqual({done:false, value:fred})
    expect(keys.next()).toEqual({done:false, value:wilma})
    expect(keys.next()).toEqual({done:true, value:undefined})
  })

  it('should be iterable', () => {
    for (const e of testSet) {
      expect(testSet.has(e)).toBeTruthy
    }
  })


});



