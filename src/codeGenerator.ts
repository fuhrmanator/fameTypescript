import * as fs from 'fs';
import { Convert, TypeScriptMM } from './quicktype/TypeScriptMMInterfaces'
import { Generator } from './generator';

const metamodelJSON = fs.readFileSync('./resources/TypeScriptMM_fromPharo.json', 'utf8');

const typeScriptMM: TypeScriptMM[] = Convert.toTypeScriptMM(metamodelJSON);

const gen = new Generator("./target/famix/", typeScriptMM)

gen.generate()
