import Ajv, { AnySchema } from 'ajv';
import { Singleton } from 'typescript-ioc';
import { BadRequestError, InternalServerError } from 'typescript-rest/dist/server/model/errors';

const logger = console;

interface ValidationResult {
  valid: boolean;
  message?: string;
}

@Singleton
export class ValidatorService {
  private readonly ajv: Ajv;

  private schemasRegistered: string[] = [];

  constructor() {
    this.ajv = new Ajv();
  }

  public registerSchema(schema: AnySchema, key: string) {
    if (!this.schemasRegistered.includes(key)) {
      this.ajv.addSchema(schema, key);
      this.schemasRegistered.push(key);
    }
  }

  public validateSchema(schemaName: string, data: any): ValidationResult {
    const validate = this.ajv.getSchema(schemaName);

    if (!validate) {
      logger.error(`Validation unsuccessful. Could not find schema ${schemaName}`);
      throw new InternalServerError();
    }

    const validationResult = validate(data);

    if (validationResult) {
      return { valid: true };
    }

    const error = validate.errors?.[0];

    if (!error) {
      logger.error('Validation unsuccessful. Unexpected failed validation state');
      throw new InternalServerError();
    }

    let errorMessage = '';

    if (error.instancePath) {
      errorMessage += `${error.instancePath}: `;
    }

    errorMessage += error.message;

    return {
      valid: false,
      message: errorMessage,
    };
  }

  public validatePayload(schemaName: string, payload: any) {
    const validationResult = this.validateSchema(schemaName, payload);

    if (validationResult.valid) {
      return;
    }

    throw new BadRequestError(validationResult.message);
  }
}
