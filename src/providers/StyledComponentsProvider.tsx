
import React, { useMemo, FC, ReactNode } from 'react';
import { StyleSheetManager } from 'styled-components';
interface StyleSheetManagerConfig {
  disableVendorPrefixes?: boolean;
  enableCSSOMInjection?: boolean;
  target?: HTMLElement | object;
  sheet?: any;
  namespace?: string;
  shouldForwardProp?: (prop: string) => boolean;
}

interface StyledComponentsProviderProps {
  children: ReactNode;
  disableVendorPrefixes?: boolean;
  enableCSSOMInjection?: boolean;
  target?: HTMLElement;
  sheet?: any;
  namespace?: string;
  shouldForwardProp?: (prop: string) => boolean;
}

const StyledComponentsProvider: FC<StyledComponentsProviderProps> = ({ 
  children,
  disableVendorPrefixes = false,
  enableCSSOMInjection = true,
  target,
  sheet,
  namespace,
  shouldForwardProp
}) => {
  const isBrowser = useMemo(
    () => typeof window !== 'undefined' && typeof document !== 'undefined',
    []
  );

  const config = useMemo((): StyleSheetManagerConfig => {
    const baseConfig: StyleSheetManagerConfig = {
      disableVendorPrefixes,
      enableCSSOMInjection: isBrowser ? enableCSSOMInjection : false,
    };

    if (target !== undefined) {
      baseConfig.target = target;
    }

    if (sheet !== undefined) {
      baseConfig.sheet = sheet;
    }

    if (namespace !== undefined) {
      baseConfig.namespace = namespace;
    }

    if (shouldForwardProp !== undefined) {
      baseConfig.shouldForwardProp = shouldForwardProp;
    }

    return baseConfig;
  }, [
    disableVendorPrefixes,
    enableCSSOMInjection,
    isBrowser,
    target,
    sheet,
    namespace,
    shouldForwardProp
  ]);

  if (!isBrowser && !sheet) {
    return <>{children}</>;
  }

  return (
    <StyleSheetManager {...config}>
      {children}
    </StyleSheetManager>
  );
};

StyledComponentsProvider.displayName = 'StyledComponentsProvider';

export default StyledComponentsProvider;