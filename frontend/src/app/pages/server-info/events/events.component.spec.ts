import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KubeflowModule, PollerService } from 'kubeflow';
import { Observable, of, Subject } from 'rxjs';
import { MWABackendService } from 'src/app/services/backend.service';
import { SSEService, WatchEvent } from 'src/app/services/sse.service';
import { InferenceServiceK8s } from 'src/app/types/kfserving/v1beta1';
import { EventObject } from '../../../types/event';

import { EventsComponent } from './events.component';

const MWABackendServiceStub: Partial<MWABackendService> = {
  getInferenceServiceEvents: () => of(),
};
const PollerServiceStub: Partial<PollerService> = {
  exponential: () => of(),
};

describe('EventsComponent', () => {
  let component: EventsComponent;
  let fixture: ComponentFixture<EventsComponent>;
  let sseEvents: Subject<WatchEvent<EventObject>>;
  let sseTeardown: jest.Mock;

  const inferenceService = {
    metadata: {
      namespace: 'kubeflow-user',
      name: 'test-model',
    },
  } as InferenceServiceK8s;

  const event = {
    metadata: {
      uid: 'event-uid',
    },
    type: 'Normal',
    reason: 'Ready',
    message: 'InferenceService is ready',
  } as EventObject;

  beforeEach(async () => {
    sseEvents = new Subject<WatchEvent<EventObject>>();
    sseTeardown = jest.fn();

    await TestBed.configureTestingModule({
      declarations: [EventsComponent],
      imports: [KubeflowModule],
      providers: [
        { provide: MWABackendService, useValue: MWABackendServiceStub },
        { provide: PollerService, useValue: PollerServiceStub },
        {
          provide: SSEService,
          useValue: {
            watchEvents: () =>
              new Observable<WatchEvent<EventObject>>(observer => {
                const subscription = sseEvents.subscribe(observer);
                return () => {
                  sseTeardown();
                  subscription.unsubscribe();
                };
              }),
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    jest.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close SSE subscription before polling fallback on SSE error events', () => {
    component.inferenceService = inferenceService;

    sseEvents.next({ type: 'ERROR', message: 'watch failed' });

    expect(sseTeardown).toHaveBeenCalled();
  });

  it('should fall back to polling when the SSE stream sends no initial batch', () => {
    jest.useFakeTimers();
    const getEventsSpy = jest.spyOn(
      MWABackendServiceStub,
      'getInferenceServiceEvents',
    );

    component.inferenceService = inferenceService;
    jest.advanceTimersByTime(10000);

    expect(sseTeardown).toHaveBeenCalled();
    expect(getEventsSpy).toHaveBeenCalledWith(inferenceService);
  });

  it('should request change detection after SSE event updates', () => {
    const cdr = (component as any).cdr;
    expect(cdr).toBeDefined();
    const detectChangesSpy = jest
      .spyOn(cdr, 'detectChanges')
      .mockImplementation(() => undefined);

    component.inferenceService = inferenceService;

    sseEvents.next({ type: 'INITIAL', items: [event] });

    expect(component.events).toEqual([event]);
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('should show an empty state after the initial batch contains no events', () => {
    component.inferenceService = inferenceService;

    sseEvents.next({ type: 'INITIAL', items: [] });
    fixture.detectChanges();

    expect(component.eventsLoaded).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      'No events found for this endpoint.',
    );
  });
});
