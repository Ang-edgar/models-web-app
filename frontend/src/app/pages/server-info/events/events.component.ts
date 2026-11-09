import { ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { PollerService } from 'kubeflow';
import { Subscription } from 'rxjs';
import { MWABackendService } from 'src/app/services/backend.service';
import { SSEService } from 'src/app/services/sse.service';
import { defaultConfig } from './config';
import { InferenceServiceK8s } from 'src/app/types/kfserving/v1beta1';
import { EventObject } from '../../../types/event';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
})
export class EventsComponent implements OnDestroy {
  private static readonly initialEventsTimeoutMilliseconds = 10000;

  public events: EventObject[] = [];
  public eventsLoaded = false;
  public config = defaultConfig;
  private pollingSubscription = new Subscription();
  private sseSubscription = new Subscription();
  private inferenceServicePrivate: InferenceServiceK8s;
  private initialEventsTimeout: ReturnType<typeof setTimeout> | null = null;

  @Input()
  set inferenceService(s: InferenceServiceK8s) {
    this.inferenceServicePrivate = s;
    this.poll(s);
  }
  get inferenceService(): InferenceServiceK8s {
    return this.inferenceServicePrivate;
  }

  constructor(
    public backend: MWABackendService,
    public poller: PollerService,
    private sseService: SSEService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
    }
    this.clearInitialEventsTimeout();
  }

  private poll(inferenceService: InferenceServiceK8s) {
    this.pollingSubscription?.unsubscribe();
    this.sseSubscription?.unsubscribe();
    this.clearInitialEventsTimeout();
    this.events = [];
    this.eventsLoaded = false;

    if (!inferenceService) {
      return;
    }

    const namespace = inferenceService.metadata.namespace;
    const name = inferenceService.metadata.name;

    this.initialEventsTimeout = setTimeout(
      () => this.fallbackToPolling(inferenceService),
      EventsComponent.initialEventsTimeoutMilliseconds,
    );

    // Use SSE for real-time event updates
    this.sseSubscription = this.sseService
      .watchEvents<EventObject>(namespace, name)
      .subscribe(
        event => {
          if (event.type === 'INITIAL' && event.items) {
            this.clearInitialEventsTimeout();
            this.events = event.items;
            this.eventsLoaded = true;
          } else if (event.type === 'ADDED' && event.object) {
            this.events = [...this.events, event.object];
          } else if (
            event.type === 'MODIFIED' &&
            event.object &&
            event.object.metadata
          ) {
            const index = this.events.findIndex(
              e => e.metadata?.uid === event.object?.metadata?.uid,
            );
            if (index !== -1) {
              this.events[index] = event.object;
              this.events = [...this.events];
            }
          } else if (event.type === 'DELETED' && event.object?.metadata?.uid) {
            // Remove deleted event from the list
            this.events = this.events.filter(
              e => e.metadata?.uid !== event.object?.metadata?.uid,
            );
          } else if (event.type === 'ERROR') {
            this.fallbackToPolling(inferenceService);
          }
          this.cdr.detectChanges();
        },
        error => {
          this.fallbackToPolling(inferenceService);
        },
      );
  }

  private fallbackToPolling(inferenceService: InferenceServiceK8s) {
    this.clearInitialEventsTimeout();
    this.sseSubscription?.unsubscribe();
    const request = this.backend.getInferenceServiceEvents(inferenceService);

    this.pollingSubscription = this.poller
      .exponential(request)
      .subscribe(events => {
        this.events = events;
        this.eventsLoaded = true;
      });
  }

  private clearInitialEventsTimeout() {
    if (this.initialEventsTimeout !== null) {
      clearTimeout(this.initialEventsTimeout);
      this.initialEventsTimeout = null;
    }
  }
}
