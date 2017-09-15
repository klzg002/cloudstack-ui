import { Component, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MdDialog } from '@angular/material';
import { By } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';
import { MockTranslatePipe } from '../../../../testutils/mocks/mock-translate.pipe.spec';
import { BaseTemplateModel } from '../../../template/shared/base-template.model';
import { Iso } from '../../../template/shared/iso.model';
import { Template } from '../../../template/shared/template.model';
import { VmTemplateDialogComponent } from './vm-template-dialog.component';
import { VmTemplateComponent } from './vm-template.component';

const templatesRaw = require('../../../../testutils/mocks/model-services/fixtures/templates.json');
const isosRaw = require('../../../../testutils/mocks/model-services/fixtures/isos.json');

const templates: Array<Template> = templatesRaw.map(t => new Template(t));
const isos: Array<Iso> = isosRaw.map(i => new Iso(i));

@Component({
  selector: 'cs-test',
  template: `
    <cs-vm-creation-template
      [templates]="templates"
      [isos]="isos"
      [(ngModel)]="template"
    ></cs-vm-creation-template>
  `
})
class TestComponent {
  @ViewChild(VmTemplateComponent) public vmTemplateComponent: VmTemplateComponent;
  public template: BaseTemplateModel;
  public templates: Array<Template>;
  public isos: Array<Iso>;
}

describe('VmTemplateComponent', () => {
  let component: VmTemplateComponent;
  let fixture: ComponentFixture<VmTemplateComponent>;
  let template: BaseTemplateModel;

  function createTestComponent() {
    const f = TestBed.createComponent(TestComponent);
    const testComponent = f.componentInstance;
    testComponent.templates = templates;
    testComponent.isos = isos;
    testComponent.template = templates[0];

    return { f, testComponent };
  }

  const mockDialog = {
    open: jasmine.createSpy('open').and.callFake(() => {
      return {
        afterClosed: () => Observable.of(template)
      }
    })
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [
        VmTemplateComponent,
        TestComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: MdDialog, useValue: mockDialog
        }
      ]
    })
    .compileComponents();
  }));

  it('should support ngModel', async () => {
    const { f, testComponent } = createTestComponent();
    f.detectChanges();

    await f.whenStable();
    f.detectChanges();

    expect(testComponent.vmTemplateComponent.template).toEqual(templates[0]);
  });

  it('should reset model if template and iso list are empty', async () => {
    const { f, testComponent } = createTestComponent();
    f.detectChanges();

    await f.whenStable();
    f.detectChanges();
    expect(testComponent.vmTemplateComponent.template).toEqual(templates[0]);

    testComponent.templates = [];
    testComponent.isos = [];

    await f.whenStable();
    f.detectChanges();
    expect(testComponent.vmTemplateComponent.template).toBe(null);
  });

  it('should display selectedTemplate name', async () => {
    const { f } = createTestComponent();
    f.detectChanges();

    await f.whenStable();
    f.detectChanges();

    const messageContainer = f.debugElement.query(By.css('.mdl-textfield__input'));
    expect(messageContainer.nativeElement.textContent.trim()).toBe(
      `VM_PAGE.VM_CREATION.OS_TEMPLATE: ${templates[0].name}`
    );
  });

  it('should display error message when templates and isos are empty', async () => {
    const { f } = createTestComponent();

    await f.whenStable();
    f.detectChanges();

    const messageContainer = f.debugElement.query(By.css('.mdl-textfield__input'));
    expect(messageContainer.nativeElement.textContent.trim()).toBe(
      `VM_PAGE.VM_CREATION.NO_TEMPLATES`
    );
  });

  it('should open the dialog', () => {
    fixture = TestBed.createComponent(VmTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.zoneId = 'someId';
    component.template = templates[0];
    component.templates = templates;
    component.isos = isos;
    const button = fixture.debugElement.query(By.css('button'));

    button.nativeElement.click();
    fixture.detectChanges();

    expect(mockDialog.open).toHaveBeenCalled();
    const args = mockDialog.open.calls.mostRecent().args;
    expect(args[0]).toBe(VmTemplateDialogComponent);
    expect(args[1]).toEqual({
      width: '780px',
      data: {
        template: templates[0],
        templates: templates,
        isos: isos,
        zoneId: 'someId'
      }
    });
  });

  it('should emit changes after dialog is closed', () => {
    fixture = TestBed.createComponent(VmTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOn(component.change, 'next');
    component.zoneId = 'someId';
    component.templates = templates;
    component.isos = isos;
    const button = fixture.debugElement.query(By.css('button'));

    button.nativeElement.click();
    fixture.detectChanges();

    expect(component.change.next).toHaveBeenCalledTimes(0);
    expect(component.template).toBeUndefined();

    template = templates[0];
    button.nativeElement.click();
    fixture.detectChanges();
    fixture.detectChanges();
    fixture.detectChanges();

    expect(component.change.next).toHaveBeenCalledTimes(1);
    expect(component.change.next).toHaveBeenCalledWith(templates[0]);
    expect(component.template).toEqual(templates[0]);
  });
});