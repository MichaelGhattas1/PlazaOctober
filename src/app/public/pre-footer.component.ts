import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HotelDto } from '../core/api/api.models';
import { LanguageService } from '../core/api/language.service';
import { UserBrandingService } from '../core/api/user-branding.service';
import { loadOnLanguage } from '../shared/load';
import { uiCopy } from '../shared/ui-copy';
import { EnquiryResult, EnquiryService } from './enquiry.service';
import { PublicCompanyService } from './public-company.service';

@Component({
  selector: 'app-pre-footer',
  template: `
    <section id="contact" class="hover-fluid scroll-mt-28 bg-navy-900 py-24 text-sand">
      <div class="grid items-start gap-x-16 gap-y-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div class="lg:col-span-7">
          <p class="kicker">{{ brand() }}</p>
          <h2 class="mt-3 font-serif text-4xl font-bold text-white sm:text-5xl">{{ copy().contactUs }}</h2>
          <span class="mt-6 block h-px w-16 bg-gold-400"></span>
          <p class="mt-6 line-clamp-3 max-w-xl text-sm leading-relaxed font-light text-sand/70">{{ intro() }}</p>
        </div>

        <form class="lg:col-span-7 lg:row-start-2" (submit)="enquire($event)">
            <div class="grid gap-8 sm:grid-cols-2">
              <label class="block">
                <span class="kicker">{{ copy().firstName }}</span>
                <input name="firstName" required maxlength="80" autocomplete="given-name" [placeholder]="copy().firstNameHint" class="mt-2 w-full border-0 border-b border-gold-500/40 bg-transparent py-2 text-sm font-light text-white outline-none placeholder:text-sand/40 focus:border-gold-300" />
              </label>
              <label class="block">
                <span class="kicker">{{ copy().lastName }}</span>
                <input name="lastName" required maxlength="80" autocomplete="family-name" [placeholder]="copy().lastNameHint" class="mt-2 w-full border-0 border-b border-gold-500/40 bg-transparent py-2 text-sm font-light text-white outline-none placeholder:text-sand/40 focus:border-gold-300" />
              </label>
            </div>
            <label class="mt-8 block">
              <span class="kicker">{{ copy().emailAddress }}</span>
              <input name="email" type="email" required maxlength="256" autocomplete="email" [placeholder]="copy().emailHint" class="mt-2 w-full border-0 border-b border-gold-500/40 bg-transparent py-2 text-sm font-light text-white outline-none placeholder:text-sand/40 focus:border-gold-300" />
            </label>
            <label class="mt-8 block">
              <span class="kicker">{{ copy().phoneNumber }}</span>
              <input name="phone" type="tel" maxlength="32" autocomplete="tel" [placeholder]="copy().phoneHint" class="mt-2 w-full border-0 border-b border-gold-500/40 bg-transparent py-2 text-sm font-light text-white outline-none placeholder:text-sand/40 focus:border-gold-300" />
            </label>
            <label class="mt-8 block">
              <span class="kicker">{{ copy().yourMessage }}</span>
              <textarea name="message" required maxlength="2000" rows="3" [placeholder]="copy().messageHint" class="mt-2 w-full resize-y border-0 border-b border-gold-500/40 bg-transparent py-2 text-sm font-light text-white outline-none placeholder:text-sand/40 focus:border-gold-300"></textarea>
            </label>
            <button type="submit" class="btn-gold mt-10 disabled:cursor-not-allowed disabled:opacity-50" [disabled]="sending()">
              {{ sending() ? copy().enquirySending : copy().submitEnquiry }}
            </button>
            @if (enquiryNotice(); as notice) {
              <p class="mt-4 text-sm text-gold-300">{{ notice }}</p>
            }
          </form>

        <div class="lg:col-span-5 lg:col-start-8 lg:row-start-2">
          <div class="border border-gold-500/50 p-3">
            <div class="relative h-72 overflow-hidden sm:h-80">
              <iframe
                class="absolute inset-0 h-full w-full"
                [src]="mapUrl"
                [title]="copy().address"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
          <ul class="mt-6 space-y-4">
            @if (phone()) {
              <li class="flex items-center gap-4">
                <svg class="h-5 w-5 shrink-0 text-gold-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 3.5h2.2l1.2 3-1.6 1a12 12 0 0 0 5.5 5.5l1-1.6 3 1.2V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5" />
                </svg>
                <a class="text-base font-light text-white hover:text-gold-300" [href]="'tel:' + phone()">{{ phone() }}</a>
              </li>
            }
            @if (email()) {
              <li class="flex items-center gap-4">
                <svg class="h-5 w-5 shrink-0 text-gold-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                  <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
                  <path stroke-linecap="round" d="m4 7 8 6 8-6" />
                </svg>
                <a class="break-all text-base font-light text-white hover:text-gold-300" [href]="'mailto:' + email()">{{ email() }}</a>
              </li>
            }
            <li class="flex items-center gap-4">
              <svg class="h-5 w-5 shrink-0 text-gold-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21s6.5-5.2 6.5-10.2a6.5 6.5 0 1 0-13 0C5.5 15.8 12 21 12 21z" />
                <circle cx="12" cy="10.8" r="2" />
              </svg>
              <a class="text-base font-light text-white hover:text-gold-300" [href]="mapHref" target="_blank" rel="noopener">2 Kamel Wasef, Dokki, Giza</a>
            </li>
          </ul>
          <div class="mt-6 flex items-center gap-6 text-gold-300">
            <a class="transition hover:text-gold-400" href="https://www.facebook.com/" target="_blank" rel="noopener" aria-label="Facebook">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3.5h-2.1C12.4 3.5 11 4.9 11 7.2v1.3H9v2.4h2V20h2.6v-7.1h2.1l.4-2.4h-2.6z" />
              </svg>
            </a>
            <a class="transition hover:text-gold-400" href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="Instagram">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="4" />
                <circle cx="12" cy="12" r="3.5" />
                <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
              </svg>
            </a>
            @if (whatsApp(); as href) {
              <a class="transition hover:text-gold-400" [href]="href" target="_blank" rel="noopener" aria-label="WhatsApp">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.5 3.5A11 11 0 0 0 2.1 16.8L1 23l6.4-1.1A11 11 0 0 0 20.5 3.5zM12 20.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.8.6.6-3.7-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.3a.5.5 0 0 0 0-.5c0-.1-.5-1.2-.7-1.7s-.4-.4-.5-.4h-.4a.8.8 0 0 0-.6.3 2.5 2.5 0 0 0-.8 1.9 4.4 4.4 0 0 0 .9 2.3 10 10 0 0 0 3.8 3.3 4.3 4.3 0 0 0 2.6.7 2.2 2.2 0 0 0 1.5-.7 1.8 1.8 0 0 0 .4-1.2c0-.1 0-.3-.2-.4z" />
                </svg>
              </a>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class PreFooter {
  private readonly company = inject(PublicCompanyService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly mapHref =
    'https://www.google.com/maps/place/2+Kamel+Wasef,+Ad+Doqi+A,+Dokki,+Giza+Governorate+3750403/@30.0338185,31.2178126,19z/data=!3m1!4b1!4m6!3m5!1s0x1458472a3efc3585:0x5bf8c866feed775f!8m2!3d30.0338173!4d31.2184563!16s%2Fg%2F11lmnw3fxc';
  protected readonly mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://maps.google.com/maps?q=30.0338173,31.2184563&z=17&output=embed',
  );
  private readonly enquiries = inject(EnquiryService);
  private readonly users = inject(UserBrandingService);
  private readonly language = inject(LanguageService);
  private readonly hotels = loadOnLanguage(() => this.users.hotels());
  protected readonly copy = computed(() => uiCopy(this.language.code()));
  protected readonly brand = computed(() => this.company.state().data?.name || 'Plaza Inn');
  protected readonly intro = computed(() => this.company.state().data?.aboutUs || this.copy().contactIntro);
  protected readonly phone = computed(() => this.contactHotel()?.phone || '');
  protected readonly email = computed(() => this.contactHotel()?.email || '');
  protected readonly sending = signal(false);
  protected readonly enquiryState = signal<EnquiryResult | 'failed' | null>(null);
  protected readonly enquiryNotice = computed(() => {
    const state = this.enquiryState();
    if (state === 'sent') return this.copy().enquirySent;
    if (state === 'confirm') return this.copy().enquiryConfirm;
    if (state === 'failed') return this.copy().enquiryFailed;
    return '';
  });
  protected readonly whatsApp = computed(() => {
    const digits = this.phone().replace(/\D/g, '');
    if (!digits) {
      return null;
    }
    const international = digits.startsWith('0') ? `20${digits.slice(1)}` : digits;
    return `https://wa.me/${international}`;
  });

  protected enquire(event: Event): void {
    event.preventDefault();
    const target = event.target;
    if (!(target instanceof HTMLFormElement) || this.sending()) {
      return;
    }
    const data = new FormData(target);
    const text = (name: string) => String(data.get(name) ?? '').trim();
    this.sending.set(true);
    this.enquiryState.set(null);
    this.enquiries
      .send({
        firstName: text('firstName'),
        lastName: text('lastName'),
        email: text('email'),
        phone: text('phone'),
        message: text('message'),
        subject: this.copy().contactUs,
      })
      .subscribe({
        next: (result) => {
          this.sending.set(false);
          this.enquiryState.set(result);
          if (result === 'sent') {
            target.reset();
          }
        },
        error: () => {
          this.sending.set(false);
          this.enquiryState.set('failed');
        },
      });
  }

  private contactHotel(): HotelDto | null {
    return this.hotels().data?.find((hotel) => hotel.phone || hotel.email) ?? null;
  }
}
