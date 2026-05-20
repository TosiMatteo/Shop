import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TagService } from './tag-service';
import { Tag } from '../../models/tag';

describe('TagService', () => {
  let service: TagService;
  let httpMock: HttpTestingController;

  const mockTags: Tag[] = [
    { id: 1, name: 'Elettronica' },
    { id: 2, name: 'Casa' }
  ];

  const mockTag: Tag = { id: 3, name: 'Sport' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TagService,
      ],
    });

    service = TestBed.inject(TagService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list()', () => {
    it('should GET all tags', () => {
      service.list().subscribe(tags => {
        expect(tags.length).toBe(2);
        expect(tags).toEqual(mockTags);
      });

      const req = httpMock.expectOne('/api/tags');
      expect(req.request.method).toBe('GET');
      req.flush(mockTags);
    });
  });

  describe('create()', () => {
    it('should POST a new tag', () => {
      service.create('Nuovo').subscribe(tag => {
        expect(tag).toEqual(mockTag);
      });

      const req = httpMock.expectOne('/api/tags');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ tag: { name: 'Nuovo' } });
      req.flush(mockTag);
    });
  });

  describe('update()', () => {
    it('should PATCH an existing tag', () => {
      const updated: Tag = { id: 1, name: 'Elettrodomestici' };
      service.update(1, 'Elettrodomestici').subscribe(tag => {
        expect(tag).toEqual(updated);
      });

      const req = httpMock.expectOne('/api/tags/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ tag: { name: 'Elettrodomestici' } });
      req.flush(updated);
    });
  });

  describe('delete()', () => {
    it('should DELETE a tag by id', () => {
      service.delete(1).subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne('/api/tags/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
