// import "./wdyr.js";
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import './index.css';
import { store } from "./store/store"
import { Layout } from "./Layout";
import ErrorPage from "./pages/ErrorPage"
import Login from './pages/Login'
import StudentLayout from './components/Layouts/StudentLayout'
import TeacherLayout from './components/Layouts/TeacherLayout'
import AdminLayout from './components/Layouts/AdminLayout'
import ClassesPage from './pages/ClassesPage'
import { ThemeProvider } from "./components/theme-provider"
import StudentsPage from './pages/StudentsPage'
import TeachersPage from './pages/TeachersPage'
import DepartmentsPage from './pages/DepartmentsPage'
import FacultyPage from './pages/FacultyPage'
import AdminTimetablePage from './pages/AdminTimetablePage'
import TEACHER_AND_STUDENT_TIMETABLE_PAGE from './pages/UsersTimetablePage'
import StudentsAttendence_forTeachers from './pages/TeacherAttendencePage'
import StudentsAttendence_forAdmin_AND_Staff from './pages/Admin_Attendance/StudentsAttendance'
import { StudentAttendanceDetailsPage } from './pages/Admin_Attendance/StudentsAttendanceDetailsPage';
import TeachersAttendance_forAdmin_AND_STAFF from './pages/Admin_Attendance/TeachersAttendance';
import MarkTeachersAttendancePage from './pages/Admin_Attendance/MarkTeachersAttendancePage';
import { TeacherAttendanceDeatilsPage } from './pages/Admin_Attendance/TeachersAttendanceDetailsPage';
import MarkStudentsAttendancePage from './pages/Admin_Attendance/MarkStudentsAttendancePage';
import My_Attendance_Page from './pages/Teacher_MYAttendancePage';
import StaffLayout from './components/Layouts/StaffLayout';
import TimeTablePage_ForStaff from './pages/StaffTimetablePage';

// ------------------------------------ //
// ---------------NOTE----------------- //
// All LEARNING DONE FROM THIS PROJECT! //

const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			<Route path="/" element={<Layout />} errorElement={<ErrorPage />}>
				<Route path="dashboard">
					{/* Student Dashboard Routes */}
					<Route path="student" element={<StudentLayout />}>
						<Route path='timetable' element={<TEACHER_AND_STUDENT_TIMETABLE_PAGE />} />
						<Route path='attendance/student/:stdId' element={<StudentAttendanceDetailsPage />} />
					</Route>

					{/* Teacher Dashboard Routes */}
					<Route path="teacher" element={<TeacherLayout />}>
						<Route path="timetable" element={<TEACHER_AND_STUDENT_TIMETABLE_PAGE />} />
						<Route path="my-attendance" element={<My_Attendance_Page />} />
						<Route path="attendance" element={<StudentsAttendence_forTeachers />} />
						<Route path='attendance/student/:stdId' element={<StudentAttendanceDetailsPage />} />
						<Route path='attendance/students/mark-attendance/:sectionId/:subject' element={<MarkStudentsAttendancePage />} />
					</Route>

					{/* Admin Dashboard Routes */}
					<Route path="admin" element={<AdminLayout />}>
						<Route path="classes" element={<ClassesPage />} />
						<Route path="students" element={<StudentsPage />} />
						<Route path='teachers' element={<TeachersPage />} />
						<Route path='departments' element={<DepartmentsPage />} />
						<Route path='faculty' element={<FacultyPage />} />
						<Route path='timetable' element={<AdminTimetablePage />} />
						<Route path='attendance/students' element={<StudentsAttendence_forAdmin_AND_Staff />} />
						<Route path='attendance/student/:stdId' element={<StudentAttendanceDetailsPage />} />
						<Route path='attendance/teachers' element={<TeachersAttendance_forAdmin_AND_STAFF />} />
						<Route path='attendance/teacher/:teacherId' element={<TeacherAttendanceDeatilsPage />} />
						<Route path='attendance/teachers/mark-attendance' element={<MarkTeachersAttendancePage />} />
					</Route>

					{/* Staff Dashboard Routes */}
					{/* NOTE: Staff just has some accessable routes of admin! */}
					<Route path="staff" element={<StaffLayout />}>
						<Route path="students" element={<StudentsPage />} />
						<Route path='timetable' element={<TimeTablePage_ForStaff />} />
						<Route path='attendance/students' element={<StudentsAttendence_forAdmin_AND_Staff />} />
						<Route path='attendance/student/:stdId' element={<StudentAttendanceDetailsPage />} />
						<Route path='attendance/teachers' element={<TeachersAttendance_forAdmin_AND_STAFF />} />
						<Route path='attendance/teacher/:teacherId' element={<TeacherAttendanceDeatilsPage />} />
						<Route path='attendance/teachers/mark-attendance' element={<MarkTeachersAttendancePage />} />
					</Route>
				</Route>

				<Route path="login" element={<Login />} />
			</Route>
		</>
	)
);

createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
		<ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
			<RouterProvider router={router} />
		</ThemeProvider>
    </Provider>
);