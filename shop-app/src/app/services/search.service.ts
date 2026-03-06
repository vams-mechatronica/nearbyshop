import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_ENDPOINTS } from '../shared/constants/api.constants';

@Injectable({ providedIn: 'root' })
export class SearchService {

  constructor(private http: HttpClient) {}

  getSuggestions(query: string): Observable<any[]> {
    return this.http.get<any[]>(API_ENDPOINTS.SEARCH_SUGGESTIONS, {
      params: { q: query, limit: '8' }
    });
  }

  getQuickSuggestions(): Observable<string[]> {
    return this.http.get<string[]>(API_ENDPOINTS.QUICK_SUGGESTIONS);
  }

  search(params: Record<string, string>): Observable<any> {
    return this.http.get<any>(API_ENDPOINTS.SEARCH, { params });
  }
}
