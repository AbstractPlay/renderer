import AjvImport from "ajv";
import type { ValidateFunction } from "ajv";
import schema from "../schemas/schema.json" with { type: "json" };

type AjvInstance = {
    compile(jsonSchema: object): ValidateFunction;
    addSchema(schema: object): void;
};

const ajvCtor = AjvImport as unknown as new () => AjvInstance;
const ajv = new ajvCtor();
ajv.addSchema(schema);

const compositeRef = `${schema.$id}/$defs/APRenderComposite`;

export const validateComposite: ValidateFunction = ajv.compile({ $ref: compositeRef });
