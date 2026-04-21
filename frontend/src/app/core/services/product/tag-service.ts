import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Tag} from '../../models/tag';

@Injectable({
  providedIn: 'root',
})
export class TagService {
  private readonly url = '/api/tags';

  constructor(private http: HttpClient) { }


  list(): Observable<Tag[]>{
    // Fetch all available tags for filters/admin management.
    return this.http.get<Tag[]>(`${this.url}`);
  }

  // Create a new tag by name.
  create(name: string): Observable<Tag> {
    return this.http.post<Tag>(this.url, { tag: { name } });
  }

  // Update an existing tag label.
  update(id: number, name: string): Observable<Tag> {
    return this.http.patch<Tag>(`${this.url}/${id}`, { tag: { name } });
  }

  // Remove a tag by id.
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
