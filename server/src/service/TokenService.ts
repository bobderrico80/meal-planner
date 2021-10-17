import { AppConfig } from 'config';
import jwkToPem from 'jwk-to-pem';
import { InjectValue, Singleton } from 'typescript-ioc';
import fetch from 'node-fetch';
import * as jwt from 'jsonwebtoken';

const logger = console;

@Singleton
export class TokenService {
  private readonly pems: any = {};

  constructor(@InjectValue('config') private readonly config: AppConfig) {
    this.retrievePems();
  }

  public async verifyToken(token: string): Promise<string | null> {
    if (token.startsWith('Bearer')) {
      token = token.replace('Bearer ', '');
    }

    const decoded = jwt.decode(token, { complete: true });

    if (!decoded) {
      return null;
    }

    const kid = decoded.header.kid;

    if (!kid) {
      return null;
    }

    const { client_id, iss, sub } = decoded.payload;

    if (client_id !== this.config.aws.clientId) {
      return null;
    }

    if (!iss || !iss.includes(this.config.aws.userPoolId)) {
      return null;
    }

    if (!sub) {
      return null;
    }

    const pem = this.pems[kid];

    if (!pem) {
      return null;
    }

    return new Promise((resolve) => {
      jwt.verify(token, pem, (error: any) => {
        if (error) {
          resolve(null);
          return;
        }

        resolve(sub);
      });
    });
  }

  private async retrievePems() {
    logger.info('Initializing auth');

    const url = `https://cognito-idp.${this.config.aws.userPoolRegion}.amazonaws.com/${this.config.aws.userPoolId}/.well-known/jwks.json`;

    try {
      const response = await fetch(url);

      if (response.status !== 200) {
        throw new Error('Could not retrieve JWKS from AWS');
      }

      const data: any = await response.json();
      const { keys } = data;

      keys.forEach((key: any) => {
        const jwk = {
          kty: key.kty,
          n: key.n,
          e: key.e,
        };
        const pem = jwkToPem(jwk);
        this.pems[key.kid] = pem;
      });
    } catch (error) {
      logger.error(error);
    }
  }
}
