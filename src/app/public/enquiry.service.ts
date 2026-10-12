import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EnquiryFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  subject: string;
}

export type EnquiryResult = 'sent' | 'confirm';

interface EnquiryResponse {
  success?: string | boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class EnquiryService {
  private readonly http = inject(HttpClient);

  send(fields: EnquiryFields): Observable<EnquiryResult> {
    const url = `https://formsubmit.co/ajax/${encodeURIComponent(environment.enquiryEmail)}`;
    return this.http
      .post<EnquiryResponse>(
        url,
        {
          firstName: fields.firstName,
          lastName: fields.lastName,
          email: fields.email,
          phone: fields.phone,
          message: fields.message,
          _subject: fields.subject,
          _template: 'table',
          _captcha: 'false',
          _replyto: fields.email,
        },
        { headers: { Accept: 'application/json' } },
      )
      .pipe(
        map((body) => {
          if (body?.success === true || body?.success === 'true') {
            return 'sent';
          }
          if ((body?.message ?? '').toLowerCase().includes('activation')) {
            return 'confirm';
          }
          throw new Error(body?.message || 'Enquiry failed');
        }),
      );
  }
}
