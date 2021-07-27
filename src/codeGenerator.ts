import * as fs from 'fs';
import { Convert, TypeScriptMM } from './quicktype/TypeScriptMMInterfaces'
import { TypeScriptFamixAPIGenerator } from './typeScriptFamixAPIGenerator';

const metamodelJSON = fs.readFileSync('./resources/TypeScriptMM_fromPharo.json', 'utf8');

const typeScriptMM: TypeScriptMM[] = Convert.toTypeScriptMM(metamodelJSON);

const gen = new TypeScriptFamixAPIGenerator("./target/famix/", typeScriptMM)

gen.generate()
