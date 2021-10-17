import { JSONSchemaType } from 'ajv';
import { AWSError } from 'aws-sdk/lib/error';
import { CognitoService } from '../service/CognitoService';
import { ValidatorService } from '../service/ValidatorService';
import { Inject, InjectValue } from 'typescript-ioc';
import { Path, POST } from 'typescript-rest';
import { UnauthorizedError } from 'typescript-rest/dist/server/model/errors';
import { TokenService } from '../service/TokenService';
import { Connection } from 'typeorm';
import { User } from '../entity/User';

const logger = console;

export interface LoginRequest {
  email: string;
  password: string;
}

const loginRequestSchema: JSONSchemaType<LoginRequest> = {
  type: 'object',
  properties: {
    email: { type: 'string', minLength: 6 },
    password: { type: 'string', minLength: 8 },
  },
  required: ['email', 'password'],
  additionalProperties: false,
};

export interface RefreshRequest {
  username: string;
  refreshToken: string;
}

const refreshRequestSchema: JSONSchemaType<RefreshRequest> = {
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 6 },
    refreshToken: { type: 'string' },
  },
  required: ['username', 'refreshToken'],
  additionalProperties: false,
};

@Path('/api/auth')
export class AuthController {
  constructor(
    @Inject private readonly validatorService: ValidatorService,
    @Inject private readonly cognitoService: CognitoService,
    @Inject private readonly tokenService: TokenService,
    @InjectValue('connection') private readonly connection: Connection
  ) {
    this.validatorService.registerSchema(loginRequestSchema, 'loginRequestSchema');
    this.validatorService.registerSchema(refreshRequestSchema, 'refreshRequestSchema');
  }

  @Path('/login')
  @POST
  public async login(loginRequest: LoginRequest) {
    this.validatorService.validatePayload('loginRequestSchema', loginRequest);

    const { email, password } = loginRequest;

    try {
      const loginResponse = await this.cognitoService.loginUser(email, password);
      const subId = await this.tokenService.verifyToken(loginResponse.accessToken);

      if (!subId) {
        throw new Error('Could not verify access token');
      }

      const repository = this.connection.getRepository(User);

      const thisUser = await repository.findOne({ subId });

      if (!thisUser) {
        logger.debug(`User with subId ${subId} not found. Adding user to table`);

        const newUser = new User();
        newUser.subId = subId;
        const createdUser = await repository.save(newUser);

        logger.debug(`User created! User id ${createdUser.id}`);
      } else {
        logger.debug(`User found! User id ${thisUser.id}`);
      }

      return loginResponse;
    } catch (error: any) {
      this.handleAuthError(error);
    }
  }

  @Path('/refresh')
  @POST
  public refresh(refreshRequest: RefreshRequest) {
    this.validatorService.validatePayload('refreshRequestSchema', refreshRequest);

    const { username, refreshToken } = refreshRequest;

    try {
      return this.cognitoService.refreshUser(username, refreshToken);
    } catch (error: any) {
      this.handleAuthError(error);
    }
  }

  private handleAuthError(error: AWSError) {
    if (error.code === 'NotAuthorizedException') {
      throw new UnauthorizedError(error.message);
    } else {
      logger.error('Unknown error occurred while logging in', error);
      throw error;
    }
  }
}
