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
    return this.http.get<Tag[]>(`${this.url}`);
  }
  create(name: string): Observable<Tag> {
    return this.http.post<Tag>(this.url, { tag: { name } });
  }

  update(id: number, name: string): Observable<Tag> {
    return this.http.patch<Tag>(`${this.url}/${id}`, { tag: { name } });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
