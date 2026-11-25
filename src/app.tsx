import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import BankPage from '@/pages/BankPage/BankPage';
import UploadPage from '@/pages/UploadPage/UploadPage';
import QuestionPage from '@/pages/QuestionPage/QuestionPage';
import PracticeSetupPage from '@/pages/PracticeSetupPage/PracticeSetupPage';
import PracticeRunPage from '@/pages/PracticeRunPage/PracticeRunPage';
import PracticeResultPage from '@/pages/PracticeResultPage/PracticeResultPage';
import SettingsPage from '@/pages/SettingsPage/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<BankPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="question/:id" element={<QuestionPage />} />
        <Route path="practice" element={<PracticeSetupPage />} />
        <Route path="practice/run/:sessionId" element={<PracticeRunPage />} />
        <Route path="practice/result/:sessionId" element={<PracticeResultPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
