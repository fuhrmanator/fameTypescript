import { SetWithOpposite } from "../src/fame/internal/setWithOpposite";

let testSet: Set<String>
let opposite = new String('')

beforeAll(() => {
  testSet = new class extends SetWithOpposite<String> {
    setOpposite(value: String): this {
      opposite = value
      return this
    }
    clearOpposite(value: String): this {
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

  it('should have fred and wilma values', function() {
    expect(testSet.entries()).toBe([[fred, fred],[wilma, wilma]])
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

});



