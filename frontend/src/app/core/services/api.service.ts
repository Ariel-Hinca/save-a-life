import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BloodResult,
  Donation,
  OcrScanResponse,
  StatsSummary,
  User,
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.base}/user`);
  }

  updateUser(id: string, payload: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.base}/user/${id}`, payload);
  }

  getDonations(): Observable<Donation[]> {
    return this.http.get<Donation[]>(`${this.base}/donations`);
  }

  createDonation(payload: Record<string, unknown>): Observable<Donation> {
    return this.http.post<Donation>(`${this.base}/donations`, payload);
  }

  deleteDonation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/donations/${id}`);
  }

  getBloodResults(): Observable<BloodResult[]> {
    return this.http.get<BloodResult[]>(`${this.base}/bloodresults`);
  }

  createBloodResult(payload: Record<string, unknown>): Observable<BloodResult> {
    return this.http.post<BloodResult>(`${this.base}/bloodresults`, payload);
  }

  parseOcr(text: string, clientConfidence?: number): Observable<OcrScanResponse> {
    return this.http.post<OcrScanResponse>(`${this.base}/ocr/scan`, {
      text,
      clientConfidence,
    });
  }

  getStatsSummary(): Observable<StatsSummary> {
    return this.http.get<StatsSummary>(`${this.base}/stats/summary`);
  }
}
