/* @refresh reload */
import { render } from 'solid-js/web';
import { HashRouter, Route } from '@solidjs/router';
import './index.css';
import "@fortawesome/fontawesome-free/css/all.min.css";
import { lazy } from 'solid-js';

const App = lazy(() => import("./App"));
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
    <Route path="/pixel-editor" component={PixelEditor}/>
  </HashRouter>
), root!);
