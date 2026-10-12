import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { ApiCallOptions } from './api.models';

interface BrandingRequestOptions extends ApiCallOptions {
  params?: Record<string, string | number | boolean | null | undefined>;
}

@Injectable({ providedIn: 'root' })
export class BrandingHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get<T>(path: string, options?: BrandingRequestOptions): Observable<T> {
    return this.http.get<T>(this.url(path), {
      params: this.params(options?.params),
      headers: this.headers(options),
    });
  }

  getText(path: string, options?: BrandingRequestOptions): Observable<string> {
    return this.http.get(this.url(path), {
      params: this.params(options?.params),
      headers: this.headers(options),
      responseType: 'text',
    });
  }

  post<T>(path: string, body: unknown, options?: ApiCallOptions): Observable<T> {
    return this.http.post<T>(this.url(path), body, { headers: this.headers(options) });
  }

  postForm<T>(path: string, body: FormData, options?: ApiCallOptions): Observable<T> {
    return this.http.post<T>(this.url(path), body, { headers: this.headers(options) });
  }

  put<T>(path: string, body: unknown, options?: ApiCallOptions): Observable<T> {
    return this.http.put<T>(this.url(path), body, { headers: this.headers(options) });
  }

  delete(path: string, options?: ApiCallOptions): Observable<void> {
    return this.http
      .delete(this.url(path), {
        headers: this.headers(options),
        responseType: 'text',
      })
      .pipe(map(() => undefined));
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private headers(options?: ApiCallOptions): HttpHeaders | undefined {
    return options?.language ? new HttpHeaders({ 'X-Language': options.language }) : undefined;
  }

  private params(
    values?: Record<string, string | number | boolean | null | undefined>,
  ): HttpParams | undefined {
    if (!values) {
      return undefined;
    }

    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
