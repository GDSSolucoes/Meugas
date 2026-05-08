import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../auth/current-user.decorator'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { FiscalService } from './fiscal.service'
import { CancelFiscalNoteDto } from './dto/cancel-fiscal-note.dto'
import { DownloadFiscalDto } from './dto/download-fiscal.dto'
import { EmitFiscalDto } from './dto/emit-fiscal.dto'
import { SearchAddressDto } from './dto/search-address.dto'

@ApiTags('fiscal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'user')
@Controller('fiscal')
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  @Post('emit-nfe')
  @ApiBody({ type: EmitFiscalDto })
  @ApiOperation({ summary: 'Emitir NF-e para uma venda' })
  async emitNFe(@Body() dto: EmitFiscalDto, @CurrentUser() user: any) {
    return this.fiscalService.emitNFe(dto, user)
  }

  @Post('emit-nfce')
  @ApiBody({ type: EmitFiscalDto })
  @ApiOperation({ summary: 'Emitir NFC-e para uma venda' })
  async emitNFCe(@Body() dto: EmitFiscalDto, @CurrentUser() user: any) {
    return this.fiscalService.emitNFCe(dto, user)
  }

  @Post('cancel-note')
  @ApiBody({ type: CancelFiscalNoteDto })
  @ApiOperation({ summary: 'Cancelar nota fiscal' })
  async cancelFiscalNote(@Body() dto: CancelFiscalNoteDto, @CurrentUser() user: any) {
    return this.fiscalService.cancelFiscalNote(dto, user)
  }

  @Post('download-danfe')
  @ApiBody({ type: DownloadFiscalDto })
  @ApiOperation({ summary: 'Baixar DANFE de nota fiscal' })
  async downloadDanfe(@Body() dto: DownloadFiscalDto, @CurrentUser() user: any) {
    return this.fiscalService.downloadDanfe(dto, user)
  }

  @Post('download-xml')
  @ApiBody({ type: DownloadFiscalDto })
  @ApiOperation({ summary: 'Baixar XML de nota fiscal' })
  async downloadXml(@Body() dto: DownloadFiscalDto, @CurrentUser() user: any) {
    return this.fiscalService.downloadXml(dto, user)
  }

  @Post('search-address')
  @ApiBody({ type: SearchAddressDto })
  @ApiOperation({ summary: 'Buscar endereço por rua, cidade e estado' })
  async searchAddressByStreet(@Body() dto: SearchAddressDto) {
    return this.fiscalService.searchAddressByStreet(dto)
  }
}
