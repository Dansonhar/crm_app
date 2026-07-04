import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { Dashboard } from '@/pages/Dashboard';
import { Clients } from '@/pages/Clients';
import { ClientDetail } from '@/pages/ClientDetail';
import { LeadsPipeline } from '@/pages/LeadsPipeline';
import { Projects } from '@/pages/Projects';
import { Invoices } from '@/pages/Invoices';
import { Tasks } from '@/pages/Tasks';
import { Settings } from '@/pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:clientId" element={<ClientDetail />} />
          <Route path="leads" element={<LeadsPipeline />} />
          <Route path="projects" element={<Projects />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
