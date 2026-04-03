import type * as React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'foliate-view': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        ref?: React.Ref<HTMLElement>;
      };
    }
  }
}

export {};