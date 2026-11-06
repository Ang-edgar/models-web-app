import {
  Component,
  Input,
  ViewChild,
  HostBinding,
  AfterViewInit,
} from '@angular/core';

import {
  DomSanitizer,
  SafeHtml,
} from '@angular/platform-browser';

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

  constructor(
    private sanitizer: DomSanitizer,
  ) {}

  @Input() height = '400px';
  @Input() searchText = '';

  @Input()
  set logs(newLogs: string[]) {
    const currLogsLength = this.logs.length;

    this.logsPrv = newLogs;

    if (!this.logs) {
      return;
    }

    if (this.viewPort) {
      this.viewPort.checkViewportSize();
    }

    if (currLogsLength === 0) {
      setTimeout(() => {
        const scrollIndex = this.logsPrv.length - 1;
        this.viewPort.scrollToIndex(scrollIndex, 'smooth');
      }, 350);
    }
  }
  get logs(): string[] {
    return this.logsPrv;
  }

  private logsPrv: string[] = [];

  ngAfterViewInit() {
    this.viewPort.elementRef.nativeElement.style.height = this.height;
  }
  highlight(entry: string): SafeHtml {
    if (!this.searchText) {
      return entry;
    }

    const escaped = this.searchText.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );

    const regex = new RegExp(
      `(${escaped})`,
      'gi',
    );


    return this.sanitizer.bypassSecurityTrustHtml(
      entry.replace(
        regex,
        '<mark>$1</mark>',
      )
    );
  }
}
