import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Get the auth token from the service
  const authToken = authService.getToken();

  // Clone the request and add the authorization header if token exists
  let authReq = req;
  if (authToken && !req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
    console.log('Adding auth token to request:', req.url);
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`
      }
    });
  } else {
    console.log('No token or login/register request:', req.url, 'Token:', authToken);
  }

  // Send the request
  return next(authReq).pipe(
    catchError(error => {
      // Handle 401 Unauthorized errors
      if (error.status === 401) {
        console.log('401 Unauthorized error, logging out');
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
