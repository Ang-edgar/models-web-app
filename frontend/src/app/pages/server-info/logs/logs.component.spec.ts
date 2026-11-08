import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  KubeflowModule,
  PanelModule,
  LoadingSpinnerModule,
  SnackBarService,
} from 'kubeflow';
import { MWABackendService } from 'src/app/services/backend.service';

import { LogsComponent } from './logs.component';

describe('LogsComponent', () => {
  let component: LogsComponent;
  let fixture: ComponentFixture<LogsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LogsComponent],
      imports: [
        HttpClientTestingModule,
        MatSnackBarModule,
        MatTabsModule,
        NoopAnimationsModule,
        CommonModule,
        KubeflowModule,
        LoadingSpinnerModule,
        PanelModule,
      ],
      providers: [MWABackendService, SnackBarService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle following logs', () => {
    const followButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.follow-logs-button',
    );

    expect(followButton.textContent.trim()).toBe('Follow logs');
    expect(followButton.getAttribute('aria-pressed')).toBe('false');

    followButton.click();
    fixture.detectChanges();

    expect(followButton.textContent.trim()).toBe('Following logs');
    expect(followButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('should label containers without showing a single component tab', () => {
    component.isvcComponents = {
      predictor: { containers: ['model-container'] },
    };
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.component-tabs')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Containers');
  });
});
