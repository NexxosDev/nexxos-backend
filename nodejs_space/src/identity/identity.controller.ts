import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IdentityService } from './identity.service';
import { VerifyIdentityDto } from './dto/verify-identity.dto';

@ApiTags('Identity Verification')
@Controller('api/identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('verify')
  @ApiOperation({ summary: 'Verify identity: liveness check + face match with document (no auth, used during registration). Accepts base64-encoded images.' })
  verify(@Body() dto: VerifyIdentityDto) {
    return this.identityService.verifyIdentity(
      dto.documentImageBase64,
      dto.selfieNeutralBase64,
      dto.selfieSmileBase64,
      dto.selfieTurnBase64,
    );
  }
}
