/* @refresh reload */
import { render } from 'solid-js/web';
import { HashRouter, Route } from '@solidjs/router';
import './index.css';
import "@fortawesome/fontawesome-free/css/all.min.css";
import { lazy } from 'solid-js';
import App from './App';
const ColourPicker = lazy(() => import('./pixel-editor/ColourPicker'));
const ReactiveSimulator = lazy(() => import('./reactive-simulator/ReactiveSimulator'));
const KittyDemoApp = lazy(() => import("./kitty-demo/App"));
const PixelEditor = lazy(() => import("./pixel-editor/PixelEditor"));

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => (
  <HashRouter>
    <Route path="/" component={App}/>
    <Route path="/kitty-demo" component={KittyDemoApp}/>
    <Route path="/pixel-editor" component={PixelEditor}/>
    <Route path="/colour-picker" component={() => {
      return (
        <div
          style={{
            "width": "300px",
            "height": "300px",
            "display": "flex",
            "flex-direction": "column",
            "margin-left": "20px",
            "margin-top": "20px",
          }}
        >
          <ColourPicker/>
        </div>
      );
    }}/>
    <Route path="/reactive-sim" component={ReactiveSimulator}/>
  </HashRouter>
), root!);
