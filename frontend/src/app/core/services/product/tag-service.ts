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
}
