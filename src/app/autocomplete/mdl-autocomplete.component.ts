import {
  Component,
  ChangeDetectorRef,
  EventEmitter,
  forwardRef,
  Input,
  ModuleWithProviders,
  NgModule,
  Output,
  ViewChild,
  ViewEncapsulation,
  HostListener,
  QueryList,
  ViewChildren,
  HostBinding,
  AfterViewInit,
  OnInit,
  OnChanges
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MdlOptionComponent, MdlSelectModule } from '@angular2-mdl-ext/select';
import { MdlPopoverComponent, MdlPopoverModule } from '@angular2-mdl-ext/popover';

function toBoolean (value: any): boolean {
  return value !== null && `${value}` !== 'false';
}

function randomId(): string {
  const S4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return (S4() + S4());
}

const MDL_SELECT_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MdlAutocompleteComponent),
  multi: true
};

@Component({
  // tslint:disable-next-line
  selector: 'mdl-autocomplete',
  templateUrl: 'mdl-autocomplete.component.html',
  styleUrls: ['mdl-autocomplete.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [MDL_SELECT_VALUE_ACCESSOR]
})
export class MdlAutocompleteComponent implements ControlValueAccessor, OnInit, AfterViewInit, OnChanges {
  @HostBinding('class.mdl-select') public mdlSelectClass = true;
  @HostBinding('class.mdl-select--floating-label') public mdlSelectFloatingLabel = this.isFloatingLabel;
  @HostBinding('class.has-placeholder') public hasPlaceholder = this.placeholder;
  @Input() public ngModel: any;
  @Input() public disabled = false;
  @Input() public label = '';
  @Input() public placeholder = '';
  @Input() public options: Array<string> = [];
  @Output() public change: EventEmitter<any> = new EventEmitter(true);

  @ViewChild(MdlPopoverComponent) public popover: MdlPopoverComponent;

  public focused = false;
  public text = '';
  public textFieldId: string;
  public visibleOptions: Array<string>;

  @ViewChildren(MdlOptionComponent) private optionComponents: QueryList<MdlOptionComponent>;

  private _isFloatingLabel = false;
  private onChange: any = Function.prototype;
  private onTouched: any = Function.prototype;

  @Input('floating-label')
  public get isFloatingLabel(): boolean {
    return this._isFloatingLabel;
  }

  constructor(private changeDetectionRef: ChangeDetectorRef) {
    this.textFieldId = `mdl-textfield-${randomId()}`;
  }

  public ngOnInit(): void {
    this.popover.hide = () => {
      this.popoverVisible = false;
      this.popover.isVisible = false;
      this.onSelect(this.getNewValueOnLeave());
      for (let i = 0; i < this.visibleOptions.length; i++) {
        if (this.ngModel === this.visibleOptions[i]) {
          this.text = this.visibleOptions[i];
          return;
        }
      }
      this.text = this.ngModel;
    };
  }

  public ngAfterViewInit(): void {
    this.renderValue();
  }

  public ngOnChanges(): void {
    this.renderValue();
  }

  public set isFloatingLabel(value) {
    this._isFloatingLabel = toBoolean(value);
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown($event: KeyboardEvent): void {
    if (!this.disabled && this.popover.isVisible) {
      let closeKeys: Array<string> = ['Escape', 'Tab', 'Enter'];
      let closeKeyCodes: Array<Number> = [13, 27, 9];
      if (closeKeyCodes.indexOf($event.keyCode) !== -1 || ($event.key && closeKeys.indexOf($event.key) !== -1)) {
        this.popover.hide();
        this.onSelect(this.getNewValueOnEnter());
      } else {
        if ($event.keyCode === 38 || ($event.key && $event.key === 'ArrowUp')) {
          this.onArrowUp($event);
        } else if ($event.keyCode === 40 || ($event.key && $event.key === 'ArrowDown')) {
          this.onArrowDown($event);
        }
      }
    }
  }

  public filterResults(newText: string, reload = true): void {
    this.text = newText;

    this.visibleOptions = this.options.filter(option => option.startsWith(this.text || ''));

    if (!this.visibleOptions.length) {
      this.popoverVisible = false;
      return;
    }

    if (this.popover.isVisible) {
      this.popoverVisible = true;
      if (!reload) { return; }
      this.onSelect(this.getNewValueOnFilterChange());
    }
  }

  private set popoverVisible(visible: boolean) {
    let style = this.popover.elementRef.nativeElement.style;
    if (visible) {
      style.display = 'block';
    } else {
      style.display = 'none';
    }
  }

  public addFocus(): void {
    this.focused = true;
  }

  public removeFocus(): void {
    this.focused = false;
  }

  public toggle($event: Event): void {
    if (!this.disabled) {
      this.popover.toggle($event);
      $event.stopPropagation();
    }
    this.filterResults(this.text, false);
  }

  public open($event: Event): void {
    if (!this.disabled && !this.popover.isVisible) {
      this.popover.show($event);
    }
  }

  public close(): void {
    if (!this.disabled && this.popover.isVisible) {
      this.popover.hide();
    }
    this.onSelect(this.getNewValueOnLeave());
  }

  public reset(resetValue = true): void {
    if (resetValue && this.ngModel) {
      this.ngModel = '';
      this.onChange(this.ngModel);
      this.change.emit(this.ngModel);
      this.renderValue();
    }
  }

  public writeValue(value: any): void {
    this.ngModel = value;
    this.onChange(this.ngModel);
    this.renderValue();
  }

  public registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => {}): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  public onSelect(value: any): void {
    let popover: any = this.popover.elementRef.nativeElement;
    let list: any = popover.querySelector('.mdl-list');
    let option: any = null;

    this.optionComponents.forEach(o => {
      if (o.value === value) {
        option = o.contentWrapper.nativeElement;
      }
    });

    if (option) {
      const selectedItemElem = option.parentElement;
      const computedScrollTop =
        selectedItemElem.offsetTop - (list.clientHeight / 2) + (selectedItemElem.clientHeight / 2);
      list.scrollTop =  Math.max(computedScrollTop, 0);
    }

    this.writeValue(value);
    this.change.emit(this.ngModel);

    if (this.optionComponents) {
      this.optionComponents.forEach(optionComponent => {
        optionComponent.updateSelected(value);
      });
    }
  }

  private onArrowUp($event: KeyboardEvent): void {
    if (!this.visibleOptions.length) {
      return;
    }

    const selectedOptionIndex = this.visibleOptions.findIndex(option => option === this.ngModel);

    if (selectedOptionIndex !== -1 && selectedOptionIndex) {
      this.onSelect(this.visibleOptions[selectedOptionIndex - 1]);
    } else {
      this.onSelect(this.visibleOptions[this.visibleOptions.length - 1]);
    }

    $event.preventDefault();
  }

  private onArrowDown($event: KeyboardEvent): void {
    if (!this.visibleOptions.length) {
      return;
    }

    const selectedOptionIndex = this.visibleOptions.findIndex(option => option === this.ngModel);

    if (selectedOptionIndex !== -1 && selectedOptionIndex + 1 < this.visibleOptions.length) {
      this.onSelect(this.visibleOptions[selectedOptionIndex + 1]);
    } else {
      this.onSelect(this.visibleOptions[0]);
    }
    $event.preventDefault();
  }

  private renderValue(): void {
    this.text = this.ngModel;
    this.changeDetectionRef.detectChanges();
  }

  private getNewValueOnFilterChange(): string {
    if (!this.visibleOptions.length) {
      return this.text;
    }
    return this.visibleOptions[0];
  }

  private getNewValueOnEnter(): string {
    if (!this.visibleOptions.length) {
      return this.text;
    }
    for (let i = 0; i < this.visibleOptions.length; i++) {
      if (this.visibleOptions[i] === this.ngModel) {
        return this.visibleOptions[i];
      }
    }
    return this.visibleOptions[0];
  }

  private getNewValueOnLeave(): string {
    for (let i = 0; i < this.visibleOptions.length; i++) {
      if (this.text === this.visibleOptions[i] && this.ngModel === this.visibleOptions[i]) {
        return this.visibleOptions[i];
      }
    }
    return this.text;
  }
}

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MdlPopoverModule,
    MdlSelectModule
  ],
  exports: [
    MdlAutocompleteComponent,
  ],
  declarations: [
    MdlAutocompleteComponent
  ],
  providers: [
    MDL_SELECT_VALUE_ACCESSOR
  ]
})
export class MdlAutocompleteModule {
  public static forRoot(): ModuleWithProviders {
    return {
      ngModule: MdlAutocompleteModule,
      providers: []
    };
  }
}