import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'RuleRun Lite — Speak the rule. Find what breaks.',description:'Reproducible property checks for pure JavaScript functions. Runs locally in an isolated WebAssembly engine.'};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
