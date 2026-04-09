import { Injectable } from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable, Subject, tap} from 'rxjs';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface RegisterCredentials {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly CUSTOMER_URL= '/api/customers';
  private readonly ADMIN_URL = '/api/admins';
  private readonly TOKEN = 'auth_token';
  private readonly USER_TYPE = 'user_type';
  private readonly ME = '/api/me';

  constructor(private http: HttpClient) { }

  private loginEventSubject = new Subject<void>();
  readonly loginEvent$ = this.loginEventSubject.asObservable();

  login(credentials: AuthCredentials) {
    return this.http
      .post<Customer>(`${this.CUSTOMER_URL}/sign_in`, { customer: credentials }, { observe: 'response' })
      .pipe(
        tap((response: HttpResponse<any>) => {
          const authHeader = response.headers.get('Authorization');
          if (authHeader) {
            localStorage.setItem(this.TOKEN, authHeader);
            localStorage.setItem(this.USER_TYPE, 'Customer');
            this.loginEventSubject.next();
          }
        })
      );
  }

  loginAdmin(credentials: AuthCredentials) {
    return this.http
      .post<any>(`${this.ADMIN_URL}/sign_in`, { admin: credentials }, { observe: 'response' })
      .pipe(
        tap((response: HttpResponse<any>) => {
          const authHeader = response.headers.get('Authorization');
          if (authHeader) {
            localStorage.setItem(this.TOKEN, authHeader);
            localStorage.setItem(this.USER_TYPE, 'Admin');
          }
        })
      );
  }

  logout(): Observable<any> {
    return this.http.delete(`${this.CUSTOMER_URL}/sign_out`).pipe(tap(() => this.clearSession()));
  }

  logoutAdmin(): Observable<any> {
    return this.http.delete(`${this.ADMIN_URL}/sign_out`).pipe(tap(() => this.clearSession()));
  }

  register(credentials: RegisterCredentials): Observable<HttpResponse<any>> {
    return this.http.post(`${this.CUSTOMER_URL}`, { customer: credentials }, { observe: 'response' })
      .pipe(
        tap((response: HttpResponse<any>) => {
          const authHeader = response.headers.get('Authorization');
          if (authHeader) {
            localStorage.setItem(this.TOKEN, authHeader);
            localStorage.setItem(this.USER_TYPE, 'Customer');
            this.loginEventSubject.next();
          }
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return localStorage.getItem(this.USER_TYPE) === 'Admin';
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(this.ME);
  }

  public clearSession(): void {
    localStorage.removeItem(this.TOKEN);
    localStorage.removeItem(this.USER_TYPE);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post('/api/customers/password', {
      customer: { email },
    });
  }

  resetPassword(token: string, password: string, password_confirmation: string): Observable<any> {
    return this.http.put('/api/customers/password', {
      customer: {
        reset_password_token: token,
        password,
        password_confirmation,
      },
    });
  }
}
