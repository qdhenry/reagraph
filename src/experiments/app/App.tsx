import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Router } from './Router';
import { Layout } from './components/Layout';

export default function App() {
  return (
    <BrowserRouter basename="/experiments">
      <Layout>
        <Suspense fallback={<div>Loading...</div>}>
          <Router />
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}