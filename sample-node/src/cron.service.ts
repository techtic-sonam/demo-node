import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { GallaryService } from './shared/services/gallary/gallary.service';

@Injectable()
export class CronService {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(forwardRef(() => GallaryService))
    private gallaryService: GallaryService,

  ){}

  @Cron('05 3 15 * *', {
    timeZone: 'America/Los_Angeles',
  })
  handleCron() {
    console.log('in cron');
    this.gallaryService.clearCubeTemp();
  }
}