import { AWSError } from 'aws-sdk';
import CognitoIdentityServiceProvider, {
  InitiateAuthRequest,
  InitiateAuthResponse,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { PromiseResult } from 'aws-sdk/lib/request';
import crypto from 'crypto';
import { Inject, InjectValue, Singleton } from 'typescript-ioc';
import { AppConfig } from '../config';
import { ValidatorService } from './ValidatorService';

const logger = console;

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

const expectedInitiateAuthResponseSchema = {
  type: 'object',
  properties: {
    AuthenticationResult: {
      type: 'object',
      properties: {
        AccessToken: { type: 'string' },
        ExpiresIn: { type: 'number' },
        RefreshToken: { type: 'string' },
        IdToken: { type: 'string' },
      },
      required: ['AccessToken', 'ExpiresIn', 'RefreshToken', 'IdToken'],
      additionalProperties: true,
    },
  },
  required: ['AuthenticationResult'],
  additionalProperties: true,
};

@Singleton
export class CognitoService {
  private readonly cognito: CognitoIdentityServiceProvider;

  constructor(
    @InjectValue('config') private readonly config: AppConfig,
    @Inject private readonly validatorService: ValidatorService
  ) {
    this.cognito = new CognitoIdentityServiceProvider({ region: this.config.aws.userPoolRegion });
    this.validatorService.registerSchema(
      expectedInitiateAuthResponseSchema,
      'expectedInitiateAuthResponseSchema'
    );
  }

  public async loginUser(email: string, password: string) {
    const params: InitiateAuthRequest = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.config.aws.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: this.generateHash(email),
      },
    };

    const response = await this.cognito.initiateAuth(params).promise();
    return this.handleInitiateAuthResponse(response);
  }

  public async refreshUser(username: string, refreshToken: string) {
    const params: InitiateAuthRequest = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: this.config.aws.clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: this.generateHash(username),
      },
    };

    const response = await this.cognito.initiateAuth(params).promise();
    return this.handleInitiateAuthResponse(response);
  }

  private generateHash(username: string) {
    return crypto
      .createHmac('SHA256', this.config.aws.clientSecret)
      .update(username + this.config.aws.clientId)
      .digest('base64');
  }

  private handleInitiateAuthResponse(
    initiateAuthResponse: PromiseResult<InitiateAuthResponse, AWSError>
  ): LoginResponse {
    const validationResult = this.validatorService.validateSchema(
      'expectedInitiateAuthResponseSchema',
      initiateAuthResponse
    );

    const result = initiateAuthResponse.AuthenticationResult;

    if (!validationResult) {
      throw new Error('Unexpected Cognito AuthenticationResult');
    }

    const { AccessToken, RefreshToken, IdToken, ExpiresIn } = result!;

    return {
      accessToken: AccessToken!,
      refreshToken: RefreshToken!,
      idToken: IdToken!,
      expiresIn: ExpiresIn!,
    };
  }
}
