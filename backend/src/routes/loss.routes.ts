import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../models/auditLog.entity';
import { Consumable } from '../models/consumable.entity';
import { LossRecord } from '../models/lossRecord.entity';
import { Reagent } from '../models/reagent.entity';
import { LossController } from '../controllers/loss.controller';
import { LossService } from '../services/loss.service';
import { ReagentService } from '../services/reagent.service';
import { ConsumableService } from '../services/consumable.service';
import { AuditService } from '../services/audit.service';
import { AlertService } from '../services/alert.service';

@Module({
  imports: [TypeOrmModule.forFeature([LossRecord, Reagent, Consumable, AuditLog])],
  controllers: [LossController],
  providers: [LossService, ReagentService, ConsumableService, AuditService, AlertService],
})
export class LossRoutesModule {}
