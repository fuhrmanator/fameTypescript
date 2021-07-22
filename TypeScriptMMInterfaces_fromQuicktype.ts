// To parse this data:
//
//   import { Convert } from "./file";
//
//   const typeScriptMM = Convert.toTypeScriptMM(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface TypeScriptMM {
    FM3:     string;
    id:      number;
    name:    string;
    classes: Class[];
}

export interface Class {
    FM3:         ClassFM3;
    id:          number;
    name:        string;
    package:     Package;
    properties?: Property[];
    traits?:     Package[];
    abstract?:   boolean;
    superclass?: Superclass;
}

export enum ClassFM3 {
    FM3Class = "FM3.Class",
    FM3Trait = "FM3.Trait",
}

export interface Package {
    ref: number;
}

export interface Property {
    FM3:         PropertyFM3;
    id:          number;
    name:        string;
    class:       Package;
    container:   boolean;
    derived:     boolean;
    multivalued: boolean;
    opposite?:   Package;
    type:        Superclass;
}

export enum PropertyFM3 {
    FM3Property = "FM3.Property",
}

export interface Superclass {
    ref: RefEnum | number;
}

export enum RefEnum {
    Boolean = "Boolean",
    Number = "Number",
    Object = "Object",
    String = "String",
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toTypeScriptMM(json: string): TypeScriptMM[] {
        return cast(JSON.parse(json), a(r("TypeScriptMM")));
    }

    public static typeScriptMMToJson(value: TypeScriptMM[]): string {
        return JSON.stringify(uncast(value, a(r("TypeScriptMM"))), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any = ''): never {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`, );
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "TypeScriptMM": o([
        { json: "FM3", js: "FM3", typ: "" },
        { json: "id", js: "id", typ: 0 },
        { json: "name", js: "name", typ: "" },
        { json: "classes", js: "classes", typ: a(r("Class")) },
    ], false),
    "Class": o([
        { json: "FM3", js: "FM3", typ: r("ClassFM3") },
        { json: "id", js: "id", typ: 0 },
        { json: "name", js: "name", typ: "" },
        { json: "package", js: "package", typ: r("Package") },
        { json: "properties", js: "properties", typ: u(undefined, a(r("Property"))) },
        { json: "traits", js: "traits", typ: u(undefined, a(r("Package"))) },
        { json: "abstract", js: "abstract", typ: u(undefined, true) },
        { json: "superclass", js: "superclass", typ: u(undefined, r("Superclass")) },
    ], false),
    "Package": o([
        { json: "ref", js: "ref", typ: 0 },
    ], false),
    "Property": o([
        { json: "FM3", js: "FM3", typ: r("PropertyFM3") },
        { json: "id", js: "id", typ: 0 },
        { json: "name", js: "name", typ: "" },
        { json: "class", js: "class", typ: r("Package") },
        { json: "container", js: "container", typ: true },
        { json: "derived", js: "derived", typ: true },
        { json: "multivalued", js: "multivalued", typ: true },
        { json: "opposite", js: "opposite", typ: u(undefined, r("Package")) },
        { json: "type", js: "type", typ: r("Superclass") },
    ], false),
    "Superclass": o([
        { json: "ref", js: "ref", typ: u(r("RefEnum"), 0) },
    ], false),
    "ClassFM3": [
        "FM3.Class",
        "FM3.Trait",
    ],
    "PropertyFM3": [
        "FM3.Property",
    ],
    "RefEnum": [
        "Boolean",
        "Number",
        "Object",
        "String",
    ],
};
