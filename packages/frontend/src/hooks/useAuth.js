import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext'; // Adjust path as needed

export const useAuth = () => useContext(AuthContext);
