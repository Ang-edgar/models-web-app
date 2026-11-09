import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { LogsViewerComponent } from './logs-viewer.component';

describe('LogsViewerComponent', () => {
  let component: LogsViewerComponent;
  let fixture: ComponentFixture<LogsViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogsViewerComponent],
      imports: [CommonModule, ScrollingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogsViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('scrolls to the latest entry while following logs', fakeAsync(() => {
    const scrollToIndex = jest
      .spyOn(component.viewPort, 'scrollToIndex')
      .mockImplementation(() => {});

    component.logs = ['first entry', 'latest entry'];
    tick(350);

    expect(scrollToIndex).toHaveBeenCalledWith(1, 'smooth');
  }));

  it('does not scroll to the latest entry when following is paused', fakeAsync(() => {
    const scrollToIndex = jest
      .spyOn(component.viewPort, 'scrollToIndex')
      .mockImplementation(() => {});

    component.followLogs = false;
    component.logs = ['first entry', 'latest entry'];
    tick(350);

    expect(scrollToIndex).not.toHaveBeenCalled();
  }));

  it('scrolls to the latest entry when following resumes', fakeAsync(() => {
    const scrollToIndex = jest
      .spyOn(component.viewPort, 'scrollToIndex')
      .mockImplementation(() => {});

    component.followLogs = false;
    component.logs = ['first entry', 'latest entry'];
    component.followLogs = true;
    tick(350);

    expect(scrollToIndex).toHaveBeenCalledWith(1, 'smooth');
  }));
});
