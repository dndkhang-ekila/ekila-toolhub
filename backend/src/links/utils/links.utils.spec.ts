import { detectDeviceAndBrowser, parseClientIp } from './links.utils';

describe('links.utils', () => {
  describe('detectDeviceAndBrowser', () => {
    it('detects Opera before Chrome when UA contains both OPR and Chrome', () => {
      const operaUa =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0';
      const result = detectDeviceAndBrowser(operaUa);
      expect(result.browser).toBe('Opera');
      expect(result.device).toBe('desktop');
    });

    it('detects Chrome when UA is standard Chrome without OPR', () => {
      const chromeUa =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const result = detectDeviceAndBrowser(chromeUa);
      expect(result.browser).toBe('Chrome');
      expect(result.device).toBe('desktop');
    });

    it('detects Edge properly', () => {
      const edgeUa =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
      const result = detectDeviceAndBrowser(edgeUa);
      expect(result.browser).toBe('Edge');
    });
  });

  describe('parseClientIp', () => {
    it('extracts first IP from x-forwarded-for header list', () => {
      const raw = '203.0.113.195, 70.41.3.18, 150.172.238.178';
      expect(parseClientIp(raw)).toBe('203.0.113.195');
    });

    it('falls back to socket remoteAddress when header is missing', () => {
      expect(parseClientIp(undefined, '10.0.0.5')).toBe('10.0.0.5');
    });
  });
});
