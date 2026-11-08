import {
  Component,
  Input,
  ViewChild,
  HostBinding,
  AfterViewInit,
} from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-logs-viewer',
  templateUrl: './logs-viewer.component.html',
  styleUrls: ['./logs-viewer.component.scss'],
})
export class LogsViewerComponent implements AfterViewInit {
  @HostBinding('class.app-logs-viewer') selfClass = true;
  @ViewChild(CdkVirtualScrollViewport, { static: true })
  viewPort: CdkVirtualScrollViewport;

  @Input() height = '400px';

  @Input()
  set followLogs(shouldFollowLogs: boolean) {
    this.shouldFollowLogs = shouldFollowLogs;

    if (shouldFollowLogs && this.logsPrv.length) {
      this.scrollToLatestLog();
    }
  }
  get followLogs(): boolean {
    return this.shouldFollowLogs;
  }

  @Input()
  set logs(newLogs: string[]) {
    const currLogsLength = this.logs.length;

    this.logsPrv = newLogs;

    if (!this.logs.length) {
      return;
    }

    if (currLogsLength === 0 || this.followLogs) {
      this.scrollToLatestLog();
    }
  }
  get logs(): string[] {
    return this.logsPrv;
  }

  private logsPrv: string[] = [];
  private shouldFollowLogs = false;

  private scrollToLatestLog() {
    setTimeout(() => {
      if (!this.logsPrv.length) {
        return;
      }

      this.viewPort.scrollToIndex(this.logsPrv.length - 1, 'smooth');
    }, 350);
  }

  ngAfterViewInit() {
    this.viewPort.elementRef.nativeElement.style.height = this.height;
  }
}
