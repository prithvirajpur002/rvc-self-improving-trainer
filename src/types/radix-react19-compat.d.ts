/**
 * React 19 compatibility shim for @blinkdotnew/ui / Radix UI components.
 *
 * @blinkdotnew/ui 0.4.x was built against React 18 types which included
 * `onPointerEnterCapture`, `onPointerLeaveCapture`, and a `placeholder` on
 * every element.  React 19 removed these from DOMAttributes, so TypeScript
 * reports TS2739 "missing properties" when you use those Radix-based
 * components without supplying those now-deleted props.
 *
 * This augmentation adds them back as optional no-ops so the component calls
 * compile cleanly without having to touch every usage site.
 */

import 'react'

declare module 'react' {
  // React 19 dropped these from DOMAttributes – add them back so older
  // library types (blinkdotnew/ui 0.4.x) keep working.
  interface DOMAttributes<T> {
    onPointerEnterCapture?: React.PointerEventHandler<T> | undefined
    onPointerLeaveCapture?: React.PointerEventHandler<T> | undefined
  }

  // React 18 had `placeholder` on HTMLAttributes for any element.
  // Some Radix `Pick<>` spreads include it.
  interface HTMLAttributes<T> {
    placeholder?: string | undefined
  }
}
