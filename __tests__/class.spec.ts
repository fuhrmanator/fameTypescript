import { FamixRepository } from "../src/famix/famixRepository";
import { Class } from "../src/famix/FamixTypeScript/Class";

const repo = new FamixRepository()
let cls: Class;

describe("FamixTypeScript/Class", () => {
    it('should instantiate', () => {
        cls = new Class(repo);
        expect(cls).toBeTruthy()
    })

    it('should have id of 1', () => {
        expect(cls.id).toBe(1)
    })

    it('should have a name', () => {
        throw new Error('Test not implemented yet')
    })

    it('should have an MSE', () => {
        expect(cls.getMSE()).toEqual("(FamixTypeScript.Class  (id: 1))\n")
    })

})