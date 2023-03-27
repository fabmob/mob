export class ClamAvConfig {
  private host: string = process.env.CLAMAV_HOST ? `${process.env.CLAMAV_HOST}` : `localhost`;

  private port: number | undefined = process.env.CLAMAV_PORT ? Number(process.env.CLAMAV_PORT) : 3310;

  /**
   * Get ClamAv configuration to init
   * @returns clamav configuration
   */
  getClamAvConfiguration() {
    return {
      debugMode: false, // This will put some debug info in your js console
      clamdscan: {
        host: this.host, // IP of host to connect to TCP interface
        port: this.port, // Port of host to use when connecting via TCP interface
        multiscan: true, // Scan using all available cores! Yay!
      },
      preference: 'clamdscan', // If clamdscan is found and active, it will be used by default
    };
  }
}
