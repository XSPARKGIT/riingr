import React, { useState, useEffect, useRef } from 'react';
import { Logo } from '../constants';
import { signUpWithEmail, signInWithEmail, sendPasswordReset } from '../services/firebaseService';
import { createUserProfile, checkUsernameAvailability } from '../services/firestoreService';
import { meAvatar } from '../assets';

interface AuthScreenProps {
    onLogin: (email: string, userId: string) => void;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (password.length < 6) return 'weak';
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
};

const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
