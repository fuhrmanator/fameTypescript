import "reflect-metadata";
import { Package, Property } from "../quicktype/TypeScriptMMInterfaces";
export { FameDescription, FameProperty }

function FameDescription(param: {famePackage: Package, fameDescription: string, fameProperties?: [Property]}) {
  return function decorator(target: any) {
     target.famePackage = param.famePackage;
     target.fameDescription = param.fameDescription
     target.fameProperties = param.fameProperties
  }
}

// Cris: not sure about type being a string... 
function FameProperty(param: {name?: string, container?: boolean, derived?: boolean, opposite?: string, type?: string}): any {
  return function decorator(target: any) {
    target.container = param.container;
    target.derived = param.derived;
    target.name = param.name;
    target.opposite = param.opposite;
    target.type = param.type;
  }
}