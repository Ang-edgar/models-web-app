import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import * as ace from 'ace-builds';

import 'ace-builds/src-noconflict/mode-sh';
import 'ace-builds/src-noconflict/theme-xcode';
import 'ace-builds/src-noconflict/ext-language_tools';

import { WizardConfig }
  from '../../models/wizard.model';

import { VLLM_ARGS }
  from '../../constants/vllm-args';

import { HUGGINGFACE_ARGS }
  from '../../constants/huggingface-args';

import { TRITON_ARGS }
  from '../../constants/triton-args';

import { TENSORFLOW_ARGS }
  from '../../constants/tensorflow-args';

import { RuntimeArgDefinition }
  from '../../models/runtime-arg-definition.model';

@Component({
  selector: 'app-container-config',
  templateUrl: './container-config.component.html',
  styleUrls: ['./container-config.component.scss'],
})
export class ContainerConfigComponent
  implements AfterViewInit, OnDestroy {

  @Input() wizard!: WizardConfig;

  @ViewChild('editor')
  editorRef!: ElementRef;

  customRuntimeArg = '';

  get availableRuntimeArgs() {

    switch (this.wizard.runtime) {

      case 'vllmserver':
        return VLLM_ARGS;

      case 'huggingface':
        return HUGGINGFACE_ARGS;

      case 'tritonserver':
        return TRITON_ARGS;

      case 'tensorflow':
        return TENSORFLOW_ARGS;

      default:
        return [];
    }

  }

  get availableChips() {

    return this.availableRuntimeArgs.filter(
      chip =>
        !this.wizard.runtimeArgs.some(
          selected =>
            selected.argument === chip.argument,
        ),
    );

  }

  private aceEditorInstance!: ace.Ace.Editor;

  ngAfterViewInit() {
    this.aceEditorInstance = ace.edit(
      this.editorRef.nativeElement,
      {
        mode: 'ace/mode/shellscript',
        theme: 'ace/theme/xcode',
        tabSize: 2,
        wrap: true,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
      },
    );

    this.aceEditorInstance.setValue(
      this.wizard.command || '',
      -1,
    );

    this.aceEditorInstance.on('change', () => {
      this.wizard.command =
        this.aceEditorInstance.getValue();
    });
  }

  ngOnDestroy() {
    if (this.aceEditorInstance) {
      this.aceEditorInstance.destroy();
    }
  }

  addPort() {
    this.wizard.ports.push({
      name: '',
      containerPort: '',
    });
  }

  removePort(index: number) {
    this.wizard.ports.splice(index, 1);
  }

  addRuntimeArgChip(
    arg: RuntimeArgDefinition,
  ) {

    const exists =
      this.wizard.runtimeArgs.some(
        existing =>
          existing.argument === arg.argument,
      );

    if (exists) {
      return;
    }

    this.wizard.runtimeArgs.push({
      argument: arg.argument,
      value: arg.defaultValue,
    });
  }

  addCustomRuntimeArg() {

    const arg =
      this.customRuntimeArg.trim();

    if (!arg) {
      return;
    }

    const exists =
      this.wizard.runtimeArgs.some(
        existing =>
          existing.argument === arg,
      );

    if (exists) {
      return;
    }

    this.wizard.runtimeArgs.push({
      argument: arg,
      value: '',
    });

    this.customRuntimeArg = '';
  }

  removeRuntimeArg(index: number) {
    this.wizard.runtimeArgs.splice(
      index,
      1,
    );
  }
}