import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Loader from "./components/Loader.jsx";

// Auth
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Profile from "./pages/Profile.jsx";
import Notifications from "./pages/Notifications.jsx";

// Student
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import ExamList from "./pages/student/ExamList.jsx";
import ExamDetail from "./pages/student/ExamDetail.jsx";
import TakeExam from "./pages/student/TakeExam.jsx";
import MyResults from "./pages/student/MyResults.jsx";
import ResultDetail from "./pages/student/ResultDetail.jsx";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminExams from "./pages/admin/AdminExams.jsx";
import ExamForm from "./pages/admin/ExamForm.jsx";
import ExamQuestions from "./pages/admin/ExamQuestions.jsx";
import ExamResults from "./pages/admin/ExamResults.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import Monitoring from "./pages/admin/Monitoring.jsx";

// Sends a logged-in user to their correct home; otherwise to login.
function Home() {
  const { user, loading } = useAuth();
  if (loading) return <Loader full />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Exam-taking runs full-screen, outside the shared Layout */}
      <Route
        path="/exams/:id/take"
        element={
          <ProtectedRoute>
            <TakeExam />
          </ProtectedRoute>
        }
      />

      {/* Authenticated app shell */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />

        {/* Student */}
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/exams" element={<ExamList />} />
        <Route path="/exams/:id" element={<ExamDetail />} />
        <Route path="/results" element={<MyResults />} />
        <Route path="/results/:id" element={<ResultDetail />} />
      </Route>

      {/* Admin shell */}
      <Route
        element={
          <ProtectedRoute role="admin">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/exams" element={<AdminExams />} />
        <Route path="/admin/exams/new" element={<ExamForm />} />
        <Route path="/admin/exams/:id" element={<ExamQuestions />} />
        <Route path="/admin/exams/:id/edit" element={<ExamForm />} />
        <Route path="/admin/exams/:id/results" element={<ExamResults />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/monitoring" element={<Monitoring />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
