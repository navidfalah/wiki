import path from 'node:path';
import express from 'express';
import { PORT } from './config';
import wikiRouter from './routes/wiki';
import dashboardRouter from './routes/dashboard';
import simpleRouter from './routes/simple';

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src', 'views'));

app.use('/css', express.static(path.join(process.cwd(), 'dist-static', 'css')));
app.use('/js', express.static(path.join(process.cwd(), 'dist-static', 'js')));

app.get('/', (_req, res) => res.redirect('/wiki'));
app.use('/wiki', wikiRouter);
app.use('/dashboard', dashboardRouter);
app.use('/', simpleRouter);

app.use((_req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`wiki-frontend listening on http://localhost:${PORT}`);
});
