/// <reference types="vite/client" />

declare module 'react-router-dom/server' {
  import { ReactNode } from 'react';
  export interface StaticRouterProps {
    location: string;
    children?: ReactNode;
  }
  export function StaticRouter(props: StaticRouterProps): JSX.Element;
}
