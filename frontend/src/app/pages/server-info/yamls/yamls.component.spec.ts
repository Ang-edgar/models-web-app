import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { InferenceServiceK8s } from 'src/app/types/kfserving/v1beta1';

import { YamlsComponent } from './yamls.component';

describe('YamlsComponent', () => {
  let component: YamlsComponent;
  let fixture: ComponentFixture<YamlsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [YamlsComponent],
      imports: [CommonModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YamlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the supplied InferenceService as YAML', () => {
    component.inferenceService = {
      apiVersion: 'serving.kserve.io/v1beta1',
      kind: 'InferenceService',
      metadata: { name: 'test-model' },
    } as InferenceServiceK8s;

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('pre').textContent).toContain(
      'apiVersion: serving.kserve.io/v1beta1',
    );
    expect(fixture.nativeElement.querySelector('pre').textContent).toContain(
      'name: test-model',
    );
  });
});
