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

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);
    
    const passwordStrength = calculatePasswordStrength(password);
    const isEmailValid = email ? validateEmail(email) : null;
    const usernameCheckRef = useRef<string>('');
    
    // Calculate cleaned username for validation
    const cleanUsername = isSignUp && username 
        ? (username.startsWith('@') ? username.slice(1) : username)
        : '';
    
    // Check if username has critical errors (not just network errors)
    const hasCriticalUsernameError = isSignUp && usernameError && 
        usernameError !== 'Unable to check username. Please try again.';
    
    // Check if username format is valid
    const isUsernameFormatValid = !isSignUp || !username || 
        /^[a-zA-Z0-9_]+$/.test(cleanUsername);

    // Check username availability when typing (debounced)
    useEffect(() => {
        if (!isSignUp || !username || username.length < 3) {
            setUsernameError(null);
            setIsCheckingUsername(false);
            usernameCheckRef.current = '';
            return;
        }

        const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
        if (cleanUsername.length < 3) {
            setUsernameError('Username must be at least 3 characters');
            setIsCheckingUsername(false);
            usernameCheckRef.current = '';
            return;
        }

        // Validate username format (alphanumeric and underscores only)
        if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
            setUsernameError('Username can only contain letters, numbers, and underscores');
            setIsCheckingUsername(false);
            usernameCheckRef.current = '';
            return;
        }

        // Set loading state
        setIsCheckingUsername(true);
        setUsernameError(null);
        usernameCheckRef.current = cleanUsername;

        const timeoutId = setTimeout(async () => {
            try {
                const isAvailable = await checkUsernameAvailability(cleanUsername);
                // Only update if this is still the current username (prevent race conditions)
                if (usernameCheckRef.current === cleanUsername) {
                    if (!isAvailable) {
                        setUsernameError('Username is already taken');
                    } else {
                        setUsernameError(null);
                    }
                    setIsCheckingUsername(false);
                }
            } catch (error) {
                // On error, don't show "taken" - just show error message
                if (usernameCheckRef.current === cleanUsername) {
                    setUsernameError('Unable to check username. Please try again.');
                    setIsCheckingUsername(false);
                }
            }
        }, 500); // 500ms debounce

        return () => {
            clearTimeout(timeoutId);
            if (usernameCheckRef.current === cleanUsername) {
                setIsCheckingUsername(false);
            }
        };
    }, [username, isSignUp]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        // Validate email format
        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }
        
        setIsLoading(true);

        try {
            let user;
            if (isSignUp) {
                // Validate signup fields
                if (!name.trim()) {
                    setError('Please enter your name');
                    setIsLoading(false);
                    return;
                }

                const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
                if (!cleanUsername || cleanUsername.length < 3) {
                    setError('Please enter a valid username (at least 3 characters)');
                    setIsLoading(false);
                    return;
                }

                if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
                    setError('Username can only contain letters, numbers, and underscores');
                    setIsLoading(false);
                    return;
                }

                // Check username availability one more time
                const isAvailable = await checkUsernameAvailability(cleanUsername);
                if (!isAvailable) {
                    setError('Username is already taken. Please choose another.');
                    setIsLoading(false);
                    return;
                }

                // Sign up new user
                user = await signUpWithEmail(email, password);
                
                // Create user profile in Firestore with provided username
                await createUserProfile(user.uid, {
                    name: name.trim(),
                    email: email,
                    avatar: meAvatar,
                    username: `@${cleanUsername}`,
                    profileComplete: false,
                });
            } else {
                // Sign in existing user
                user = await signInWithEmail(email, password);
            }
            
            // Success - call onLogin with email and user ID
            onLogin(email, user.uid);
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.message || "Authentication failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError(null);
        setResetSuccess(false);
        
        if (!validateEmail(resetEmail)) {
            setResetError('Please enter a valid email address');
            return;
        }
        
        setIsResettingPassword(true);
        
        try {
            await sendPasswordReset(resetEmail);
            setResetSuccess(true);
        } catch (err: any) {
            console.error('Password reset error:', err);
            setResetError(err.message || 'Failed to send password reset email.');
        } finally {
            setIsResettingPassword(false);
        }
    };

    const getPasswordStrengthColor = (strength: PasswordStrength): string => {
        switch (strength) {
            case 'weak': return 'bg-red-500';
            case 'medium': return 'bg-yellow-500';
            case 'strong': return 'bg-green-500';
            default: return 'bg-slate-300';
        }
    };

    const getPasswordStrengthText = (strength: PasswordStrength): string => {
        switch (strength) {
            case 'weak': return 'Weak';
            case 'medium': return 'Medium';
            case 'strong': return 'Strong';
            default: return '';
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white font-sans overflow-hidden relative">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="auth-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                            <circle cx="50" cy="50" r="2" fill="currentColor" />
                            <path d="M10 10l20 20M40 5l10 10M80 80l15 15" stroke="currentColor" fill="none" strokeWidth="2" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#auth-pattern)" />
                </svg>
            </div>

            <div className="z-10 w-full max-w-md px-6 sm:px-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="mb-10 sm:mb-12">
                     <Logo size="lg" />
                </div>

                <div className="w-full bg-white rounded-3xl sm:rounded-[40px] p-1.5 sm:p-1 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-slate-100/80 overflow-hidden backdrop-blur-sm">
                    <div className="p-6 sm:p-8 pt-8 sm:pt-10 relative overflow-hidden">
                        {!showForgotPassword ? (
                            <form 
                                key={isSignUp ? 'signup' : 'signin'}
                                onSubmit={handleSubmit} 
                                className="space-y-6 transition-all duration-500 ease-in-out"
                                style={{
                                    animation: 'fadeSlideIn 0.5s ease-out'
                                }}
                            >
                                <div className="text-center space-y-3 mb-8 sm:mb-10">
                                    <h1 
                                        className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight transition-all duration-300"
                                        style={{
                                            animation: 'fadeInDown 0.4s ease-out'
                                        }}
                                    >
                                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                                    </h1>
                                    <p 
                                        className="text-sm sm:text-[14px] font-medium text-slate-500 px-2 sm:px-4 leading-relaxed transition-all duration-300"
                                        style={{
                                            animation: 'fadeInDown 0.5s ease-out 0.1s both'
                                        }}
                                    >
                                        {isSignUp 
                                            ? 'Enter your details to create your account. Choose a unique username that others can search for.'
                                            : 'Enter your email and password to continue messaging.'
                                        }
                                    </p>
                                </div>

                                <div className="space-y-4 sm:space-y-5">
                                    <div 
                                        style={{
                                            animation: 'fadeInDown 0.5s ease-out 0.15s both'
                                        }}
                                    >
                                        <div className="relative">
                                            <input 
                                                type="email" 
                                                placeholder="Email address"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className={`w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50/80 border-2 rounded-xl sm:rounded-2xl outline-none transition-all font-semibold text-sm sm:text-base placeholder:text-slate-400 ${
                                                    isEmailValid === false && email
                                                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                                                        : isEmailValid === true
                                                        ? 'border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                                                        : 'border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                                                } focus:bg-white`}
                                                autoFocus={!isSignUp}
                                                disabled={isLoading}
                                                required
                                            />
                                            {email && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    {isEmailValid === true ? (
                                                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : isEmailValid === false ? (
                                                        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                        {isEmailValid === false && email && (
                                            <p className="text-xs text-red-500 font-bold px-2 mt-1">Please enter a valid email address</p>
                                        )}
                                    </div>

                                    {isSignUp && (
                                        <div
                                            style={{
                                                animation: 'fadeInDown 0.5s ease-out 0.2s both'
                                            }}
                                        >
                                            <input 
                                                type="text" 
                                                placeholder="Full Name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50/80 border-2 border-slate-200 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 rounded-xl sm:rounded-2xl outline-none transition-all font-semibold text-sm sm:text-base placeholder:text-slate-400"
                                                disabled={isLoading}
                                                required={isSignUp}
                                            />
                                        </div>
                                    )}

                                    {isSignUp && (
                                        <div
                                            style={{
                                                animation: 'fadeInDown 0.5s ease-out 0.25s both'
                                            }}
                                        >
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    placeholder="Username (e.g., johndoe or @johndoe)"
                                                    value={username}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/[^a-zA-Z0-9_@]/g, '');
                                                        setUsername(value);
                                                    }}
                                                    className={`w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50/80 border-2 rounded-xl sm:rounded-2xl outline-none transition-all font-semibold text-sm sm:text-base placeholder:text-slate-400 ${
                                                        usernameError 
                                                            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                                                            : isCheckingUsername
                                                            ? 'border-yellow-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100'
                                                            : 'border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                                                    } focus:bg-white`}
                                                    disabled={isLoading}
                                                    required={isSignUp}
                                                    minLength={3}
                                                />
                                                {isCheckingUsername && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <svg className="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    </div>
                                                )}
                                                {username && !usernameError && !isCheckingUsername && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            {usernameError && (
                                                <p className="text-xs text-red-500 font-bold px-2 mt-1">{usernameError}</p>
                                            )}
                                            {username && !usernameError && !isCheckingUsername && username.length >= 3 && (
                                                <p className="text-xs text-green-500 font-bold px-2 mt-1">✓ Username available</p>
                                            )}
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            animation: `fadeInDown 0.5s ease-out ${isSignUp ? '0.3s' : '0.2s'} both`
                                        }}
                                    >
                                        <div className="relative">
                                        <input 
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 pr-12 bg-slate-50/80 border-2 border-slate-200 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 rounded-xl sm:rounded-2xl outline-none transition-all font-semibold text-sm sm:text-base placeholder:text-slate-400"
                                            disabled={isLoading}
                                                required
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                                                disabled={isLoading}
                                            >
                                                {showPassword ? (
                                                    <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    </svg>
                                                ) : (
                                                    <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        {isSignUp && password && (
                                            <div className="mt-2">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-slate-600">Password strength:</span>
                                                    <span className={`text-xs font-black ${passwordStrength === 'weak' ? 'text-red-500' : passwordStrength === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                                                        {getPasswordStrengthText(passwordStrength)}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                                    <div 
                                                        className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                                                        style={{ width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%' }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {error && <p className="text-xs text-red-500 font-bold px-2">{error}</p>}
                                </div>

                                {!isSignUp && (
                                    <div className="text-right -mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword(true)}
                                            className="text-xs sm:text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                                            disabled={isLoading}
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                )}

                                <button 
                                    type="submit"
                                    disabled={
                                        !email || 
                                        !password || 
                                        password.length < 6 || 
                                        isLoading ||
                                        isEmailValid === false ||
                                        (isSignUp && (
                                            !name.trim() || 
                                            !username || 
                                            cleanUsername.length < 3 || 
                                            hasCriticalUsernameError || 
                                            isCheckingUsername ||
                                            !isUsernameFormatValid
                                        ))
                                    }
                                    className="w-full py-3.5 sm:py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base shadow-lg shadow-green-100/50 hover:shadow-xl hover:shadow-green-100/70 transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
                                    style={{
                                        animation: `fadeInDown 0.5s ease-out ${isSignUp ? '0.35s' : '0.25s'} both`
                                    }}
                                >
                                    <span>{isLoading ? (isSignUp ? "Creating..." : "Signing in...") : (isSignUp ? "Sign Up" : "Sign In")}</span>
                                    {!isLoading && (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    )}
                                </button>

                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsSignUp(!isSignUp);
                                        setError(null);
                                        setPassword('');
                                        setName('');
                                        setUsername('');
                                        setUsernameError(null);
                                        setShowForgotPassword(false);
                                    }}
                                    className="w-full text-xs sm:text-sm text-slate-500 hover:text-slate-700 transition-colors text-center mt-3 sm:mt-4"
                                    disabled={isLoading}
                                    style={{
                                        animation: `fadeInDown 0.5s ease-out ${isSignUp ? '0.4s' : '0.3s'} both`
                                    }}
                                >
                                    {isSignUp ? (
                                        <>
                                            Already have an account?{' '}
                                            <span className="font-semibold text-green-600">Sign in</span>
                                        </>
                                    ) : (
                                        <>
                                            Don't have an account?{' '}
                                            <span className="font-semibold text-green-600">Sign up</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center space-y-3 mb-8 sm:mb-10">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                                        Reset Password
                                    </h1>
                                    <p className="text-sm sm:text-[14px] font-medium text-slate-500 px-2 sm:px-4 leading-relaxed">
                                        Enter your email address and we'll send you a link to reset your password.
                                    </p>
                                </div>

                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div>
                                        <div className="relative">
                                    <input 
                                                type="email" 
                                                placeholder="Email address"
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                className={`w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50/80 border-2 rounded-xl sm:rounded-2xl outline-none transition-all font-semibold text-sm sm:text-base placeholder:text-slate-400 ${
                                                    resetEmail && !validateEmail(resetEmail)
                                                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                                                        : resetEmail && validateEmail(resetEmail)
                                                        ? 'border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                                                        : 'border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                                                } focus:bg-white`}
                                        autoFocus
                                                disabled={isResettingPassword || resetSuccess}
                                                required
                                    />
                                </div>
                                    </div>

                                    {resetError && <p className="text-xs text-red-500 font-bold px-2">{resetError}</p>}
                                    {resetSuccess && (
                                        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-2xl">
                                            <p className="text-sm font-bold text-green-700">
                                                ✓ Password reset email sent! Check your inbox for instructions.
                                            </p>
                                        </div>
                                    )}

                                <button 
                                    type="submit"
                                        disabled={!resetEmail || !validateEmail(resetEmail) || isResettingPassword || resetSuccess}
                                        className="w-full py-3.5 sm:py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base shadow-lg shadow-green-100/50 hover:shadow-xl hover:shadow-green-100/70 transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
                                >
                                        <span>{isResettingPassword ? "Sending..." : resetSuccess ? "Email Sent!" : "Send Reset Link"}</span>
                                </button>

                                <button 
                                    type="button"
                                        onClick={() => {
                                            setShowForgotPassword(false);
                                            setResetEmail('');
                                            setResetError(null);
                                            setResetSuccess(false);
                                        }}
                                        className="w-full text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors text-center mt-3 sm:mt-4"
                                        disabled={isResettingPassword}
                                >
                                        Back to Sign In
                                </button>
                            </form>
                            </div>
                        )}
                    </div>
                </div>

                <p className="mt-8 sm:mt-12 text-[10px] sm:text-xs font-medium text-slate-400 text-center max-w-sm leading-relaxed px-4">
                    By continuing, you agree to our <span className="text-slate-600 hover:text-slate-800 cursor-pointer transition-colors">Terms of Service</span> and <span className="text-slate-600 hover:text-slate-800 cursor-pointer transition-colors">Privacy Policy</span>.
                </p>
            </div>
        </div>
    );
};
