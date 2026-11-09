import { TestBed, waitForAsync } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MWABackendService } from './backend.service';
import { SnackBarService } from 'kubeflow';
import { InferenceServiceK8s } from '../types/kfserving/v1beta1';

describe('MWABackendService', () => {
  let service: MWABackendService;
  let httpTestingController: HttpTestingController;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatSnackBarModule],
      providers: [MWABackendService, SnackBarService],
    }).compileComponents();
  }));

  beforeEach(() => {
    service = TestBed.inject(MWABackendService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('passes log display options through the query parameters', () => {
    const inferenceService: InferenceServiceK8s = {
      metadata: { name: 'model', namespace: 'team' },
    };

    service
      .getInferenceServiceLogs(
        inferenceService,
        'predictor',
        'kserve-container',
        500,
        true,
        true,
      )
      .subscribe();

    const request = httpTestingController.expectOne(
      'api/namespaces/team/inferenceservices/model/components/' +
        'predictor/pods/containers/kserve-container/logs?' +
        'tailLines=500&previous=true&timestamps=true',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ logs: [] });
  });

  afterEach(() => {
    httpTestingController.verify();
  });
});
