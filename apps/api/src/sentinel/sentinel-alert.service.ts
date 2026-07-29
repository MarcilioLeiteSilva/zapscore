import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface SentinelAlertPayload {
  title: string;
  severity: AlertSeverity;
  fixtureInfo?: string;
  description: string;
  autoHealed?: boolean;
}

@Injectable()
export class SentinelAlertService {
  private readonly logger = new Logger(SentinelAlertService.name);
  private readonly webhookUrl: string | null;

  constructor(private readonly configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('SENTINEL_WEBHOOK_URL') || null;
  }

  async sendAlert(alert: SentinelAlertPayload): Promise<void> {
    const icon = alert.severity === 'CRITICAL' ? '🚨' : alert.severity === 'WARNING' ? '⚠️' : 'ℹ️';
    const healBadge = alert.autoHealed ? ' [AUTOCORRIGIDO 🛠️]' : '';
    const logMsg = `${icon} [SENTINEL ${alert.severity}] ${alert.title}${healBadge} — ${alert.description} ${alert.fixtureInfo ? `(${alert.fixtureInfo})` : ''}`;

    if (alert.severity === 'CRITICAL') {
      this.logger.error(logMsg);
    } else if (alert.severity === 'WARNING') {
      this.logger.warn(logMsg);
    } else {
      this.logger.log(logMsg);
    }

    if (!this.webhookUrl) return;

    try {
      await axios.post(this.webhookUrl, {
        content: `**${icon} SENTINEL ${alert.severity}**${healBadge}\n**${alert.title}**\n${alert.description}\n${alert.fixtureInfo ? `> Partida: ${alert.fixtureInfo}` : ''}`,
      });
    } catch (err: any) {
      this.logger.error(`Falha ao enviar alerta via Webhook: ${err.message}`);
    }
  }
}
