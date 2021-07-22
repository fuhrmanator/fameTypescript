import * as Famix from "../../target/famix/model/famix";
import * as File from "../../target/famix/model/file";
import {FamixBaseElement} from "./famix_base_element";
import {FamixMseExporter} from "./famix_mse_exporter";
import {FamixRepository} from "./famix_repository";

const model = {Famix, File };

export = {FamixBaseElement, FamixMseExporter, FamixRepository, model};
