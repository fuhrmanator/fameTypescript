import * as fs from 'fs';
import { Class, Convert, Property, RefEnum, TypeScriptMM } from '../TypeScriptMMInterfaces_fromQuicktype'
import { Generator } from './generator';

const metamodelJSON = fs.readFileSync('TypeScriptMM_fromPharo.json', 'utf8');

const typeScriptMM: TypeScriptMM[] = Convert.toTypeScriptMM(metamodelJSON);

const gen = new Generator("./target/famix/", typeScriptMM)

gen.generate()
