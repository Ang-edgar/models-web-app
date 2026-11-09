import { Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { MWABackendService } from 'src/app/services/backend.service';
import { ExponentialBackoff } from 'kubeflow';
import { Subscription } from 'rxjs';
import { InferenceServiceK8s } from 'src/app/types/kfserving/v1beta1';

enum IsvcComponent {
  predictor = 'predictor',
  transformer = 'transformer',
  explainer = 'explainer',
}

interface IsvcComponents {
  [key: string]: { containers: string[] };
}

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
})
export class LogsComponent implements OnDestroy {
  public searchText = '';
  public severity = 'all';
  public followLogs = true;
  public lineCount = '100';
  public readonly lineCountOptions = ['100', '500', '1000', 'all'];
  public showPreviousLogs = false;
  public showTimestamps = true;
  public currLogs: string[] = [];
  public logsRequestCompleted = false;
  public loadErrorMsg = '';

  public isvcComponents: IsvcComponents = {};
  private currentComponent: string;
  private currentContainer: string;
  private hasLoadedContainers = false;

  @ViewChild('componentTabGroup', { static: false }) componentTabGroup;
  @ViewChild('containerTabGroup', { static: false }) containerTabGroup;

  get components() {
    return Object.keys(this.isvcComponents);
  }

  @Input()
  set inferenceService(s: InferenceServiceK8s) {
    this.svcPrv = s;

    if (!s) {
      return;
    }

    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }

    for (const component of Object.keys(IsvcComponent)) {
      if (!(component in this.svcPrv.spec)) {
        continue;
      }

      this.isvcComponents[component] = { containers: [] };

      this.backend
        .getInferenceServiceContainers(this.svcPrv, component)
        .subscribe(
          containers => {
            if (!this.hasLoadedContainers) {
              this.currentComponent = component;
              this.currentContainer = containers[0];
              this.hasLoadedContainers = true;
            }
            this.isvcComponents[component].containers = containers;
          },
          error => {
            console.log(`error getting ${component} containers'`, error);
          },
        );
    }

    this.pollingSub = this.poller.start().subscribe(() => {
      if (!this.currentComponent || !this.currentContainer) {
        return;
      }

      this.backend
        .getInferenceServiceLogs(
          this.svcPrv,
          this.currentComponent,
          this.currentContainer,
          this.selectedLineCount,
          this.showPreviousLogs,
          this.showTimestamps,
        )
        .subscribe(
          logs => {
            this.currLogs = logs;
            this.logsRequestCompleted = true;
            this.loadErrorMsg = '';
          },
          error => {
            this.currLogs = [];
            this.logsRequestCompleted = true;
            this.loadErrorMsg = error;
          },
        );
    });
  }

  private svcPrv: InferenceServiceK8s;
  private pollingSub: Subscription;
  private poller = new ExponentialBackoff({
    interval: 5000,
    retries: 1,
    maxInterval: 5001,
  });

  constructor(public backend: MWABackendService) {}

  resetLogDisplay() {
    this.logsRequestCompleted = false;
    this.currLogs = [];
    this.loadErrorMsg = '';
    this.poller.reset();
  }

  componentTabChange(index: number) {
    this.currentComponent = Object.keys(this.isvcComponents)[index];

    if (
      !this.isvcComponents[this.currentComponent].containers.includes(
        this.currentContainer,
      )
    ) {
      this.currentContainer =
        this.isvcComponents[this.currentComponent].containers[0];
    }

    this.resetLogDisplay();
  }

  get filteredLogs(): string[] {
    let logs = [...this.currLogs];

    if (this.searchText) {
      logs = logs.filter(log =>
        log.toLowerCase().includes(this.searchText.toLowerCase()),
      );
    }

    switch (this.severity) {
      case 'error':
        logs = logs.filter(log => log.toUpperCase().includes('ERROR'));
        break;

      case 'warn':
        logs = logs.filter(log => log.toUpperCase().includes('WARN'));
        break;

      case 'info':
        logs = logs.filter(log => log.toUpperCase().includes('INFO'));
        break;
    }

    return logs;
  }

  containerTabChange(index: number) {
    this.currentContainer =
      this.isvcComponents[this.currentComponent].containers[index];
    this.resetLogDisplay();
  }

  refreshLogs(): void {
    if (!this.currentComponent || !this.currentContainer) {
      return;
    }

    this.logsRequestCompleted = false;

    this.backend
      .getInferenceServiceLogs(
        this.svcPrv,
        this.currentComponent,
        this.currentContainer,
        this.selectedLineCount,
        this.showPreviousLogs,
        this.showTimestamps,
      )
      .subscribe(
        logs => {
          this.currLogs = logs;
          this.logsRequestCompleted = true;
          this.loadErrorMsg = '';
        },
        error => {
          this.currLogs = [];
          this.logsRequestCompleted = true;
          this.loadErrorMsg = error;
        },
      );
  }

  private get selectedLineCount(): number | undefined {
    return this.lineCount === 'all' ? undefined : Number(this.lineCount);
  }

  copyLogs(): void {
    const text = this.currLogs.join('\n');

    navigator.clipboard.writeText(text).then(() => {
      console.log('Logs copied');
    });
  }

  downloadLogs(): void {
    const text = this.currLogs.join('\n');

    const blob = new Blob([text], {
      type: 'text/plain',
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;
    a.download =
      `${this.svcPrv.metadata.name}-` + `${this.currentContainer}.log`;

    a.click();

    window.URL.revokeObjectURL(url);
  }

  ngOnDestroy() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
  }
}
