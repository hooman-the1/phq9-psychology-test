import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'latinToPersianNumbers',
  standalone: true,
})
export class LatinToPersianNumbersPipe implements PipeTransform {
  private readonly persianDigits = '۰۱۲۳۴۵۶۷۸۹';

  transform(value: string | number | null | undefined): string | number | null | undefined {
    if (value === null || value === undefined) {
      return value;
    }

    return value
      .toString()
      .replace(/[0-9]/g, (digit) => this.persianDigits[Number(digit)]);
  }
}
