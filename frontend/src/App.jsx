import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import DashboardTest from './pages/Dashboard/DashboardTest';
import SimpleChart from './pages/Dashboard/SimpleChart';
import Heatmap from './pages/Heatmap/Heatmap';
import Profile from './pages/Profile/Profile';
import Reports from './pages/Reports/Reports';
import Layout from './components/Layout';
import AddStudent from './pages/Students/AddStudent';
import ManageStudents from './pages/Students/ManageStudents';
import EditStudent from './pages/Students/EditStudent';
import ManageSemesterMarks from './pages/Students/ManageSemesterMarks';
import EditStudentScores from './pages/Students/EditStudentScores';
import UserManagement from './pages/Admin/UserManagement';

// New Analytics pages
import AdminDashboard from './pages/Analytics/AdminDashboard';
import FacultyDashboard from './pages/Analytics/FacultyDashboard';
import StudentProfile from './pages/Analytics/StudentProfile';
import AttritionAnalytics from './pages/Analytics/AttritionAnalytics';
import SubjectAnalytics from './pages/Analytics/SubjectAnalytics';
import AcademicRoadmap from './pages/Analytics/AcademicRoadmap';

// New Intervention pages
import InterventionList from './pages/Interventions/InterventionList';
import CreateIntervention from './pages/Interventions/CreateIntervention';
import InterventionDetail from './pages/Interventions/InterventionDetail';

function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) return <Navigate to="/" />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" />;
  
  return children;
}

function FacultyRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) return <Navigate to="/" />;
  if (user.role !== 'faculty' && user.role !== 'admin') return <Navigate to="/" />;
  
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register onLogin={handleLogin} />} />
        
        {/* Role-based Dashboard Routes */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <Layout user={user} onLogout={handleLogout}>
                <Dashboard user={user} />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/faculty-dashboard"
          element={
            <ProtectedRoute requiredRole="faculty">
              <Layout user={user} onLogout={handleLogout}>
                <FacultyDashboard user={user} />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout user={user} onLogout={handleLogout}>
                <AdminDashboard user={user} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout user={user} onLogout={handleLogout}>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout user={user} onLogout={handleLogout}>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Legacy dashboard route - redirect based on role */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {user?.role === 'admin' && <Navigate to="/analytics/admin" />}
              {user?.role === 'faculty' && <Navigate to="/analytics/faculty" />}
              {user?.role === 'student' && <Navigate to="/student-dashboard" />}
              {!user?.role && <Navigate to="/" />}
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/heatmap"
          element={
            <ProtectedRoute>
              <Layout user={user} onLogout={handleLogout}>
                <Heatmap user={user} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout user={user} onLogout={handleLogout}>
                <Profile user={user} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout user={user} onLogout={handleLogout}>
                <Reports user={user} />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Student Management Routes (Faculty/Admin only) */}
        <Route
          path="/students/add"
          element={
            <FacultyRoute>
              <Layout user={user} onLogout={handleLogout}>
                <AddStudent />
              </Layout>
            </FacultyRoute>
          }
        />
        <Route
          path="/students/manage"
          element={
            <FacultyRoute>
              <Layout user={user} onLogout={handleLogout}>
                <ManageStudents />
              </Layout>
            </FacultyRoute>
          }
        />
        <Route
          path="/students/semester-marks"
          element={
            <FacultyRoute>
              <Layout user={user} onLogout={handleLogout}>
                <ManageSemesterMarks />
              </Layout>
            </FacultyRoute>
          }
        />
        <Route
          path="/students/edit/:id"
          element={
            <FacultyRoute>
              <Layout user={user} onLogout={handleLogout}>
                <EditStudent />
              </Layout>
            </FacultyRoute>
          }
        />
        <Route
          path="/students/scores/:id"
          element={
            <FacultyRoute>
              <Layout user={user} onLogout={handleLogout}>
                <EditStudentScores />
              </Layout>
            </FacultyRoute>
          }
        />
        
        {/* Debug Route */}
        <Route
          path="/dashboard-test"
          element={
            <ProtectedRoute>
              <Layout user={user} onLogout={handleLogout}>
                <DashboardTest user={user} />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Simple Chart Test Route */}
        <Route
          path="/simple-chart"
          element={
            <ProtectedRoute>
              <Layout user={user} onLogout={handleLogout}>
                <SimpleChart user={user} />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* New Analytics Routes */}
        <Route path="/analytics/admin" element={
          <ProtectedRoute requiredRole="admin">
            <Layout user={user} onLogout={handleLogout}><AdminDashboard user={user} /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/analytics/faculty" element={
          <FacultyRoute>
            <Layout user={user} onLogout={handleLogout}><FacultyDashboard user={user} /></Layout>
          </FacultyRoute>
        } />
        <Route path="/analytics/students/:id" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}><StudentProfile user={user} /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/analytics/attrition" element={
          <FacultyRoute>
            <Layout user={user} onLogout={handleLogout}><AttritionAnalytics user={user} /></Layout>
          </FacultyRoute>
        } />
        <Route path="/analytics/subjects" element={
          <FacultyRoute>
            <Layout user={user} onLogout={handleLogout}><SubjectAnalytics user={user} /></Layout>
          </FacultyRoute>
        } />
        <Route path="/analytics/students/:id/roadmap" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}><AcademicRoadmap user={user} /></Layout>
          </ProtectedRoute>
        } />
        
        {/* Intervention Routes */}
        <Route path="/interventions" element={
          <FacultyRoute>
            <Layout user={user} onLogout={handleLogout}><InterventionList user={user} /></Layout>
          </FacultyRoute>
        } />
        <Route path="/interventions/create" element={
          <FacultyRoute>
            <Layout user={user} onLogout={handleLogout}><CreateIntervention user={user} /></Layout>
          </FacultyRoute>
        } />
        <Route path="/interventions/:id" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}><InterventionDetail user={user} /></Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
