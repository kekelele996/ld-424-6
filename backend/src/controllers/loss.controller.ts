import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LossService } from '../services/loss.service';
import { AuthenticatedRequest } from '../types/interfaces';
import { ok } from '../utils/response';

@ApiTags('loss-records')
@ApiBearerAuth()
@Controller('loss-records')
export class LossController {
  constructor(private readonly service: LossService) {}

  @Get()
  async list() {
    return ok(await this.service.list());
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return ok(await this.service.findOne(id));
  }

  @Post()
  async create(@Body() body: Record<string, unknown>, @Req() req: AuthenticatedRequest) {
    return ok(await this.service.create(body, req.user), '报损申请已提交');
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return ok(await this.service.approve(id, req.user), '报损申请已通过');
  }

  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() body: { rejectionReason: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return ok(await this.service.reject(id, body.rejectionReason, req.user), '报损申请已驳回');
  }
}
