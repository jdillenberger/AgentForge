import { Request, Response } from 'express';
import { ConfigService } from '../config/app.config';
import { AuthService } from '../services/auth.service';

/**
 * Base controller class with common functionality
 */
export abstract class BaseController {
  protected readonly config = ConfigService.getInstance();
  protected readonly authService = AuthService.getInstance();

  /**
   * Send success response
   */
  protected success<T>(res: Response, data: T, message?: string): void {
    // For backward compatibility with frontend, return raw data
    // TODO: Update frontend to handle structured responses, then enable this:
    // const response: SuccessResponse<T> = {
    //   success: true,
    //   data,
    //   message,
    //   timestamp: new Date().toISOString(),
    //   requestId: res.get('x-request-id'),
    // };
    // res.json(response);
    
    res.json(data);
  }

  /**
   * Authentication middleware function for use in routes
   */
  public authenticate = this.authService.authenticate.bind(this.authService);

  /**
   * Optional authentication middleware function for use in routes
   */
  public optionalAuthenticate = this.authService.optionalAuthenticate.bind(this.authService);
}