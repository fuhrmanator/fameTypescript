import { Class, Package, Property, RefEnum, TypeScriptMM } from './quicktype/TypeScriptMMInterfaces'
import { ClassDeclaration, InterfaceDeclaration, Project, Scope, SourceFile } from "ts-morph";
import { FamixReferences } from './famixReferences'
import assert from 'assert';

type RefType = number | RefEnum

export class TypeScriptFamixAPIGenerator {
    project: Project
    sourceRoot: string
    referenceNames: FamixReferences;
    mm: TypeScriptMM[]

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

            // if ((fm3pkg.name === 'FamixTypeScript') ||
            //     (fm3pkg.name === 'Famix-Traits') ||
            //     (fm3pkg.name === 'Moose')) {
            this.acceptPackage(fm3pkg);
            // }

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

            // add MSE conversion method

            // public getMSE(): string {
            //     const mse: FamixMseExporter = new FamixMseExporter("--THISPACKAGE--.--THISNAME--", this);
            //     this.addPropertiesToExporter(mse);
            //     return mse.getMSE();
            //   }

            //   public addPropertiesToExporter(exporter: FamixMseExporter) {
            //     super.addPropertiesToExporter(exporter);
            // --PROPERTIES--
            //   }

            // }            

            sourceFile.insertStatements(0, ['// This code automagically generated from a metamodel using ts-morph'])
            sourceFile.formatText()
        }
    }

    acceptClass(cls: Class, sourceFile: SourceFile) {
        const packageName = this.referenceNames.nameForRef(cls.package.ref)
        const classDeclaration = sourceFile.addClass({
            name: cls.name,
            isExported: true
        });

        // imports and implements for traits
        if (cls.traits) for (const trait of cls.traits) {
            const traitPath = this.referenceNames.sourcePathForClassRef(trait.ref)
            const traitName = this.referenceNames.nameForRef(trait.ref)
            sourceFile.addImportDeclaration(
                {
                    moduleSpecifier: `../${traitPath}`,
                    namedImports: [traitName]
                }
            )
            classDeclaration.addImplements(traitName)
        }

        // superclass
        if (cls.superclass !== undefined) {
            // JavaFile.java hacks the superclass in case of "Object"
            if (packageName === 'Moose' && cls.name === 'Object') {
                console.log(`Hmmm.... skipping superclass for ${JSON.stringify(cls)}`);
            } else {
                let superclass = this.referenceNames.nameForRef(cls.superclass.ref)
                let superclassPath = this.referenceNames.sourcePathForClassRef(cls.superclass.ref);
                if (superclass !== undefined) {
                    // logic from JavaFile.java addSuperclass
                    if (cls.name === 'Entity' && superclass === 'Entity') {
                        console.log(`Fixing superclass of Entity to FamixBaseElement!`)
                        superclass = 'FamixBaseElement'
                        superclassPath = firstLetterToLowerCase(superclass)
                    }
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

        if (cls.properties) {
            const sortedProperties = cls.properties.sort((p1, p2) => p1.name.localeCompare(p2.name))
            for (const prop of sortedProperties) {
                console.log(`  Property: ${prop.name}, id: ${prop.id}, type.ref: ${prop.type.ref}`);
                this.acceptProperty(prop, classDeclaration, sourceFile)
            }
        }

        // MSE conversion -- probably not going to work with Traits, as properties are now traits?
        sourceFile.addImportDeclaration(
            {
                moduleSpecifier: `../famixMSEExporter`,
                namedImports: [`FamixMSEExporter`]
            }
        )
        classDeclaration.addMethod({
            name: 'getMSE', statements: [
                `const mse: FamixMSEExporter = new FamixMSEExporter("${packageName}.${cls.name}", this)`,
                `this.addPropertiesToExporter(mse)`,
                `return mse.getMSE()`
            ]
        })
        // public getMSE(): string {
        //     const mse: FamixMseExporter = new FamixMseExporter("--THISPACKAGE--.--THISNAME--", this);
        //     this.addPropertiesToExporter(mse);
        //     return mse.getMSE();
        //   }

        // TODO figure this out -- getting it from JavaFile.java
        const addPropertyStatements = new Array<string>()
        if (cls.properties) for (const p of cls.properties) {
            addPropertyStatements.push(`exporter.addProperty("${p.name}", this.${p.name})`)
        }

        classDeclaration.addMethod({ name: 'addPropertiesToExporter', parameters: [{ name: 'exporter', type: 'FamixMSEExporter' }], statements: addPropertyStatements })

        // --PROPERTIES--  
        // should look like:
        // exporter.addProperty("accessor", this.getAccessor());
        // exporter.addProperty("variable", this.getVariable());
        // exporter.addProperty("isWrite", this.getIsWrite());
        // from JavaFile.java:
        // for ( Entry<String, String> each: properties.entrySet()) {
        //     stream.append("    exporter.addProperty(\""+each.getKey()+"\", this."+each.getValue()+"());\n");
        // }

        //   public addPropertiesToExporter(exporter: FamixMseExporter) {
        //     super.addPropertiesToExporter(exporter);
        // --PROPERTIES--
        //   }

        // }        

        return classDeclaration
    }

    private acceptProperty(prop: Property, classDeclaration: ClassDeclaration, sourceFile: SourceFile) {
        if (prop.derived && !prop.opposite) {
            return this.acceptDerivedProperty(prop, classDeclaration, sourceFile)
        } else {
            return this.acceptAccessorProperty(prop, classDeclaration, sourceFile)
        }
    }

    private acceptAccessorProperty(prop: Property, classDeclaration: ClassDeclaration, sourceFile: SourceFile) {
        let className = this.referenceNames.nameForRef(prop.class.ref)
        // determine the type 
        let typeScriptType;
        // special types that are in typescript
        if (!refIsType(prop.type.ref)) {
            typeScriptType = this.referenceNames.nameForRef(prop.type.ref);
            // Only add import for property if it's not the same as the class
            if (typeScriptType !== classDeclaration.getName()) this.addImportForProperty(prop, sourceFile);
        } else {
            typeScriptType = this.convertToTypescriptType(prop.type.ref as string);
        }

        const fieldType = `${(prop.multivalued ? 'Set<' : '') + typeScriptType + (prop.multivalued ? '>' : '')}`

        const declaredProperty = classDeclaration.addProperty({
            name: `_${prop.name}`,
            type: `${fieldType} ${!prop.multivalued ? ' | null' : ''}`,
            scope: Scope.Private,
            initializer: 'null'
        });

        let oppositeSetter = ''
        let oppositeGetter = ''

        if (prop.opposite) {
            let oppositeName = this.referenceNames.nameForRef(prop.opposite.ref)
            oppositeSetter = `${oppositeName}`
            oppositeGetter = `${oppositeName}`
        }

        const noConflictTypeName = typeScriptType // todo make this like the "asJavaSafeName()" in JavaFame

        let base = prop.multivalued ? 'Many' : 'One'
        if (prop.opposite) {
            base += (this.referenceNames.elementForRef(prop.opposite.ref) as Property).multivalued ? 'Many' : 'One'
        }

        if (prop.multivalued) {
            addImportForOppositeSupport(sourceFile);
            // override initializer
            declaredProperty.setInitializer(
                `new class extends SetWithOpposite<${typeScriptType}> {\n` +
                `  constructor(private outerThis: ${className}) { super() }\n` +
                `  clearOpposite(value: ${typeScriptType}): this {\n` +
                (base === 'ManyMany' ? `    value.${oppositeGetter}.delete(this.outerThis)\n` : `    value.${oppositeSetter} = null\n`) +
                `    return this\n` +
                `  }\n` +
                `  setOpposite(value: ${typeScriptType}): this {\n` +
                (base === 'ManyMany' ? `    value.${oppositeGetter}.add(this.outerThis)\n` : `    value.${oppositeSetter} = this.outerThis\n`) +
                `    return this\n` +
                `  }\n` +
                `}(this) /* pass outer this */`
            )
        }

        // getters and setters

        // initialize them for base === "One" case

        let getterMethodDefinition = {
            name: `${prop.name}`,
            returnType: `${fieldType} | null`,
            statements: [`return this._${prop.name}`],
        }

        let setterParamName = `the${firstLetterToUpperCase(typeScriptType)}`
        let setterMethodDefinition = {
            name: `${prop.name}`,
            parameters: [{
                name: setterParamName,
                type: `${typeScriptType} | null`
            }],
            statements: [`this._${prop.name} = ${setterParamName}`],
        }

        console.log(`      accessorProperty: ${prop.name}, isMultivalued: ${prop.multivalued}, base: ${base}`)
        // see https://github.com/moosetechnology/FameJava/blob/master/src/ch/akuhn/fame/codegen/template.txt for logic
        switch (base) {
            case 'One':
                // getter/setter already initialized above
                break
            case 'Many':
                getterMethodDefinition = {
                    name: `${prop.name}`,
                    returnType: `${fieldType}`,
                    statements: [`return this._${prop.name}`],
                }
                setterParamName += 'Set'
                setterMethodDefinition = {
                    name: `${prop.name}`,
                    parameters: [{
                        name: setterParamName,
                        type: `Set<${typeScriptType}>`
                    }],
                    statements: [`this._${prop.name} = JSON.parse(JSON.stringify(${setterParamName})) //deep copy`],
                }
                break
            case 'ManyOne':
                getterMethodDefinition = {
                    name: `${prop.name}`,
                    returnType: `${fieldType}`,
                    statements: [`return this._${prop.name}`],
                }
                setterParamName += 'Set'
                setterMethodDefinition = {
                    name: `${prop.name}`,
                    parameters: [{
                        name: setterParamName,
                        type: `Set<${typeScriptType}>`
                    }],
                    statements: [`this._${prop.name} = JSON.parse(JSON.stringify(${setterParamName})) // deep copy`],
                }
                break
            case 'OneMany':
                // getter same as 'One' (defined above)
                // setter
                setterMethodDefinition = {
                    name: `${prop.name}`,
                    parameters: [{
                        name: setterParamName,
                        type: `${typeScriptType} | null`
                    }],
                    statements: [
                        `if (this._${prop.name} !== null) {`,
                        `   if (this._${prop.name} === ${setterParamName}) return;`,
                        `   this._${prop.name}.${oppositeGetter}.delete(this)`,
                        `}`,
                        `this._${prop.name} = ${setterParamName}`,
                        `if (${setterParamName} == null) return`,
                        `${setterParamName}.${oppositeGetter}.add(this)`,
                    ],
                }
                break
            case 'OneOne':
                // TODO: Not tested yet!
                console.log('OneOne property!')
                // getter is same as One
                // setter
                setterMethodDefinition = {
                    name: `${prop.name}`,
                    parameters: [{
                        name: setterParamName,
                        type: `${typeScriptType} | null`
                    }],
                    statements: [
                        `if (this._${prop.name} == null ? ${setterParamName} !== null : !this._${prop.name} === ${setterParamName}) {`,
                        `  const old_${prop.name} = this._${prop.name}`,
                        `  this._${prop.name} = ${setterParamName}`,
                        `  if (old_${prop.name} !== null) old_${prop.name}.${oppositeSetter} = null`,
                        `  if (${setterParamName} !== null) ${setterParamName}.${oppositeSetter} = this`,
                        `}`
                    ],
                }
                break
            case 'ManyMany':
                getterMethodDefinition = {
                    name: `${prop.name}`,
                    returnType: `${fieldType}`,
                    statements: [`return this._${prop.name}`],
                }
                setterParamName += 'Set'
                setterMethodDefinition = {
                    name: `${prop.name}`,
                    parameters: [{
                        name: setterParamName,
                        type: `Set<${typeScriptType}>`
                    }],
                    statements: [`this._${prop.name} = JSON.parse(JSON.stringify(${setterParamName})) // deep copy`],
                }
                break
            default:
                throw new Error(`invalid value for ${base} (switch)`)
        }

        classDeclaration.addGetAccessor(getterMethodDefinition)
        classDeclaration.addSetAccessor(setterMethodDefinition)

        // adder for multivalue

        if (prop.multivalued) {
            const paramName = `the${firstLetterToUpperCase(typeScriptType)}`
            classDeclaration.addMethod({
                name: `add${firstLetterToUpperCase(prop.name)}`,  // todo (maybe), remove the 's' if the property has plural, e.g. scope instead of scopes
                parameters: [{
                    name: paramName,
                    type: `${typeScriptType}`
                }
                ],
                // returnType: `${fieldType}`,
                statements: [`this._${prop.name}.add(${paramName})`],
            })
        }


        // Sugar methods?

    }

    private acceptDerivedProperty(prop: Property, classDeclaration: ClassDeclaration, sourceFile: SourceFile) {
        // assert m.isDerived() && !m.hasOpposite();
        assert(prop.derived && !prop.opposite)
        // code.addImport(FameProperty.class);
        this.addImportForClass(prop.class, sourceFile)

        // String typeName = "Object";
        // if (m.getType() != null) { // TODO should not have null type
        //     typeName = className(m.getType());
        //     code.addImport(this.packageName(m.getType().getPackage()), typeName);
        // }

        // TODO: not sure what to do here - not sure what this adds concretely

        // if (m.isMultivalued()) {
        //     code.addImport("java.util", "*");
        // }
        if (prop.multivalued) addImportForOppositeSupport(sourceFile);

        // String myName = CodeGeneration.asJavaSafeName(m.getName());
        const myName = prop.name;

        // String base = "Trait." + (m.isMultivalued() ? "Many" : "One");
        let base = "Trait." + (prop.multivalued ? "Many" : "One")

        // Template getter = Template.get(base + ".Derived.Getter");

        // getter.set("TYPE", typeName);
        // getter.set("NAME", m.getName());
        // getter.set("GETTER", "get" + Character.toUpperCase(myName.charAt(0)) + myName.substring(1));

        const typeName = this.referenceNames.nameForRef(prop.class.ref)
        const name = prop.name
        const getter = prop.name

        // String props = "";
        // if (m.isDerived()) {
        //     props += ", derived = true";
        // }
        // if (m.isContainer()) {
        //     props += ", container = true";
        // }

        let props = '';
        if (prop.derived) { props += ", derived = true" }
        if (prop.container) { props += ", container = true" }

        // getter.set("PROPS", props);

        // StringBuilder stream = code.getContentStream();
        // stream.append(getter.apply());
        // return null;

        // public --TYPE-- --GETTER--();
        let derivedGetter = { name: `${getter}`, returnType: `${typeName}`}
        // @FameProperty(name = "--NAME--"--PROPS--)
        let fameProperty = `name = "${name}"${props}`
        
        if (prop.multivalued) {
            // public Collection<--TYPE--> --GETTER--();
            derivedGetter = {name: `${getter}`,
                returnType: `Set<${typeName}>`,
            }
        }
        const methodDec = classDeclaration.addGetAccessor(derivedGetter)
        // comment before getter()?
        methodDec.insertStatements(0, [`// @FameProperty(${fameProperty})`])

        return methodDec
    }


    private addImportForClass(pkg: Package, sourceFile: SourceFile) {
        sourceFile.addImportDeclaration(
            {
                moduleSpecifier: `../${this.referenceNames.sourcePathForClassRef(pkg.ref)}`,
                namedImports: [this.referenceNames.nameForRef(pkg.ref)]
            }
        );
    }

    private addImportForProperty(prop: Property, sourceFile: SourceFile) {
        sourceFile.addImportDeclaration(
            {
                moduleSpecifier: `../${this.referenceNames.sourcePathForClassRef(prop.type.ref)}`,
                namedImports: [this.referenceNames.nameForRef(prop.type.ref)]
            }
        );
    }

    private addImportForTrait(trait: Package, sourceFile: SourceFile) {
        sourceFile.addImportDeclaration(
            {
                moduleSpecifier: `../${this.referenceNames.sourcePathForClassRef(trait.ref)}`,
                namedImports: [this.referenceNames.nameForRef(trait.ref)]
            }
        );
    }

    acceptTrait(cls: Class, sourceFile: SourceFile) {
        const interfaceDeclaration = sourceFile.addInterface({
            name: cls.name,
            isExported: true
        });

        if (cls.traits) for (const trait of cls.traits) {
            console.log(`      acceptTrait: adding trait import for ${this.referenceNames.nameForRef(trait.ref)}`)
            this.addImportForTrait(trait, sourceFile)
        }

        assert(cls.superclass === undefined, `Trait ${cls.name} has a superclass defined.`)

        if (cls.properties) for (const property of cls.properties) {
            this.acceptPropertyTrait(cls, sourceFile, interfaceDeclaration, property);
        }

        return interfaceDeclaration
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
            return this.acceptDerivedPropertyTrait(property, interfaceDeclaration, sourceFile)
        else
            return this.acceptAccessorPropertyTrait(property, sourceFile)
    }

    acceptDerivedPropertyTrait(property: Property, interfaceDeclaration: InterfaceDeclaration, sourceFile: SourceFile) {
        assert(property.derived && !property.opposite)

        // this has spooky Object stuff in it, need to ask team @Lille

        // code.addImport(FameProperty.class);
        // String typeName = "Object";
        // if (m.getType() != null) { // TODO should not have null type
        //     typeName = className(m.getType());
        //     code.addImport(this.packageName(m.getType().getPackage()), typeName);
        // }
        if (!refIsType(property.type.ref)) {
            this.addImportForProperty(property, sourceFile)
        }
        // if (m.isMultivalued()) {
        //     code.addImport("java.util", "*");
        // }
        // String myName = CodeGeneration.asJavaSafeName(m.getName());

        // String base = "Trait." + (m.isMultivalued() ? "Many" : "One");
        // Template getter = Template.get(base + ".Derived.Getter");

        // getter.set("TYPE", typeName);
        // getter.set("NAME", m.getName());
        // getter.set("GETTER", "get" + Character.toUpperCase(myName.charAt(0)) + myName.substring(1));
        let typeName = refIsType(property.type.ref) ? (property.type.ref as string).toLowerCase() : this.referenceNames.nameForRef(property.type.ref);
        if (property.multivalued) { console.log('         multivalued property'); typeName += '[]' }
        interfaceDeclaration.addMethod({ name: `get${firstLetterToUpperCase(property.name)}`, returnType: typeName })

        // String props = "";
        // if (m.isDerived()) {
        //     props += ", derived = true";
        // }
        // if (m.isContainer()) {
        //     props += ", container = true";
        // }
        // getter.set("PROPS", props);

        // StringBuilder stream = code.getContentStream();
        // stream.append(getter.apply());
        // return null;
    }

    acceptAccessorPropertyTrait(property: Property, sourceFile: SourceFile) {
        return; // throw new Error('Function not implemented.');
    }
}

function addImportForOppositeSupport(sourceFile: SourceFile) {
    sourceFile.addImportDeclaration(
        {
            moduleSpecifier: `../../fame/internal/setWithOpposite`,
            namedImports: [`SetWithOpposite`]
        }
    );
}

function firstLetterToUpperCase(name: string) {
    return name[0].toLocaleUpperCase() + name.substr(1);
}

function firstLetterToLowerCase(name: string) {
    return name[0].toLocaleLowerCase() + name.substr(1);
}

function refIsType(ref: RefType) {
    return RefEnum[ref as RefEnum];
}

