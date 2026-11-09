import {
  Component,
  Input,
  ViewChild,
  HostBinding,
  AfterViewInit,
} from '@angular/core';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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

  constructor(private sanitizer: DomSanitizer) {}

  @Input() height = '400px';
  @Input() searchText = '';
  private followLogsValue = true;

  @Input()
  set followLogs(followLogs: boolean) {
    this.followLogsValue = followLogs;

    if (followLogs) {
      this.scrollToLatest();
    }
  }
  get followLogs(): boolean {
    return this.followLogsValue;
  }

  @Input()
  set logs(newLogs: string[]) {
    const shouldScrollToLatest =
      this.logs.length !== newLogs.length ||
      this.logs[this.logs.length - 1] !== newLogs[newLogs.length - 1];

    this.logsPrv = newLogs;

    if (shouldScrollToLatest && this.viewPort) {
      this.viewPort.checkViewportSize();
    }

    if (shouldScrollToLatest) {
      this.scrollToLatest();
    }
  }
  get logs(): string[] {
    return this.logsPrv;
  }

  private logsPrv: string[] = [];

  ngAfterViewInit() {
    this.viewPort.elementRef.nativeElement.style.height = this.height;
  }

  private scrollToLatest(): void {
    if (!this.followLogs || !this.viewPort || !this.logs.length) {
      return;
    }

    setTimeout(() => {
      if (this.followLogs && this.logs.length) {
        this.viewPort.checkViewportSize();
        this.viewPort.scrollToOffset(this.logs.length * 20, 'smooth');
      }
    });
  }

  highlight(entry: string): SafeHtml {
    if (!this.searchText) {
      return entry;
    }

    const escaped = this.searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const regex = new RegExp(`(${escaped})`, 'gi');

    return this.sanitizer.bypassSecurityTrustHtml(
      entry.replace(regex, '<mark>$1</mark>'),
    );
  }
}
