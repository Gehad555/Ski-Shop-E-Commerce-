import { Component, input, output } from '@angular/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [MatFormField, MatLabel, MatInput, FormsModule],
  selector: 'app-text-field',
  styleUrl: './text-field.component.scss',
  templateUrl: './text-field.component.html',
})
export class TextFieldComponent {
  label = input.required<string>();
  type = input('text');
  placeholder = input('');
  value = input('');
  valueChange = output<string>();

  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.valueChange.emit(val);
  }
}
