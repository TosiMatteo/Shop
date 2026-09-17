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
    { id: 2, name: 'Casa' },
  ];

  const mockTag: Tag = { id: 3, name: 'Sport' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TagService],
    });
    service = TestBed.inject(TagService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── list() ────────────────────────────────────────────────────────────────
  describe('list()', () => {
    it('should GET all tags', () => {
      let tags: Tag[] | undefined;

      service.list().subscribe(result => (tags = result));

      const req = httpMock.expectOne('/api/tags');
      expect(req.request.method).toBe('GET');
      req.flush(mockTags);

      expect(tags).toEqual(mockTags);
    });
  });

  // ─── create() ──────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('should POST a new tag', () => {
      let tag: Tag | undefined;

      service.create('Nuovo').subscribe(result => (tag = result));

      const req = httpMock.expectOne('/api/tags');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ tag: { name: 'Nuovo' } });
      req.flush(mockTag);

      expect(tag).toEqual(mockTag);
    });
  });

  // ─── update() ──────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('should PATCH an existing tag', () => {
      const mockUpdatedTag: Tag = { id: 1, name: 'Elettrodomestici' };
      let tag: Tag | undefined;

      service.update(1, 'Elettrodomestici').subscribe(result => (tag = result));

      const req = httpMock.expectOne('/api/tags/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ tag: { name: 'Elettrodomestici' } });
      req.flush(mockUpdatedTag);

      expect(tag).toEqual(mockUpdatedTag);
    });
  });

  // ─── delete() ──────────────────────────────────────────────────────────────
  describe('delete()', () => {
    it('should DELETE a tag by id', () => {
      let completed = false;

      service.delete(1).subscribe({ complete: () => (completed = true) });

      const req = httpMock.expectOne('/api/tags/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(completed).toBeTrue();
    });
  });
});
