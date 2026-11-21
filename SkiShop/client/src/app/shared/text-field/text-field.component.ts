import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-text-field',
  imports: [MatFormField, MatLabel, MatInput, MatError, ReactiveFormsModule],
  templateUrl: './text-field.component.html',
  styleUrl: './text-field.component.scss',
})
export class TextFieldComponent {
  control = input.required<FormControl>();
  label = input.required<string>();
  type = input('text');
  placeholder = input('');
}
