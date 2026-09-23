export type AdPlacement =
  | 'banner_bottom'
  | 'native_match_card'
  | 'native_news_feed'
  | 'header_sponsor'
  | 'popup_launch';

export type AdStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'expired';

export interface UploadedCreativeFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size?: number;
}

export interface AdCampaign {
  id: string;
  title: string;
  advertiser: string;
  placement: AdPlacement;
  target_apps: string[];
  target_leagues: number[];
  creative_image: string;
  creative_url?: string;
  destination_url: string;
  start_at: string;
  end_at: string;
  priority: number;
  status: AdStatus;
  max_impressions: number;
  impressions_count: number;
  clicks_count: number;
  created?: string;
  updated?: string;
}

export interface AdStatRecord {
  id?: string;
  campaign_id: string;
  event_type: 'impression' | 'click';
  app_slug: string;
  league_id?: number;
  timestamp: string;
}

export interface ServeAdQuery {
  app: string;
  placement: AdPlacement;
  leagueId?: number;
}

export interface ServeAdResponse {
  id: string;
  title: string;
  advertiser: string;
  placement: AdPlacement;
  imageUrl: string;
  destinationUrl: string;
  impressionUrl: string;
  clickUrl: string;
}

export interface PlacementInventoryInfo {
  placement: AdPlacement;
  name: string;
  admobStatus: 'free' | 'hybrid';
  recommendedSize: string;
  aspectRatio: string;
  description: string;
  activeCampaignsCount: number;
}

export interface AdvertiserMetricsSummary {
  advertiser: string;
  campaignsCount: number;
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  activeCampaigns: number;
}

export interface DashboardMetricsResponse {
  totalImpressions: number;
  totalClicks: number;
  averageCtr: number;
  activeCampaignsCount: number;
  advertisersCount: number;
  byAdvertiser: AdvertiserMetricsSummary[];
  recentCampaigns: AdCampaign[];
}
