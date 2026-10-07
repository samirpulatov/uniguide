import { Fragment } from 'react';
import { courseList, scheduleRows, weekDays } from '../mock/studentHub';

const COURSE_COLORS: Record<string, string> = {
  Mathematics: '#423a6a',
  'German B1': '#42394f',
  Thermodynamics: '#3a3f5a',
  'Technical Mechanics': '#39415a',
  'Study Skills': '#3f424d',
};

export function CoursesPage() {
  return (
    <div className="page-wide">
      <h1>Your schedule</h1>
      <p className="status-message" style={{ display: 'block', margin: '0 0 1.75rem' }}>
        Winter Semester 2026/27
      </p>

      <div className="schedule-grid">
        <div />
        {weekDays.map((day) => (
          <div key={day} className="schedule-day-label">{day}</div>
        ))}
        {scheduleRows.map((row) => (
          <Fragment key={row.label}>
            <div className="schedule-time-label">{row.label}</div>
            {row.cells.map((name, i) => (
              <div
                key={`${row.label}-${i}`}
                className={`schedule-cell ${name ? '' : 'schedule-cell--empty'}`}
                style={name ? { background: COURSE_COLORS[name] ?? 'var(--surface)' } : undefined}
              >
                {name && <span>{name}</span>}
              </div>
            ))}
          </Fragment>
        ))}
      </div>

      <h3 style={{ marginBottom: '0.9rem', opacity: 0.85 }}>Enrolled courses</h3>
      <table className="course-table">
        <thead>
          <tr>
            <th>Course</th>
            <th>Instructor</th>
            <th>Room</th>
            <th style={{ textAlign: 'right' }}>Credits</th>
          </tr>
        </thead>
        <tbody>
          {courseList.map((course) => (
            <tr key={course.code}>
              <td>
                <div>{course.name}</div>
                <div className="course-code">{course.code}</div>
              </td>
              <td>{course.instructor}</td>
              <td>{course.room}</td>
              <td className="credits">{course.credits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
