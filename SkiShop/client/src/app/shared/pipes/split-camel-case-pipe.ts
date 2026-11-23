import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'splitCamelCase',
})
export class SplitCamelCasePipe implements PipeTransform {
  transform(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
}
