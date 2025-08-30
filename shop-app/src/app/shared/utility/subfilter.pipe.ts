import { Pipe, PipeTransform } from '@angular/core';
import { Subscription } from '../../models/subscribe.model';


@Pipe({ name: 'subFilter' })
export class SubFilterPipe implements PipeTransform {
  transform(subs: Subscription[], status: string): Subscription[] {
    if (!subs) return [];
    if (!status) return subs;
    return subs.filter(s => s.status.toLowerCase() === status.toLowerCase());
  }
}
