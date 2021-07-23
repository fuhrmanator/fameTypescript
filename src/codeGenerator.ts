import * as fs from 'fs';
import { Class, Convert, RefEnum, TypeScriptMM } from '../TypeScriptMMInterfaces_fromQuicktype'
import { ClassDeclaration, NamedImports, Project, Scope, SourceFile, ts } from "ts-morph";
import { FamixReferences } from './famixReferences'
import { profile } from 'console';

const metamodelJSON = fs.readFileSync('TypeScriptMM_fromPharo.json', 'utf8');

const typeScriptMM: TypeScriptMM[] = Convert.toTypeScriptMM(metamodelJSON);

// const referenceNames = new Map<number | RefEnum, Class>();

const referenceNames = new FamixReferences(typeScriptMM);

// Let's make some classes!

const sourceRoot = "./target/famix/";

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
// const famixTSMM = typeScriptMM.filter(entry => entry.name === 'FamixTypeScript');

for (const fm3pkg of typeScriptMM) {

    if ((fm3pkg.name === 'FamixTypeScript') || (fm3pkg.name === 'Famix-Traits') || (fm3pkg.name === 'Moose')) {

        acceptPackage(fm3pkg);

    }

}

project.saveSync();


function acceptPackage(fm3pkg: TypeScriptMM) {
    console.log(`Package: ${fm3pkg.name}`);
    for (const cls of fm3pkg.classes) {
        console.log(` Class: ${cls.name}`);
        let className = cls.name;
        const classFileName = referenceNames.sourcePathForClassRef(cls.id);
        const sourceFile = project.createSourceFile(`${sourceRoot}${classFileName}.ts`, "", { overwrite: true });
        if (cls.FM3 === 'FM3.Trait')
            //acceptTrait(sourceFile, className, cls, fm3pkg)
            acceptClass(sourceFile, className, cls, fm3pkg)
        else
            acceptClass(sourceFile, className, cls, fm3pkg)

        sourceFile.formatText();

    }
}

function acceptClass(sourceFile: SourceFile, className: string, cls: Class, fm3pkg: TypeScriptMM) {
    const classDeclaration = sourceFile.addClass({
        name: className,
        isExported: true
    });

    configureSuperclass(fm3pkg, cls, className, classDeclaration, sourceFile);
    configureProperties(cls, sourceFile, classDeclaration);
}

function configureProperties(cls: Class, sourceFile: SourceFile, classDeclaration: ClassDeclaration) {
    if (cls.properties) {
        for (const prop of cls.properties) {
            console.log(`  Property: ${prop.name}, id: ${prop.id}, type.ref: ${prop.type.ref}`);
            let typeScriptType;
            // special types that are in typescript
            if (!RefEnum[prop.type.ref as RefEnum]) {
                typeScriptType = referenceNames.nameForRef(prop.type.ref);
                sourceFile.addImportDeclaration(
                    {
                        moduleSpecifier: `../${referenceNames.sourcePathForClassRef(prop.type.ref)}`,
                        namedImports: [typeScriptType]
                    }
                );
            } else {
                typeScriptType = convertToTypescriptType(prop.type.ref as string);
            }

            classDeclaration.addProperty({
                name: `${prop.name}`,
                type: `${typeScriptType}`,
                scope: Scope.Private
            });
        }
    }
}

function configureSuperclass(fm3pkg: TypeScriptMM, cls: Class, className: string, classDeclaration: ClassDeclaration, sourceFile: SourceFile) {
    if (cls.superclass !== undefined) {
        if (fm3pkg.name === 'Moose' && cls.name === 'Object') {
            console.log(`skipping superclass for ${JSON.stringify(cls)} because of a reference bug`);
        }
        else {
            const superclass = referenceNames.nameForRef(cls.superclass.ref);
            const superclassPath = referenceNames.sourcePathForClassRef(cls.superclass.ref);
            if (superclass !== undefined) {
                console.log(`class: ${className}, superclass: ${superclass}, ref: ${cls.superclass.ref}`);
                classDeclaration.setExtends(superclass);
                sourceFile.addImportDeclaration(
                    {
                        moduleSpecifier: `../${superclassPath}`,
                        namedImports: [superclass]
                    }
                );
            }

            else
                throw new Error(`superclass ${cls.superclass.ref} undefined (not in references)`);
        }
    }
}

function convertToTypescriptType(typename: string) {
    if (typename === "String" ||
        typename === "Boolean" ||
        typename === "Number") {
        return typename.toLowerCase();
    }
    return typename;
}


function acceptTrait(sourceFile: SourceFile, className: string, cls: Class, fm3pkg: TypeScriptMM) {
    throw new Error('Function not implemented.');
}

