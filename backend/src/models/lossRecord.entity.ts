import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ItemType, UsageStatus } from '../types/enums';

@Entity('loss_records')
export class LossRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  itemId!: string;

  @Column({ type: 'enum', enum: ItemType })
  itemType!: ItemType;

  @Column('decimal', { precision: 12, scale: 3 })
  quantity!: number;

  @Column()
  reason!: string;

  @Column()
  applicantId!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  applicationDate!: Date;

  @Column({ type: 'enum', enum: UsageStatus, default: UsageStatus.Pending })
  approvalStatus!: UsageStatus;

  @Column({ nullable: true })
  approverId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvalDate?: Date;

  @Column({ nullable: true })
  rejectionReason?: string;
}
