import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage';
import OptimizePage from '@/pages/OptimizePage/OptimizePage';
import ComparePage from '@/pages/ComparePage/ComparePage';
import LibraryPage from '@/pages/LibraryPage/LibraryPage';
import SettingsPage from '@/pages/SettingsPage/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<OptimizePage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
