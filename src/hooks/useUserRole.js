import { useState, useEffect } from "react";
import useProfile from "./useProfile";
import useClassrooms from "./useClassrooms";
import useLocalStorage from "./useLocalStorage";

/**
 * Hook to detect and manage user roles
 * Determines user type based on:
 * - Explicit role selection (stored in localStorage)
 * - Classroom participation (student/teacher)
 * - Model training activity (ASL expert)
 * - Content creation activity (signer/content creator)
 */
function useUserRole() {
  const [userRole, setUserRole] = useState(null);
  const [detectedRoles, setDetectedRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getUserProfile } = useProfile();
  const { getStudentsClassrooms, getStaffClassrooms } = useClassrooms();
  const [storedRole, setStoredRole] = useLocalStorage("userRole", null);

  useEffect(() => {
    detectUserRoles();
  }, []);

  const detectUserRoles = async () => {
    setLoading(true);
    const roles = [];

    try {
      // Check if user has selected a role preference first
      if (storedRole) {
        roles.push(storedRole);
      }

      // Helper function to add timeout to promises
      const withTimeout = (promise, timeoutMs = 3000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout")), timeoutMs)
          )
        ]);
      };

      // Check classroom participation (non-blocking with timeouts)
      const classroomChecks = Promise.allSettled([
        withTimeout(getStudentsClassrooms("", 0, 1), 3000).then(
          (studentClassrooms) => {
            if (studentClassrooms && studentClassrooms[0] && studentClassrooms[0].length > 0) {
              if (!roles.includes("student")) {
                roles.push("student");
              }
            }
          }
        ).catch(() => {
          // User might not be a student - this is fine
        }),
        withTimeout(getStaffClassrooms("", 0, 1), 3000).then(
          (staffClassrooms) => {
            if (staffClassrooms && staffClassrooms[0] && staffClassrooms[0].length > 0) {
              if (!roles.includes("teacher")) {
                roles.push("teacher");
              }
            }
          }
        ).catch(() => {
          // User might not be a teacher - this is fine
        })
      ]);

      // Wait for classroom checks with a maximum wait time
      await Promise.race([
        classroomChecks,
        new Promise(resolve => setTimeout(resolve, 4000)) // Max 4 seconds total
      ]);

      setDetectedRoles(roles);
      
      // Set primary role: use stored preference, or first detected role, or default to "student"
      const primaryRole = storedRole || roles[0] || "student";
      setUserRole(primaryRole);
    } catch (err) {
      console.error("Error detecting user roles:", err);
      // Always set a default role
      const primaryRole = storedRole || "student";
      setUserRole(primaryRole);
      setDetectedRoles(storedRole ? [storedRole] : []);
    } finally {
      // Always stop loading, even if there were errors
      setLoading(false);
    }
  };

  const setRole = (role) => {
    setStoredRole(role);
    setUserRole(role);
  };

  const hasRole = (role) => {
    return userRole === role || detectedRoles.includes(role);
  };

  return {
    userRole,
    detectedRoles,
    setRole,
    hasRole,
    loading,
    refreshRoles: detectUserRoles,
  };
}

export default useUserRole;

