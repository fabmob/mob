export class ClamAvConfig {
  private url = process.env.ANTIVIRUS_FQDN
    ? `https://${process.env.ANTIVIRUS_FQDN}/api/v1/scan`
    : `${process.env.ANTIVIRUS}`;

  getScanUrl(): string {
    return this.url;
  }
}
