import { GET, Path } from 'typescript-rest';
import packageJson from '../../package.json';

export interface HealthResponse {
  version: string;
}

@Path('/api/health')
export class HealthCheckController {
  @Path('/')
  @GET
  health(): HealthResponse {
    return { version: packageJson.version };
  }
}
