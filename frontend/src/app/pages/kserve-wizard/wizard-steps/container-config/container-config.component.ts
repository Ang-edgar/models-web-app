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

@Component({
  selector: 'app-container-config',
  templateUrl: './container-config.component.html',
  styleUrls: ['./container-config.component.scss'],
})
export class ContainerConfigComponent
  implements AfterViewInit, OnDestroy {

  @Input() wizard: any;

  @ViewChild('editor')
  editorRef!: ElementRef;

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
}