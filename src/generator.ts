import { Class, Property, RefEnum, TypeScriptMM } from '../TypeScriptMMInterfaces_fromQuicktype'
import { ClassDeclaration, InterfaceDeclaration, Project, Scope, SourceFile } from "ts-morph";
import { FamixReferences } from './famixReferences'
import { assert } from 'console';


export class Generator {
    project: Project
    sourceRoot: string
    referenceNames: FamixReferences;
    mm : TypeScriptMM[]

    constructor(sourceRoot: string, mm: TypeScriptMM[]) {
        this.sourceRoot = sourceRoot
        this.mm = mm
        this.referenceNames = new FamixReferences(mm);
        this.project = new Project(
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
        )
    }

    generate() {
        for (const fm3pkg of this.mm) {

            if ((fm3pkg.name === 'FamixTypeScript') ||
                (fm3pkg.name === 'Famix-Traits') ||
                (fm3pkg.name === 'Moose')) {
                this.acceptPackage(fm3pkg);
            }

        }
        this.project.saveSync()
    }

    acceptPackage(fm3pkg: TypeScriptMM) {
        console.log(`Package: ${fm3pkg.name}`);
        for (const cls of fm3pkg.classes) {
            console.log(` Class: ${cls.name}`);
            const classFileName = this.referenceNames.sourcePathForClassRef(cls.id);
            const sourceFile = this.project.createSourceFile(`${this.sourceRoot}${classFileName}.ts`, "", { overwrite: true });
            if (cls.FM3 === 'FM3.Trait')
                this.acceptTrait(cls, sourceFile)
            //acceptClass(sourceFile, className, cls, fm3pkg)
            else
                this.acceptClass(cls, sourceFile)

            sourceFile.formatText();

        }
    }

    acceptClass(cls: Class, sourceFile: SourceFile) {
        const classDeclaration = sourceFile.addClass({
            name: cls.name,
            isExported: true
        });

        // imports for traits
        if (cls.traits) for (const trait of cls.traits) {
            sourceFile.addImportDeclaration(
                {
                    moduleSpecifier: `../${this.referenceNames.sourcePathForClassRef(trait.ref)}`,
                    namedImports: [this.referenceNames.nameForRef(trait.ref)]
                }
            );
        }

        // superclass
        if (cls.superclass !== undefined) {
            if (this.referenceNames.nameForRef(cls.package.ref) === 'Moose' && cls.name === 'Object') {
                console.log(`skipping superclass for ${JSON.stringify(cls)} because of a reference bug`);
            }
            else {
                const superclass = this.referenceNames.nameForRef(cls.superclass.ref);
                const superclassPath = this.referenceNames.sourcePathForClassRef(cls.superclass.ref);
                if (superclass !== undefined) {
                    console.log(`   setting superclass for class: ${cls.name} to superclass: ${superclass}, ref: ${cls.superclass.ref}`);
                    classDeclaration.setExtends(superclass);
                    sourceFile.addImportDeclaration(
                        {
                            moduleSpecifier: `../${superclassPath}`,
                            namedImports: [superclass]
                        }
                    );
                } else
                    throw new Error(`superclass ${cls.superclass.ref} undefined (not in references)`);
            }
        }

        this.configureProperties(cls, sourceFile, classDeclaration);
    }

    configureProperties(cls: Class, sourceFile: SourceFile, classDeclaration: ClassDeclaration | InterfaceDeclaration) {
        if (cls.properties) {
            for (const prop of cls.properties) {
                console.log(`  Property: ${prop.name}, id: ${prop.id}, type.ref: ${prop.type.ref}`);
                let typeScriptType;
                // special types that are in typescript
                if (!RefEnum[prop.type.ref as RefEnum]) {
                    typeScriptType = this.referenceNames.nameForRef(prop.type.ref);
                    sourceFile.addImportDeclaration(
                        {
                            moduleSpecifier: `../${this.referenceNames.sourcePathForClassRef(prop.type.ref)}`,
                            namedImports: [typeScriptType]
                        }
                    );
                } else {
                    typeScriptType = this.convertToTypescriptType(prop.type.ref as string);
                }

                classDeclaration.addProperty({
                    name: `${prop.name}`,
                    type: `${typeScriptType}`,
                    scope: Scope.Private
                });
            }
        }
    }

    acceptTrait(cls: Class, sourceFile: SourceFile) {
        const interfaceDeclaration = sourceFile.addInterface({
            name: cls.name,
            isExported: true
        });

        assert(cls.superclass === undefined, `Trait ${cls.name} has a superclass defined.`)
        //configureSuperclass(fm3pkg, cls, className, interfaceDeclaration,this.sourceFile);
        if (cls.properties) for (const property of cls.properties) {
            this.acceptPropertyTrait(cls, sourceFile, interfaceDeclaration, property);
        }
    }

    convertToTypescriptType(typename: string) {
        if (typename === "String" ||
            typename === "Boolean" ||
            typename === "Number") {
            return typename.toLowerCase();
        }
        return typename;
    }


    acceptPropertyTrait(cls: Class, sourceFile: SourceFile, interfaceDeclaration: InterfaceDeclaration, property: Property) {
        if (property.derived && !property.opposite)
            return this.acceptDerivedPropertyTrait(property)
        else
            return this.acceptAccessorPropertyTrait(property)
    }

    acceptDerivedPropertyTrait(property: Property) {
        assert(property.derived && !property.opposite)
        /*
            code.addImport(FameProperty.class);
            String typeName = "Object";
            if (m.getType() != null) { // TODO should not have null type
                typeName = className(m.getType());
                code.addImport(this.packageName(m.getType().getPackage()), typeName);
            }
            if (m.isMultivalued()) {
                code.addImport("java.util", "*");
            }
            String myName = CodeGeneration.asJavaSafeName(m.getName());
    
            String base = "Trait." + (m.isMultivalued() ? "Many" : "One");
            Template getter = Template.get(base + ".Derived.Getter");
    
            getter.set("TYPE", typeName);
            getter.set("NAME", m.getName());
            getter.set("GETTER", "get" + Character.toUpperCase(myName.charAt(0)) + myName.substring(1));
    
            String props = "";
            if (m.isDerived()) {
                props += ", derived = true";
            }
            if (m.isContainer()) {
                props += ", container = true";
            }
            getter.set("PROPS", props);
    
            StringBuilder stream = code.getContentStream();
            stream.append(getter.apply());
            return null;    */
    }

    acceptAccessorPropertyTrait(property: Property) {
        return; // throw new Error('Function not implemented.');
    }
}