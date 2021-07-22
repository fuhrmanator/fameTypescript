import * as fs from 'fs';
import { Convert, RefEnum, TypeScriptMM } from '../TypeScriptMMInterfaces_fromQuicktype'
import { Project, Scope, SourceFile, ts } from "ts-morph";

const metamodelJSON = fs.readFileSync('TypeScriptMM_fromPharo.json', 'utf8');

const typeScriptMM: TypeScriptMM[] = Convert.toTypeScriptMM(metamodelJSON);

const referenceNames = new Map<number | RefEnum, string>();

initReferences(typeScriptMM, referenceNames);

// Let's make some classes!

const sourceRoot = "./target/famix/model/";

// this is deno style module resolution (ex. `import { MyClass } from "./MyClass.ts"`)
const project = new Project(
    /*{
    resolutionHost: (moduleResolutionHost, getCompilerOptions) => {
        return {
            resolveModuleNames: (moduleNames, containingFile) => {
                const compilerOptions = getCompilerOptions();
                const resolvedModules: ts.ResolvedModule[] = [];

                for (const moduleName of moduleNames.map(removeTsExtension)) {
                    const result = ts.resolveModuleName(moduleName, containingFile, compilerOptions, moduleResolutionHost);
                    if (result.resolvedModule)
                        resolvedModules.push(result.resolvedModule);
                }

                return resolvedModules;
            },
        };

        function removeTsExtension(moduleName: string) {
            if (moduleName.slice(-3).toLowerCase() === ".ts")
                return moduleName.slice(0, -3);
            return moduleName;
        }
    },
}*/
);

// ignore the other stuff in the MM
const famixTSMM = typeScriptMM.filter(entry => entry.name === 'FamixTypeScript');

famixTSMM[0].classes.forEach(cls => {
    let className = cls.name;
    const classFileName = typeScriptFileName(className);
    const sourceFile = project.createSourceFile(`${sourceRoot}${classFileName}.ts`, "", { overwrite: true });
    const classDeclaration = sourceFile.addClass({
        name: className,
        isExported: true
    });

    if (cls.superclass) {
        const superclass = referenceNames.get(cls.superclass.ref) as string;
        classDeclaration.setExtends(superclass);
        sourceFile.addImportDeclaration(
            {
                moduleSpecifier: "./" + typeScriptFileName(superclass),
                namedImports: [superclass]
            }
        )
    }

    // Bogus for now
    classDeclaration.addProperty({
        name: 'myProp',
        type: 'string',
        initializer: '\'hello world!\'',
        scope: Scope.Public
    });

    sourceFile.formatText();

})

project.saveSync();


function convertToTypescriptType(typename: string) {
    if (typename === "String" ||
        typename === "Boolean" ||
        typename === "Number") {
        return typename.toLowerCase();
    }
    return typename;
}

// map the IDs to Names
function initReferences(mm: TypeScriptMM[], nameRefMap: Map<number | RefEnum, string>) {
    for (const entry of mm) {
        for (const cls of entry.classes) {
            nameRefMap.set(cls.id, cls.name)
        }
    }
}

function typeScriptFileName(s:string) : string {
    return s.charAt(0).toLowerCase() + s.substring(1);
}