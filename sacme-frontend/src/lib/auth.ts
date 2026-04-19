export const getAuthToken = () => {
    if (typeof window === 'undefined') return '';

    const path = window.location.pathname;

    if (path.includes('/professor')) {
        return localStorage.getItem('professor_token');
    }

    if (path.includes('/student')) {
        return localStorage.getItem('student_token');
    }

    if (path.includes('/admin') || path.includes('/main-admin')) {
        return localStorage.getItem('admin_token');
    }

    if (path.includes('/faculty-advisor')) {
        return localStorage.getItem('faculty-advisor_token');
    }

    // Ultimate fallback logic
    const role = localStorage.getItem('user_role');
    if (role === 'student') return localStorage.getItem('student_token');
    if (role === 'professor') return localStorage.getItem('professor_token');
    if (role === 'faculty-advisor') return localStorage.getItem('faculty-advisor_token');
    if (role === 'main-admin') return localStorage.getItem('admin_token');

    return localStorage.getItem('sacme_token') || '';
};

export const logoutUser = () => {
    if (typeof window === 'undefined') return;

    // Path based cleanups
    const path = window.location.pathname;

    if (path.includes('/student')) {
         localStorage.removeItem('student_token');
    } else if (path.includes('/professor')) {
         localStorage.removeItem('professor_token');
    } else if (path.includes('/faculty-advisor')) {
         localStorage.removeItem('faculty-advisor_token');
    } else if (path.includes('/admin') || path.includes('/main-admin')) {
         localStorage.removeItem('admin_token');
    } else {
         // Wipe all safely mapped if unpredictable
         localStorage.removeItem('sacme_token');
         localStorage.removeItem('student_token');
         localStorage.removeItem('professor_token');
         localStorage.removeItem('admin_token');
         localStorage.removeItem('faculty-advisor_token');
    }
    
    // Check if any other tokens are present to determine if we should remove 'user_role'. 
    // This isn't perfect for 3+ simultaneous roles, but suffices for normal operation.
    if (!localStorage.getItem('student_token') && !localStorage.getItem('professor_token') && !localStorage.getItem('admin_token') && !localStorage.getItem('faculty-advisor_token')) {
        localStorage.removeItem('user_role');
    }
};
