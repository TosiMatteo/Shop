import { Injectable } from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable, tap} from 'rxjs';

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
  private readonly CUSTOMER_URL = 'http://localhost:3000/api/customers';
  private readonly TOKEN = 'auth_token';
  private readonly ME = 'http://localhost:3000/api/me';

  constructor(private http: HttpClient) { }

  login(credentials: AuthCredentials) {
    return this.http.post<Customer>(`${this.CUSTOMER_URL}/sign_in`, {customer: credentials}, {observe: 'response'})
      .pipe(
        tap((response: HttpResponse<any>) => {
          const authHeader = response.headers.get('Authorization');
          if(authHeader) {
            localStorage.setItem(this.TOKEN, authHeader)
          }
        })
      );
  }

  logout(): Observable<any> {
    return this.http.delete(`${this.CUSTOMER_URL}/sign_out`)
      .pipe(tap(() => localStorage.removeItem(this.TOKEN)));
  }

  register(credentials: RegisterCredentials): Observable<HttpResponse<any>> {
    return this.http.post(`${this.CUSTOMER_URL}`, {customer: credentials}, {observe: 'response'})
      .pipe(tap((response: HttpResponse<any>) => {
        const authHeader = response.headers.get('Authorization');
        if(authHeader) {
          localStorage.setItem(this.TOKEN, authHeader);
        }
      }));
  }

  getToken() {
    return localStorage.getItem(this.TOKEN);
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  getCurrentUser() {
    return this.http.get(`${this.ME}`);
  }
}
