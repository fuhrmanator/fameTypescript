import {FamixMSEExporter} from "./famixMSEExporter";
import {FamixRepository} from "./famixRepository";

export abstract class FamixBaseElement {

  public id: number | undefined;

  constructor(repo: FamixRepository) {
    repo.addElement(this);
  }

  public abstract getMSE(): string;

  // @ts-ignore
  // tslint:disable-next-line:no-empty
  public addPropertiesToExporter(exporter: FamixMSEExporter): void {
  }

}
