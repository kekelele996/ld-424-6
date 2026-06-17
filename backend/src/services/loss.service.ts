import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LossRecord } from '../models/lossRecord.entity';
import { ItemType, UsageStatus } from '../types/enums';
import { AuthUser } from '../types/interfaces';
import { AuditService } from './audit.service';
import { ConsumableService } from './consumable.service';
import { ReagentService } from './reagent.service';

@Injectable()
export class LossService {
  constructor(
    @InjectRepository(LossRecord) private readonly repo: Repository<LossRecord>,
    private readonly reagents: ReagentService,
    private readonly consumables: ConsumableService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.repo.find({ order: { applicationDate: 'DESC' } });
  }

  async findOne(id: string) {
    const record = await this.repo.findOneBy({ id });
    if (!record) throw new NotFoundException('报损记录不存在');
    return record;
  }

  async create(payload: Partial<LossRecord> & Record<string, unknown>, user: AuthUser) {
    const normalized: Partial<LossRecord> = {
      itemId: String(payload.itemId ?? ''),
      itemType: payload.itemType as ItemType,
      quantity: Number(payload.quantity ?? 0),
      reason: String(payload.reason ?? ''),
      approvalStatus: UsageStatus.Pending,
    };

    if (!normalized.itemId) throw new BadRequestException('物品ID不能为空');
    if (!normalized.itemType) throw new BadRequestException('物品类型不能为空');
    if (!normalized.quantity || normalized.quantity <= 0) throw new BadRequestException('报损数量必须大于0');
    if (!normalized.reason) throw new BadRequestException('报损原因不能为空');

    if (normalized.itemType === ItemType.Reagent) {
      const reagent = await this.reagents.findOne(normalized.itemId);
      if (Number(reagent.currentStock) < normalized.quantity) {
        throw new BadRequestException('库存不足，无法提交报损申请');
      }
    } else {
      const consumable = await this.consumables.findOne(normalized.itemId);
      if (Number(consumable.currentStock) < normalized.quantity) {
        throw new BadRequestException('库存不足，无法提交报损申请');
      }
    }

    const record = await this.repo.save(
      this.repo.create({ ...normalized, applicantId: user.id, approvalStatus: UsageStatus.Pending }),
    );
    await this.audit.record(user, 'CREATE_LOSS', 'lossRecord', { id: record.id, itemType: record.itemType });
    return record;
  }

  async approve(id: string, user: AuthUser) {
    const record = await this.findOne(id);
    if (record.approvalStatus === UsageStatus.Approved) return record;
    if (record.approvalStatus === UsageStatus.Rejected) {
      throw new BadRequestException('已驳回的报损申请不能审批通过');
    }

    record.approvalStatus = UsageStatus.Approved;
    record.approverId = user.id;
    record.approvalDate = new Date();

    const saved = await this.repo.save(record);

    if (saved.itemType === ItemType.Reagent) {
      await this.reagents.adjustStock(saved.itemId, -Number(saved.quantity), user, 'APPROVE_REAGENT_LOSS');
    } else {
      await this.consumables.adjustStock(saved.itemId, -Number(saved.quantity), user, 'APPROVE_CONSUMABLE_LOSS');
    }

    await this.audit.record(user, 'APPROVE_LOSS', 'lossRecord', { id });
    return saved;
  }

  async reject(id: string, rejectionReason: string, user: AuthUser) {
    const record = await this.findOne(id);
    if (record.approvalStatus === UsageStatus.Rejected) return record;
    if (record.approvalStatus === UsageStatus.Approved) {
      throw new BadRequestException('已通过的报损申请不能驳回');
    }

    record.approvalStatus = UsageStatus.Rejected;
    record.approverId = user.id;
    record.approvalDate = new Date();
    record.rejectionReason = rejectionReason;

    const saved = await this.repo.save(record);
    await this.audit.record(user, 'REJECT_LOSS', 'lossRecord', { id, rejectionReason });
    return saved;
  }
}
