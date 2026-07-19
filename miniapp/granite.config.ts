import { defineConfig, type AppsInTossWebConfigResponse } from '@apps-in-toss/web-framework/config';

const config: AppsInTossWebConfigResponse = defineConfig({
  appName: 'k-beauty-agent',
  brand: {
    displayName: 'K-Beauty Agent',
    primaryColor: '#3182F6',
    // 앱인토스 콘솔에 로고를 등록한 뒤 콘솔의 이미지 URL로 교체해야 합니다.
    icon: 'https://k-beauty-agent-lq0v.onrender.com/static/app-icon.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite --host 0.0.0.0',
      build: 'tsc -b && vite build',
    },
  },
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },
  outdir: 'dist',
  webViewProps: {
    type: 'partner',
  },
});

export default config;
