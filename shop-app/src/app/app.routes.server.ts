import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender
  },{
    path: 'products/:slug',
    renderMode: RenderMode.Server
  },{
    path: 'order-summary/:orderId',
    renderMode: RenderMode.Server
  }
];
