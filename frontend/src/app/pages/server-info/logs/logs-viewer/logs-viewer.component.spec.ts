import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { LogsViewerComponent } from './logs-viewer.component';

describe('LogsViewerComponent', () => {
  let component: LogsViewerComponent;
  let fixture: ComponentFixture<LogsViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogsViewerComponent],
      imports: [CommonModule, ScrollingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(LogsViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should scroll to the latest entry while following logs', fakeAsync(() => {
    const scrollToIndex = jest
      .spyOn(component.viewPort, 'scrollToIndex')
      .mockImplementation(() => {});

    component.logs = ['first entry'];
    tick(350);
    scrollToIndex.mockClear();

    component.followLogs = true;
    component.logs = ['first entry', 'second entry'];
    tick(350);

    expect(scrollToIndex).toHaveBeenLastCalledWith(1, 'smooth');
  }));
});
